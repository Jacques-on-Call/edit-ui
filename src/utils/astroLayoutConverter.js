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
  return componentMap[tagName] || componentMap['default'];
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
    const { content: fileBody } = matter(astroContent);
    if (!fileBody.trim()) return null;

    const { ast } = await parse(fileBody);
    const craftNodes = {};

    function addNode(nodeData, parentId) {
      const nodeId = uuidv4();
      craftNodes[nodeId] = { ...nodeData, parent: parentId };
      if (parentId) {
        if (!craftNodes[parentId].nodes) {
          craftNodes[parentId].nodes = [];
        }
        craftNodes[parentId].nodes.push(nodeId);
      }
      return nodeId;
    }

    function traverse(astNode, parentId) {
      if (astNode.type === 'text' && astNode.value.trim() === '') {
        return;
      }
      if (!['element', 'text', 'fragment'].includes(astNode.type)) {
        return;
      }

      if (astNode.type === 'fragment') {
        (astNode.children || []).forEach(child => traverse(child, parentId));
        return;
      }

      if (astNode.type === 'text') {
        addNode({
          type: { resolvedName: 'Text' },
          isCanvas: false,
          props: { text: astNode.value.trim() },
          displayName: 'Text',
          custom: {},
          hidden: false,
          nodes: [],
        }, parentId);
        return;
      }

      if (astNode.type === 'element') {
        if (astNode.name === 'html' || astNode.name === 'head' || astNode.name === 'body') {
            (astNode.children || []).forEach(child => traverse(child, parentId));
            return;
        }

        const componentDef = mapTagToComponent(astNode.name);
        const nodeData = {
          type: { resolvedName: componentDef.name },
          isCanvas: componentDef.isCanvas,
          props: {},
          displayName: componentDef.name,
          custom: {},
          hidden: false,
          nodes: [], // Initialize nodes array
        };

        if (!componentDef.isCanvas) {
          const innerText = (astNode.children || [])
            .filter(c => c.type === 'text')
            .map(c => c.value)
            .join(' ')
            .trim();
          nodeData.props.text = innerText || astNode.name;
          addNode(nodeData, parentId);
        } else {
          const newParentId = addNode(nodeData, parentId);
          (astNode.children || []).forEach(child => traverse(child, newParentId));
        }
      }
    }

    craftNodes['ROOT'] = {
      type: { resolvedName: 'Page' },
      isCanvas: true,
      props: {},
      displayName: 'Page',
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    };

    traverse(ast, 'ROOT');

    return { nodes: craftNodes, rootNodeId: 'ROOT' };

  } catch (error) {
    console.error("Failed to convert Astro to Craft.js JSON:", error);
    return null;
  }
}