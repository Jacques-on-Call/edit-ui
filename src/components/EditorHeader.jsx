import { h } from 'preact';
import { Bold, Italic, Heading2, List, ListOrdered, Link, Undo, Redo, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-preact';
import { useEditor } from '../contexts/EditorContext';
import Dropdown from './Dropdown';
import './EditorHeader.css';

const HEADING_CYCLE = ['', 'h2', 'h3', 'h4', 'h5', 'h6'];
const LIST_CYCLE = ['', 'ul', 'ol'];

export default function EditorHeader() {
  const { activeEditor, selectionState } = useEditor();

  const handleAction = (action, value) => {
    const api = activeEditor;
    if (!api) return;

    if (api.focus) api.focus();

    switch (action) {
      case 'bold': api.toggleBold(); break;
      case 'italic': api.toggleItalic(); break;
      case 'heading': api.toggleHeading(value); break;
      case 'list': api.toggleList(value); break;
      case 'align': api.alignText(value); break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) api.insertLink(url);
        break;
      case 'undo': api.undo(); break;
      case 'redo': api.redo(); break;
    }
  };

  const handleHeadingCycle = () => {
    const currentLevel = selectionState.blockType || 'paragraph';
    const currentIndex = HEADING_CYCLE.indexOf(currentLevel);
    const nextIndex = (currentIndex + 1) % HEADING_CYCLE.length;
    handleAction('heading', HEADING_CYCLE[nextIndex] || null); // null to turn off
  };

  const handleListCycle = () => {
    const currentType = selectionState.blockType;
    const currentIndex = LIST_CYCLE.indexOf(currentType);
    const nextIndex = (currentIndex + 1) % LIST_CYCLE.length;
    handleAction('list', LIST_CYCLE[nextIndex]);
  };

  const isDisabled = !activeEditor;
  const preventDefault = (e) => e.preventDefault();

  const currentHeading = HEADING_CYCLE.find(h => h === selectionState.blockType);
  const currentList = LIST_CYCLE.find(l => l === selectionState.blockType);

  return (
    <header class="editor-header">
      <div class="toolbar-scroll-container">
        <div class="toolbar">
          <button onMouseDown={preventDefault} onClick={() => handleAction('bold')} data-active={selectionState.isBold} aria-label="Bold" disabled={isDisabled}>
            <Bold size={18} />
          </button>
        <button onMouseDown={preventDefault} onClick={() => handleAction('italic')} data-active={selectionState.isItalic} aria-label="Italic" disabled={isDisabled}>
          <Italic size={18} />
        </button>

        <Dropdown
          buttonContent={
            selectionState.alignment === 'center' ? <AlignCenter size={18} /> :
            selectionState.alignment === 'right' ? <AlignRight size={18} /> :
            selectionState.alignment === 'justify' ? <AlignJustify size={18} /> :
            <AlignLeft size={18} />
          }
        >
          <button onMouseDown={preventDefault} onClick={() => handleAction('align', 'left')} aria-label="Align Left" disabled={isDisabled}>
            <AlignLeft size={18} />
          </button>
          <button onMouseDown={preventDefault} onClick={() => handleAction('align', 'center')} aria-label="Align Center" disabled={isDisabled}>
            <AlignCenter size={18} />
          </button>
          <button onMouseDown={preventDefault} onClick={() => handleAction('align', 'right')} aria-label="Align Right" disabled={isDisabled}>
            <AlignRight size={18} />
          </button>
          <button onMouseDown={preventDefault} onClick={() => handleAction('align', 'justify')} aria-label="Align Justify" disabled={isDisabled}>
            <AlignJustify size={18} />
          </button>
        </Dropdown>

        <button onMouseDown={preventDefault} onClick={handleHeadingCycle} aria-label="Heading" disabled={isDisabled}>
          {currentHeading ? currentHeading.toUpperCase() : <Heading2 size={18} />}
        </button>
        <button onMouseDown={preventDefault} onClick={handleListCycle} aria-label="List" disabled={isDisabled}>
          {currentList === 'ol' ? <ListOrdered size={18} /> : <List size={18} />}
        </button>
        <button onMouseDown={preventDefault} onClick={() => handleAction('link')} aria-label="Link" disabled={isDisabled}>
          <Link size={18} />
        </button>
        <button onMouseDown={preventDefault} onClick={() => handleAction('undo')} aria-label="Undo" disabled={isDisabled}>
          <Undo size={18} />
        </button>
        <button onMouseDown={preventDefault} onClick={() => handleAction('redo')} aria-label="Redo" disabled={isDisabled}>
          <Redo size={18} />
        </button>
        </div>
      </div>
    </header>
  );
}
