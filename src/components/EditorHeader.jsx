import { h } from 'preact';
import { 
  Bold, Italic, Underline, Strikethrough, Code, 
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, 
  Link, 
  Undo, Redo, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  RemoveFormatting,
  Type,
  Highlighter,
  Plus,
  Minus,
  Table,
  Calendar,
  Image
} from 'lucide-preact';
import { useEditor } from '../contexts/EditorContext';
import Dropdown from './Dropdown';
import './EditorHeader.css';

const LIST_CYCLE = ['', 'ul', 'ol'];

// Block type labels for the dropdown
const BLOCK_TYPE_OPTIONS = [
  { value: '', label: 'Normal', icon: Type },
  { value: 'h1', label: 'Heading 1', icon: Heading1 },
  { value: 'h2', label: 'Heading 2', icon: Heading2 },
  { value: 'h3', label: 'Heading 3', icon: Heading3 },
  { value: 'h4', label: 'Heading 4', icon: Heading4 },
  { value: 'h5', label: 'Heading 5', icon: Heading5 },
  { value: 'h6', label: 'Heading 6', icon: Heading6 },
];

export default function EditorHeader() {
  const { activeEditor, selectionState } = useEditor();

  const handleAction = (action, value) => {
    console.log(`[EditorHeader] Action triggered: ${action}`, { value });
    const api = activeEditor;
    if (!api) {
      console.warn(`[EditorHeader] Action "${action}" aborted: No active editor.`);
      return;
    }

    if (api.focus) api.focus();

    switch (action) {
      case 'bold': api.toggleBold(); break;
      case 'italic': api.toggleItalic(); break;
      case 'underline': api.toggleUnderline(); break;
      case 'strikethrough': api.toggleStrikethrough(); break;
      case 'code': api.toggleCode(); break;
      case 'highlight': api.toggleHighlight(); break;
      case 'heading': api.toggleHeading(value); break;
      case 'list': api.toggleList(value); break;
      case 'align': api.alignText(value); break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) api.insertLink(url);
        break;
      case 'horizontalRule': api.insertHorizontalRule(); break;
      case 'table': 
        const rows = prompt('Number of rows:', '3');
        const cols = prompt('Number of columns:', '3');
        if (rows && cols) api.insertTable(parseInt(rows), parseInt(cols));
        break;
      case 'date': api.insertDate(); break;
      case 'clearFormatting': api.clearFormatting(); break;
      case 'undo': api.undo(); break;
      case 'redo': api.redo(); break;
    }
  };

  const handleListCycle = () => {
    const currentType = selectionState.blockType;
    const currentIndex = LIST_CYCLE.indexOf(currentType);
    const nextIndex = (currentIndex + 1) % LIST_CYCLE.length;
    handleAction('list', LIST_CYCLE[nextIndex]);
  };

  const isDisabled = !activeEditor;
  const preventDefault = (e) => e.preventDefault();

  const currentList = LIST_CYCLE.find(l => l === selectionState.blockType);
  
  // Get current block type for heading dropdown display
  const currentBlockOption = BLOCK_TYPE_OPTIONS.find(opt => opt.value === selectionState.blockType) || BLOCK_TYPE_OPTIONS[0];
  const CurrentBlockIcon = currentBlockOption.icon;

  return (
    <header class="editor-header">
      <div class="toolbar-scroll-container">
        <div class="toolbar">
          {/* GROUP 1: History (Undo/Redo first as requested) */}
          <div class="toolbar-group">
            <button onMouseDown={preventDefault} onClick={() => handleAction('undo')} aria-label="Undo" disabled={isDisabled} title="Undo">
              <Undo size={18} />
            </button>
            <button onMouseDown={preventDefault} onClick={() => handleAction('redo')} aria-label="Redo" disabled={isDisabled} title="Redo">
              <Redo size={18} />
            </button>
          </div>

          <span class="toolbar-divider" />

          {/* GROUP 2: Text Formatting (Bold, Italic, Underline, Strikethrough, Code, Highlight) */}
          <div class="toolbar-group">
            <button onMouseDown={preventDefault} onClick={() => handleAction('bold')} data-active={selectionState.isBold} aria-label="Bold" disabled={isDisabled} title="Bold">
              <Bold size={18} />
            </button>
            <button onMouseDown={preventDefault} onClick={() => handleAction('italic')} data-active={selectionState.isItalic} aria-label="Italic" disabled={isDisabled} title="Italic">
              <Italic size={18} />
            </button>
            <button onMouseDown={preventDefault} onClick={() => handleAction('underline')} data-active={selectionState.isUnderline} aria-label="Underline" disabled={isDisabled} title="Underline">
              <Underline size={18} />
            </button>
            <button onMouseDown={preventDefault} onClick={() => handleAction('strikethrough')} data-active={selectionState.isStrikethrough} aria-label="Strikethrough" disabled={isDisabled} title="Strikethrough">
              <Strikethrough size={18} />
            </button>
            <button onMouseDown={preventDefault} onClick={() => handleAction('code')} data-active={selectionState.isCode} aria-label="Inline Code" disabled={isDisabled} title="Inline Code">
              <Code size={18} />
            </button>
            <button onMouseDown={preventDefault} onClick={() => handleAction('highlight')} data-active={selectionState.isHighlight} aria-label="Highlight" disabled={isDisabled} title="Highlight">
              <Highlighter size={18} />
            </button>
          </div>

          <span class="toolbar-divider" />

          {/* GROUP 3: Block Format (Heading Dropdown) */}
          <div class="toolbar-group">
            <Dropdown
              buttonContent={
                <span class="dropdown-button-content">
                  <CurrentBlockIcon size={18} />
                </span>
              }
            >
              {BLOCK_TYPE_OPTIONS.map((option) => {
                const IconComponent = option.icon;
                // H1 is disabled if one already exists AND current selection is not H1
                // This enforces SEO best practice of only one H1 per page
                const isH1Disabled = option.value === 'h1' && selectionState.hasH1InDocument && selectionState.blockType !== 'h1';
                return (
                  <button 
                    key={option.value}
                    onMouseDown={preventDefault} 
                    onClick={() => handleAction('heading', option.value || null)} 
                    aria-label={option.label} 
                    disabled={isDisabled || isH1Disabled}
                    data-active={selectionState.blockType === option.value || (option.value === '' && selectionState.blockType === 'paragraph')}
                    title={isH1Disabled ? 'Only one H1 per page allowed (SEO)' : option.label}
                  >
                    <IconComponent size={16} />
                    <span class="dropdown-label">{option.label}</span>
                    {isH1Disabled && <span class="dropdown-hint">(in use)</span>}
                  </button>
                );
              })}
            </Dropdown>
          </div>

          <span class="toolbar-divider" />

          {/* GROUP 4: Alignment */}
          <div class="toolbar-group">
            <Dropdown
              buttonContent={
                selectionState.alignment === 'center' ? <AlignCenter size={18} /> :
                selectionState.alignment === 'right' ? <AlignRight size={18} /> :
                selectionState.alignment === 'justify' ? <AlignJustify size={18} /> :
                <AlignLeft size={18} />
              }
            >
              <button onMouseDown={preventDefault} onClick={() => handleAction('align', 'left')} aria-label="Align Left" disabled={isDisabled} data-active={selectionState.alignment === 'left' || !selectionState.alignment}>
                <AlignLeft size={18} />
                <span class="dropdown-label">Left</span>
              </button>
              <button onMouseDown={preventDefault} onClick={() => handleAction('align', 'center')} aria-label="Align Center" disabled={isDisabled} data-active={selectionState.alignment === 'center'}>
                <AlignCenter size={18} />
                <span class="dropdown-label">Center</span>
              </button>
              <button onMouseDown={preventDefault} onClick={() => handleAction('align', 'right')} aria-label="Align Right" disabled={isDisabled} data-active={selectionState.alignment === 'right'}>
                <AlignRight size={18} />
                <span class="dropdown-label">Right</span>
              </button>
              <button onMouseDown={preventDefault} onClick={() => handleAction('align', 'justify')} aria-label="Align Justify" disabled={isDisabled} data-active={selectionState.alignment === 'justify'}>
                <AlignJustify size={18} />
                <span class="dropdown-label">Justify</span>
              </button>
            </Dropdown>
          </div>

          <span class="toolbar-divider" />

          {/* GROUP 5: Lists */}
          <div class="toolbar-group">
            <button onMouseDown={preventDefault} onClick={handleListCycle} aria-label="List" disabled={isDisabled} title="Toggle List">
              {currentList === 'ol' ? <ListOrdered size={18} /> : <List size={18} />}
            </button>
          </div>

          <span class="toolbar-divider" />

          {/* GROUP 6: Insert (Link + Insert Dropdown) */}
          <div class="toolbar-group">
            <button onMouseDown={preventDefault} onClick={() => handleAction('link')} aria-label="Link" disabled={isDisabled} title="Insert Link">
              <Link size={18} />
            </button>
            <Dropdown
              buttonContent={<Plus size={18} />}
            >
              <button onMouseDown={preventDefault} onClick={() => handleAction('horizontalRule')} aria-label="Horizontal Rule" disabled={isDisabled}>
                <Minus size={16} />
                <span class="dropdown-label">Horizontal Rule</span>
              </button>
              <button onMouseDown={preventDefault} onClick={() => handleAction('table')} aria-label="Table" disabled={isDisabled}>
                <Table size={16} />
                <span class="dropdown-label">Table</span>
              </button>
              <button onMouseDown={preventDefault} onClick={() => handleAction('date')} aria-label="Date" disabled={isDisabled}>
                <Calendar size={16} />
                <span class="dropdown-label">Date</span>
              </button>
            </Dropdown>
          </div>

          <span class="toolbar-divider" />

          {/* GROUP 7: Clear Formatting */}
          <div class="toolbar-group">
            <button onMouseDown={preventDefault} onClick={() => handleAction('clearFormatting')} aria-label="Clear Formatting" disabled={isDisabled} title="Clear Formatting">
              <RemoveFormatting size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
