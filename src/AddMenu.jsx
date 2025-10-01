import React from 'react';

const AddMenu = ({ editor, closeMenu }) => {
  if (!editor) return null;

  const handleCommand = (command) => {
    if (editor) {
      editor.execCommand(command);
      if (closeMenu) closeMenu();
    }
  };

  const buttonClasses = "bg-gray-50 border border-gray-200 text-gray-800 p-2 rounded cursor-pointer text-sm text-left hover:bg-gray-200 w-full";

  return (
    <div className="absolute top-[calc(100%+5px)] right-0 bg-white border border-gray-300 rounded shadow-lg z-[1000] w-[200px] p-2 flex flex-col gap-2">
      <button className={buttonClasses} onClick={() => handleCommand('mceLink')}>Insert/Edit Link</button>
      <button className={buttonClasses} onClick={() => handleCommand('mceImage')}>Insert/Edit Image</button>
      <button className={buttonClasses} onClick={() => handleCommand('mceInsertTable')}>Insert Table</button>
      {/* More items can be added here if needed */}
    </div>
  );
};

export default AddMenu;
