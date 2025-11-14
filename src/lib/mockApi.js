// easy-seo/src/lib/mockApi.js

const mockPageJson = {
  "meta": { "title": "Test Home Page", "slug": "home-page", "initialContent": "<p>Welcome to your test page. Edit this content.</p>" },
  "children": [
    { "id": "block-1", "type": "hero", "props": { "title": "Welcome", "text": "<h1>Hero Title</h1>" }, "children": [] },
    { "id": "block-2", "type": "section", "props": { "name": "main" }, "children": [
        { "id": "block-2-1", "type": "paragraph", "props": { "text": "<p>This is a paragraph block</p>" }, "children": [] },
        { "id": "block-2-2", "type": "cta", "props": { "text": "Click Me" }, "children": [] }
      ]
    }
  ]
};

export const fetchPageJson = (slug) => {
  console.log(`[mockApi] fetchPageJson called for ${slug}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockPageJson);
    }, 100);
  });
};

export const saveDraft = (slug, content) => {
  const payloadLength = content.length;
  console.log(`[mockApi] saveDraft called ${slug} payload length ${payloadLength}`);
  const key = `easy-seo:draft:${slug}`;

  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const dataToStore = JSON.stringify({ content, timestamp: new Date().toISOString() });
        localStorage.setItem(key, dataToStore);
        console.log(`[mockApi] saveDraft resolved, key=${key}`);
        resolve({ ok: true });
      } catch (error) {
        console.error('[mockApi] Failed to save draft to localStorage:', error);
        resolve({ ok: false, error: error.message });
      }
    }, 500);
  });
};
