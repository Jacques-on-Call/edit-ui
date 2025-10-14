import { v4 as uuidv4 } from 'uuid';

/**
 * A minimal parser that checks for a specific string and returns
 * the corresponding Craft.js JSON if found.
 * @param {string} astroContent The raw string content of the .astro file.
 * @returns {object|null} A Craft.js JSON object or null if no match.
 */
export function parseTestComponent(astroContent) {
  if (astroContent.includes('<div>Hello World</div>')) {
    const rootId = 'ROOT';
    const testComponentId = uuidv4();

    return {
      [rootId]: {
        type: { resolvedName: 'div' },
        isCanvas: true,
        props: { style: { padding: '20px' } },
        displayName: 'Root',
        nodes: [testComponentId],
        hidden: false,
        custom: {},
        linkedNodes: {},
      },
      [testComponentId]: {
        type: { resolvedName: 'TestComponent' },
        isCanvas: false,
        props: {},
        displayName: 'Test Component',
        parent: rootId,
        hidden: false,
        nodes: [],
        custom: {},
        linkedNodes: {},
      },
    };
  }

  return null; // Return null if the component isn't found
}

/**
 * A minimal generator that checks for the TestComponent in the Craft.js
 * JSON and returns the corresponding .astro file string if found.
 * @param {object} craftJson The Craft.js JSON object.
 * @returns {string|null} The .astro file string or null.
 */
export function generateTestComponent(craftJson) {
  if (!craftJson || !craftJson.ROOT || !craftJson.ROOT.nodes) {
    return null;
  }

  const rootNodes = craftJson.ROOT.nodes;
  const hasTestComponent = rootNodes.some(nodeId => {
    const node = craftJson[nodeId];
    return node && node.type.resolvedName === 'TestComponent';
  });

  if (hasTestComponent) {
    return `---
---
<div>Hello World</div>`;
  }

  return null;
}