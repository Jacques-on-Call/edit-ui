import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { useEditor } from '../contexts/EditorContext';
import {
  Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, Image, Table, X, Menu,
  Minus, FileText, Calendar, Columns, ChevronDown,
  Undo, Redo, Bold, Italic, Underline, Strikethrough, Code, Link,
  Type, Palette, Highlighter, Eraser
} from 'lucide-preact';
import { useVisualViewportFix } from '../hooks/useVisualViewportFix';
import './SlideoutToolbar.css';

/**
 * Unified Liquid Rail - Corrected Focus Management
 */
export default function SlideoutToolbar() {
  const { activeEditor, handleAction, isToolbarInteractionRef, selectionState } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const railRef = useRef(null);

  // Keep your existing Viewport fix
  useVisualViewportFix(railRef);

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

  // Auto-open logic (Keep as is)
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const hasSelection = selection.toString().length > 0;
      if (hasSelection && !isOpen) {
        setIsOpen(true);
        setIsExpanded(false);
      }
    };
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [isOpen]);

  // Close logic (Keep as is)
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if ((isOpen || isExpanded) && railRef.current && !railRef.current.contains(e.target)) {
        setIsExpanded(false);
        setIsOpen(false);
      }
    };
    if (isOpen || isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isExpanded]);

  // CRITICAL FIX: Use onPointerDown instead of onClick
  const toggleOpen = (e) => {
    e.preventDefault(); // Prevents focus loss
    e.stopPropagation();
    if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;

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

  const onAction = (e, action, payload) => {
    e.preventDefault(); // Prevents focus loss
    e.stopPropagation();
    if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;

    handleAction(action, payload);

    // Close logic based on mode
    if (!isExpanded) {
      setIsOpen(false);
    }
  };

  const toolbarActions = [
    // ... (Your existing toolbarActions array remains exactly the same)
    { id: 'bold', icon: Bold, label: 'Bold', action: 'bold', category: 'Formatting', active: selectionState?.isBold },
    { id: 'italic', icon: Italic, label: 'Italic', action: 'italic', category: 'Formatting', active: selectionState?.isItalic },
    { id: 'underline', icon: Underline, label: 'Underline', action: 'underline', category: 'Formatting', active: selectionState?.isUnderline },
    { id: 'strikethrough', icon: Strikethrough, label: 'Strike', action: 'strikethrough', category: 'Formatting', active: selectionState?.isStrikethrough },
    { id: 'code', icon: Code, label: 'Code', action: 'code', category: 'Formatting', active: selectionState?.isCode },
    { id: 'link', icon: Link, label: 'Link', action: 'link', category: 'Formatting' },
    { id: 'undo', icon: Undo, label: 'Undo', action: 'undo', category: 'History' },
    { id: 'redo', icon: Redo, label: 'Redo', action: 'redo', category: 'History' },
    { id: 'heading-2', icon: Heading2, label: 'Heading 2', action: 'heading', payload: 'h2', category: 'Headings', active: selectionState?.blockType === 'h2' },
    { id: 'heading-3', icon: Heading3, label: 'Heading 3', action: 'heading', payload: 'h3', category: 'Headings', active: selectionState?.blockType === 'h3' },
    { id: 'heading-4', icon: Heading4, label: 'Heading 4', action: 'heading', payload: 'h4', category: 'Headings', active: selectionState?.blockType === 'h4' },
    { id: 'bullet-list', icon: List, label: 'Bullet List', action: 'list', payload: 'ul', category: 'Lists', active: selectionState?.blockType === 'ul' },
    { id: 'numbered-list', icon: ListOrdered, label: 'Numbered List', action: 'list', payload: 'ol', category: 'Lists', active: selectionState?.blockType === 'ol' },
    { id: 'image', icon: Image, label: 'Image', action: 'image', category: 'Media' },
    { id: 'table', icon: Table, label: 'Table', action: 'table', category: 'Structure' },
    { id: 'horizontal-rule', icon: Minus, label: 'Divider', action: 'horizontalRule', category: 'Structure' },
    { id: 'columns', icon: Columns, label: 'Columns', action: 'columns', payload: 2, category: 'Layout' },
    { id: 'date', icon: Calendar, label: 'Date', action: 'date', category: 'Utility' }
  ];

  const grouped = toolbarActions.reduce((acc, action) => {
    const cat = action.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(action);
    return acc;
  }, {});

  const categoryOrder = ['Formatting', 'History', 'Headings', 'Lists', 'Structure', 'Media', 'Layout', 'Utility'];

  const toggleGroup = (e, groupName) => {
    e.preventDefault(); // Prevents focus loss
    e.stopPropagation();
    if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return createPortal(
    <>
      <div
        ref={railRef}
        className={`unified-liquid-rail ${isOpen ? 'open' : ''} ${isExpanded ? 'expanded' : ''}`}
        // CRITICAL: Catch interactions on the container too
        onPointerDown={(e) => {
           // We don't prevent default here globally, as it might block scrolling inside the rail
           // But we mark the interaction
           if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
        }}
      >
        <button
          className={`rail-hamburger ${isOpen ? 'active' : ''}`}
          // CRITICAL: Use onPointerDown
          onPointerDown={toggleOpen}
          aria-label="Toggle menu"
          aria-expanded={isOpen || isExpanded}
        >
          <Menu size={24} />
        </button>

        {isOpen && (
          <div className="rail-content">
            {isExpanded && (
              <div className="rail-header">
                <h3>Edit</h3>
                <button
                  onPointerDown={(e) => { e.preventDefault(); setIsExpanded(false); setIsOpen(false); }}
                  className="rail-close-btn"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            <div className="rail-scroll-area">
              {categoryOrder.map((categoryName) => {
                const categoryItems = grouped[categoryName];
                if (!categoryItems || categoryItems.length === 0) return null;
                const isCategoryExpanded = expandedGroups[categoryName];

                return (
                  <div key={categoryName} className="rail-category">
                    {isExpanded && (
                      <button className="rail-category-header" onPointerDown={(e) => toggleGroup(e, groupName)}>
                        <span className="rail-category-label">{categoryName}</span>
                        <ChevronDown size={16} className={`rail-chevron ${isCategoryExpanded ? 'expanded' : ''}`} />
                      </button>
                    )}

                    {(!isExpanded || isCategoryExpanded) && (
                      <div className="rail-items-grid">
                        {categoryItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              // CRITICAL: Use onPointerDown
                              onPointerDown={(e) => onAction(e, item.action, item.payload)}
                              className={`rail-item ${item.active ? 'active' : ''}`}
                              title={item.label}
                            >
                              <Icon size={20} className="rail-item-icon" />
                              {isExpanded && <span className="rail-item-label">{item.label}</span>}
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
      </div>

      {isExpanded && (
        <div
          className="rail-backdrop"
          onPointerDown={(e) => {
             e.preventDefault();
             setIsExpanded(false);
             setIsOpen(false);
          }}
        />
      )}
    </>,
    document.body
  );
}
