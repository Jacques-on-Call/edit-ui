import { parse } from 'node-html-parser';

export function tiptapToJSON(tiptapJSON) {
  const content = tiptapJSON.content;
  const json = [];

  for (const node of content) {
    switch (node.type) {
      case 'heading':
        json.push({
          type: 'heading',
          level: node.attrs.level,
          text: node.content.map(n => n.text).join(''),
        });
        break;
      case 'paragraph':
        json.push({
          type: 'paragraph',
          text: node.content ? node.content.map(n => n.text).join('') : '',
        });
        break;
      case 'callout':
        json.push({
          type: 'callout',
          style: node.attrs.style,
          text: node.content.map(n => n.text).join(''),
        });
        break;
      case 'codeBlock':
        json.push({
          type: 'code-block',
          language: node.attrs.language,
          code: node.content[0].text,
        });
        break;
      case 'image':
        json.push({
          type: 'image',
          src: node.attrs.src,
          alt: node.attrs.alt,
          width: node.attrs.width,
          height: node.attrs.height,
        });
        break;
      // Add more cases for other node types later
    }
  }

  return json;
}

export function jsonToTiptap(json) {
  const content = [];

  for (const block of json) {
    switch (block.type) {
      case 'heading':
        content.push({
          type: 'heading',
          attrs: { level: block.level },
          content: [{ type: 'text', text: block.text }],
        });
        break;
      case 'paragraph':
        const p_root = parse(block.text);
        const p_content = [];
        for (const node of p_root.childNodes) {
          if (node.nodeType === 3) { // TextNode
            p_content.push({ type: 'text', text: node.text });
          } else if (node.nodeType === 1) { // ElementNode
            const marks = [];
            if (node.tagName.toLowerCase() === 'strong') {
              marks.push({ type: 'bold' });
            }
            if (node.tagName.toLowerCase() === 'em') {
              marks.push({ type: 'italic' });
            }
            if (node.tagName.toLowerCase() === 'u') {
              marks.push({ type: 'underline' });
            }
            p_content.push({ type: 'text', text: node.text, marks });
          }
        }
        content.push({
          type: 'paragraph',
          content: p_content,
        });
        break;
      case 'callout':
        content.push({
          type: 'callout',
          attrs: { style: block.style },
          content: [{ type: 'text', text: block.text }],
        });
        break;
      case 'code-block':
        content.push({
          type: 'codeBlock',
          attrs: { language: block.language },
          content: [{ type: "text", text: block.code }],
        });
        break;
      case 'image':
        content.push({
          type: 'image',
          attrs: {
            src: block.src,
            alt: block.alt,
            width: block.width,
            height: block.height,
          },
        });
        break;
    }
  }

  return { type: 'doc', content };
}
