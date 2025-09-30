import React from 'react';
import styles from './FormatMenu.module.css';

const FormatMenu = ({ editor, activeFormats = {}, closeMenu }) => {
  if (!editor) return null;

  const handleCommand = (command, value = null) => {
    if (editor) {
        editor.execCommand(command, false, value);
        if (closeMenu) closeMenu();
    }
  };

  const handleFormatBlock = (format) => {
    if (editor) {
        editor.execCommand('FormatBlock', false, format);
        if (closeMenu) closeMenu();
    }
  };

  return (
    <div className={styles.formatMenu}>
      <div className={styles.menuSection}>
        <div className={styles.menuHeader}>Text</div>
        <button onClick={() => handleCommand('bold')} className={activeFormats.bold ? styles.active : ''}>Bold</button>
        <button onClick={() => handleCommand('italic')} className={activeFormats.italic ? styles.active : ''}>Italic</button>
        <button onClick={() => handleCommand('underline')} className={activeFormats.underline ? styles.active : ''}>Underline</button>
        <button onClick={() => handleCommand('strikethrough')}>Strikethrough</button>
        <button onClick={() => handleCommand('superscript')}>Superscript</button>
        <button onClick={() => handleCommand('subscript')}>Subscript</button>
        <button onClick={() => handleCommand('removeformat')}>Clear Formatting</button>
      </div>
      <div className={styles.menuSection}>
        <div className={styles.menuHeader}>Block Style</div>
        <button onClick={() => handleFormatBlock('p')}>Paragraph</button>
        <button onClick={() => handleFormatBlock('h1')}>Heading 1</button>
        <button onClick={() => handleFormatBlock('h2')}>Heading 2</button>
        <button onClick={() => handleFormatBlock('h3')}>Heading 3</button>
      </div>
      <div className={styles.menuSection}>
        <div className={styles.menuHeader}>Alignment</div>
        <button onClick={() => handleCommand('JustifyLeft')} className={activeFormats.justifyLeft ? styles.active : ''}>Left</button>
        <button onClick={() => handleCommand('JustifyCenter')} className={activeFormats.justifyCenter ? styles.active : ''}>Center</button>
        <button onClick={() => handleCommand('JustifyRight')} className={activeFormats.justifyRight ? styles.active : ''}>Right</button>
        <button onClick={() => handleCommand('JustifyFull')} className={activeFormats.justifyFull ? styles.active : ''}>Justify</button>
      </div>
       <div className={styles.menuSection}>
        <div className={styles.menuHeader}>Lists</div>
        <button onClick={() => handleCommand('InsertUnorderedList')} className={activeFormats.unorderedList ? styles.active : ''}>Bullet List</button>
        <button onClick={() => handleCommand('InsertOrderedList')}>Numbered List</button>
      </div>
    </div>
  );
};

export default FormatMenu;
