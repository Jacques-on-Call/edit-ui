import React, { useState, useEffect, useRef } from 'react';
import Icon from './icons';
import FormatMenu from './FormatMenu';
import AddMenu from './AddMenu';

const TopToolbar = ({ editor, activeFormats, onDone }) => {
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

  const buttonClasses = "bg-transparent border-none text-gray-800 cursor-pointer p-2 rounded-md transition-colors duration-200 ease-in-out flex items-center justify-center hover:bg-gray-100";

  return (
    <div className="flex justify-between items-center w-full px-4 box-border">
      <div className="flex items-center gap-2">
        <button onClick={onDone} title="Preview" className={buttonClasses}>
          <Icon name="eye" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
            <button onClick={toggleAddMenu} title="Add..." ref={addButtonRef} className={buttonClasses}>
                <Icon name="plus" />
            </button>
            {isAddMenuOpen && (
              <div ref={addMenuRef}>
                <AddMenu editor={editor} closeMenu={() => setAddMenuOpen(false)} />
              </div>
            )}
        </div>
        <div className="relative">
            <button onClick={toggleFormatMenu} title="Format text and paragraph" ref={formatButtonRef} className={buttonClasses}>
                <Icon name="type" />
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