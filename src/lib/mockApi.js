// easy-seo/src/lib/mockApi.js

/**
 * Fetches a mock page JSON structure.
 * @param {string} slug - The identifier for the page.
 * @returns {Promise<object>} A promise that resolves to the page data.
 */
export const fetchPageJson = (slug) => {
  console.log(`[mockApi] fetchPageJson called for ${slug}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: slug,
        title: `Mock Title for ${slug}`,
        content: `This is the initial mock content for the page: ${slug}.`,
        blocks: [
          { id: 'block-1', type: 'heading', content: 'Main Heading' },
          { id: 'block-2', type: 'paragraph', content: 'A paragraph of text.' },
        ],
      });
    }, 500); // Simulate network delay
  });
};

/**
 * Saves a draft of the page content to localStorage.
 * @param {string} slug - The identifier for the page.
 * @param {object} payload - The content to save.
 * @returns {Promise<void>} A promise that resolves when the save is complete.
 */
export const saveDraft = (slug, payload) => {
  const payloadString = JSON.stringify(payload);
  console.log(`[mockApi] saveDraft called ${slug} payload length ${payloadString.length}`);
  return new Promise((resolve, reject) => {
    try {
      const key = `easy-seo:draft:${slug}`;
      localStorage.setItem(key, payloadString);
      console.log(`[mockApi] saveDraft resolved, key=${key}`);
      resolve();
    } catch (err) {
      console.error('[mockApi] Failed to save draft to localStorage:', err);
      reject(err);
    }
  });
};
