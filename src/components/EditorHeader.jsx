import { h } from 'preact';
import { Bold, Italic, Heading2, List, Link, Undo, Redo } from 'lucide-preact';
import { useEditor } from '../contexts/EditorContext';
import './EditorHeader.css';

export default function EditorHeader() {
  const { activeEditor } = useEditor();

  const handleAction = (action) => {
    const api = activeEditor;

    if (api) {
      switch (action) {
        case 'bold':
          api.toggleBold();
          break;
        case 'italic':
          api.toggleItalic();
          break;
        case 'heading':
          api.toggleHeading();
          break;
        case 'link':
          const url = prompt('Enter the URL:');
          if (url) {
            api.insertLink(url);
          }
          break;
        case 'undo':
          api.undo();
          break;
        case 'redo':
          api.redo();
          break;
        default:
          break;
      }
    } else {
      console.warn('[EditorToolbar] No active editor to perform action on.');
    }
  };

  const isDisabled = !activeEditor;

  return (
    <header class="editor-header">
      <div class="toolbar">
        <button onClick={() => handleAction('bold')} aria-label="Bold" disabled={isDisabled}>
          <Bold size={18} />
        </button>
        <button onClick={() => handleAction('italic')} aria-label="Italic" disabled={isDisabled}>
          <Italic size={18} />
        </button>
        <button onClick={() => handleAction('heading')} aria-label="Heading" disabled={isDisabled}>
          <Heading2 size={18} />
        </button>
        <button onClick={() => handleAction('list')} aria-label="List" disabled={isDisabled}>
          <List size={18} />
        </button>
        <button onClick={() => handleAction('link')} aria-label="Link" disabled={isDisabled}>
          <Link size={18} />
        </button>
        <button onClick={() => handleAction('undo')} aria-label="Undo" disabled={isDisabled}>
          <Undo size={18} />
        </button>
        <button onClick={() => handleAction('redo')} aria-label="Redo" disabled={isDisabled}>
          <Redo size={18} />
        </button>
      </div>
    </header>
  );
}
