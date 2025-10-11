import { parse } from '@astrojs/compiler';
import { v4 as uuidv4 } from 'uuid';

/**
 * Converts the HTML body of an Astro file into a Craft.js compatible JSON node structure.
 * @param {string} astroContent - The full string content of an .astro file.
 * @returns {Promise<{nodes: object, rootNodeId: string}|null>} - An object containing the nodes and the ID of the root node, or null on failure.
 */
export async function convertAstroToCraft(astroContent) {
  try {
    const { ast } = await parse(astroContent);
    const craftNodes = {};
    let rootNodeId = null;

    // Recursive function to traverse the AST and build Craft.js nodes
    function traverse(astNode) {
      if (astNode.type === 'element') {
        const nodeId = uuidv4();
        const children = (astNode.children || []).map(traverse).filter(Boolean);

        craftNodes[nodeId] = {
          type: {
            // We'll need a mapping from HTML tags to Craft.js components
            resolvedName: mapTagToComponent(astNode.name)
          },
          isCanvas: true, // Allow dropping components inside
          props: {},
          displayName: mapTagToComponent(astNode.name),
          custom: {},
          hidden: false,
          nodes: children.map(c => c.id),
          linkedNodes: {}
        };

        children.forEach(child => {
            if (craftNodes[child.id]) {
                craftNodes[child.id].parent = nodeId;
            }
        });

        return { id: nodeId };
      } else if (astNode.type === 'text') {
        // Handle text nodes - convert them to a Text component in Craft.js
        const nodeId = uuidv4();
        craftNodes[nodeId] = {
            type: { resolvedName: 'Text' },
            isCanvas: false,
            props: { text: astNode.value },
            displayName: 'Text',
            custom: {},
            hidden: false,
            nodes: [],
            linkedNodes: {}
        };
        return { id: nodeId };
      }
      return null;
    }

    // Find the <body> tag and start traversal from there.
    // This is a simplification; a real implementation would need to walk the whole tree.
    let bodyNode = null;
    function findBody(node) {
        if (node.type === 'element' && node.name === 'body') {
            bodyNode = node;
            return;
        }
        if (node.children) {
            for (const child of node.children) {
                findBody(child);
                if (bodyNode) return;
            }
        }
    }

    findBody(ast);

    if (bodyNode) {
      const rootChildren = (bodyNode.children || []).map(traverse).filter(Boolean);
      rootNodeId = uuidv4();
      craftNodes[rootNodeId] = {
        type: { resolvedName: 'Page' },
        isCanvas: true,
        props: { style: { minHeight: '100vh' } },
        displayName: 'Page',
        custom: {},
        hidden: false,
        nodes: rootChildren.map(c => c.id),
        linkedNodes: {}
      };
      rootChildren.forEach(child => {
        if(craftNodes[child.id]) {
            craftNodes[child.id].parent = rootNodeId;
        }
      });
    } else {
        return null; // No body tag found
    }

    // The root node of the Craft.js canvas
    craftNodes[rootNodeId].parent = 'ROOT';

    const finalJson = {
      ...craftNodes,
      ROOT: {
        type: { resolvedName: 'Page' },
        isCanvas: true,
        props: {},
        displayName: 'Page',
        custom: {},
        hidden: false,
        nodes: [rootNodeId], // The main page container is the direct child of ROOT
        linkedNodes: {},
      },
    };

    // The data structure expected by `actions.deserialize()` is just the node map.
    return { nodes: finalJson, rootNodeId: 'ROOT' };

  } catch (error) {
    console.error("Failed to convert Astro to Craft.js JSON:", error);
    return null;
  }
}

function mapTagToComponent(tagName) {
  const mapping = {
    'h1': 'Text', // Assuming a generic Text component can handle this
    'p': 'Text',
    'div': 'EditorSection', // A div could be a section
    'header': 'EditorHero',
    'footer': 'EditorFooter',
    // Add more mappings here
  };
  return mapping[tagName] || 'EditorSection'; // Default to a generic container
}