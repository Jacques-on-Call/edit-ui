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

const toolbarActions = [
    { id: 'bold', icon: Bold, label: 'Bold', action: 'bold', category: 'Formatting' },
    { id: 'italic', icon: Italic, label: 'Italic', action: 'italic', category: 'Formatting' },
    { id: 'underline', icon: Underline, label: 'Underline', action: 'underline', category: 'Formatting' },
    { id: 'strikethrough', icon: Strikethrough, label: 'Strike', action: 'strikethrough', category: 'Formatting' },
    { id: 'code', icon: Code, label: 'Code', action: 'code', category: 'Formatting' },
    { id: 'link', icon: Link, label: 'Link', action: 'link', category: 'Formatting' },
    { id: 'heading-2', icon: Heading2, label: 'H2', action: 'heading', payload: 'h2', category: 'Headings' },
    { id: 'heading-3', icon: Heading3, label: 'H3', action: 'heading', payload: 'h3', category: 'Headings' },
    { id: 'heading-4', icon: Heading4, label: 'H4', action: 'heading', payload: 'h4', category: 'Headings' },
    { id: 'bullet-list', icon: List, label: 'Bullet List', action: 'list', payload: 'ul', category: 'Lists' },
    { id: 'numbered-list', icon: ListOrdered, label: 'Numbered List', action: 'list', payload: 'ol', category: 'Lists' },
    { id: 'undo', icon: Undo, label: 'Undo', action: 'undo', category: 'History' },
    { id: 'redo', icon: Redo, label: 'Redo', action: 'redo', category: 'History' },
    { id: 'image', icon: Image, label: 'Image', action: 'image', category: 'Media' },
    { id: 'table', icon: Table, label: 'Table', action: 'table', category: 'Structure' },
    { id: 'horizontal-rule', icon: Minus, label: 'Divider', action: 'horizontalRule', category: 'Structure' },
    { id: 'columns', icon: Columns, label: 'Columns', action: 'columns', payload: 2, category: 'Layout' },
];

const styleCategories = ['Formatting', 'Headings'];
const addCategories = ['History', 'Lists', 'Media', 'Structure', 'Layout'];
const styleActions = toolbarActions.filter(a => styleCategories.includes(a.category));
const addActions = toolbarActions.filter(a => addCategories.includes(a.category));

export default function UnifiedLiquidRail({ onWidthChange }) {
  const { handleAction, isToolbarInteractionRef, selectionState } = useContext(EditorContext);

  const [mode, setMode] = useState('style'); // 'style', 'add'
  const [isOpen, setOpen] = useState(false);
  const [isExpanded, setExpanded] = useState(false);

  const railRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const hamburgerRef = useRef(null);
  const lastTapRef = useRef(0);

  // Pass all relevant refs to the hook for viewport management
  useVisualViewportFix([hamburgerRef, railRef, scrollAreaRef]);

  useEffect(() => {
    onWidthChange?.(isOpen ? (isExpanded ? 240 : 56) : 0);
  }, [isOpen, isExpanded, onWidthChange]);

  // EFFECT 1: Handle Text Selection Changes
  useEffect(() => {
    const handleSelectionChange = () => {
      if (isToolbarInteractionRef.current) return;
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        setOpen(true);
        setMode('style');
      } else {
        // Only auto-close if the user was in style mode.
        // This prevents a manually opened 'add' panel from closing.
        if (mode === 'style') {
          setOpen(false);
        }
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [mode, isToolbarInteractionRef]);

  // EFFECT 2: Handle Clicking Outside to Close
  useEffect(() => {
    const handlePointerUp = (e) => {
      // If the click is inside the rail or on the hamburger, do nothing.
      if (railRef.current?.contains(e.target) || hamburgerRef.current?.contains(e.target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('pointerup', handlePointerUp);
    return () => document.removeEventListener('pointerup', handlePointerUp);
  }, []);

  // HANDLER: Hamburger Click Logic
  const onHamburgerPointerDown = (e) => {
    e.preventDefault();
    isToolbarInteractionRef.current = true;

    const now = Date.now();
    if (now - lastTapRef.current < 300) { // Double-tap
      setExpanded(prev => !prev);
    } else { // Single-tap
      if (!isOpen) {
        setOpen(true);
        setMode('add');
      } else {
        setMode(prev => prev === 'add' ? 'style' : 'add');
      }
    }
    lastTapRef.current = now;
  };

  const scheduleClearInteractionRef = () => {
    setTimeout(() => { isToolbarInteractionRef.current = false; }, 100);
  };

  const renderActions = (actions) => {
    return actions.map((item) => {
      const Icon = item.icon;
      const isActive = (item.action === 'heading' && selectionState?.blockType === item.payload) ||
                       (selectionState?.[`is${item.label}`]);
      return (
        <button
          key={item.id}
          className={`rail-item ${isActive ? 'active' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault();
            isToolbarInteractionRef.current = true;
            handleAction(item.action, item.payload);
          }}
        >
          <Icon size={24} className="rail-item-icon" />
          <span className="rail-item-label">{item.label}</span>
        </button>
      );
    });
  };

  const railClassName = `unified-liquid-rail ${isOpen ? 'open' : ''} ${isExpanded ? 'expanded' : 'compact'}`;

  return createPortal(
    <>
      <button
        ref={hamburgerRef}
        className="rail-hamburger-trigger"
        onPointerDown={onHamburgerPointerDown}
        onPointerUp={scheduleClearInteractionRef}
      >
        <Menu size={24} />
      </button>
      <div ref={railRef} className={railClassName}>
        <div ref={scrollAreaRef} className="rail-scroll-area">
          {mode === 'style' ? renderActions(styleActions) : renderActions(addActions)}
        </div>
      </div>
    </>,
    document.body
  );
}
