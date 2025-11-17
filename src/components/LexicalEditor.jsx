import { h } from 'preact';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes } from 'lexical';

const editorConfig = {
  namespace: 'EasySEOEditor',
  theme: {
    // Basic styling for editor elements
    root: 'p-4 bg-gray-800 text-white rounded-lg focus:outline-none',
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'line-through',
    },
    heading: {
      h1: 'text-3xl font-bold',
      h2: 'text-2xl font-bold',
      h3: 'text-xl font-bold',
    },
    list: {
      ol: 'list-decimal ml-6',
      ul: 'list-disc ml-6',
    },
    link: 'text-blue-400 hover:underline',
  },
  onError(error) {
    console.error('[LexicalEditor] Error:', error);
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListItemNode,
    ListNode,
    CodeHighlightNode,
    CodeNode,
    AutoLinkNode,
    LinkNode,
  ],
};

// Plugin to load initial content as HTML
function InitialContentPlugin({ initialContent }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (editor && initialContent) {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialContent, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        $getRoot().clear();
        $insertNodes(nodes);
      });
    }
  }, [editor, initialContent]);
  return null;
}

const LexicalEditor = forwardRef(({ slug, initialContent, onChange }, ref) => {
  const editorRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      editorRef.current?.focus();
    },
  }));

  const handleOnChange = (editorState, editor) => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      onChange(htmlString);
    });
  };

  const initialConfig = {
    ...editorConfig,
    editorState: null, // Initial content will be set by the plugin
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<div className="editor-placeholder">Start typing...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleOnChange} />
        <InitialContentPlugin initialContent={initialContent} />
      </div>
    </LexicalComposer>
  );
});

export default LexicalEditor;
