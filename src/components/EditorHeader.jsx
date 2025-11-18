import { h } from 'preact';
import { Bold, Italic, Heading2, List, Link, Undo, Redo } from 'lucide-preact';
import './EditorHeader.css';

export default function EditorHeader({ editorApiRef }) {
  const handleAction = (action) => {
    console.log(`[EditorToolbar] action -> ${action}`);
    const api = editorApiRef.current;
    if (api) {
      switch (action) {
        case 'bold':
          if (api.toggleBold) api.toggleBold();
          break;
        case 'italic':
          if (api.toggleItalic) api.toggleItalic();
          break;
        case 'heading':
          if (api.toggleHeading) api.toggleHeading();
          break;
        case 'link':
          if (api.insertLink) {
            const url = prompt('Enter the URL:');
            if (url) {
              api.insertLink(url);
            }
          }
          break;
        case 'undo':
          if (api.undo) api.undo();
          break;
        case 'redo':
          if (api.redo) api.redo();
          break;
        default:
          break;
      }
    }
  };

  return (
    <header className="editor-header">
      <div className="toolbar">
        <button onClick={() => handleAction('bold')} aria-label="Bold">
          <Bold size={18} />
        </button>
        <button onClick={() => handleAction('italic')} aria-label="Italic">
          <Italic size={18} />
        </button>
        <button onClick={() => handleAction('heading')} aria-label="Heading">
          <Heading2 size={18} />
        </button>
        <button onClick={() => handleAction('list')} aria-label="List">
          <List size={18} />
        </button>
        <button onClick={() => handleAction('link')} aria-label="Link">
          <Link size={18} />
        </button>
        <button onClick={() => handleAction('undo')} aria-label="Undo">
          <Undo size={18} />
        </button>
        <button onClick={() => handleAction('redo')} aria-label="Redo">
          <Redo size={18} />
        </button>
      </div>
    </header>
  );
}
