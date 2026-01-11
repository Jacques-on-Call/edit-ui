import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { useEditor } from '../contexts/EditorContext';
import { 
  Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, Image, Table, X, Menu,
  Minus, FileText, Calendar, Columns, ChevronDown,
  Undo, Redo, Bold, Italic, Underline, Strikethrough, Code, Link
} from 'lucide-preact';
import { useVisualViewportFix } from '../hooks/useVisualViewportFix';
import './SlideoutToolbar.css';

/**
 * Unified SlideoutToolbar - Translucent liquid glass toolbar for both Styling and Adding
 */
export default function SlideoutToolbar() {
  const { activeEditor, handleAction, isToolbarInteractionRef, selectionState } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const toolbarRef = useRef(null);
  const hamburgerRef = useRef(null);
  
  useVisualViewportFix(hamburgerRef);
  
  const [expandedGroups, setExpandedGroups] = useState({
    'Formatting': true,
    'History': false,
    'Headings': false,
    'Lists': false,
    'Structure': false,
    'Media': false,
    'Layout': false,
    'Utility': false
  });

  // Auto-open toolbar on text selection (Style Context)
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const hasSelection = selection.toString().length > 0;

      if (hasSelection && !isOpen) {
        setIsOpen(true);
        setIsExpanded(false); // Open in compact icon mode first
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && (isOpen || isExpanded)) {
        setIsExpanded(false);
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isExpanded]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if ((isOpen || isExpanded) && toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        const trigger = document.querySelector('.floating-hamburger');
        if (!trigger || !trigger.contains(e.target)) {
          setIsExpanded(false);
          setIsOpen(false);
        }
      }
    };
    if (isOpen || isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isExpanded]);

  const toggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsExpanded(false);
    } else if (!isExpanded) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
      setIsOpen(false);
    }
  };

  const toolbarActions = [
    // Formatting Section (Integrated from SidePanelToolbar)
    { id: 'bold', icon: Bold, label: 'Bold', action: 'bold', category: 'Formatting', active: selectionState?.isBold },
    { id: 'italic', icon: Italic, label: 'Italic', action: 'italic', category: 'Formatting', active: selectionState?.isItalic },
    { id: 'underline', icon: Underline, label: 'Underline', action: 'underline', category: 'Formatting', active: selectionState?.isUnderline },
    { id: 'link', icon: Link, label: 'Link', action: 'link', category: 'Formatting' },

    // History section
    { id: 'undo', icon: Undo, label: 'Undo', action: 'undo', category: 'History' },
    { id: 'redo', icon: Redo, label: 'Redo', action: 'redo', category: 'History' },

    // Headings section
    { id: 'heading-2', icon: Heading2, label: 'Heading 2', action: 'heading', payload: 'h2', category: 'Headings' },
    { id: 'heading-3', icon: Heading3, label: 'Heading 3', action: 'heading', payload: 'h3', category: 'Headings' },

    // Lists section
    { id: 'bullet-list', icon: List, label: 'Bullet List', action: 'list', payload: 'ul', category: 'Lists' },
    { id: 'numbered-list', icon: ListOrdered, label: 'Numbered List', action: 'list', payload: 'ol', category: 'Lists' },

    // Media & Structure
    { id: 'image', icon: Image, label: 'Image', action: 'image', category: 'Media' },
    { id: 'table', icon: Table, label: 'Table', action: 'table', category: 'Structure' },
    { id: 'horizontal-rule', icon: Minus, label: 'Divider', action: 'horizontalRule', category: 'Structure' }
  ];

  const groupedActions = toolbarActions.reduce((acc, action) => {
    const category = action.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(action);
    return acc;
  }, {});

  const categoryOrder = ['Formatting', 'History', 'Headings', 'Lists', 'Structure', 'Media', 'Layout', 'Utility'];
  
  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return createPortal(
    <>
      <button
        ref={hamburgerRef}
        className={`floating-hamburger ${isOpen ? 'active' : ''}`}
        onPointerDown={(e) => {
          e.preventDefault();
          if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
          toggleOpen();
        }}
        aria-label="Menu"
      >
        <Menu size={24} />
      </button>
      
      {isOpen && (
        <div 
          ref={toolbarRef}
          className={`slideout-toolbar ${isExpanded ? 'expanded' : 'collapsed'}`}
        >
          {isExpanded && (
            <div className="slideout-toolbar-header">
              <h3>Toolbar</h3>
              <button onPointerDown={() => { setIsExpanded(false); setIsOpen(false); }} className="close-button">
                <X size={20} />
              </button>
            </div>
          )}
          
          <div className="slideout-toolbar-content">
            {categoryOrder.map((categoryName) => {
              const categoryItems = groupedActions[categoryName];
              if (!categoryItems || categoryItems.length === 0) return null;
              
              const isCategoryExpanded = expandedGroups[categoryName];
              
              return (
                <div key={categoryName} className="toolbar-category">
                  {isExpanded && (
                    <button className="toolbar-category-header" onPointerDown={() => toggleGroup(categoryName)}>
                      <span className="toolbar-category-label">{categoryName}</span>
                      <ChevronDown size={16} className={`category-chevron ${isCategoryExpanded ? 'expanded' : ''}`} />
                    </button>
                  )}
                  
                  {(!isExpanded || isCategoryExpanded) && (
                    <div className="toolbar-category-items">
                      {categoryItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
                              handleAction(item.action, item.payload);
                              if (!isExpanded) { setIsOpen(false); } // Close after selection if in compact mode
                            }}
                            className={`toolbar-item ${item.active ? 'active' : ''}`}
                            title={item.label}
                          >
                            <Icon size={20} className="toolbar-item-icon" />
                            {isExpanded && <span className="toolbar-item-label">{item.label}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
