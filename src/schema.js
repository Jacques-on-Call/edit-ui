// react-login/src/schema.js

/**
 * @typedef {Object} HeadingBlock
 * @property {'heading'} type
 * @property {1 | 2 | 3 | 4 | 5 | 6} level
 * @property {string} text
 */

/**
 * @typedef {Object} ParagraphBlock
 * @property {'paragraph'} type
 * @property {string} text
 */

/**
 * @typedef {Object} ImageBlock
 * @property {'image'} type
 * @property {string} src
 * @property {string} alt
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} CalloutBlock
 * @property {'callout'} type
 * @property {string} text
 * @property {'info' | 'warning' | 'danger'} style
 */

/**
 * @typedef {Object} CodeBlock
 * @property {'code-block'} type
 * @property {string} language
 * @property {string} code
 */

/**
 * @typedef {HeadingBlock | ParagraphBlock | ImageBlock | CalloutBlock | CodeBlock} ContentBlock
 */

/**
 * @type {ContentBlock[]}
 */
export const defaultContent = [
  {
    type: 'heading',
    level: 2,
    text: 'Welcome to the editor!',
  },
  {
    type: 'paragraph',
    text: 'You can start typing here.',
  },
];
