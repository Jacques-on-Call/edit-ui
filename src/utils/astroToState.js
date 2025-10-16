/**
 * Converts a string of Astro file content into the editor's state object.
 * This is the reverse of the stateToAstro function.
 * @param {string} astroContent - The raw string content of an .astro file.
 * @returns {object} - The state object for the layout editor.
 */
import { parse } from '@astrojs/compiler';

/**
 * Converts a string of Astro file content into the editor's state object.
 * @param {string} astroContent - The raw string content of an .astro file.
 * @returns {Promise<object>} - The state object for the layout editor.
 */
export async function astroToState(astroContent) {
  try {
    const { ast } = await parse(astroContent);

    const state = {
      root: { type: 'root', children: [], props: {} }
    };
    let nextId = 1;

    function traverse(astNode, parentId) {
      if (!astNode.children) return;

      for (const node of astNode.children) {
        if (node.type === 'component' || (node.type === 'element' && /^[A-Z]/.test(node.name))) {
          const newId = `comp-${nextId++}`;

          const props = {};
          if (node.attributes) {
            for (const attr of node.attributes) {
              if (attr.type === 'attribute') {
                props[attr.name] = attr.value;
              } else if (attr.type === 'expression') {
                props[attr.name] = `{${astroContent.substring(attr.position.start.offset + 1, attr.position.end.offset - 1)}}`;
              }
            }
          }

          const newComponent = {
            type: node.name,
            children: [],
            props: props,
          };

          state[newId] = newComponent;
          state[parentId].children.push(newId);

          // Recursively traverse children of the new component
          traverse(node, newId);
        }
      }
    }

    traverse(ast, 'root');

    return state;
  } catch (error) {
    console.error("Failed to parse Astro content:", error);
    return {
      root: {
        type: 'root',
        children: [],
        props: { error: `Failed to parse layout file: ${error.message}` }
      }
    };
  }
}