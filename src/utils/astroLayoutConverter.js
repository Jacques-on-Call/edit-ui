import { parse } from '@astrojs/compiler';
import { v4 as uuidv4 } from 'uuid';
import matter from 'gray-matter';

// A more detailed mapping that includes whether a component is a container.
const componentMap = {
  'h1': { name: 'EditorHero', isCanvas: false },
  'h2': { name: 'Text', isCanvas: false },
  'h3': { name: 'Text', isCanvas: false },
  'p': { name: 'Text', isCanvas: false },
  'div': { name: 'EditorSection', isCanvas: true },
  'header': { name: 'EditorHero', isCanvas: false },
  'footer': { name: 'EditorFooter', isCanvas: true },
  'article': { name: 'EditorSection', isCanvas: true },
  'main': { name: 'EditorSection', isCanvas: true },
  'nav': { name: 'EditorSection', isCanvas: true },
  'a': { name: 'Text', isCanvas: false },
  'span': { name: 'Text', isCanvas: false },
  'img': { name: 'EditorHero', isCanvas: false },
  'button': { name: 'EditorCTA', isCanvas: false },
  'default': { name: 'EditorSection', isCanvas: true }
};

/**
 * Maps an HTML tag to a Craft.js component definition.
 * @param {string} tagName - The HTML tag name.
 * @returns {{name: string, isCanvas: boolean}} The component definition.
 */
function mapTagToComponent(tagName) {
  const componentDef = componentMap[tagName];
  // The 'footer' is a string in the map, handle this case.
  if (typeof componentDef === 'string') {
    return { name: componentDef, isCanvas: true };
  }
  return componentDef || componentMap['default'];
}

/**
 * Converts the HTML content of an Astro file into a semantically correct
 * Craft.js compatible JSON node structure.
 *
 * @param {string} astroContent - The full string content of an .astro file.
 * @returns {Promise<{nodes: object, rootNodeId: string}|null>} A valid Craft.js node map or null on failure.
 */
export async function convertAstroToCraft(astroContent) {
  try {
    const { data: frontmatter, content: fileBody } = matter(astroContent);
    const htmlToParse = frontmatter.body || fileBody;

    if (!htmlToParse.trim()) {
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
      if (astNode.type === 'text' && astNode.value.trim() === '') {
        return null;
      }
      if (!['element', 'text', 'comment', 'doctype', 'fragment'].includes(astNode.type)) {
        return null;
      }

      // If it's a fragment (like the root of the AST), just traverse its children.
      if (astNode.type === 'fragment') {
          return (astNode.children || []).map(traverse).filter(Boolean);
      }

      const nodeId = uuidv4();
      let nodeData;
      let children = [];

      if (astNode.type === 'element') {
        const componentDef = mapTagToComponent(astNode.name);

        if (!componentDef.isCanvas) {
            const innerText = (astNode.children || [])
                .filter(c => c.type === 'text')
                .map(c => c.value)
                .join(' ')
                .trim();

            nodeData = {
                type: { resolvedName: componentDef.name },
                isCanvas: false,
                props: { text: innerText || astNode.name },
                displayName: componentDef.name,
                custom: {},
                hidden: false,
                nodes: [],
                linkedNodes: {},
            };
        } else {
            children = (astNode.children || []).flatMap(traverse).filter(Boolean);
            nodeData = {
                type: { resolvedName: componentDef.name },
                isCanvas: true,
                props: {},
                displayName: componentDef.name,
                custom: {},
                hidden: false,
                nodes: children.map(c => c.id),
                linkedNodes: {},
            };
        }
      } else { // astNode.type === 'text'
        nodeData = {
          type: { resolvedName: 'Text' },
          isCanvas: false,
          props: { text: astNode.value.trim() },
          displayName: 'Text',
          custom: {},
          hidden: false,
          nodes: [],
          linkedNodes: {},
        };
      }

      if (nodeData) {
        craftNodes[nodeId] = nodeData;

        children.forEach(child => {
            if (craftNodes[child.id]) {
            craftNodes[child.id].parent = nodeId;
            }
        });
        return { id: nodeId };
      }
      return null;
    }

    const topLevelNodes = (ast.children || []).flatMap(traverse).filter(Boolean);

    craftNodes['ROOT'] = {
      type: { resolvedName: 'Page' },
      isCanvas: true,
      props: {},
      displayName: 'Page',
      custom: {},
      hidden: false,
      nodes: topLevelNodes.map(n => n.id),
      linkedNodes: {},
    };

    topLevelNodes.forEach(node => {
      if (craftNodes[node.id]) {
        craftNodes[node.id].parent = 'ROOT';
      }
    });

    return { nodes: craftNodes, rootNodeId: 'ROOT' };

  } catch (error) {
    console.error("Failed to convert Astro to Craft.js JSON:", error);
    return null;
  }
}