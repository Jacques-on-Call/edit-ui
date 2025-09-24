import React from 'react';
import './AddMenu.css'; // Will create this next

const AddMenu = ({ editor }) => {
  if (!editor) return null;

  const handleCommand = (command) => {
    editor.execCommand(command);
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
