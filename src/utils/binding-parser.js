import { get } from 'lodash';

/**
 * A simple yet robust parser for replacing {{token}} placeholders in a string.
 * It uses lodash's `get` for safe deep access of nested properties.
 *
 * @param {string} templateString - The string containing placeholders (e.g., "Welcome, {{user.name}}").
 * @param {object} data - The data object to source values from (e.g., { user: { name: 'Jules' } }).
 * @returns {string} The parsed string with placeholders replaced.
 */
export const parseBindings = (templateString, data) => {
  if (typeof templateString !== 'string') {
    return templateString;
  }

  return templateString.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    // Trim whitespace from the key inside the braces
    const trimmedKey = key.trim();
    // Use lodash.get for safe access to nested properties
    const value = get(data, trimmedKey);

    // If the value is found, return it. Otherwise, return the original placeholder.
    // This prevents showing 'undefined' or 'null' in the UI.
    return value !== undefined && value !== null ? value : match;
  });
};

/**
 * Traverses a Craft.js node tree and applies the binding parser to all prop values.
 * This is a recursive function that modifies the node tree in place.
 *
 * @param {object} nodes - The 'nodes' object from Craft.js's serialized state.
 * @param {string} nodeId - The ID of the current node to process.
 * @param {object} data - The data object for the parser.
 */
export const applyBindingsToNodeTree = (nodes, nodeId, data) => {
    const node = nodes[nodeId];
    if (!node) return;

    // Parse all props of the current node
    if (node.data.props) {
        Object.keys(node.data.props).forEach(propKey => {
            node.data.props[propKey] = parseBindings(node.data.props[propKey], data);
        });
    }

    // Recursively process all children
    if (node.data.nodes && node.data.nodes.length > 0) {
        node.data.nodes.forEach(childId => {
            applyBindingsToNodeTree(nodes, childId, data);
        });
    }
};