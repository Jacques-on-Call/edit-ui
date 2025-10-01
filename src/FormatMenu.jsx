import React from 'react';

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

  const getButtonClasses = (isActive) => {
    const baseClasses = "bg-gray-50 border border-gray-200 text-gray-800 p-2 rounded cursor-pointer text-sm text-left flex-grow hover:bg-gray-200";
    return isActive ? `${baseClasses} bg-blue-100 border-blue-300` : baseClasses;
  };

  return (
    <div className="absolute top-[calc(100%+5px)] right-0 bg-white border border-gray-300 rounded-md shadow-lg z-[1000] w-[280px] p-2 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-200">
        <div className="w-full text-xs font-bold text-gray-600 mb-1">Text</div>
        <button onClick={() => handleCommand('bold')} className={getButtonClasses(activeFormats.bold)}>Bold</button>
        <button onClick={() => handleCommand('italic')} className={getButtonClasses(activeFormats.italic)}>Italic</button>
        <button onClick={() => handleCommand('underline')} className={getButtonClasses(activeFormats.underline)}>Underline</button>
        <button onClick={() => handleCommand('strikethrough')} className={getButtonClasses(activeFormats.strikethrough)}>Strikethrough</button>
        <button onClick={() => handleCommand('superscript')} className={getButtonClasses(activeFormats.superscript)}>Superscript</button>
        <button onClick={() => handleCommand('subscript')} className={getButtonClasses(activeFormats.subscript)}>Subscript</button>
        <button onClick={() => handleCommand('removeformat')} className={getButtonClasses(false)}>Clear Formatting</button>
      </div>
      <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-200">
        <div className="w-full text-xs font-bold text-gray-600 mb-1">Block Style</div>
        <button onClick={() => handleFormatBlock('p')} className={getButtonClasses(activeFormats.p)}>Paragraph</button>
        <button onClick={() => handleFormatBlock('h1')} className={getButtonClasses(activeFormats.h1)}>Heading 1</button>
        <button onClick={() => handleFormatBlock('h2')} className={getButtonClasses(activeFormats.h2)}>Heading 2</button>
        <button onClick={() => handleFormatBlock('h3')} className={getButtonClasses(activeFormats.h3)}>Heading 3</button>
      </div>
      <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-200">
        <div className="w-full text-xs font-bold text-gray-600 mb-1">Alignment</div>
        <button onClick={() => handleCommand('JustifyLeft')} className={getButtonClasses(activeFormats.justifyLeft)}>Left</button>
        <button onClick={() => handleCommand('JustifyCenter')} className={getButtonClasses(activeFormats.justifyCenter)}>Center</button>
        <button onClick={() => handleCommand('JustifyRight')} className={getButtonClasses(activeFormats.justifyRight)}>Right</button>
        <button onClick={() => handleCommand('JustifyFull')} className={getButtonClasses(activeFormats.justifyFull)}>Justify</button>
      </div>
       <div className="flex flex-wrap gap-2">
        <div className="w-full text-xs font-bold text-gray-600 mb-1">Lists</div>
        <button onClick={() => handleCommand('InsertUnorderedList')} className={getButtonClasses(activeFormats.unorderedList)}>Bullet List</button>
        <button onClick={() => handleCommand('InsertOrderedList')} className={getButtonClasses(activeFormats.orderedList)}>Numbered List</button>
      </div>
    </div>
  );
};

export default FormatMenu;
