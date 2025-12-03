import { useImperativeHandle } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
  $getRoot,
  $createLineBreakNode
} from 'lexical';
import {
  $createHeadingNode
} from '@lexical/rich-text';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND
} from '@lexical/list';
import {
  TOGGLE_LINK_COMMAND
} from '@lexical/link';
import {
  INSERT_HORIZONTAL_RULE_COMMAND
} from '@lexical/react/LexicalHorizontalRuleNode';
import {
  INSERT_TABLE_COMMAND
} from '@lexical/table';
import {
  $setBlocksType,
  $patchStyleText,
  $getSelectionStyleValueForProperty
} from '@lexical/selection';

export default function EditorApiPlugin({ apiRef }) {
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
      // Insert current date as formatted text
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(dateStr);
        }
      });
    },
    clearFormatting: () => {
      // Clear all text formatting from selection
      const formatTypes = ['bold', 'italic', 'underline', 'strikethrough', 'code', 'highlight'];
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          formatTypes.forEach(format => selection.formatText(format, false));
          // Also clear inline styles (text color, background color)
          $patchStyleText(selection, { 
            color: null,
            'background-color': null
          });
        }
      });
    },
    // Set text color using inline styles
    setTextColor: (color) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { color: color || null });
        }
      });
    },
    // Set highlight/background color using inline styles
    setHighlightColor: (color) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { 'background-color': color || null });
        }
      });
    },
    // Get current text color from selection
    getTextColor: () => {
      let color = null;
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          color = $getSelectionStyleValueForProperty(selection, 'color', null);
        }
      });
      return color;
    },
    // Get current highlight color from selection
    getHighlightColor: () => {
      let color = null;
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          color = $getSelectionStyleValueForProperty(selection, 'background-color', null);
        }
      });
      return color;
    },
    // Insert a page break (visual separator for print/pagination)
    insertPageBreak: () => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Insert a horizontal rule styled as page break, followed by a new paragraph
          const pageBreakNode = $createParagraphNode();
          const textNode = $createTextNode('--- Page Break ---');
          pageBreakNode.append(textNode);
          selection.insertNodes([pageBreakNode, $createParagraphNode()]);
        }
      });
    },
    // Insert inline image placeholder (user will provide URL)
    insertImage: (src, alt = '', width = 'auto') => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // For now, insert as a placeholder text with image notation
          // Full image node implementation would require custom Lexical node
          const imageText = `[Image: ${alt || src}]`;
          selection.insertText(imageText);
        }
      });
    },
    // Insert columns layout placeholder
    insertColumns: (columnCount = 2) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Insert column layout as structured text placeholder
          const columnTexts = [];
          for (let i = 1; i <= columnCount; i++) {
            columnTexts.push(`[Column ${i}]`);
          }
          selection.insertText(columnTexts.join(' | '));
        }
      });
    },
    // Insert collapsible/accordion section
    insertCollapsible: (title = 'Click to expand') => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Insert collapsible as structured text placeholder
          selection.insertText(`[▶ ${title}]\n  Content goes here...\n[/Collapsible]`);
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

  return null;
}
