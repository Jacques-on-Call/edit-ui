import { DecoratorNode } from 'lexical';
import { h } from 'preact';

// Simple Preact component to render the Callout box
const CalloutComponent = ({ text }) => {
  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // bg-blue-500/10
        borderLeft: '4px solid rgba(59, 130, 246, 1)', // border-l-4 border-blue-500
        borderRadius: '4px',
        margin: '10px 0',
        color: 'rgba(209, 213, 219, 1)', // text-gray-300
      }}
    >
      {text}
    </div>
  );
};

export class CalloutNode extends DecoratorNode {
  __text;

  static getType() {
    return 'callout';
  }

  static clone(node) {
    return new CalloutNode(node.__text, node.__key);
  }

  static importJSON(serializedNode) {
    return $createCalloutNode(serializedNode.text);
  }

  constructor(text, key) {
    super(key);
    this.__text = text;
  }

  exportJSON() {
    return {
      type: 'callout',
      version: 1,
      text: this.__text,
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
    return <CalloutComponent text={this.__text} />;
  }
}

export function $createCalloutNode(text) {
  return new CalloutNode(text);
}

export function $isCalloutNode(node) {
  return node instanceof CalloutNode;
}
