import { h } from 'preact';
import { useRef } from 'preact/hooks';
import LexicalEditor from '../LexicalEditor';
import { useEditor } from '../../contexts/EditorContext';

export default function LexicalField({ value, onChange, placeholder, className, transparentBg = false, darkText = false }) {
  const editorApiRef = useRef(null);
  const { setActiveEditor, setSelectionState } = useEditor();

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
