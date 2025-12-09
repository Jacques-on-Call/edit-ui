import { h } from 'preact';
import { useRef } from 'preact/hooks';
import LexicalEditor from '../LexicalEditor';
import { useEditor } from '../../contexts/EditorContext';

export default function LexicalField({ value, onChange, placeholder, className, transparentBg = false, darkText = false }) {
  const editorApiRef = useRef(null);
  const { setActiveEditor, setSelectionState } = useEditor();

  const handleFocus = () => {
    console.log('[LexicalField] Focus event. Setting active editor.');
    if (editorApiRef.current) {
      setActiveEditor(editorApiRef.current);
    } else {
      console.warn('[LexicalField] Focus event, but editorApiRef is not set.');
    }
  };

  const handleBlur = () => {
    console.log('[LexicalField] Blur event. Clearing active editor after delay.');
    // Delay clearing the active editor to allow toolbar buttons to be clicked
    setTimeout(() => {
      console.log('[LexicalField] Delay complete. Clearing active editor.');
      setActiveEditor(null);
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
