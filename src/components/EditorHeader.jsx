import { h } from 'preact';
import { Bold, Italic, Heading2, List, Link, Undo, Redo } from 'lucide-preact';
import './EditorHeader.css';

export default function EditorHeader({ editorApiRef, isMobile }) {
  console.log(`[EditorToolbar] mounted isMobile:${isMobile}`);

  const handleAction = (action) => {
    console.log(`[EditorToolbar] action -> ${action}`);
    const api = editorApiRef.current;
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
