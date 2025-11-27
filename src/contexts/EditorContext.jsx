import { h, createContext } from 'preact';
import { useState, useMemo, useContext } from 'preact/hooks';

// 1. Create the Context
export const EditorContext = createContext(null);

// 2. Create the Provider Component
export function EditorProvider({ children }) {
  const [activeEditor, setActiveEditor] = useState(null);
  const [selectionState, setSelectionState] = useState({
    blockType: 'paragraph',
    alignment: 'left',
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isCode: false,
    hasH1InDocument: false,
  });

  const contextValue = useMemo(() => ({
    activeEditor,
    setActiveEditor,
    selectionState,
    setSelectionState,
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
