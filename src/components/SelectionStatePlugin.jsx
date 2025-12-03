import { useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  $getRoot
} from 'lexical';
import {
  $isHeadingNode
} from '@lexical/rich-text';
import {
  $isListItemNode,
  $isListNode
} from '@lexical/list';
import {
  $findMatchingParent
} from '@lexical/utils';
import {
  $getSelectionStyleValueForProperty
} from '@lexical/selection';

export default function SelectionStatePlugin({ onSelectionChange }) {
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

      let hasH1InDocument = false;
      const children = root.getChildren();
      for (const child of children) {
        if ($isHeadingNode(child) && child.getTag() === 'h1') {
          hasH1InDocument = true;
          break;
        }
      }

      // Get inline styles for text and highlight color
      const textColor = $getSelectionStyleValueForProperty(selection, 'color', null);
      const highlightColor = $getSelectionStyleValueForProperty(selection, 'background-color', null);

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
        textColor,
        highlightColor,
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
