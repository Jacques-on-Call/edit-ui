// easy-seo/src/pages/api/submit.ts
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { getRuntime } from "@astrojs/cloudflare/runtime";
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
const TURNSTILE_SECRET_KEY = import.meta.env.TURNSTILE_SECRET_KEY;
const EMAIL_TO = import.meta.env.EMAIL_TO;

if (!RESEND_API_KEY || !TURNSTILE_SECRET_KEY || !EMAIL_TO) {
  console.error("Missing required environment variables for form submission.");
}

const resend = new Resend(RESEND_API_KEY);

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  const runtime = getRuntime(request);
  const data = await request.formData();
  const { 'bot-field': botField, 'submit-timestamp': submitTimestamp, 'cf-turnstile-response': turnstileToken, ...formData } = Object.fromEntries(data.entries());

  // 1. Honeypot Check
  if (botField) {
    // This is a bot submission, but we return a success message to not alert the bot.
    return new Response(JSON.stringify({ message: "Form submitted successfully!" }), { status: 200 });
  }

  // 2. Timed Submission Check (must be at least 3 seconds)
  const formSubmitTime = Number(submitTimestamp);
  const serverReceiveTime = Date.now();
  if (serverReceiveTime - formSubmitTime < 3000) {
    return new Response(JSON.stringify({ message: "Submission too fast." }), { status: 400 });
  }

  // 3. Cloudflare Turnstile Verification
  if (!turnstileToken) {
    return new Response(JSON.stringify({ message: "Turnstile token missing." }), { status: 400 });
  }

  const turnstileResponse = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: clientAddress,
      }),
    }
  );

  const turnstileData = await turnstileResponse.json();

  if (!turnstileData.success) {
    console.error("Turnstile verification failed:", turnstileData['error-codes']);
    return new Response(JSON.stringify({ message: "Spam protection check failed." }), { status: 403 });
  }

  // If all checks pass, proceed to send the email and save to DB
  try {
    const repoName = new URL(request.headers.get('referer') || 'https://example.com').hostname;
    const leadData = JSON.stringify(formData);

    // Save to D1 database
    await runtime.env.DB.prepare(
      "INSERT INTO leads (repo, data) VALUES (?, ?)"
    ).bind(repoName, leadData).run();

    const emailHtml = `
      <h1>New Contact Form Submission</h1>
      <p>You have received a new message from your website contact form.</p>
      <h2>Submission Details:</h2>
      <ul>
        ${Object.entries(formData).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
      </ul>
      <hr>
      <p>This email was sent from the ${new URL(request.headers.get('referer') || 'https://example.com').hostname} website.</p>
    `;

    await resend.emails.send({
      from: `no-reply@${new URL(request.headers.get('referer') || 'https://example.com').hostname}`,
      to: EMAIL_TO,
      subject: 'New Contact Form Submission',
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({
        message: "Form submitted successfully!",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        message: "There was an error sending your message. Please try again later.",
      }),
      { status: 500 }
    );
  }
};
