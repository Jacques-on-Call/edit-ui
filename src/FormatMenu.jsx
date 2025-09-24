import React from 'react';
import './FormatMenu.css';

const FormatMenu = ({ editor, onCommand }) => {
  if (!editor) return null;

  const handleCommand = (command, value = null) => {
    if (onCommand) {
        onCommand(command, value);
    } else {
        editor.execCommand(command, false, value);
    }
  };

  const handleFormatBlock = (format) => {
    editor.execCommand('FormatBlock', false, format);
  };

  return (
    <div className="format-menu">
      <div className="menu-section">
        <div className="menu-header">Text</div>
        <button onClick={() => handleCommand('bold')}>Bold</button>
        <button onClick={() => handleCommand('italic')}>Italic</button>
        <button onClick={() => handleCommand('underline')}>Underline</button>
        <button onClick={() => handleCommand('strikethrough')}>Strikethrough</button>
        <button onClick={() => handleCommand('superscript')}>Superscript</button>
        <button onClick={() => handleCommand('subscript')}>Subscript</button>
        <button onClick={() => handleCommand('removeformat')}>Clear Formatting</button>
      </div>
      <div className="menu-section">
        <div className="menu-header">Block Style</div>
        <button onClick={() => handleFormatBlock('p')}>Paragraph</button>
        <button onClick={() => handleFormatBlock('h1')}>Heading 1</button>
        <button onClick={() => handleFormatBlock('h2')}>Heading 2</button>
        <button onClick={() => handleFormatBlock('h3')}>Heading 3</button>
      </div>
      <div className="menu-section">
        <div className="menu-header">Alignment</div>
        <button onClick={() => handleCommand('JustifyLeft')}>Left</button>
        <button onClick={() => handleCommand('JustifyCenter')}>Center</button>
        <button onClick={() => handleCommand('JustifyRight')}>Right</button>
        <button onClick={() => handleCommand('JustifyFull')}>Justify</button>
      </div>
       <div className="menu-section">
        <div className="menu-header">Lists</div>
        <button onClick={() => handleCommand('InsertUnorderedList')}>Bullet List</button>
        <button onClick={() => handleCommand('InsertOrderedList')}>Numbered List</button>
      </div>
    </div>
  );
};

export default FormatMenu;
