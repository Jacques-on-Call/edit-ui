import { DecoratorNode } from 'lexical';
import { h } from 'preact';

// Simple Preact component to render the image
const ImageComponent = ({ src, alt, width, height }) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
    />
  );
};

export class ImageNode extends DecoratorNode {
  __src;
  __alt;
  __width;
  __height;

  static getType() {
    return 'image';
  }

  static clone(node) {
    return new ImageNode(node.__src, node.__alt, node.__width, node.__height, node.__key);
  }

  static importJSON(serializedNode) {
    const { src, alt, width, height } = serializedNode;
    return $createImageNode({ src, altText: alt, width, height });
  }

  constructor(src, altText, width, height, key) {
    super(key);
    this.__src = src;
    this.__alt = altText;
    this.__width = width;
    this.__height = height;
  }

  exportJSON() {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      alt: this.__alt,
      width: this.__width,
      height: this.__height,
    };
  }

  createDOM(config) {
    // This is the outer wrapper element for the decorator node.
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image; // You can add 'image: 'your-tailwind-classes'' to the theme.
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM() {
    // Returning false tells Lexical that this node does not need its
    // DOM representation updated. The Preact component will handle its own updates.
    return false;
  }

  decorate() {
    // This is the magic part for Preact. `preact/compat` will ensure
    // this JSX is rendered correctly within the Lexical editor.
    return <ImageComponent src={this.__src} alt={this.__alt} width={this.__width} height={this.__height} />;
  }
}

export function $createImageNode({ src, altText, width, height }) {
  return new ImageNode(src, altText, width, height);
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}
