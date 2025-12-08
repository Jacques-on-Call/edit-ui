import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import LexicalEditor from '../LexicalEditor';
import { useEditor } from '../../contexts/EditorContext';

export default function LexicalField({ value, onChange, placeholder, className, transparentBg = false, darkText = false }) {
  const editorApiRef = useRef(null);
  const isProgrammaticUpdateRef = useRef(false);
  const { setActiveEditor, setSelectionState } = useEditor();

  // Effect to handle programmatic updates from parent
  useEffect(() => {
    if (editorApiRef.current && value !== editorApiRef.current.getHTML()) {
      isProgrammaticUpdateRef.current = true;
      editorApiRef.current.setHTML(value);
    }
  }, [value]);

  const handleLexicalChange = (newHtml) => {
    if (isProgrammaticUpdateRef.current) {
      isProgrammaticUpdateRef.current = false;
      return; // Suppress onChange event for programmatic updates
    }
    if (onChange) {
      onChange(newHtml);
    }
  };

  const handleFocus = () => {
    if (editorApiRef.current) {
      setActiveEditor(editorApiRef.current);
    }
  };

  const handleBlur = () => {
    setActiveEditor(null);
  };

  return (
    <LexicalEditor
      ref={editorApiRef}
      initialContent={value}
      onChange={handleLexicalChange}
      onSelectionChange={setSelectionState}
      placeholder={placeholder}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className} // Pass className to the editor itself
      transparentBg={transparentBg} // Pass transparent background flag
      darkText={darkText} // Pass dark text flag
    />
  );
}
