import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './icons';
import FormatMenu from './FormatMenu';
import AddMenu from './AddMenu';

const TopToolbar = ({ editor, activeFormats, onDone }) => {
  const navigate = useNavigate();
  const [isFormatMenuOpen, setFormatMenuOpen] = useState(false);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);
  const formatMenuRef = useRef(null);
  const addMenuRef = useRef(null);
  const formatButtonRef = useRef(null);
  const addButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFormatMenuOpen && formatMenuRef.current && !formatMenuRef.current.contains(event.target) && !formatButtonRef.current.contains(event.target)) {
        setFormatMenuOpen(false);
      }
      if (isAddMenuOpen && addMenuRef.current && !addMenuRef.current.contains(event.target) && !addButtonRef.current.contains(event.target)) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFormatMenuOpen, isAddMenuOpen]);

  const toggleFormatMenu = () => {
    setFormatMenuOpen(prev => !prev);
    setAddMenuOpen(false); // Close other menu
  };

  const toggleAddMenu = () => {
    setAddMenuOpen(prev => !prev);
    setFormatMenuOpen(false); // Close other menu
  };

  const buttonClasses = "bg-transparent text-white p-2 rounded-lg transition-colors duration-200 hover:bg-white/20 flex items-center justify-center";

  return (
    <div className="flex justify-between items-center w-full py-2 px-4 bg-[#007aff]">
      <div className="flex items-center gap-3">
        <button onClick={onDone} title="Preview" className={buttonClasses}>
          <Icon name="eye" className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
            <button onClick={toggleAddMenu} title="Add..." ref={addButtonRef} className={buttonClasses}>
                <Icon name="plus" className="w-6 h-6" />
            </button>
            {isAddMenuOpen && (
              <div ref={addMenuRef}>
                <AddMenu editor={editor} closeMenu={() => setAddMenuOpen(false)} />
              </div>
            )}
        </div>
        <div className="relative">
            <button onClick={toggleFormatMenu} title="Format text and paragraph" ref={formatButtonRef} className={buttonClasses}>
                <Icon name="type" className="w-6 h-6" />
            </button>
            {isFormatMenuOpen && (
              <div ref={formatMenuRef}>
                <FormatMenu editor={editor} activeFormats={activeFormats} closeMenu={() => setFormatMenuOpen(false)} />
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TopToolbar;