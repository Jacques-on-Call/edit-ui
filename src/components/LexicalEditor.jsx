import { h } from 'preact';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { forwardRef, useEffect, useImperativeHandle, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode, $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { ListItemNode, ListNode, $createListItemNode, $createListNode, $isListItemNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, SELECTION_CHANGE_COMMAND, $createParagraphNode, FORMAT_ELEMENT_COMMAND } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $findMatchingParent } from '@lexical/utils';


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
    clearFormatting: () => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Clear text formatting by dispatching commands to toggle off if they're on
          const formats = ['bold', 'italic', 'underline', 'strikethrough', 'code'];
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
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $getRoot().contains(parent);
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
      const root = $getRoot();
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

const LexicalEditor = forwardRef(({ slug, initialContent, onChange, onSelectionChange }, ref) => {
  const lastHtmlRef = useRef('');

  const handleOnChange = (editorState, editor) => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      // Keep track of the last HTML we sent out.
      lastHtmlRef.current = htmlString;
      onChange(htmlString);
    });
  };

  const initialConfig = {
    ...editorConfig,
    editorState: null, // Initial content will be set by the plugin
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div class="relative">
        <RichTextPlugin
          contentEditable={<ContentEditable class="editor-input" />}
          placeholder={<div class="editor-placeholder">Start typing...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleOnChange} />
        <InitialContentPlugin initialContent={initialContent} lastHtmlRef={lastHtmlRef} />
        <EditorApiPlugin apiRef={ref} />
        {onSelectionChange && <SelectionStatePlugin onSelectionChange={onSelectionChange} />}
      </div>
    </LexicalComposer>
  );
});

export default LexicalEditor;
