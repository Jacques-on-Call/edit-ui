import { parse } from 'node-html-parser';
import { v4 as uuidv4 } from 'uuid';
import matter from 'gray-matter';

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

function mapTagToComponent(tagName) {
  return componentMap[tagName.toLowerCase()] || componentMap['default'];
}

export async function convertAstroToCraft(astroContent) {
  try {
    const { content: fileBody } = matter(astroContent);
    if (!fileBody.trim()) return null;

    const root = parse(fileBody);
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

    function traverse(htmlNode, parentId) {
      if (htmlNode.nodeType === 3 && htmlNode.text.trim() === '') { // Node.TEXT_NODE
        return;
      }

      if (htmlNode.nodeType === 3) { // Text node
        addNode({
          type: { resolvedName: 'Text' },
          isCanvas: false,
          props: { text: htmlNode.text.trim() },
          displayName: 'Text',
          custom: {},
          hidden: false,
          nodes: [],
        }, parentId);
        return;
      }

      if (htmlNode.nodeType === 1) { // Node.ELEMENT_NODE
        const tagName = htmlNode.tagName;
        if (!tagName) return; // Skip comments or other non-element nodes

        const componentDef = mapTagToComponent(tagName);
        const nodeData = {
          type: { resolvedName: componentDef.name },
          isCanvas: componentDef.isCanvas,
          props: {},
          displayName: componentDef.name,
          custom: {},
          hidden: false,
          nodes: [],
        };

        if (!componentDef.isCanvas) {
          nodeData.props.text = htmlNode.text.trim() || tagName;
          addNode(nodeData, parentId);
        } else {
          const newParentId = addNode(nodeData, parentId);
          (htmlNode.childNodes || []).forEach(child => traverse(child, newParentId));
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

    traverse(root, 'ROOT');

    return { nodes: craftNodes, rootNodeId: 'ROOT' };

  } catch (error) {
    console.error("Failed to convert Astro to Craft.js JSON:", error);
    return null;
  }
}