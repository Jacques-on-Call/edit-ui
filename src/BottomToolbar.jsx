import React from 'react';
import Icon from './icons';

const BottomToolbar = ({ editor, activeFormats = {} }) => {
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

  const getButtonClasses = (isActive) => {
    const baseClasses = "bg-transparent border-none text-gray-800 cursor-pointer p-3 rounded-md transition-colors duration-200 ease-in-out flex items-center justify-center hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed";
    return isActive ? `${baseClasses} bg-gray-200 text-blue-600` : baseClasses;
  };

  return (
    <div className="flex justify-center items-center w-full px-4 gap-2 box-border">
      <button onClick={() => handleCommand('undo')} title="Undo" disabled={!isEditorReady} className={getButtonClasses(false)}>
        <Icon name="corner-up-left" />
      </button>
      <button onClick={() => handleCommand('redo')} title="Redo" disabled={!isEditorReady} className={getButtonClasses(false)}>
        <Icon name="corner-up-right" />
      </button>
      <button
        onClick={() => handleCommand('bold')}
        title="Bold"
        className={getButtonClasses(activeFormats.bold)}
        disabled={!isEditorReady}
      >
        <Icon name="bold" />
      </button>
      <button
        onClick={() => handleCommand('italic')}
        title="Italic"
        className={getButtonClasses(activeFormats.italic)}
        disabled={!isEditorReady}
      >
        <Icon name="italic" />
      </button>
      <button
        onClick={() => handleCommand('underline')}
        title="Underline"
        className={getButtonClasses(activeFormats.underline)}
        disabled={!isEditorReady}
      >
        <Icon name="underline" />
      </button>
      <button
        onClick={() => handleCommand('InsertUnorderedList')}
        title="Bullet List"
        className={getButtonClasses(activeFormats.unorderedList)}
        disabled={!isEditorReady}
      >
        <Icon name="list" />
      </button>
      <button onClick={handleInsertHr} title="Insert Section Separator" disabled={!isEditorReady} className={getButtonClasses(false)}>
        <Icon name="minus" />
      </button>
    </div>
  );
};

export default BottomToolbar;