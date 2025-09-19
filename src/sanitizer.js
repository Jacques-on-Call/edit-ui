import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  'h1', 'h2', 'p', 'ul', 'li', 'strong', 'em', 'a', 'img', 'blockquote', 'code', 'table', 'tr', 'td'
];

const allowedAttributes = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
  p: ['class'],
  blockquote: ['class'],
};

const transformTags = {
  a: (tagName, attribs) => ({
    tagName: 'a',
    attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' },
  }),
};

export function sanitize(html) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    transformTags,
  });
}
