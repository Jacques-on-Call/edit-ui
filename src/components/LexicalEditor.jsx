import { h } from 'preact';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes, $getSelection, $isRangeSelection, SELECTION_CHANGE_COMMAND, $isRootNode } from 'lexical';
import EditorApiPlugin from './EditorApiPlugin';
import SelectionStatePlugin from './SelectionStatePlugin';

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
      code: 'bg-gray-700 text-pink-400 px-1 py-0.5 rounded font-mono text-sm',
      highlight: 'editor-highlight',
    },
    heading: {
      h1: 'text-4xl font-bold',
      h2: 'text-3xl font-bold',
      h3: 'text-2xl font-bold',
      h4: 'text-xl font-bold',
      h5: 'text-lg font-bold',
      h6: 'text-base font-bold',
    },
    list: {
      ol: 'list-decimal ml-6',
      ul: 'list-disc ml-6',
    },
    link: 'text-blue-400 hover:underline',
    horizontalRule: 'editor-hr',
    table: 'editor-table',
    tableCell: 'editor-table-cell',
    tableCellHeader: 'editor-table-cell-header',
    tableRow: 'editor-table-row',
  },
  onError(error) {
    console.error('[LexicalEditor] Uncaught Error:', error.message, '\n', error.stack);
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
    HorizontalRuleNode,
    TableNode,
    TableCellNode,
    TableRowNode,
  ],
};

// Plugin to load initial content as HTML
function InitialContentPlugin({ initialContent, lastHtmlRef }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (editor && initialContent && initialContent !== lastHtmlRef.current) {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialContent, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        $getRoot().clear();
        $insertNodes(nodes);
      });
    }
  }, [editor, initialContent, lastHtmlRef]);
  return null;
}

const LexicalEditor = forwardRef(({ slug, initialContent, onChange, onSelectionChange, onFocus, onBlur, className, placeholder, transparentBg = false }, ref) => {
  const lastHtmlRef = useRef('');
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);

  const handleOnChange = (editorState, editor) => {
    editor.getEditorState().read(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      if (htmlString !== lastHtmlRef.current) {
        lastHtmlRef.current = htmlString;
        onChange(htmlString);
      }

      const root = $getRoot();
      const children = root.getChildren();
      // The editor is empty if it contains only one empty paragraph.
      const empty = children.length === 1 && children[0].getTextContent() === '';
      setIsEditorEmpty(empty);
    });
  };

  const initialConfig = {
    ...editorConfig,
    editorState: null,
  };

  const placeholderText = placeholder || 'Start typing...';

  // When transparentBg is true, use transparent background for use on background images
  const editorInputClass = transparentBg ? 'editor-input editor-input-transparent' : 'editor-input';

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div class={`relative ${className || ''}`}>
        <RichTextPlugin
          contentEditable={
            <div onFocus={onFocus} onBlur={onBlur} class="px-2">
              <ContentEditable className={editorInputClass} />
            </div>
          }
          placeholder={
            isEditorEmpty && <div className="editor-placeholder px-2">{placeholderText}</div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <HorizontalRulePlugin />
        <TablePlugin />
        <OnChangePlugin onChange={handleOnChange} />
        <InitialContentPlugin initialContent={initialContent} lastHtmlRef={lastHtmlRef} />
        <EditorApiPlugin apiRef={ref} />
        {onSelectionChange && <SelectionStatePlugin onSelectionChange={onSelectionChange} />}
      </div>
    </LexicalComposer>
  );
});

export default LexicalEditor;
