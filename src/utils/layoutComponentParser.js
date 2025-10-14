import { v4 as uuidv4 } from 'uuid';

/**
 * Parses the string content of an .astro file and converts it into a Craft.js
 * JSON node structure. This parser is specifically designed to recognize a
 * predefined set of layout components.
 *
 * @param {string} astroContent The raw string content of the .astro file.
 * @returns {object} A Craft.js compatible JSON object.
 */
export function parseAstroToCraft(astroContent) {
  if (!astroContent || typeof astroContent !== 'string') {
    return {
      ROOT: {
        type: { resolvedName: 'div' },
        isCanvas: true,
        props: { style: { padding: '20px' } },
        displayName: 'Root',
        custom: {},
        hidden: false,
        nodes: [],
        linkedNodes: {},
      },
    };
  }

  const nodes = {};
  const rootNodeId = 'ROOT';
  const childNodes = [];

  // Define component patterns and their corresponding Craft.js types
  const componentPatterns = [
    { pattern: /<Header\s*\/>/g, type: 'Header', isCanvas: false, displayName: 'Header' },
    { pattern: /<slot\s*\/>/g, type: 'MainContent', isCanvas: true, displayName: 'Main Content' },
    { pattern: /<Footer\s*\/>/g, type: 'Footer', isCanvas: false, displayName: 'Footer' },
  ];

  // Find all matches and their positions
  const foundComponents = [];
  componentPatterns.forEach(({ pattern, type, isCanvas, displayName }) => {
    let match;
    while ((match = pattern.exec(astroContent)) !== null) {
      foundComponents.push({
        type,
        isCanvas,
        displayName,
        index: match.index,
      });
    }
  });

  // Sort components by their appearance in the file
  foundComponents.sort((a, b) => a.index - b.index);

  // Build the Craft.js node tree
  foundComponents.forEach(component => {
    const nodeId = uuidv4();
    nodes[nodeId] = {
      type: { resolvedName: component.type },
      isCanvas: component.isCanvas,
      props: {},
      displayName: component.displayName,
      custom: {},
      hidden: false,
      nodes: [],
      parent: rootNodeId,
      linkedNodes: {},
    };
    childNodes.push(nodeId);
  });

  // Create the ROOT node
  nodes[rootNodeId] = {
    type: { resolvedName: 'div' },
    isCanvas: true,
    props: { style: { padding: '20px', backgroundColor: '#f9f9f9' } },
    displayName: 'Root',
    custom: {},
    hidden: false,
    nodes: childNodes,
    linkedNodes: {},
  };

  // If no components were found, return a default empty state
  if (childNodes.length === 0) {
      return {
          [rootNodeId]: {
              type: { resolvedName: 'div' },
              isCanvas: true,
              props: { style: { padding: '20px' } },
              displayName: 'Root',
              custom: {},
              hidden: false,
              nodes: [],
              linkedNodes: {},
          }
      };
  }

  return nodes;
}

/**
 * Generates a clean .astro file string from a Craft.js JSON node structure.
 *
 * @param {object} craftJson The Craft.js JSON object.
 * @returns {string} A string representing the .astro file content.
 */
export function generateAstroFromCraft(craftJson) {
  if (!craftJson || !craftJson.ROOT) {
    return `<!-- Invalid Craft.js JSON data -->`;
  }

  // This map now includes the correct import path for each component.
  // This is the key to generating correct import statements.
  const componentMap = {
    'Header': { tag: 'Header', importPath: '~/components/Header.astro' },
    'Footer': { tag: 'Footer', importPath: '~/components/Footer.astro' },
    'Text': { tag: 'p' }, // No import needed for standard HTML tags
    'MainContent': { tag: 'main', defaultContent: '<slot />' },
  };

  const requiredImports = new Map();

  function renderNode(nodeId, allNodes, level = 0) {
    const node = allNodes[nodeId];
    if (!node) return `<!-- Missing node: ${nodeId} -->`;

    const componentName = node.type.resolvedName;
    const mapping = componentMap[componentName];
    const indent = '  '.repeat(level);

    if (!mapping) return `${indent}<!-- Unsupported component: ${componentName} -->`;

    const { tag, importPath, defaultContent } = mapping;

    // Collect required imports
    if (importPath) {
      requiredImports.set(tag, importPath);
    }

    // Self-closing tags (like <Header />)
    if (!node.isCanvas && (!node.nodes || node.nodes.length === 0) && componentName !== 'Text') {
      return `${indent}<${tag} />`;
    }

    // Container tags (like <main> or <p>)
    let innerContent;
    if (node.nodes && node.nodes.length > 0) {
      innerContent = '\n' + node.nodes.map(childId => renderNode(childId, allNodes, level + 1)).join('\n') + '\n' + indent;
    } else if (componentName === 'Text') {
      innerContent = node.props.text || '';
    } else if (defaultContent) {
      innerContent = `\n${indent}  ${defaultContent}\n${indent}`;
    } else {
      innerContent = '';
    }

    return `${indent}<${tag}>${innerContent}</${tag}>`;
  }

  const body = craftJson.ROOT.nodes.map(nodeId => renderNode(nodeId, craftJson, 0)).join('\n\n');

  const importStatements = Array.from(requiredImports.entries())
    .map(([tag, path]) => `import ${tag} from '${path}';`)
    .join('\n');

  const frontmatter = `---
// Generated by the Easy-SEO Layout Editor
${importStatements}
---`;

  return `${frontmatter}\n\n${body}`;
}