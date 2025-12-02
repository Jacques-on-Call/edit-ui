import { h } from 'preact';
import { useRef } from 'preact/hooks';
import LexicalEditor from '../LexicalEditor'; // Assuming LexicalEditor is in the parent directory
import { useEditor } from '../../contexts/EditorContext';

// This is a new, self-contained Lexical field.
// transparentBg: when true, removes the default gray background for use on background images
export default function LexicalField({ value, onChange, placeholder, className, transparentBg = false }) {
  const editorApiRef = useRef(null);
  const { setActiveEditor, setSelectionState } = useEditor();

  const handleFocus = () => {
    // When this field is focused, we tell the context about its API ref.
    if (editorApiRef.current) {
      setActiveEditor(editorApiRef.current);
    }
  };

  const handleBlur = () => {
    // When this field is blurred, we clear the active editor.
    setActiveEditor(null);
  };

  // No need for a wrapper div anymore. The events will be passed directly.
  return (
    <LexicalEditor
      ref={editorApiRef}
      initialContent={value}
      onChange={onChange}
      onSelectionChange={setSelectionState}
      placeholder={placeholder}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className} // Pass className to the editor itself
      transparentBg={transparentBg} // Pass transparent background flag
    />
  );
}
