import { DecoratorNode } from 'lexical';
import { h } from 'preact';

// Simple Preact component to render the CTA button
const CtaComponent = ({ text, url }) => {
  return (
    <a
      href={url}
      onClick={(e) => e.preventDefault()} // Prevent navigation inside the editor
      style={{
        display: 'inline-block',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        borderRadius: '5px',
        textDecoration: 'none',
        fontWeight: 'bold',
        cursor: 'pointer',
        margin: '10px 0'
      }}
    >
      {text}
    </a>
  );
};

export class CtaNode extends DecoratorNode {
  __text;
  __url;

  static getType() {
    return 'cta';
  }

  static clone(node) {
    return new CtaNode(node.__text, node.__url, node.__key);
  }

  static importJSON(serializedNode) {
    return $createCtaNode(serializedNode.text, serializedNode.url);
  }

  constructor(text, url, key) {
    super(key);
    this.__text = text;
    this.__url = url;
  }

  exportJSON() {
    return {
      type: 'cta',
      version: 1,
      text: this.__text,
      url: this.__url,
    };
  }

  createDOM() {
    // The outer wrapper for the decorator node
    return document.createElement('div');
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return <CtaComponent text={this.__text} url={this.__url} />;
  }
}

export function $createCtaNode(text, url) {
  return new CtaNode(text, url);
}

export function $isCtaNode(node) {
  return node instanceof CtaNode;
}
