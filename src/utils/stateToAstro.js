/**
 * Converts the editor's state object into a string of Astro component code.
 * @param {object} components - The components object from the editor's state.
 * @param {object} componentTypes - The registry of component definitions.
 * @returns {string} - A string of Astro code.
 */
export function stateToAstro(components, componentTypes) {
  const imports = new Set();
  const componentMap = new Map();

  // First, find all unique component types used in the layout
  Object.values(components).forEach(comp => {
    if (comp.type !== 'root' && componentTypes[comp.type]) {
      imports.add(comp.type);
      // Corrected path to match the component structure.
      componentMap.set(comp.type, `import ${comp.type} from '../components/layout-editor/${comp.type}.astro';`);
    }
  });

  const generateComponentCode = (id) => {
    const component = components[id];
    if (!component || component.type === 'root') return component.children.map(generateComponentCode).join('\n');

    const ComponentDef = componentTypes[component.type];
    if (!ComponentDef) return `<!-- Unknown component: ${component.type} -->`;

    let propsString = '';
    if (component.props) {
      propsString = Object.entries(component.props)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return `${key}="${value.replace(/"/g, '\\"')}"`;
          }
          // For non-string props, we'll need a more robust serialization
          // For now, we'll just JSON.stringify them
          return `${key}={${JSON.stringify(value)}}`;
        })
        .join(' ');
    }

    if (ComponentDef.canHaveChildren && component.children.length > 0) {
      const childrenCode = component.children.map(generateComponentCode).join('\n');
      return `<${component.type} ${propsString}>\n${childrenCode}\n</${component.type}>`;
    } else {
      return `<${component.type} ${propsString} />`;
    }
  };

  const bodyCode = generateComponentCode('root');

  const frontmatter = `---
${Array.from(componentMap.values()).join('\n')}
---
`;

  return `${frontmatter}\n${bodyCode}`;
}