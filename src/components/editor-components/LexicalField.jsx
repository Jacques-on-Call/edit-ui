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
    console.log('[LexicalField] handleBlur: A content-editable field has lost focus. Scheduling a delayed clear of the active editor.');
    console.log(`[LexicalField] handleBlur: Current isToolbarInteractionRef: ${isToolbarInteractionRef?.current}`);

    blurTimeoutRef.current = setTimeout(() => {
      // Before clearing, check if the user is interacting with the toolbar.
      if (isToolbarInteractionRef?.current) {
        console.log('[LexicalField] Aborting clear: Toolbar interaction detected.');
        return;
      }
      console.log('[LexicalField] handleBlur Timeout: Delay complete and no toolbar interaction detected. Clearing active editor.');
      setActiveEditor(null);
    }, 200);
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
