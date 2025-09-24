import React from 'react';
import Icon from './icons';
import './BottomToolbar.css';

const BottomToolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const handleCommand = (command, value = null) => {
    editor.execCommand(command, false, value);
  };

  return (
    <div className="bottom-toolbar">
      <button onClick={() => handleCommand('mention')} title="Mention">
        <Icon name="at" />
      </button>
      <button onClick={() => handleCommand('bold')} title="Bold">
        <Icon name="bold" />
      </button>
      <button onClick={() => handleCommand('italic')} title="Italic">
        <Icon name="italic" />
      </button>
      <button onClick={() => handleCommand('underline')} title="Underline">
        <Icon name="underline" />
      </button>
      <button title="Text Color">A</button>
      <button title="Highlight Color">H</button>
      <button onClick={() => handleCommand('InsertUnorderedList')} title="Bullet List">
        <Icon name="list" />
      </button>
    </div>
  );
};

export default BottomToolbar;
