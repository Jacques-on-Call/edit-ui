import { parse } from '@astrojs/compiler';
import { v4 as uuidv4 } from 'uuid';
import matter from 'gray-matter';

/**
 * Maps HTML tag names to their corresponding Craft.js component names.
 * @param {string} tagName - The HTML tag name.
 * @returns {string} The name of the Craft.js component.
 */
function mapTagToComponent(tagName) {
  const mapping = {
    'h1': 'EditorHero',
    'h2': 'Text',
    'h3': 'Text',
    'p': 'Text',
    'div': 'EditorSection',
    'header': 'EditorHero',
    'footer': 'EditorFooter',
    'article': 'EditorSection',
    'main': 'EditorSection',
    'nav': 'EditorSection',
    'a': 'Text',
    'span': 'Text',
    'img': 'EditorHero',
    'button': 'EditorCTA',
  };
  return mapping[tagName] || 'EditorSection'; // Default to a generic container
}

/**
 * Converts the HTML content of an Astro file into a Craft.js compatible JSON node structure.
 * This function intelligently traverses the AST, ignoring whitespace and creating a valid,
 * flat node map with a proper ROOT node.
 *
 * @param {string} astroContent - The full string content of an .astro file.
 * @returns {Promise<{nodes: object, rootNodeId: string}|null>} A valid Craft.js node map or null on failure.
 */
export async function convertAstroToCraft(astroContent) {
  try {
    const { data: frontmatter, content: fileBody } = matter(astroContent);
    // Prioritize content from frontmatter.body if it exists, otherwise use the file body.
    const htmlToParse = frontmatter.body || fileBody;

    // It's possible there's no content to parse after extracting frontmatter.
    if (!htmlToParse.trim()) {
      console.warn("No content found in Astro file to convert.");
      return null;
    }

    const { ast } = await parse(htmlToParse);
    const craftNodes = {};

    /**
     * Recursively traverses the AST and converts nodes to the Craft.js format.
     * @param {object} astNode - The current node in the Astro AST.
     * @returns {{id: string}|null} An object with the new node's ID, or null if the node should be ignored.
     */
    function traverse(astNode) {
      // **CRITICAL FIX**: Ignore nodes that are just whitespace.
      if (astNode.type === 'text' && astNode.value.trim() === '') {
        return null;
      }
      // Also ignore comments and other non-element/text nodes.
      if (!['element', 'text'].includes(astNode.type)) {
        return null;
      }

      const nodeId = uuidv4();
      const children = (astNode.children || []).map(traverse).filter(Boolean);
      let nodeData;

      if (astNode.type === 'element') {
        nodeData = {
          type: { resolvedName: mapTagToComponent(astNode.name) },
          isCanvas: true, // Optimistically allow dropping components inside most elements.
          props: {}, // Props would be populated from attributes in a more advanced version.
          displayName: mapTagToComponent(astNode.name),
          custom: {},
          hidden: false,
          nodes: children.map(c => c.id),
          linkedNodes: {},
        };
      } else { // astNode.type === 'text'
        nodeData = {
          type: { resolvedName: 'Text' },
          isCanvas: false,
          props: { text: astNode.value },
          displayName: 'Text',
          custom: {},
          hidden: false,
          nodes: [],
          linkedNodes: {},
        };
      }

      craftNodes[nodeId] = nodeData;

      // Assign the parent to each of the child nodes.
      children.forEach(child => {
        if (craftNodes[child.id]) {
          craftNodes[child.id].parent = nodeId;
        }
      });

      return { id: nodeId };
    }

    // The Astro compiler returns a root fragment, so we traverse its children.
    const topLevelChildren = ast.children.map(traverse).filter(Boolean);

    // **CRITICAL FIX**: Create a single, valid ROOT node for Craft.js.
    craftNodes['ROOT'] = {
      type: { resolvedName: 'Page' },
      isCanvas: true,
      props: { style: { minHeight: '100vh' } },
      displayName: 'Page',
      custom: {},
      hidden: false,
      nodes: topLevelChildren.map(c => c.id),
      linkedNodes: {},
    };

    // Assign ROOT as the parent for all top-level nodes.
    topLevelChildren.forEach(child => {
      if (craftNodes[child.id]) {
        craftNodes[child.id].parent = 'ROOT';
      }
    });

    // The entire object is the node map that `deserialize` expects.
    return { nodes: craftNodes, rootNodeId: 'ROOT' };

  } catch (error) {
    console.error("Failed to convert Astro to Craft.js JSON:", error);
    return null;
  }
}