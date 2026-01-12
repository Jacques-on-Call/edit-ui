import { h } from 'preact';
import { useState, useEffect, useRef, useContext } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { EditorContext } from '../contexts/EditorContext';
import {
  Heading2, Heading3, Heading4,
  List, ListOrdered, Image, Table, X, Menu,
  Minus, Columns, ChevronDown,
  Undo, Redo, Bold, Italic, Underline, Strikethrough, Code, Link
} from 'lucide-preact';
import { useVisualViewportFix } from '../hooks/useVisualViewportFix';
import './UnifiedLiquidRail.css';

// Combined and categorized actions as per the specification
const toolbarActions = [
    // Formatting
    { id: 'bold', icon: Bold, label: 'Bold', action: 'bold', category: 'Formatting' },
    { id: 'italic', icon: Italic, label: 'Italic', action: 'italic', category: 'Formatting' },
    { id: 'underline', icon: Underline, label: 'Underline', action: 'underline', category: 'Formatting' },
    { id: 'strikethrough', icon: Strikethrough, label: 'Strike', action: 'strikethrough', category: 'Formatting' },
    { id: 'code', icon: Code, label: 'Code', action: 'code', category: 'Formatting' },
    { id: 'link', icon: Link, label: 'Link', action: 'link', category: 'Formatting' },
    // Headings
    { id: 'heading-2', icon: Heading2, label: 'H2', action: 'heading', payload: 'h2', category: 'Headings' },
    { id: 'heading-3', icon: Heading3, label: 'H3', action: 'heading', payload: 'h3', category: 'Headings' },
    { id: 'heading-4', icon: Heading4, label: 'H4', action: 'heading', payload: 'h4', category: 'Headings' },
    // Lists
    { id: 'bullet-list', icon: List, label: 'Bullet List', action: 'list', payload: 'ul', category: 'Lists' },
    { id: 'numbered-list', icon: ListOrdered, label: 'Numbered List', action: 'list', payload: 'ol', category: 'Lists' },
    // History
    { id: 'undo', icon: Undo, label: 'Undo', action: 'undo', category: 'History' },
    { id: 'redo', icon: Redo, label: 'Redo', action: 'redo', category: 'History' },
    // Media
    { id: 'image', icon: Image, label: 'Image', action: 'image', category: 'Media' },
    // Structure
    { id: 'table', icon: Table, label: 'Table', action: 'table', category: 'Structure' },
    { id: 'horizontal-rule', icon: Minus, label: 'Divider', action: 'horizontalRule', category: 'Structure' },
    // Layout
    { id: 'columns', icon: Columns, label: 'Columns', action: 'columns', payload: 2, category: 'Layout' },
];

const styleCategories = ['Formatting', 'Headings', 'Lists'];
const addCategories = ['History', 'Media', 'Structure', 'Layout'];

const styleActions = toolbarActions.filter(a => styleCategories.includes(a.category));
const addActions = toolbarActions.filter(a => addCategories.includes(a.category));


export default function UnifiedLiquidRail({ onWidthChange }) {
  const { handleAction, isToolbarInteractionRef, selectionState } = useContext(EditorContext);

  // State machine as per the specification
  const [mode, setMode] = useState('idle'); // 'idle', 'style', 'add'
  const [isOpen, setOpen] = useState(false);
  const [isExpanded, setExpanded] = useState(false);

  const railRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const lastTapRef = useRef(0);
  const isScrollingRef = useRef(false);

  // Custom hook to handle virtual keyboard on mobile
  useVisualViewportFix(railRef, scrollAreaRef);

  // Effect to report width changes to the parent
  useEffect(() => {
    let width = 0;
    if (isOpen) {
      width = isExpanded ? 240 : 56;
    }
    if (onWidthChange) {
      onWidthChange(width);
    }
  }, [isOpen, isExpanded, onWidthChange]);

  // Refined selection handler for reliability
  useEffect(() => {
    const onSelectionChange = () => {
      // If the user is actively scrolling the main window or interacting with the toolbar, do nothing.
      if (isScrollingRef.current || (isToolbarInteractionRef && isToolbarInteractionRef.current)) return;

      const sel = window.getSelection();
      // Show the toolbar if there's a meaningful text selection.
      if (sel && sel.toString().trim().length > 0) {
        setMode('style');
        setOpen(true);
        setExpanded(false);
      } else {
        // Hide the toolbar if the selection is lost, but only if it's in 'style' mode
        // and not manually expanded to show the 'add' tools.
        if (mode === 'style' && !isExpanded) {
          setOpen(false);
          setMode('idle');
        }
      }
      // REMOVED: The closing logic is now handled exclusively by click-outside and Escape key.
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [mode, isExpanded, isToolbarInteractionRef]); // Dependencies are still important

  // Global scroll handler to prevent toolbar pop-up while scrolling the page
  useEffect(() => {
    let scrollTimeout;
    const onScroll = () => {
      isScrollingRef.current = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => { isScrollingRef.current = false; }, 150);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Smarter click/tap outside handler
  useEffect(() => {
    const pointerStart = { x: 0, y: 0 };
    let isDragging = false;

    const handlePointerDown = (e) => {
      pointerStart.x = e.clientX;
      pointerStart.y = e.clientY;
      isDragging = false;
    };

    const handlePointerMove = (e) => {
        if (isDragging) return;
        const deltaX = Math.abs(e.clientX - pointerStart.x);
        const deltaY = Math.abs(e.clientY - pointerStart.y);
        // If the user moves more than a few pixels, consider it a drag/scroll, not a tap.
        if (deltaX > 5 || deltaY > 5) {
            isDragging = true;
        }
    };

    const handlePointerUp = (e) => {
      // If it was a drag, or if the tap is inside the toolbar, do nothing.
      if (isDragging || (railRef.current && railRef.current.contains(e.target))) {
        return;
      }
      // Otherwise, it's a clean tap outside, so close the toolbar.
      setOpen(false);
      setExpanded(false);
      setMode('idle');
    };

     const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setExpanded(false);
        setMode('idle');
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Universal hamburger handler
  const onHamburgerPointerDown = (e) => {
    e.preventDefault();
    if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;

    const now = Date.now();
    const isTextSelected = window.getSelection()?.toString().trim().length > 0;

    if (now - lastTapRef.current < 300) { // Double-tap always toggles expand
      setExpanded(prev => !prev);
    } else { // Single-tap logic
      if (isTextSelected) {
        // If text is selected, the hamburger's only job is to expand/collapse.
        setExpanded(prev => !prev);
      } else {
        // If no text is selected, the hamburger opens the 'add' panel.
        setMode('add');
        setOpen(prev => !prev); // Toggle open state
        setExpanded(false);     // Always start compact
      }
    }
    lastTapRef.current = now;
  };

  const scheduleClearInteractionRef = () => {
      setTimeout(() => {
          if (isToolbarInteractionRef) isToolbarInteractionRef.current = false;
      }, 100);
  };

  const isInsertAction = (action) => ['image', 'table', 'horizontalRule', 'columns'].includes(action);

  const renderActions = (actions) => {
    return actions.map((item) => {
      const Icon = item.icon;
      const isActive = (item.action === 'heading' && selectionState?.blockType === item.payload) ||
                       (item.action === 'list' && selectionState?.blockType === item.payload) ||
                       (item.action === 'bold' && selectionState?.isBold) ||
                       (item.action === 'italic' && selectionState?.isItalic) ||
                       (item.action === 'underline' && selectionState?.isUnderline) ||
                       (item.action === 'strikethrough' && selectionState?.isStrikethrough) ||
                       (item.action === 'code' && selectionState?.isCode);
      return (
        <button
          key={item.id}
          role="button"
          aria-label={item.label}
          title={item.label}
          tabindex="0"
          className={`rail-item ${isActive ? 'active' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault();
            if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
          }}
          onPointerUp={scheduleClearInteractionRef}
          onPointerCancel={scheduleClearInteractionRef}
          onClick={(e) => {
            e.preventDefault();
            handleAction(item.action, item.payload);
            if (isInsertAction(item.action)) {
              setOpen(false);
              setMode('idle');
            }
          }}
        >
          <Icon size={24} className="rail-item-icon" />
          <span className="rail-item-label">{item.label}</span>
        </button>
      );
    });
  }

  if (window.__EASY_SEO_TOOLBAR_DEBUG__) {
    console.log({ mode, isOpen, isExpanded, isInteracting: isToolbarInteractionRef?.current });
  }

  const railClassName = `unified-liquid-rail ${isOpen ? 'open' : 'closed'} ${isExpanded ? 'expanded' : 'compact'}`;

  const railContent = (
    <div ref={railRef} className={railClassName} role="toolbar">
        <button
            className="rail-hamburger"
            onPointerDown={onHamburgerPointerDown}
            onPointerUp={scheduleClearInteractionRef}
            onPointerCancel={scheduleClearInteractionRef}
            aria-label="Toggle toolbar"
        >
            <Menu size={24} />
        </button>

        <div className="rail-scroll-area">
            {isOpen && mode === 'style' && renderActions(styleActions)}
            {isOpen && mode === 'add' && renderActions(addActions)}
        </div>
    </div>
  );
}
