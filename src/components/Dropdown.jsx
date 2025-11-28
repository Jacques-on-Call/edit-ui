import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import './Dropdown.css';

export default function Dropdown({ buttonContent, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div class="dropdown" ref={dropdownRef}>
      <button class="dropdown-toggle" onMouseDown={toggleDropdown}>
        {buttonContent}
      </button>
      {isOpen && (
        <div class="dropdown-menu">
          {children}
        </div>
      )}
    </div>
  );
}
