// easy-seo/src/lib/mockApi.js

// This is the hard-coded mock page data as specified in the brief.
const mockPageJson = {
  "meta": {
    "title": "Test Home Page",
    "slug": "home-page",
    "initialContent": "<p>Welcome to your test page. Edit this content.</p>"
  },
  "children": [
    {
      "id": "block-1",
      "type": "hero",
      "props": { "title": "Welcome", "text": "<h1>Hero Title</h1>" },
      "children": []
    },
    {
      "id": "block-2",
      "type": "section",
      "props": { "name": "main" },
      "children": [
        {
          "id": "block-2-1",
          "type": "paragraph",
          "props": { "text": "<p>This is a paragraph block</p>" },
          "children": []
        },
        {
          "id": "block-2-2",
          "type": "cta",
          "props": { "text": "Click Me" },
          "children": []
        }
      ]
    }
  ]
};

/**
 * Fetches the mock page JSON for a given slug.
 * In Sprint 1, it only returns the hard-coded fixture for 'home-page'.
 * @param {string} slug - The slug of the page to fetch.
 * @returns {Promise<object>} A promise that resolves with the page data.
 */
export const fetchPageJson = (slug) => {
  console.log(`[mockApi] fetchPageJson called for ${slug}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real scenario, you'd fetch different data based on the slug.
      if (slug === 'home-page' || slug === 'home') {
        console.log(`[mockApi] returning fixture for ${slug}`);
        resolve(mockPageJson);
      } else {
        // For now, we resolve with the same data for any valid-looking slug
        console.log(`[mockApi] returning fixture for ${slug}`);
        resolve(mockPageJson);
      }
    }, 100); // Simulate network delay
  });
};

/**
 * Saves a draft of the page content to localStorage.
 * @param {string} slug - The slug of the page.
 * @param {string} content - The content to save.
 * @returns {Promise<{ok: boolean, error?: string}>} A promise that resolves with the save status.
 */
export const saveDraft = (slug, content) => {
  console.log(`[mockApi] saveDraft called for slug: ${slug}`);
  const key = `easy-seo:draft:${slug}`;

  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const dataToStore = JSON.stringify({
          content,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem(key, dataToStore);
        console.log(`[mockApi] saveDraft resolved, key=${key}`);
        resolve({ ok: true });
      } catch (error) {
        console.error('[mockApi] Failed to save draft to localStorage:', error);
        resolve({ ok: false, error: error.message });
      }
    }, 500); // Simulate network delay
  });
};
