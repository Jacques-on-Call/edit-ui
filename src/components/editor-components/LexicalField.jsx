import { h } from 'preact';
import { useRef } from 'preact/hooks';
import LexicalEditor from '../LexicalEditor';
import { useEditor } from '../../contexts/EditorContext';

export default function LexicalField({ value, onChange, placeholder, className, transparentBg = false, darkText = false }) {
  const editorApiRef = useRef(null);
  const { activeEditor, setActiveEditor, setSelectionState } = useEditor();

  const handleFocus = () => {
    console.log('[LexicalField] Focus event triggered.', {
      isEditorAlreadyActive: !!activeEditor,
      editorApiRefPresent: !!editorApiRef.current
    });
    if (editorApiRef.current) {
      setActiveEditor(editorApiRef.current);
    } else {
      console.warn('[LexicalField] Focus event, but editorApiRef is not set.');
    }
  };

  const handleBlur = () => {
    const newFocusTarget = document.activeElement;
    console.log('[LexicalField] Blur event triggered. New focus target:', {
      tagName: newFocusTarget?.tagName,
      className: newFocusTarget?.className,
      id: newFocusTarget?.id,
    });

    // Delay clearing the active editor to allow toolbar buttons to be clicked
    setTimeout(() => {
      console.log('[LexicalField] Delay complete. Now checking if blur was temporary.');
      // Re-check the active element. If focus moved to a toolbar, don't clear the editor.
      const focusHasMovedToToolbar = document.activeElement?.closest('.floating-toolbar, .slideout-toolbar');

      if (focusHasMovedToToolbar) {
        console.log('[LexicalField] Blur was temporary (moved to a toolbar). NOT clearing active editor.');
      } else {
        console.log('[LexicalField] Focus moved elsewhere. Clearing active editor.');
        setActiveEditor(null);
      }
    }, 150);
  };

  return (
    <LexicalEditor
      ref={editorApiRef}
      initialContent={value}
      onChange={onChange}
      onSelectionChange={setSelectionState}
      placeholder={placeholder}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      transparentBg={transparentBg}
      darkText={darkText}
    />
  );
}
