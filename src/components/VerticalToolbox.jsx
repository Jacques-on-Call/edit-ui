import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { 
  Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, Image, Table, X,
  Minus, FileText, Calendar, Columns, ChevronDown,
  Undo, Redo
} from 'lucide-preact';
import HamburgerTrigger from './HamburgerTrigger';

/**
 * VerticalToolbox - Slide-out left sidebar for insert actions
 * 
 * Features:
 * - Block headings: H2, H3, H4, H5, H6
 * - Lists: Bullet List, Numbered List
 * - Media & Structure: Image, Table, Horizontal Rule, Page Break
 * - Layout: Columns Layout, Collapsible Container
 * - Utility: Date insertion, Undo, Redo
 * - Collapsible category groups (accordion) to reduce height on mobile
 * 
 * Includes hamburger trigger button in top-left corner
 * Auto-closes after action selection
 * Full keyboard accessibility with Escape key support
 */
export default function VerticalToolbox({ handleAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const toolboxRef = useRef(null);
  // Track which category groups are expanded (accordion pattern)
  // Default: History expanded (at top), others collapsed on mobile
  const [expandedGroups, setExpandedGroups] = useState({
    'History': true, // Start with History expanded since it's most important
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
    // Media & Structure section
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
      id: 'image',
      icon: Image,
      label: 'Image',
      action: () => handleInsert('image'),
      ariaLabel: 'Insert Image',
      category: 'Media'
    },
    {
      id: 'table',
      icon: Table,
      label: 'Table',
      action: () => handleInsert('table'),
      ariaLabel: 'Insert Table',
      category: 'Structure'
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
    // Undo/Redo section (only in vertical toolbox per requirements)
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
  ];

  // Group actions by category for better organization
  const groupedActions = toolboxActions.reduce((acc, action) => {
    const category = action.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(action);
    return acc;
  }, {});

  // History should be first per requirements
  const categoryOrder = ['History', 'Headings', 'Lists', 'Structure', 'Media', 'Layout', 'Utility'];
  
  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

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
          {categoryOrder.map((categoryName) => {
            const categoryItems = groupedActions[categoryName];
            if (!categoryItems || categoryItems.length === 0) return null;
            
            const isExpanded = expandedGroups[categoryName];
            
            return (
              <div key={categoryName} className="toolbox-category">
                <button 
                  className="toolbox-category-header"
                  onClick={() => toggleGroup(categoryName)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${categoryName} section`}
                >
                  <span className="toolbox-category-label">{categoryName}</span>
                  <ChevronDown 
                    size={16} 
                    className={`category-chevron ${isExpanded ? 'expanded' : ''}`}
                  />
                </button>
                {isExpanded && (
                  <div className="toolbox-category-items">
                    {categoryItems.map((item) => {
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
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Backdrop overlay when open */}
      {isOpen && <div className="vertical-toolbox-backdrop" onClick={toggleOpen} />}
    </>
  );
}
