// easy-seo/src/lib/mockApi.js
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
    }, 200);
  });
};
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
