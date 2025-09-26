import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './icons';
import FormatMenu from './FormatMenu';
import AddMenu from './AddMenu';
import './TopToolbar.css';

const TopToolbar = ({ editor, activeFormats, onDone }) => {
  const navigate = useNavigate();
  const [isFormatMenuOpen, setFormatMenuOpen] = useState(false);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);
  const formatMenuRef = useRef(null);
  const addMenuRef = useRef(null);
  const formatButtonRef = useRef(null);
  const addButtonRef = useRef(null);

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close format menu if click is outside of its container and not on its button
      if (isFormatMenuOpen && formatMenuRef.current && !formatMenuRef.current.contains(event.target) && !formatButtonRef.current.contains(event.target)) {
        setFormatMenuOpen(false);
      }
      // Close add menu if click is outside of its container and not on its button
      if (isAddMenuOpen && addMenuRef.current && !addMenuRef.current.contains(event.target) && !addButtonRef.current.contains(event.target)) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFormatMenuOpen, isAddMenuOpen]);

  const handleCommand = (command, value = null) => {
    if (editor) {
      editor.execCommand(command, false, value);
    }
  };

  const handlePreview = () => {
    // Navigate back to the previous page (the file viewer)
    navigate(-1);
  };

  const toggleFormatMenu = () => {
    setFormatMenuOpen(prev => !prev);
    setAddMenuOpen(false); // Close other menu
  };

  const toggleAddMenu = () => {
    setAddMenuOpen(prev => !prev);
    setFormatMenuOpen(false); // Close other menu
  };

  return (
    <div className="top-toolbar">
      <div className="toolbar-group">
        <button onClick={onDone} title="Preview">
          <Icon name="eye" />
        </button>
        {/* Undo/redo buttons were moved to the bottom toolbar to follow user feedback */}
      </div>

      <div className="toolbar-group">
        <div className="dropdown-container">
            <button onClick={toggleAddMenu} title="Add..." ref={addButtonRef}>
                <Icon name="plus" />
            </button>
            {isAddMenuOpen && <div ref={addMenuRef}><AddMenu editor={editor} closeMenu={() => setAddMenuOpen(false)} /></div>}
        </div>
        <div className="dropdown-container">
            <button onClick={toggleFormatMenu} title="Format text and paragraph" ref={formatButtonRef}>
                <Icon name="type" />
            </button>
            {isFormatMenuOpen && <div ref={formatMenuRef}><FormatMenu editor={editor} activeFormats={activeFormats} closeMenu={() => setFormatMenuOpen(false)} /></div>}
        </div>
      </div>
    </div>
  );
};

export default TopToolbar;
