import { h } from 'preact';
import { Bold, Italic, Heading2, List, Link, Undo, Redo } from 'lucide-preact';
import './EditorHeader.css';

export default function EditorHeader({ editorApi }) {
  const handleAction = (action) => {
    console.log(`[EditorToolbar] action -> ${action}`);
    if (editorApi) {
      switch (action) {
        case 'bold':
          if (editorApi.toggleBold) editorApi.toggleBold();
          break;
        case 'italic':
          if (editorApi.toggleItalic) editorApi.toggleItalic();
          break;
        case 'heading':
          if (editorApi.toggleHeading) editorApi.toggleHeading();
          break;
        case 'link':
          if (editorApi.insertLink) {
            const url = prompt('Enter the URL:');
            if (url) {
              editorApi.insertLink(url);
            }
          }
          break;
        case 'undo':
          if (editorApi.undo) editorApi.undo();
          break;
        case 'redo':
          if (editorApi.redo) editorApi.redo();
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
