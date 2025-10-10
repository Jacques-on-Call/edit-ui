import { Parser } from 'acorn';
import jsx from 'acorn-jsx';

/**
 * @file Component Mapper
 * @description Utilities for parsing and mapping components from Astro layouts.
 */

/**
 * Parses an Astro file's body to extract the names of all used components.
 * @param {string} astroBody - The body content of the .astro file (after the frontmatter).
 * @returns {{components: string[], error: string|null}} An object containing a list of component names, or an error message.
 */
export function extractComponentsFromAstro(astroBody) {
  const JsxParser = Parser.extend(jsx());
  const components = new Set();

  try {
    const ast = JsxParser.parse(astroBody, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    });

    // Simple recursive traversal to find JSXOpeningElement nodes
    function walk(node) {
      if (!node) return;

      if (node.type === 'JSXOpeningElement') {
        if (node.name && node.name.name) {
          // Add component name to the set (e.g., 'Header', 'Footer', 'slot')
          components.add(node.name.name);
        }
      }

      // Recurse into children
      for (const key in node) {
        if (node.hasOwnProperty(key)) {
          const child = node[key];
          if (typeof child === 'object' && child !== null) {
            if (Array.isArray(child)) {
              child.forEach(walk);
            } else {
              walk(child);
            }
          }
        }
      }
    }

    walk(ast);

    return { components: [...components], error: null };
  } catch (err) {
    return { components: [], error: `Failed to parse Astro body: ${err.message}` };
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