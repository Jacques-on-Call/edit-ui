import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { useEditor } from '../contexts/EditorContext';
import {
  Heading2, Heading3, Heading4,
  List, ListOrdered, Image, Table, X, Menu,
  Minus, Columns, ChevronDown,
  Undo, Redo, Bold, Italic, Underline, Strikethrough, Code, Link
} from 'lucide-preact';
import { useVisualViewportFix } from '../hooks/useVisualViewportFix';
import './UnifiedLiquidRail.css';

/**
 * Unified Liquid Rail Component
 * Implements a "Smart Rail" state machine:
 * - 'closed': The rail is completely hidden.
 * - 'compact': Appears on text selection, showing only styling icons.
 * - 'expanded': Triggered by hamburger click, showing the full "Add" menu.
 */
export default function UnifiedLiquidRail({ onWidthChange }) {
  const { handleAction, isToolbarInteractionRef, selectionState } = useEditor();

  // ** REFACTORED STATE MODEL **
  // 'mode' controls WHICH tools are shown ('style' or 'add').
  // 'isExpanded' controls HOW they are shown (icons-only or with labels).
  const [mode, setMode] = useState('closed');
  const [isExpanded, setIsExpanded] = useState(false);

  const railRef = useRef(null);
  const clickTimeout = useRef(null);
  const DOUBLE_CLICK_DELAY = 250;

  useVisualViewportFix(railRef);

  const [expandedGroups, setExpandedGroups] = useState({
    'Formatting': true, 'History': true, 'Headings': true, 'Lists': true,
    'Media': true, 'Structure': true, 'Layout': true,
  });

  // Effect to report width changes to the parent
  useEffect(() => {
    let width = 0;
    if (mode !== 'closed') {
      width = isExpanded ? 240 : 56; // Corresponds to --rail-width-expanded and --rail-width-compact
    }
    onWidthChange(width);
  }, [mode, isExpanded, onWidthChange]);

  // Effect to open the 'style' mode on text selection
  useEffect(() => {
    const handleSelection = () => {
      if (isToolbarInteractionRef?.current) return;
      const selection = window.getSelection();
      const hasSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0;

      if (hasSelection && mode === 'closed') {
        setMode('style');
        setIsExpanded(false); // Always start in compact (icons-only) view
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [mode, isToolbarInteractionRef]);

  // Effect to handle closing the rail (Escape key or click outside)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (railRef.current && !railRef.current.contains(event.target)) {
        setMode('closed');
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMode('closed');
    };

    if (mode !== 'closed') {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mode]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
    };
  }, []);

  // ** REFACTORED INTERACTION LOGIC **
  const handleTriggerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;

    // Double-click always toggles expansion state
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      setIsExpanded(prev => !prev);
      // If closed, a double-click should also open it (default to 'add' mode)
      if (mode === 'closed') {
        setMode('add');
      }
      return;
    }

    // Single-click logic
    clickTimeout.current = setTimeout(() => {
      clickTimeout.current = null;
      if (mode === 'closed') {
        setMode('style'); // From closed, single-click opens style mode
        setIsExpanded(false);
      } else {
        // If already open, single-click toggles between 'style' and 'add' modes
        setMode(prev => prev === 'style' ? 'add' : 'style');
      }
    }, DOUBLE_CLICK_DELAY);
  };

  const onAction = (e, action, payload) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
    handleAction(action, payload);
    // Action no longer closes the rail, giving user more control.
  };

  const toggleGroup = (e, groupName) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Define actions for different modes
  const styleActions = [
    { id: 'bold', icon: Bold, label: 'Bold', action: 'bold', category: 'Formatting', active: selectionState?.isBold },
    { id: 'italic', icon: Italic, label: 'Italic', action: 'italic', category: 'Formatting', active: selectionState?.isItalic },
    { id: 'underline', icon: Underline, label: 'Underline', action: 'underline', category: 'Formatting', active: selectionState?.isUnderline },
    { id: 'strikethrough', icon: Strikethrough, label: 'Strike', action: 'strikethrough', category: 'Formatting', active: selectionState?.isStrikethrough },
    { id: 'code', icon: Code, label: 'Code', action: 'code', category: 'Formatting', active: selectionState?.isCode },
    { id: 'link', icon: Link, label: 'Link', action: 'link', category: 'Formatting' },
    { id: 'heading-2', icon: Heading2, label: 'H2', action: 'heading', payload: 'h2', category: 'Headings', active: selectionState?.blockType === 'h2' },
    { id: 'heading-3', icon: Heading3, label: 'H3', action: 'heading', payload: 'h3', category: 'Headings', active: selectionState?.blockType === 'h3' },
    { id: 'heading-4', icon: Heading4, label: 'H4', action: 'heading', payload: 'h4', category: 'Headings', active: selectionState?.blockType === 'h4' },
    { id: 'bullet-list', icon: List, label: 'Bullet List', action: 'list', payload: 'ul', category: 'Lists', active: selectionState?.blockType === 'ul' },
    { id: 'numbered-list', icon: ListOrdered, label: 'Numbered List', action: 'list', payload: 'ol', category: 'Lists', active: selectionState?.blockType === 'ol' },
  ];

  const addActions = [
    { id: 'undo', icon: Undo, label: 'Undo', action: 'undo', category: 'History' },
    { id: 'redo', icon: Redo, label: 'Redo', action: 'redo', category: 'History' },
    { id: 'image', icon: Image, label: 'Image', action: 'image', category: 'Media' },
    { id: 'table', icon: Table, label: 'Table', action: 'table', category: 'Structure' },
    { id: 'horizontal-rule', icon: Minus, label: 'Divider', action: 'horizontalRule', category: 'Structure' },
    { id: 'columns', icon: Columns, label: 'Columns', action: 'columns', payload: 2, category: 'Layout' },
  ];

  const getGroupedActions = (actions) => actions.reduce((acc, action) => {
    const cat = action.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(action);
    return acc;
  }, {});

  const styleGroups = getGroupedActions(styleActions);
  const addGroups = getGroupedActions(addActions);

  const categoryOrder = ['Formatting', 'Headings', 'Lists', 'History', 'Media', 'Structure', 'Layout'];

  const renderActions = (groupedItems, categoryName) => {
    const categoryItems = groupedItems[categoryName];
    if (!categoryItems) return null;

    return categoryItems.map((item) => {
      const Icon = item.icon;
      return (
        <button
          key={item.id}
          onPointerDown={(e) => onAction(e, item.action, item.payload)}
          className={`rail-item ${item.active ? 'active' : ''}`}
          title={item.label}
        >
          <Icon size={20} className="rail-item-icon" />
          {isExpanded && <span className="rail-item-label">{item.label}</span>}
        </button>
      );
    });
  };

  const railClassName = `unified-liquid-rail mode-${mode} ${isExpanded ? 'expanded' : 'compact'}`;

  // Always render within a portal to ensure consistent positioning
  return createPortal(
    <>
      <div
        ref={railRef}
        className={railClassName}
        onPointerDown={(e) => {
          if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
        }}
      >
        {/* The hamburger is now always inside the main container */}
        <button
          className={`rail-hamburger ${mode !== 'closed' ? 'active' : ''}`}
          onPointerDown={handleTriggerClick}
          aria-label="Toggle menu"
          aria-expanded={mode !== 'closed'}
        >
          <Menu size={24} />
        </button>

        {/* Only render content when not closed */}
        {mode !== 'closed' && (
          <div className="rail-content">
            {isExpanded && (
              <div className="rail-header">
                <h3>{mode === 'style' ? 'Styling' : 'Add Content'}</h3>
                <button onPointerDown={(e) => { e.preventDefault(); setMode('closed'); }} className="rail-close-btn" >
                  <X size={20} />
                </button>
              </div>
            )}

            <div className="rail-scroll-area">
              {mode === 'style' && (
                <div className="rail-items-grid">
                  {renderActions(styleGroups, 'Formatting')}
                  {renderActions(styleGroups, 'Headings')}
                  {renderActions(styleGroups, 'Lists')}
                </div>
              )}

              {mode === 'add' && !isExpanded && (
                <div className="rail-items-grid">
                  {categoryOrder.map(categoryName => renderActions(addGroups, categoryName))}
                </div>
              )}

              {mode === 'add' && isExpanded && categoryOrder.map(categoryName => {
                 const items = addGroups[categoryName];
                 if (!items) return null;
                 const isCategoryExpanded = expandedGroups[categoryName];

                 return (
                   <div key={categoryName} className="rail-category">
                     <button className="rail-category-header" onPointerDown={(e) => toggleGroup(e, categoryName)}>
                       <span className="rail-category-label">{categoryName}</span>
                       <ChevronDown size={16} className={`rail-chevron ${isCategoryExpanded ? 'expanded' : ''}`} />
                     </button>
                     {isCategoryExpanded && (
                       <div className="rail-items-grid">
                          {renderActions(addGroups, categoryName)}
                       </div>
                     )}
                   </div>
                 );
              })}
            </div>
          </div>
        )}
      </div>

      {isExpanded && mode !== 'closed' && (
        <div className="rail-backdrop" onPointerDown={(e) => { e.preventDefault(); setMode('closed'); }} />
      )}
    </>,
    document.body
  );
}
