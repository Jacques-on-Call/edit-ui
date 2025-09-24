import React from 'react';
import './FormatMenu.css';

const FormatMenu = ({ editor, activeFormats = {} }) => {
  if (!editor) return null;

  const handleCommand = (command, value = null) => {
    if (editor) {
        editor.execCommand(command, false, value);
    }
  };

  const handleFormatBlock = (format) => {
    if (editor) {
        editor.execCommand('FormatBlock', false, format);
    }
  };

  return (
    <div className="format-menu">
      <div className="menu-section">
        <div className="menu-header">Text</div>
        <button onClick={() => handleCommand('bold')} className={activeFormats.bold ? 'active' : ''}>Bold</button>
        <button onClick={() => handleCommand('italic')} className={activeFormats.italic ? 'active' : ''}>Italic</button>
        <button onClick={() => handleCommand('underline')} className={activeFormats.underline ? 'active' : ''}>Underline</button>
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
        <button onClick={() => handleCommand('JustifyLeft')} className={activeFormats.justifyLeft ? 'active' : ''}>Left</button>
        <button onClick={() => handleCommand('JustifyCenter')} className={activeFormats.justifyCenter ? 'active' : ''}>Center</button>
        <button onClick={() => handleCommand('JustifyRight')} className={activeFormats.justifyRight ? 'active' : ''}>Right</button>
        <button onClick={() => handleCommand('JustifyFull')} className={activeFormats.justifyFull ? 'active' : ''}>Justify</button>
      </div>
       <div className="menu-section">
        <div className="menu-header">Lists</div>
        <button onClick={() => handleCommand('InsertUnorderedList')} className={activeFormats.unorderedList ? 'active' : ''}>Bullet List</button>
        <button onClick={() => handleCommand('InsertOrderedList')}>Numbered List</button>
      </div>
    </div>
  );
};

export default FormatMenu;
