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
  $insertNodes
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
  $setBlocksType
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
