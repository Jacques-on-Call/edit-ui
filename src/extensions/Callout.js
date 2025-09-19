import { Node, mergeAttributes } from '@tiptap/core';

export const Callout = Node.create({
  name: 'callout',

  group: 'block',

  content: 'inline*',

  defining: true,

  addAttributes() {
    return {
      style: {
        default: 'info',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'p',
        getAttrs: (node) => {
          if (node.style.backgroundColor) {
            // This is a very basic heuristic.
            // We can make it more robust later.
            return { style: 'info' };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'callout' }), 0];
  },

  addCommands() {
    return {
      toggleCallout: () => ({ commands }) => {
        return commands.toggleNode(this.name, 'paragraph');
      },
    };
  },

  addNodeView() {
    return ({ editor, node, getPos, HTMLAttributes }) => {
      const { style } = node.attrs;
      const dom = document.createElement('div');
      const content = document.createElement('div');

      dom.classList.add('callout', `callout-${style}`);
      content.classList.add('content');

      dom.append(content);

      return {
        dom,
        contentDOM: content,
      };
    };
  },
});
