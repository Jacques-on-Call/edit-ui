import React from 'react';
import Icon from './icons';
import styles from './BottomToolbar.module.css';

const BottomToolbar = ({ editor, activeFormats = {} }) => {
  // The component now always renders, but buttons are disabled if the editor is not ready.
  const isEditorReady = !!editor;

  const handleCommand = (command, value = null) => {
    if (isEditorReady) {
      editor.execCommand(command, false, value);
    }
  };

  const handleInsertHr = () => {
    if (isEditorReady) {
      editor.execCommand('mceInsertContent', false, '<hr />');
    }
  };

  return (
    <div className={styles.bottomToolbar}>
      <button onClick={() => handleCommand('undo')} title="Undo" disabled={!isEditorReady}>
        <Icon name="corner-up-left" />
      </button>
      <button onClick={() => handleCommand('redo')} title="Redo" disabled={!isEditorReady}>
        <Icon name="corner-up-right" />
      </button>
      <button
        onClick={() => handleCommand('bold')}
        title="Bold"
        className={activeFormats.bold ? styles.active : ''}
        disabled={!isEditorReady}
      >
        <Icon name="bold" />
      </button>
      <button
        onClick={() => handleCommand('italic')}
        title="Italic"
        className={activeFormats.italic ? styles.active : ''}
        disabled={!isEditorReady}
      >
        <Icon name="italic" />
      </button>
      <button
        onClick={() => handleCommand('underline')}
        title="Underline"
        className={activeFormats.underline ? styles.active : ''}
        disabled={!isEditorReady}
      >
        <Icon name="underline" />
      </button>
      <button
        onClick={() => handleCommand('InsertUnorderedList')}
        title="Bullet List"
        className={activeFormats.unorderedList ? styles.active : ''}
        disabled={!isEditorReady}
      >
        <Icon name="list" />
      </button>
      <button onClick={handleInsertHr} title="Insert Section Separator" disabled={!isEditorReady}>
        <Icon name="minus" />
      </button>
    </div>
  );
};

export default BottomToolbar;