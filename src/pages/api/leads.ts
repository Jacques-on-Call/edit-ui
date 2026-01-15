// easy-seo/src/pages/api/leads.ts
import type { APIRoute } from 'astro';
import { getRuntime } from "@astrojs/cloudflare/runtime";

export const GET: APIRoute = async ({ request, locals }) => {
  const runtime = getRuntime(request);
  const url = new URL(request.url);
  const repo = url.searchParams.get('repo');

  if (!repo) {
    return new Response(JSON.stringify({ message: "Repo parameter is required." }), { status: 400 });
  }

  try {
    const { results } = await runtime.env.DB.prepare(
      "SELECT * FROM leads WHERE repo = ? ORDER BY created_at DESC"
    ).bind(repo).all();

    return new Response(
      JSON.stringify(results),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching leads:", error);
    return new Response(
      JSON.stringify({
        message: "There was an error fetching your leads.",
      }),
      { status: 500 }
    );
  }
};
