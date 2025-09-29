import React from 'react';

const AddMenu = ({ editor, closeMenu }) => {
  if (!editor) return null;

  const handleCommand = (command) => {
    if (editor) {
      editor.execCommand(command);
      if (closeMenu) closeMenu();
    }
  };

  const buttonClasses = "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md";

  return (
    <div
      className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
      role="menu"
      aria-orientation="vertical"
    >
      <div className="py-1" role="none">
        <button onClick={() => handleCommand('mceLink')} className={buttonClasses} role="menuitem">
          Insert/Edit Link
        </button>
        <button onClick={() => handleCommand('mceImage')} className={buttonClasses} role="menuitem">
          Insert/Edit Image
        </button>
        <button onClick={() => handleCommand('mceInsertTable')} className={buttonClasses} role="menuitem">
          Insert Table
        </button>
      </div>
    </div>
  );
};

export default AddMenu;