import { parse } from '@astrojs/compiler';
import { astroCompilerReady } from '../main.jsx';

/**
 * @file Component Mapper
 * @description Utilities for parsing and mapping components from Astro layouts using the official Astro compiler.
 */

/**
 * Parses an Astro file's content to extract the names of all used components and islands.
 * This function uses the official `@astrojs/compiler` to walk the AST, ensuring an
 * accurate and robust parsing of Astro-specific syntax.
 *
 * @param {string} fileContent - The full content of the .astro file.
 * @returns {{components: string[], islands: string[], error: string|null}} An object containing lists of component and island names, or an error message.
 */
export async function parseAstroComponents(fileContent) {
  const components = new Set();
  const islands = new Set();

  try {
    // Ensure the WASM module is initialized before attempting to parse.
    await astroCompilerReady;
    const { ast } = await parse(fileContent);

    // The walk function recursively traverses the AST.
    function walk(node) {
      if (!node) return;

      // Check if the node is a component, identifiable by a capital letter start.
      if (node.type === 'Component' && node.name) {
        components.add(node.name);

        // Check for client directives to identify islands.
        const hasClientDirective = node.attributes?.some(
          attr => attr.type === 'attribute' && attr.name.startsWith('client:')
        );

        if (hasClientDirective) {
          islands.add(node.name);
        }
      }

      // Recurse into children. The AST structure can have children in various properties.
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }

    walk(ast);

    return { components: [...components], islands: [...islands], error: null };
  } catch (err) {
    // The compiler provides detailed error messages.
    return { components: [], islands: [], error: `Failed to parse Astro file: ${err.message}` };
  }
}

/**
 * A registry to map component names to their actual (dynamically imported) modules.
 * This is a placeholder for now and will be expanded in later phases.
 *
 * Example usage:
 * const HeaderComponent = await componentRegistry.Header();
 */
export const componentRegistry = {
  // Example entry:
  // Header: () => import('../components/Header.astro'),
};