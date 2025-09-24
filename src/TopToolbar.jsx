import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './icons';
import FormatMenu from './FormatMenu';
import AddMenu from './AddMenu';
import './TopToolbar.css';

const TopToolbar = ({ editor }) => {
  const navigate = useNavigate();
  const [isFormatMenuOpen, setFormatMenuOpen] = useState(false);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);

  const handleCommand = (command, value = null) => {
    if (editor) {
      editor.execCommand(command, false, value);
    }
  };

  const handlePreview = () => {
    // This assumes the path is available to navigate back to.
    // We may need to get the path from the URL or a prop.
    const path = window.location.pathname.replace('/edit/', '');
    navigate(`/explorer/file?path=${path}`);
  };

  return (
    <div className="top-toolbar">
      <div className="toolbar-group">
        <button onClick={handlePreview} title="Preview">
          <Icon name="eye" />
        </button>
        <button onClick={() => handleCommand('undo')} title="Undo">
          <Icon name="corner-up-left" />
        </button>
        <button onClick={() => handleCommand('redo')} title="Redo">
          <Icon name="corner-up-right" />
        </button>
      </div>

      <div className="toolbar-group">
        <div className="dropdown-container">
            <button onClick={() => setAddMenuOpen(!isAddMenuOpen)} title="Add...">
                <Icon name="plus" />
            </button>
            {isAddMenuOpen && <AddMenu editor={editor} />}
        </div>
        <div className="dropdown-container">
            <button onClick={() => setFormatMenuOpen(!isFormatMenuOpen)} title="Format text and paragraph">
                <Icon name="type" />
            </button>
            {isFormatMenuOpen && <FormatMenu editor={editor} />}
        </div>
      </div>
    </div>
  );
};

export default TopToolbar;
