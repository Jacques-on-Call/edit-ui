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

  // Define Tailwind classes for buttons
  const baseButtonClasses = "p-2 rounded-lg transition-colors duration-200 hover:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed disabled:hover:bg-transparent";
  const activeButtonClasses = "bg-white/30";

  return (
    <div className="flex justify-around items-center w-full py-2 px-4 bg-[#007aff]">
      <button
        onClick={() => handleCommand('undo')}
        title="Undo"
        disabled={!isEditorReady}
        className={baseButtonClasses}
      >
        <Icon name="corner-up-left" className="w-6 h-6" />
      </button>
      <button
        onClick={() => handleCommand('redo')}
        title="Redo"
        disabled={!isEditorReady}
        className={baseButtonClasses}
      >
        <Icon name="corner-up-right" className="w-6 h-6" />
      </button>
      <button
        onClick={() => handleCommand('bold')}
        title="Bold"
        className={`${baseButtonClasses} ${activeFormats.bold ? activeButtonClasses : ''}`}
        disabled={!isEditorReady}
      >
        <Icon name="bold" className="w-6 h-6" />
      </button>
      <button
        onClick={() => handleCommand('italic')}
        title="Italic"
        className={`${baseButtonClasses} ${activeFormats.italic ? activeButtonClasses : ''}`}
        disabled={!isEditorReady}
      >
        <Icon name="italic" className="w-6 h-6" />
      </button>
      <button
        onClick={() => handleCommand('underline')}
        title="Underline"
        className={`${baseButtonClasses} ${activeFormats.underline ? activeButtonClasses : ''}`}
        disabled={!isEditorReady}
      >
        <Icon name="underline" className="w-6 h-6" />
      </button>
      <button
        onClick={() => handleCommand('InsertUnorderedList')}
        title="Bullet List"
        className={`${baseButtonClasses} ${activeFormats.unorderedList ? activeButtonClasses : ''}`}
        disabled={!isEditorReady}
      >
        <Icon name="list" className="w-6 h-6" />
      </button>
      <button
        onClick={handleInsertHr}
        title="Insert Section Separator"
        disabled={!isEditorReady}
        className={baseButtonClasses}
      >
        <Icon name="minus" className="w-6 h-6" />
      </button>
    </div>
  );
};

export default BottomToolbar;