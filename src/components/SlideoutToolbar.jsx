import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { useEditor } from '../contexts/EditorContext';
import { 
  Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, Image, Table, X, Menu,
  Minus, FileText, Calendar, Columns, ChevronDown,
  Undo, Redo
} from 'lucide-preact';
import { useVisualViewportFix } from '../hooks/useVisualViewportFix';
import './SlideoutToolbar.css';

/**
 * SlideoutToolbar - Icon-only slide-out toolbar with liquid glass theme
 * 
 * Features:
 * - Floating hamburger trigger in top-left corner
 * - Collapsed state: narrow icon-rail (icon-only column)
 * - Expanded state: wider slideout panel with icons and labels
 * - Icon-first layout with labels hidden by default (icon-only)
 * - Liquid glass visual theme with backdrop blur
 * - Auto-closes after action selection
 * - Full keyboard accessibility with Escape key
 * - Collapsible category groups (accordion pattern)
 * 
 * Props:
 * - handleAction: (action: string, payload?: any) => void - Handler for toolbar actions
 */
export default function SlideoutToolbar() {
  const { activeEditor, handleAction, isToolbarInteractionRef } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const toolbarRef = useRef(null);
  const hamburgerRef = useRef(null);
  
  // Apply iOS Safari visualViewport fix to hamburger button to prevent it from moving when virtual keyboard opens
  useVisualViewportFix(hamburgerRef);
  
  // Track which category groups are expanded (accordion pattern)
  const [expandedGroups, setExpandedGroups] = useState({
    'History': true, // Start with History expanded
    'Headings': false,
    'Lists': false,
    'Structure': false,
    'Media': false,
    'Layout': false,
    'Utility': false
  });

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

  const handleInsert = (action, ...args) => {
    console.log('[SlideoutToolbar] Action triggered:', action, 'activeEditor:', !!activeEditor);
    if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
    if (!activeEditor) {
      console.warn('[SlideoutToolbar] No active editor, action may not work:', action);
    }
    handleAction(action, ...args);
    // Close toolbar after selection
    setIsExpanded(false);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (!isOpen) {
      // Open in collapsed (icon-rail) state
      setIsOpen(true);
      setIsExpanded(false);
    } else if (!isExpanded) {
      // Expand to full slideout
      setIsExpanded(true);
    } else {
      // Close completely
      setIsExpanded(false);
      setIsOpen(false);
    }
  };

  const toolbarActions = [
    // History section (undo/redo at top)
    {
      id: 'undo',
      icon: Undo,
      label: 'Undo',
      action: () => handleInsert('undo'),
      ariaLabel: 'Undo',
      category: 'History'
    },
    {
      id: 'redo',
      icon: Redo,
      label: 'Redo',
      action: () => handleInsert('redo'),
      ariaLabel: 'Redo',
      category: 'History'
    },
    // Headings section
    {
      id: 'heading-2',
      icon: Heading2,
      label: 'Heading 2',
      action: () => handleInsert('heading', 'h2'),
      ariaLabel: 'Insert Heading 2',
      category: 'Headings'
    },
    {
      id: 'heading-3',
      icon: Heading3,
      label: 'Heading 3',
      action: () => handleInsert('heading', 'h3'),
      ariaLabel: 'Insert Heading 3',
      category: 'Headings'
    },
    {
      id: 'heading-4',
      icon: Heading4,
      label: 'Heading 4',
      action: () => handleInsert('heading', 'h4'),
      ariaLabel: 'Insert Heading 4',
      category: 'Headings'
    },
    {
      id: 'heading-5',
      icon: Heading5,
      label: 'Heading 5',
      action: () => handleInsert('heading', 'h5'),
      ariaLabel: 'Insert Heading 5',
      category: 'Headings'
    },
    {
      id: 'heading-6',
      icon: Heading6,
      label: 'Heading 6',
      action: () => handleInsert('heading', 'h6'),
      ariaLabel: 'Insert Heading 6',
      category: 'Headings'
    },
    // Lists section
    {
      id: 'bullet-list',
      icon: List,
      label: 'Bullet List',
      action: () => handleInsert('list', 'ul'),
      ariaLabel: 'Insert Bullet List',
      category: 'Lists'
    },
    {
      id: 'numbered-list',
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => handleInsert('list', 'ol'),
      ariaLabel: 'Insert Numbered List',
      category: 'Lists'
    },
    // Structure section
    {
      id: 'horizontal-rule',
      icon: Minus,
      label: 'Horizontal Rule',
      action: () => handleInsert('horizontalRule'),
      ariaLabel: 'Insert Horizontal Rule',
      category: 'Structure'
    },
    {
      id: 'page-break',
      icon: FileText,
      label: 'Page Break',
      action: () => handleInsert('pageBreak'),
      ariaLabel: 'Insert Page Break',
      category: 'Structure'
    },
    {
      id: 'table',
      icon: Table,
      label: 'Table',
      action: () => handleInsert('table'),
      ariaLabel: 'Insert Table',
      category: 'Structure'
    },
    // Media section
    {
      id: 'image',
      icon: Image,
      label: 'Image',
      action: () => handleInsert('image'),
      ariaLabel: 'Insert Image',
      category: 'Media'
    },
    // Layout section
    {
      id: 'columns',
      icon: Columns,
      label: 'Columns Layout',
      action: () => handleInsert('columns', 2),
      ariaLabel: 'Insert Columns Layout',
      category: 'Layout'
    },
    {
      id: 'collapsible',
      icon: ChevronDown,
      label: 'Collapsible',
      action: () => handleInsert('collapsible'),
      ariaLabel: 'Insert Collapsible Container',
      category: 'Layout'
    },
    // Utility section
    {
      id: 'date',
      icon: Calendar,
      label: 'Date',
      action: () => handleInsert('date'),
      ariaLabel: 'Insert Current Date',
      category: 'Utility'
    },
  ];

  // Group actions by category
  const groupedActions = toolbarActions.reduce((acc, action) => {
    const category = action.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(action);
    return acc;
  }, {});

  // Category order: History first per requirements
  const categoryOrder = ['History', 'Headings', 'Lists', 'Structure', 'Media', 'Layout', 'Utility'];
  
  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  return createPortal(
    <>
      {/* Floating hamburger trigger */}
      <button
        ref={hamburgerRef}
        className="floating-hamburger"
        onPointerDown={(e) => {
          e.preventDefault();
          if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
          toggleOpen();
        }}
        aria-label={isExpanded ? 'Close menu' : isOpen ? 'Expand menu' : 'Open menu'}
        aria-expanded={isOpen || isExpanded}
        title="Insert elements"
        disabled={!activeEditor}
      >
        <Menu size={24} />
      </button>
      
      {/* Slideout toolbar panel */}
      {isOpen && (
        <div 
          ref={toolbarRef}
          className={`slideout-toolbar ${isExpanded ? 'expanded' : 'collapsed'}`}
          role="menu"
          aria-label="Insert menu"
        >
          {/* Header - only shown when expanded */}
          {isExpanded && (
            <div className="slideout-toolbar-header">
              <h3>Insert</h3>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
                  setIsExpanded(false);
                  setIsOpen(false);
                }}
                aria-label="Close insert menu"
                className="close-button"
              >
                <X size={20} />
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="slideout-toolbar-content">
            {categoryOrder.map((categoryName) => {
              const categoryItems = groupedActions[categoryName];
              if (!categoryItems || categoryItems.length === 0) return null;
              
              const isCategoryExpanded = expandedGroups[categoryName];
              
              return (
                <div key={categoryName} className="toolbar-category">
                  {/* Category header - only shown when slideout is expanded */}
                  {isExpanded && (
                    <button 
                      className="toolbar-category-header"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
                        toggleGroup(categoryName);
                      }}
                      aria-expanded={isCategoryExpanded}
                      aria-label={`${isCategoryExpanded ? 'Collapse' : 'Expand'} ${categoryName} section`}
                    >
                      <span className="toolbar-category-label">{categoryName}</span>
                      <ChevronDown 
                        size={16} 
                        className={`category-chevron ${isCategoryExpanded ? 'expanded' : ''}`}
                      />
                    </button>
                  )}
                  
                  {/* Category items - show all in collapsed mode, respect accordion in expanded */}
                  {(!isExpanded || isCategoryExpanded) && (
                    <div className="toolbar-category-items">
                      {categoryItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              console.log(`[SlideoutToolbar] PointerDown: ${item.label} button`);
                              item.action();
                            }}
                            className="toolbar-item"
                            aria-label={item.ariaLabel}
                            role="menuitem"
                            title={item.label}
                          >
                            <Icon size={20} className="toolbar-item-icon" />
                            {/* Label only visible when expanded */}
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
      
      {/* Backdrop overlay when open */}
      {isOpen && (
        <div 
          className="slideout-toolbar-backdrop" 
          onClick={() => {
            setIsExpanded(false);
            setIsOpen(false);
          }} 
        />
      )}
    </>,
    document.body
  );
}
