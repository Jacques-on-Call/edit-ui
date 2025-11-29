import { h } from 'preact';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { HorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND, $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { TableCellNode, TableNode, TableRowNode, INSERT_TABLE_COMMAND } from '@lexical/table';
import { forwardRef, useEffect, useImperativeHandle, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode, $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { ListItemNode, ListNode, $createListItemNode, $createListNode, $isListItemNode, $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND, $isLinkNode } from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, SELECTION_CHANGE_COMMAND, $createParagraphNode, FORMAT_ELEMENT_COMMAND, $createTextNode } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils';


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
    // GUARD: Only update if the incoming content is different from what we last sent.
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

// Internal plugin to expose the editor API via a ref
function EditorApiPlugin({ apiRef }) {
  const [editor] = useLexicalComposerContext();

  useImperativeHandle(apiRef, () => ({
    toggleBold: () => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
    },
    toggleItalic: () => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
    },
    toggleUnderline: () => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
    },
    toggleStrikethrough: () => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
    },
    toggleCode: () => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
    },
    toggleHighlight: () => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight');
    },
    toggleHeading: (level) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (level) {
            $setBlocksType(selection, () => $createHeadingNode(level));
          } else {
            $setBlocksType(selection, () => $createParagraphNode());
          }
        }
      });
    },
    toggleList: (type) => {
      if (type === 'ul') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else if (type === 'ol') {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      } else {
        // Remove list formatting - convert back to paragraph
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    },
    alignText: (alignment) => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
    },
    insertLink: (url) => {
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    },
    insertHorizontalRule: () => {
      editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
    },
    insertTable: (rows = 3, cols = 3) => {
      editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: String(rows), columns: String(cols) });
    },
    insertDate: () => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const dateStr = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          selection.insertText(dateStr);
        }
      });
    },
    clearFormatting: () => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Clear text formatting by dispatching commands to toggle off if they're on
          const formats = ['bold', 'italic', 'underline', 'strikethrough', 'code', 'highlight'];
          formats.forEach(format => {
            if (selection.hasFormat(format)) {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
            }
          });
          // Reset to paragraph
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    },
    undo: () => {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    },
    redo: () => {
      editor.dispatchCommand(REDO_COMMAND, undefined);
    },
    focus: () => {
      editor.focus();
    },
  }));

  return null; // This plugin does not render anything
}

function SelectionStatePlugin({ onSelectionChange }) {
  const [editor] = useLexicalComposerContext();

  const updateSelectionState = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchorNode = selection.anchor.getNode();
      const root = $getRoot();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              // Check if the parent is the root - meaning we found the top-level block element
              return parent !== null && parent.getKey() === root.getKey();
            });

      let blockType = 'paragraph';
      if (element) {
        if ($isHeadingNode(element)) {
          blockType = element.getTag();
        } else if ($isListItemNode(element)) {
          const parentList = $findMatchingParent(element, (node) => $isListNode(node));
          if (parentList) {
            blockType = parentList.getListType();
          }
        }
      }

      let alignment = 'left';
      if (element) {
        alignment = element.getFormatType();
      }

      // Check if H1 exists anywhere in the document (for SEO - only one H1 allowed)
      let hasH1InDocument = false;
      const children = root.getChildren();
      for (const child of children) {
        if ($isHeadingNode(child) && child.getTag() === 'h1') {
          hasH1InDocument = true;
          break;
        }
      }

      onSelectionChange({
        blockType,
        alignment,
        isBold: selection.hasFormat('bold'),
        isItalic: selection.hasFormat('italic'),
        isUnderline: selection.hasFormat('underline'),
        isStrikethrough: selection.hasFormat('strikethrough'),
        isCode: selection.hasFormat('code'),
        isHighlight: selection.hasFormat('highlight'),
        hasH1InDocument,
      });
    });
  }, [editor, onSelectionChange]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateSelectionState();
        return false;
      },
      1 // Priority
    );
  }, [editor, updateSelectionState]);

  return null;
}

const LexicalEditor = forwardRef(({ slug, initialContent, onChange, onSelectionChange, onFocus, onBlur, className, placeholder }, ref) => {
  useEffect(() => {
    // console.log(`[LexicalEditor] Component mounted for slug: ${slug}`);
    // return () => console.log(`[LexicalEditor] Component unmounted for slug: ${slug}`);
  }, [slug]);

  const lastHtmlRef = useRef('');

  const handleOnChange = (editorState, editor) => {
    // This can be very noisy, so we log conditionally.
    // console.log(`[LexicalEditor-onChange] Content updated for slug: ${slug}`);
    editor.getEditorState().read(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      // GUARD: Only call onChange if the HTML has actually changed.
      // This prevents the infinite loop.
      if (htmlString !== lastHtmlRef.current) {
        lastHtmlRef.current = htmlString;
        onChange(htmlString);
      }
    });
  };

  const initialConfig = {
    ...editorConfig,
    editorState: null, // Initial content will be set by the plugin
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div class={`relative ${className || ''}`}>
        <RichTextPlugin
          contentEditable={
            // DEV NOTE: The `px-2` class here is CRITICAL for the mobile-first
            // design. It prevents text from touching the screen edges.
            // DO NOT REMOVE OR ALTER without explicit consent from the project lead,
            // as this has been a recurring issue.
            <div onFocus={onFocus} onBlur={onBlur} class="px-2">
              <ContentEditable className="editor-input" />
            </div>
          }
          placeholder={
            // DEV NOTE: This padding must match the ContentEditable wrapper.
            <div className="editor-placeholder px-2">{placeholder || 'Start typing...'}</div>
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
