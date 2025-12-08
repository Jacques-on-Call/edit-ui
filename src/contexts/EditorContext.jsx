import { h, createContext } from 'preact';
import { useState, useMemo, useContext } from 'preact/hooks';

// 1. Create the Context
export const EditorContext = createContext(null);

// 2. Create the Provider Component
export function EditorProvider({ children }) {
  const [activeEditor, setActiveEditorInternal] = useState(null);
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
        // args[0] should be 'h2', 'h3', etc.
        activeEditor.toggleHeading?.(args[0]);
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
  }), [activeEditor, selectionState]);

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
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
