import { h } from 'preact';
import { useRef } from 'preact/hooks';
import LexicalEditor from '../LexicalEditor'; // Assuming LexicalEditor is in the parent directory
import { useEditor } from '../../contexts/EditorContext';

// This is a new, self-contained Lexical field.
export default function LexicalField({ value, onChange, placeholder, className }) {
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

  // We add a simple wrapper div to catch the focus and blur events.
  return (
    <div onFocus={handleFocus} onBlur={handleBlur} class={className}>
      <LexicalEditor
        ref={editorApiRef}
        initialContent={value}
        onChange={onChange}
        onSelectionChange={setSelectionState}
        placeholder={placeholder}
      />
    </div>
  );
}
