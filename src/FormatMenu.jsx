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

  const buttonClasses = "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md";
  const sectionHeaderClasses = "px-4 pt-2 pb-1 text-xs font-bold text-gray-500 uppercase";

  return (
    <div
      className="absolute right-0 mt-2 w-64 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
      role="menu"
      aria-orientation="vertical"
    >
      <div className="py-1" role="none">
        <div className={sectionHeaderClasses}>Text</div>
        <button onClick={() => handleCommand('bold')} className={`${buttonClasses} ${activeFormats.bold ? 'bg-gray-100' : ''}`} role="menuitem">Bold</button>
        <button onClick={() => handleCommand('italic')} className={`${buttonClasses} ${activeFormats.italic ? 'bg-gray-100' : ''}`} role="menuitem">Italic</button>
        <button onClick={() => handleCommand('underline')} className={`${buttonClasses} ${activeFormats.underline ? 'bg-gray-100' : ''}`} role="menuitem">Underline</button>
      </div>
      <div className="py-1 border-t border-gray-100" role="none">
        <div className={sectionHeaderClasses}>Block Style</div>
        <button onClick={() => handleFormatBlock('p')} className={buttonClasses} role="menuitem">Paragraph</button>
        <button onClick={() => handleFormatBlock('h1')} className={buttonClasses} role="menuitem">Heading 1</button>
        <button onClick={() => handleFormatBlock('h2')} className={buttonClasses} role="menuitem">Heading 2</button>
      </div>
      <div className="py-1 border-t border-gray-100" role="none">
        <div className={sectionHeaderClasses}>Lists</div>
        <button onClick={() => handleCommand('InsertUnorderedList')} className={buttonClasses} role="menuitem">Bullet List</button>
        <button onClick={() => handleCommand('InsertOrderedList')} className={buttonClasses} role="menuitem">Numbered List</button>
      </div>
    </div>
  );
};

export default FormatMenu;