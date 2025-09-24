import React from 'react';
import './AddMenu.css';

const AddMenu = ({ editor, closeMenu }) => {
  if (!editor) return null;

  const handleCommand = (command) => {
    if (editor) {
      editor.execCommand(command);
      if (closeMenu) closeMenu();
    }
  };

  return (
    <div className="add-menu">
      <button onClick={() => handleCommand('mceLink')}>Insert/Edit Link</button>
      <button onClick={() => handleCommand('mceImage')}>Insert/Edit Image</button>
      <button onClick={() => handleCommand('mceInsertTable')}>Insert Table</button>
      {/* More items can be added here if needed */}
    </div>
  );
};

export default AddMenu;
