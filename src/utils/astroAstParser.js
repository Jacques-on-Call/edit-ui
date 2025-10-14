import { parse } from '@astrojs/compiler';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parses an Astro file's content into a Craft.js JSON structure using an AST.
 * @param {string} astroContent The raw string content of the .astro file.
 * @returns {Promise<object>} A promise that resolves to the Craft.js JSON object.
 */
export async function parseAstroToCraftJson(astroContent) {
  if (!astroContent) {
    return { ROOT: createNode('div', true) };
  }

  try {
    const { ast } = await parse(astroContent);
    const nodes = {};
    const rootId = 'ROOT';
    nodes[rootId] = createNode('div', true, { displayName: 'Root' });

    // The body of an Astro file is a "Fragment" node with children
    const body = ast.children.find(node => node.type === 'Fragment');
    if (body && body.children) {
      traverse(body.children, rootId, nodes);
    }

    return nodes;

  } catch (error) {
    console.error("Failed to parse Astro content:", error);
    // Return a minimal, valid Craft.js structure on error
    const nodes = { ROOT: createNode('div', true, { displayName: 'Error Root' }) };
    const errorNodeId = uuidv4();
    nodes.ROOT.nodes.push(errorNodeId);
    nodes[errorNodeId] = createNode('TextNode', false, {
      props: { text: `Error parsing Astro file: ${error.message}` },
      parent: 'ROOT'
    });
    return nodes;
  }
}

/**
 * Recursively traverses the AST and builds the Craft.js node map.
 * @param {Array<object>} astNodes The array of AST nodes to process.
 * @param {string} parentId The ID of the parent Craft.js node.
 * @param {object} craftNodes The map of all Craft.js nodes being built.
 */
function traverse(astNodes, parentId, craftNodes) {
  astNodes.forEach(astNode => {
    let craftNodeId = null;
    let isContainer = false;

    if (astNode.type === 'Element') {
      craftNodeId = uuidv4();
      // An element is a container if it can have children.
      isContainer = astNode.children && astNode.children.length > 0;
      const props = {
        tag: astNode.name,
        // We will add attribute parsing later
      };
      craftNodes[craftNodeId] = createNode('GenericElement', isContainer, { props, parent: parentId });

      // Recursively process children
      if (isContainer) {
        traverse(astNode.children, craftNodeId, craftNodes);
      }

    } else if (astNode.type === 'Text') {
      // Ignore whitespace-only text nodes
      if (astNode.value.trim() === '') return;

      craftNodeId = uuidv4();
      craftNodes[craftNodeId] = createNode('TextNode', false, {
        props: { text: astNode.value },
        parent: parentId,
      });

    } else if (astNode.type === 'Slot') {
      craftNodeId = uuidv4();
      craftNodes[craftNodeId] = createNode('GenericElement', true, {
        props: { tag: 'slot' }, // Represent slot as a special GenericElement
        parent: parentId,
      });
    }
    // Other node types (Comment, Frontmatter, etc.) are ignored for now.

    if (craftNodeId) {
      craftNodes[parentId].nodes.push(craftNodeId);
    }
  });
}

/**
 * Helper function to create a new Craft.js node object.
 * @param {string} type The resolved name of the component (e.g., 'GenericElement').
 * @param {boolean} isCanvas Whether the node is a container.
 * @param {object} overrides Additional properties to set on the node.
 * @returns {object} A new Craft.js node.
 */
function createNode(type, isCanvas, overrides = {}) {
  return {
    type: { resolvedName: type },
    isCanvas,
    props: overrides.props || {},
    displayName: overrides.displayName || type,
    custom: {},
    hidden: false,
    nodes: [],
    linkedNodes: {},
    ...overrides,
  };
}

/**
 * Generates an Astro file string from a Craft.js JSON object.
 * @param {object} craftJson The Craft.js JSON object from the editor state.
 * @returns {string} A string representing the .astro file content.
 */
export function generateAstroFromCraftJson(craftJson) {
  if (!craftJson || !craftJson.ROOT) {
    return "<!-- Invalid Craft.js JSON data -->";
  }

  function renderNode(nodeId, allNodes, level = 0) {
    const node = allNodes[nodeId];
    if (!node) return `<!-- Missing node: ${nodeId} -->`;

    const indent = '  '.repeat(level);
    const componentName = node.type.resolvedName;

    if (componentName === 'TextNode') {
      return `${indent}${node.props.text || ''}`;
    }

    if (componentName === 'GenericElement') {
      const tag = node.props.tag || 'div';

      // Handle self-closing tags like <slot />
      if (tag === 'slot') {
        return `${indent}<slot />`;
      }

      let innerContent = '';
      if (node.nodes && node.nodes.length > 0) {
        innerContent = '\n' + node.nodes.map(childId => renderNode(childId, allNodes, level + 1)).join('\n') + '\n' + indent;
      }

      return `${indent}<${tag}>${innerContent}</${tag}>`;
    }

    return `${indent}<!-- Unsupported component: ${componentName} -->`;
  }

  const body = craftJson.ROOT.nodes.map(nodeId => renderNode(nodeId, craftJson, 0)).join('\n');

  // For now, we'll return just the body. Frontmatter generation can be added later.
  return body;
}