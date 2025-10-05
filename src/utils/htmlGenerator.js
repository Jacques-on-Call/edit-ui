import { marked } from 'marked';

// Helper function to render a button component
function renderButton(button) {
  if (!button || !button.text || !button.url) return '';
  // Basic styling for a button, assuming Tailwind CSS is linked.
  return `<a href="${button.url}" class="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors">${button.text}</a>`;
}

// Helper function to render an image
function renderImage(image) {
  if (!image || !image.src) return '';
  return `<img src="${image.src}" alt="${image.alt || ''}" class="my-4 rounded-lg shadow-md" />`;
}

/**
 * Generates a full HTML document for previewing an Astro page.
 * @param {object} frontmatter - The frontmatter object from the parsed file.
 * @returns {string} A complete HTML document as a string.
 */
export function generateHtmlForPreview(frontmatter) {
  if (!frontmatter) {
    return `<html><head><title>Error</title></head><body><h1>Error: No frontmatter provided for preview.</h1></body></html>`;
  }

  const { title, sections } = frontmatter;
  let bodyContent = '';

  if (sections && Array.isArray(sections)) {
    for (const section of sections) {
      // These class names are inspired by common web design patterns and should be styled by the project's CSS.
      bodyContent += `<section class="py-12 px-4 section-${section.type}">`;
      bodyContent += `<div class="max-w-4xl mx-auto">`;

      switch (section.type) {
        case 'hero':
          if (section.title) bodyContent += `<h1 class="text-4xl font-bold text-center mb-4">${section.title}</h1>`;
          if (section.subtitle) bodyContent += `<h2 class="text-xl text-center text-gray-600 mb-6">${section.subtitle}</h2>`;
          if (section.image) bodyContent += `<div class="flex justify-center">${renderImage(section.image)}</div>`;
          if (section.buttons && section.buttons.length > 0) {
            bodyContent += `<div class="text-center mt-6 space-x-4">${section.buttons.map(renderButton).join('')}</div>`;
          }
          break;

        case 'text_block':
          if (section.content) {
            // Using prose to get Tailwind's typography styles
            bodyContent += `<div class="prose lg:prose-xl mx-auto">${marked.parse(section.content)}</div>`;
          }
          break;

        case 'grid':
          if (section.title) bodyContent += `<h2 class="text-3xl font-bold text-center mb-8">${section.title}</h2>`;
          if (section.items && Array.isArray(section.items)) {
            bodyContent += `<div class="grid md:grid-cols-3 gap-8">`;
            for (const item of section.items) {
              bodyContent += `<div class="bg-white p-6 rounded-lg shadow-lg">`;
              if (item.image) bodyContent += renderImage(item.image);
              if (item.title) bodyContent += `<h3 class="text-xl font-bold mb-2">${item.title}</h3>`;
              if (item.text) bodyContent += `<p class="text-gray-700">${item.text}</p>`;
              if (item.buttons && item.buttons.length > 0) {
                bodyContent += `<div class="mt-4">${item.buttons.map(renderButton).join('')}</div>`;
              }
              bodyContent += `</div>`;
            }
            bodyContent += `</div>`;
          }
          break;

        default:
          bodyContent += `<div class="bg-gray-100 p-4 rounded-lg"><p>Unknown section type: <strong>${section.type}</strong></p><pre class="text-sm bg-gray-200 p-2 rounded mt-2"><code>${JSON.stringify(section, null, 2)}</code></pre></div>`;
      }

      bodyContent += `</div></section>`;
    }
  } else {
    bodyContent = `<div class="text-center py-12">This document does not contain a 'sections' array to preview.</div>`;
  }

  // Link to the main stylesheet. Vite will handle serving this during development.
  // This assumes the main CSS entry point is at /src/index.css
  const stylesheetUrl = `/src/index.css`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Preview: ${title || 'Untitled Page'}</title>
        <link rel="stylesheet" href="${stylesheetUrl}">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50">
        <main>${bodyContent}</main>
      </body>
    </html>
  `;
}