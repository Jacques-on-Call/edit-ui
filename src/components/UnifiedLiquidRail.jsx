import { h } from 'preact';
import { useState, useEffect, useRef, useContext } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { EditorContext } from '../contexts/EditorContext';
import {
  Heading2, Heading3, Heading4,
  List, ListOrdered, Image, Table, X, Menu,
  Minus, Columns, ChevronDown,
  Undo, Redo, Bold, Italic, Underline, Strikethrough, Code, Link,
  Type, Plus
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
    // Undo and Redo have been moved to BottomActionBar
    { id: 'image', icon: Image, label: 'Image', action: 'image', category: 'Media' },
    { id: 'table', icon: Table, label: 'Table', action: 'table', category: 'Structure' },
    { id: 'horizontal-rule', icon: Minus, label: 'Divider', action: 'horizontalRule', category: 'Structure' },
    { id: 'columns', icon: Columns, label: 'Columns', action: 'columns', payload: 2, category: 'Layout' },
];

const styleCategories = ['Formatting', 'Headings', 'Lists'];
const addCategories = ['Media', 'Structure', 'Layout'];
const styleActions = toolbarActions.filter(a => styleCategories.includes(a.category));
const addActions = toolbarActions.filter(a => addCategories.includes(a.category));

export default function UnifiedLiquidRail({ onWidthChange }) {
  const { handleAction, isToolbarInteractionRef, selectionState } = useContext(EditorContext);

  // 'style', 'add', or null (closed)
  const [activeMode, setActiveMode] = useState(null);

  const railRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const triggerGroupRef = useRef(null); // Ref for the new container
  const lastTapRef = useRef(0);

  // Pass refs to viewport hook to ensure they stay on screen
  useVisualViewportFix([triggerGroupRef, railRef]);

  const isOpen = activeMode !== null;

  // Notify parent of width changes
  useEffect(() => {
    onWidthChange?.(isOpen ? 44 : 0);
  }, [isOpen, onWidthChange]);

  // Handle Text Selection Changes
  useEffect(() => {
    const handleSelectionChange = () => {
      if (isToolbarInteractionRef.current) return;
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        setActiveMode('style');
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [isToolbarInteractionRef]);

  // Handle outside clicks
  useEffect(() => {
    const handlePointerUp = (e) => {
      if (
        railRef.current?.contains(e.target) ||
        triggerGroupRef.current?.contains(e.target)
      ) {
        return;
      }
      setActiveMode(null); // Close
    };
    document.addEventListener('pointerup', handlePointerUp);
    return () => document.removeEventListener('pointerup', handlePointerUp);
  }, []);

  // Mode Toggle Logic
  const toggleMode = (mode, e) => {
    e.preventDefault();
    isToolbarInteractionRef.current = true;

    // If clicking the active mode, close it. Otherwise switch to it.
    setActiveMode(prev => (prev === mode ? null : mode));

    lastTapRef.current = Date.now();
  };

  const scheduleClearInteractionRef = () => {
    isToolbarInteractionRef.current = false;
  };

  const currentActions = activeMode === 'style' ? styleActions : addActions;

  return createPortal(
    <>
      {/* THE DOUBLE-DECKER TRIGGER */}
      <div
        ref={triggerGroupRef}
        className={`rail-trigger-group ${isOpen ? 'is-open' : ''}`}
      >
        <button
          className={`rail-btn ${activeMode === 'style' ? 'active' : ''}`}
          onPointerDown={(e) => toggleMode('style', e)}
          onPointerUp={scheduleClearInteractionRef}
        >
          <Type size={22} />
        </button>

        <button
          className={`rail-btn ${activeMode === 'add' ? 'active' : ''}`}
          onPointerDown={(e) => toggleMode('add', e)}
          onPointerUp={scheduleClearInteractionRef}
        >
          {/* If 'add' is open, show X to close, otherwise show Plus */}
          {activeMode === 'add' ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      {/* THE RAIL */}
      <div
        ref={railRef}
        className={`unified-liquid-rail ${isOpen ? 'open' : ''} compact`}
      >
        <div ref={scrollAreaRef} className="rail-scroll-area">
          {isOpen && currentActions.map((item) => {
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
                 onPointerUp={scheduleClearInteractionRef}
               >
                 <Icon size={22} className="rail-item-icon" />
                 <span className="rail-item-label">{item.label}</span>
               </button>
             );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}
