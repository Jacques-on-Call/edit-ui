import { DecoratorNode } from 'lexical';
import { h } from 'preact';
import StyledImageComponent from '../components/StyledImageComponent';

export class StyledImageNode extends DecoratorNode {
  __src;
  __alt;
  __width;
  __alignment;

  static getType() {
    return 'styled-image';
  }

  static clone(node) {
    return new StyledImageNode(
      node.__src,
      node.__alt,
      node.__width,
      node.__alignment,
      node.__key,
    );
  }

  constructor(src, alt, width, alignment, key) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__width = width;
    this.__alignment = alignment;
  }

  createDOM(config) {
    const div = document.createElement('div');
    div.style.display = 'contents';
    return div;
  }

  updateDOM() {
    return false;
  }

  decorate(editor, config) {
    return (
      <StyledImageComponent
        src={this.__src}
        alt={this.__alt}
        width={this.__width}
        alignment={this.__alignment}
        nodeKey={this.getKey()}
      />
    );
  }
}

export function $createStyledImageNode({ src, alt, width, alignment }) {
  return new StyledImageNode(src, alt, width, alignment);
}

export function $isStyledImageNode(node) {
  return node instanceof StyledImageNode;
}
