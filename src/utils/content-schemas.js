export const contentSchemas = {
  service: {
    name: 'Service',
    fields: [
      { id: 'service.title', label: 'Service Title', type: 'text' },
      { id: 'service.description', label: 'Service Description', type: 'text' },
      { id: 'service.heroImage', label: 'Hero Image URL', type: 'url' },
    ],
  },
  blogPost: {
    name: 'Blog Post',
    fields: [
      { id: 'blogPost.title', label: 'Post Title', type: 'text' },
      { id: 'blogPost.author', label: 'Author Name', type: 'text' },
      { id: 'blogPost.publishDate', label: 'Publish Date', type: 'date' },
      { id: 'blogPost.summary', label: 'Post Summary', type: 'text' },
      { id: 'blogPost.content', label: 'Main Content', type: 'richtext' },
    ],
  },
  // Add other content types here in the future
};

/**
 * A simple utility to get the schema for a given page type.
 * The mapping between a layout's purpose and a schema is defined here.
 * For now, we'll assume a direct mapping from the template name.
 * @param {string} type - The type of page (e.g., 'Service Page', 'Blog Post').
 * @returns {object|null} The corresponding schema or null if not found.
 */
export const getSchemaForType = (type) => {
  if (!type) return null;
  const lowerType = type.toLowerCase();

  if (lowerType.includes('service')) {
    return contentSchemas.service;
  }
  if (lowerType.includes('blog')) {
    return contentSchemas.blogPost;
  }
  return null;
};