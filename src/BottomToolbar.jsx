import React from 'react';
import Icon from './icons';
import './BottomToolbar.css';

const BottomToolbar = ({ editor, activeFormats = {} }) => {
  if (!editor) {
    return null;
  }

  const handleCommand = (command, value = null) => {
    if (editor) {
        editor.execCommand(command, false, value);
    }
  };

  const handleInsertHr = () => {
    if (editor) {
      // Inserts a horizontal rule, which will be our section separator.
      editor.execCommand('mceInsertContent', false, '<hr />');
    }
  };

  return (
    <div className="bottom-toolbar">
      <button onClick={() => handleCommand('undo')} title="Undo">
        <Icon name="corner-up-left" />
      </button>
      <button onClick={() => handleCommand('redo')} title="Redo">
        <Icon name="corner-up-right" />
      </button>
      <button onClick={() => handleCommand('bold')} title="Bold" className={activeFormats.bold ? 'active' : ''}>
        <Icon name="bold" />
      </button>
      <button onClick={() => handleCommand('italic')} title="Italic" className={activeFormats.italic ? 'active' : ''}>
        <Icon name="italic" />
      </button>
      <button onClick={() => handleCommand('underline')} title="Underline" className={activeFormats.underline ? 'active' : ''}>
        <Icon name="underline" />
      </button>
      <button title="Text Color">A</button>
      <button title="Highlight Color">H</button>
      <button onClick={() => handleCommand('InsertUnorderedList')} title="Bullet List" className={activeFormats.unorderedList ? 'active' : ''}>
        <Icon name="list" />
      </button>
      <button onClick={handleInsertHr} title="Insert Section Separator">
        <Icon name="minus" />
      </button>
    </div>
  );
};

export default BottomToolbar;