/**
 * Maps mock data for a blog post to the props of a given Craft.js node.
 * This function modifies the node object directly.
 * @param {object} node - The Craft.js node object from the serialized state.
 * @param {object} mockData - The mock data object for a blog post.
 */
const mapBlogPostDataToNode = (node, mockData) => {
  switch (node.data.displayName) {
    case 'Hero':
      node.data.props.title = mockData.title;
      node.data.props.subtitle = mockData.summary;
      break;
    case 'EditorSection': // Assuming content is rendered in a generic section
      if (node.data.props.content) { // Check if the prop exists
        node.data.props.content = mockData.content;
      }
      break;
    // Add other mappings as needed for different components
  }
};

/**
 * Maps mock data for a service page to the props of a given Craft.js node.
 * @param {object} node - The Craft.js node object.
 * @param {object} mockData - The mock data object for a service page.
 */
const mapServicePageDataToNode = (node, mockData) => {
    switch (node.data.displayName) {
      case 'Hero':
        node.data.props.title = mockData.headline;
        node.data.props.subtitle = mockData.subheading;
        break;
      case 'FeatureGrid':
        node.data.props.features = mockData.features;
        break;
      case 'CTA':
        node.data.props.text = mockData.headline;
        node.data.props.buttonText = mockData.ctaButtonText;
        break;
    }
};

/**
 * Prepares a Craft.js layout for rendering by injecting mock data into it.
 * @param {string|object} layoutJson - The serialized layout state.
 * @param {object} mockData - The mock data to inject.
 * @param {string} pageType - The type of page (e.g., 'blogpost', 'service').
 * @returns {object} The modified layout object, ready for the <Renderer>.
 */
export const prepareLayoutForRender = (layoutJson, mockData, pageType) => {
  const layout = typeof layoutJson === 'string' ? JSON.parse(layoutJson) : layoutJson;

  // Deep clone the layout to avoid mutating the original state
  const newLayout = JSON.parse(JSON.stringify(layout));

  Object.values(newLayout.nodes).forEach(node => {
    if (pageType === 'blogpost') {
      mapBlogPostDataToNode(node, mockData);
    } else if (pageType === 'service') {
      mapServicePageDataToNode(node, mockData);
    }
  });

  return newLayout;
};