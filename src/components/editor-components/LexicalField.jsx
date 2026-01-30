import { h } from 'preact';
import { useRef } from 'preact/hooks';
import LexicalEditor from '../LexicalEditor';
import { useEditor } from '../../contexts/EditorContext';

export default function LexicalField({ value, onChange, placeholder, className, transparentBg = false, darkText = false }) {
  const editorApiRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const { setActiveEditor, setSelectionState, isToolbarInteractionRef } = useEditor();

  const handleFocus = () => {
    // If a blur timeout is pending, cancel it.
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    // Reset toolbar interaction flag on focus - BUT ONLY if focus came from outside the toolbar
    // Actually, let's keep it simple: just log for now
    console.log(`[LexicalField] handleFocus: A field has received focus. Interaction flag: ${isToolbarInteractionRef?.current}`);

    if (editorApiRef.current) {
      setActiveEditor(editorApiRef.current);
    }
  };

  const handleBlur = () => {
    // If the blur was caused by interacting with the toolbar, do not clear the active editor.
    // The toolbar interaction flag will be cleared by the toolbar itself.
    if (isToolbarInteractionRef?.current) {
      return;
    }
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
