import { h } from 'preact';
import { useRef } from 'preact/hooks';
import LexicalEditor from '../LexicalEditor';
import { useEditor } from '../../contexts/EditorContext';

export default function LexicalField({ value, onChange, placeholder, className, transparentBg = false, darkText = false }) {
  const editorApiRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const { setActiveEditor, setSelectionState } = useEditor();

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
    console.log('[LexicalField] Blur event. Clearing active editor after delay.');
    // Delay clearing the active editor to allow toolbar buttons to be clicked without losing focus.
    // Increased delay for mobile devices where touch events take longer
    blurTimeoutRef.current = setTimeout(() => {
      console.log('[LexicalField] Delay complete. Clearing active editor.');
      setActiveEditor(null);
    }, 300);
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
