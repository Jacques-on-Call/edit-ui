import { h } from 'preact';
import { useRef } from 'preact/hooks';
import LexicalEditor from '../LexicalEditor'; // Assuming LexicalEditor is in the parent directory
import { useEditor } from '../../contexts/EditorContext';

// This is a new, self-contained Lexical field.
export default function LexicalField({ value, onChange, placeholder, className }) {
  const editorApiRef = useRef(null);
  const { setActiveEditor } = useEditor();

  const handleFocus = () => {
    // When this field is focused, we tell the context about its API ref.
    if (editorApiRef.current) {
      console.log('[LexicalField] Focused, setting active editor.');
      setActiveEditor(editorApiRef.current);
    }
  };

  // We add a simple wrapper div to catch the focus event.
  // The LexicalEditor itself doesn't have a simple onFocus prop.
  return (
    <div onFocus={handleFocus} class={className}>
      <LexicalEditor
        ref={editorApiRef}
        initialContent={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
