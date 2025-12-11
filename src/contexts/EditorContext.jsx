import { h, createContext } from 'preact';
import { useState, useMemo, useContext, useRef } from 'preact/hooks';
import EditorFloatingToolbar from '../components/EditorFloatingToolbar';

// 1. Create the Context
export const EditorContext = createContext(null);

// 2. Create the Provider Component
export function EditorProvider({ children }) {
  const [activeEditor, setActiveEditorInternal] = useState(null);
  const isToolbarInteractionRef = useRef(false);
  const [selectionState, setSelectionState] = useState({
    blockType: 'paragraph',
    alignment: 'left',
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isCode: false,
    isHighlight: false,
    hasH1InDocument: false,
  });

  const setActiveEditor = (editor) => {
    if (editor) {
      console.log('[EditorContext] Active editor is SET.');
    } else {
      console.log('[EditorContext] Active editor is CLEARED.');
    }
    setActiveEditorInternal(editor);
  };

  // Handle formatting actions from toolbars
  // This dispatches actions to the currently active editor
  // NOTE: URL prompts use window.prompt as a temporary solution. 
  // TODO: Replace with proper modal dialogs for better UX and to avoid popup blockers
  const handleAction = (action, ...args) => {
    if (!activeEditor) {
      console.warn('[EditorContext] handleAction called but no active editor');
      return;
    }

    console.log('[EditorContext] handleAction:', action, args);

    switch (action) {
      case 'bold':
        activeEditor.toggleBold?.();
        break;
      case 'italic':
        activeEditor.toggleItalic?.();
        break;
      case 'underline':
        activeEditor.toggleUnderline?.();
        break;
      case 'strikethrough':
        activeEditor.toggleStrikethrough?.();
        break;
      case 'code':
        activeEditor.toggleCode?.();
        break;
      case 'link':
        // TODO: Replace window.prompt with a proper modal dialog
        // Current implementation is simple but can be blocked by popup blockers
        const url = window.prompt('Enter URL:');
        if (url) {
          activeEditor.insertLink?.(url);
        }
        break;
      case 'list':
        // args[0] should be 'ul' or 'ol'
        activeEditor.toggleList?.(args[0]);
        break;
      case 'heading':
        // args[0] should be 'h2', 'h3', etc. or null for paragraph
        activeEditor.toggleHeading?.(args[0]);
        break;
      case 'align':
        // args[0] should be 'left', 'center', 'right', or 'justify'
        activeEditor.alignText?.(args[0]);
        break;
      case 'textColor':
        // args[0] is the color string or null to remove
        activeEditor.setTextColor?.(args[0]);
        break;
      case 'highlightColor':
        // args[0] is the color string or null to remove
        activeEditor.setHighlightColor?.(args[0]);
        break;
      case 'clearFormatting':
        activeEditor.clearFormatting?.();
        break;
      case 'image':
        // TODO: Replace sequential window.prompt calls with a single modal dialog form
        // Current implementation provides poor UX with two separate popups
        const imgSrc = window.prompt('Enter image URL:');
        if (imgSrc) {
          const alt = window.prompt('Enter image alt text (optional):') || '';
          activeEditor.insertImage?.(imgSrc, alt);
        }
        break;
      case 'table':
        // Insert a default 3x3 table
        activeEditor.insertTable?.(3, 3);
        break;
      case 'horizontalRule':
        activeEditor.insertHorizontalRule?.();
        break;
      case 'pageBreak':
        activeEditor.insertPageBreak?.();
        break;
      case 'columns':
        // args[0] is the number of columns (default 2)
        activeEditor.insertColumns?.(args[0] || 2);
        break;
      case 'collapsible':
        activeEditor.insertCollapsible?.();
        break;
      case 'date':
        activeEditor.insertDate?.();
        break;
      case 'undo':
        activeEditor.undo?.();
        break;
      case 'redo':
        activeEditor.redo?.();
        break;
      default:
        console.warn('[EditorContext] Unknown action:', action);
    }
  };

  const contextValue = useMemo(() => ({
    activeEditor,
    setActiveEditor,
    selectionState,
    setSelectionState,
    handleAction,
    isToolbarInteractionRef,
  }), [activeEditor, selectionState]);

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
      <EditorFloatingToolbar
        editorRootSelector=".editor-input"
        offset={{ x: 0, y: 10 }}
        cooldownMs={200}
      />
    </EditorContext.Provider>
  );
}

// 3. Create a custom hook for easy consumption
export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
