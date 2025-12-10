import { h } from 'preact';
import { useRef } from 'preact/hooks';
import LexicalEditor from '../LexicalEditor';
import { useEditor } from '../../contexts/EditorContext';

export default function LexicalField({ value, onChange, placeholder, className, transparentBg = false, darkText = false }) {
  const editorApiRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const { setActiveEditor, setSelectionState, isToolbarInteractionRef } = useEditor();

  const handleFocus = () => {
    // If a blur timeout is pending, cancel it. This prevents the editor from being cleared
    // when focus moves rapidly between editor fields.
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    console.log('[LexicalField] Focus event. Setting active editor.');
    if (editorApiRef.current) {
      setActiveEditor(editorApiRef.current);
    }
  };

  const handleBlur = () => {
    console.log('[LexicalField] Blur event. Scheduling active editor clear.');

    blurTimeoutRef.current = setTimeout(() => {
      // Before clearing, check if the user is interacting with the toolbar.
      // If they are, we abort the clear and let the toolbar handle things.
      if (isToolbarInteractionRef?.current) {
        console.log('[LexicalField] Aborting clear: Toolbar interaction detected.');
        return;
      }
      console.log('[LexicalField] Delay complete. Clearing active editor.');
      setActiveEditor(null);
    }, 50);
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
