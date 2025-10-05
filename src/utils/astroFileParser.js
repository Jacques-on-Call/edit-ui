import { Parser } from ‘acorn’;

/**

- Converts a JavaScript value to source code string
  */
  function valueToSourceCode(value, indent = 0) {
  const indentStr = ’  ’.repeat(indent);

if (value === null) return ‘null’;
if (value === undefined) return ‘undefined’;

switch (typeof value) {
case ‘string’:
if (value.includes(’\n’)) {
return ‘`' + value.replace(/`/g, ‘\`').replace(/\$/g, '\\$') + '`’;
}
return “’” + value.replace(/’/g, “\’”) + “’”;

```
case 'number':
case 'boolean':
  return String(value);

case 'object':
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map(item => 
      indentStr + '  ' + valueToSourceCode(item, indent + 1)
    ).join(',\n');
    return '[\n' + items + '\n' + indentStr + ']';
  }
  
  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';
  const props = entries.map(([key, val]) => {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) 
      ? key 
      : `'${key}'`;
    return indentStr + '  ' + safeKey + ': ' + valueToSourceCode(val, indent + 1);
  }).join(',\n');
  return '{\n' + props + '\n' + indentStr + '}';

default:
  return JSON.stringify(value);
```

}
}

/**

- Traverses an Acorn AST node to convert it into a JavaScript value.
  */
  function astNodeToValue(node, source) {
  switch (node.type) {
  case ‘Literal’:
  return node.value;
  case ‘ObjectExpression’: {
  const obj = {};
  for (const prop of node.properties) {
  const key = prop.key.name || prop.key.value;
  obj[key] = astNodeToValue(prop.value, source);
  }
  return obj;
  }
  case ‘ArrayExpression’:
  return node.elements.map(element => astNodeToValue(element, source));
  case ‘TemplateLiteral’:
  return node.quasis.map(q => q.value.cooked).join(’’);
  default:
  try {
  const valueString = source.substring(node.start, node.end);
  return Function(`"use strict"; return (${valueString})`)();
  } catch (e) {
  console.error(“Could not evaluate AST node:”, e);
  return null;
  }
  }
  }

/**

- Parses an .astro file’s frontmatter and body.
  */
  export async function parseAstroFile(fileContent) {
  const trace = { detected: ‘astro-ast’, rawFrontmatter: null, body: null, parsed: null, error: null };

if (!fileContent) {
trace.error = ‘Empty content’;
return { model: null, trace };
}

try {
const text = fileContent.replace(/\r\n/g, ‘\n’);
const frontmatterRegex = /^—([\s\S]*?)—/;
const match = text.match(frontmatterRegex);

```
if (!match || !match[1]) {
  trace.error = 'No frontmatter block found.';
  const model = { frontmatter: {}, body: text, originalBody: text, raw: text, rawType: 'none' };
  return { model, trace };
}

const frontmatterContent = match[1].trim();
trace.rawFrontmatter = frontmatterContent;

// Extract the original body (the component markup after frontmatter)
const originalBody = text.substring(match[0].length).trim();
trace.body = originalBody;

const frontmatter = {};
if (frontmatterContent) {
  try {
    const ast = Parser.parse(frontmatterContent, { ecmaVersion: 'latest', sourceType: 'module' });
    for (const node of ast.body) {
      if (node.type === 'ExportNamedDeclaration' && node.declaration && node.declaration.type === 'VariableDeclaration') {
        for (const declarator of node.declaration.declarations) {
          if (declarator.id.type === 'Identifier' && declarator.init) {
            const name = declarator.id.name;
            const value = astNodeToValue(declarator.init, frontmatterContent);
            frontmatter[name] = value;
          }
        }
      }
    }
    trace.parsed = frontmatter;
  } catch (parseError) {
    trace.error = `Frontmatter syntax error: ${parseError.message}`;
  }
}

const model = {
  frontmatter,
  body: originalBody, // Keep original for display
  originalBody, // Store separately for reconstruction
  raw: text,
  rawType: 'astro-ast',
};

if (trace.error) {
  model.body = `Error parsing frontmatter. Please check the syntax.\n\n${fileContent}`;
  model.rawType = 'error';
}

return { model, trace };
```

} catch (err) {
trace.error = (err && err.message) || String(err);
const model = {
frontmatter: {},
body: fileContent,
originalBody: fileContent,
raw: fileContent,
rawType: ‘error’
};
return { model, trace };
}
}

/**

- Stringifies a frontmatter object and body back into a complete .astro file.
- For Astro files, we preserve the original component markup.
  */
  export function stringifyAstroFile(frontmatter, originalBody) {
  let frontmatterString = ‘’;
  for (const [key, value] of Object.entries(frontmatter)) {
  frontmatterString += `export const ${key} = ${valueToSourceCode(value)};\n`;
  }

// Preserve the original component markup
return `—
${frontmatterString}—

${originalBody}`;
}
