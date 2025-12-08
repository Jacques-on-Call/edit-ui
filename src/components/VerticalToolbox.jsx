import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Heading2, Heading3, List, ListOrdered, Image, Table, X } from 'lucide-preact';
import HamburgerTrigger from './HamburgerTrigger';

/**
 * VerticalToolbox - Slide-out left sidebar for insert actions
 * Contains: H2, H3, Bullet List, Numbered List, Image, Table
 * Includes hamburger trigger button
 */
export default function VerticalToolbox({ handleAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const toolboxRef = useRef(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && toolboxRef.current && !toolboxRef.current.contains(e.target)) {
        // Check if click is on hamburger trigger (which has its own handler)
        const trigger = document.querySelector('.hamburger-trigger');
        if (!trigger || !trigger.contains(e.target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleInsert = (action, ...args) => {
    handleAction(action, ...args);
    // Close toolbar after selection
    setIsOpen(false);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const toolboxActions = [
    {
      id: 'heading-2',
      icon: Heading2,
      label: 'Heading 2',
      action: () => handleInsert('heading', 'h2'),
      ariaLabel: 'Insert Heading 2',
    },
    {
      id: 'heading-3',
      icon: Heading3,
      label: 'Heading 3',
      action: () => handleInsert('heading', 'h3'),
      ariaLabel: 'Insert Heading 3',
    },
    {
      id: 'bullet-list',
      icon: List,
      label: 'Bullet List',
      action: () => handleInsert('list', 'ul'),
      ariaLabel: 'Insert Bullet List',
    },
    {
      id: 'numbered-list',
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => handleInsert('list', 'ol'),
      ariaLabel: 'Insert Numbered List',
    },
    {
      id: 'image',
      icon: Image,
      label: 'Image',
      action: () => handleInsert('image'),
      ariaLabel: 'Insert Image',
    },
    {
      id: 'table',
      icon: Table,
      label: 'Table',
      action: () => handleInsert('table'),
      ariaLabel: 'Insert Table',
    },
  ];

  return (
    <>
      <HamburgerTrigger onClick={toggleOpen} isOpen={isOpen} />
      
      <div 
        ref={toolboxRef}
        className={`vertical-toolbox ${isOpen ? 'open' : ''}`}
        role="menu"
        aria-label="Insert menu"
      >
        <div className="vertical-toolbox-header">
          <h3>Insert</h3>
          <button
            onClick={toggleOpen}
            aria-label="Close insert menu"
            className="close-button"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="vertical-toolbox-content">
          {toolboxActions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="toolbox-item"
                aria-label={item.ariaLabel}
                role="menuitem"
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Backdrop overlay when open */}
      {isOpen && <div className="vertical-toolbox-backdrop" onClick={toggleOpen} />}
    </>
  );
}
