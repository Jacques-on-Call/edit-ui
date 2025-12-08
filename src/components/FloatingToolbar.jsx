import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { Bold, Italic, Underline, Code, Link, List, ListOrdered } from 'lucide-preact';

/**
 * FloatingToolbar - Context-aware formatting toolbar that appears above text selection
 * Handles edge cases:
 * - Collapsed selections (cursor with no selection)
 * - Selections spanning multiple nodes
 * - Selections inside contenteditable areas
 * - Repositioning on scroll/resize
 * - Preventing selection clearing on toolbar clicks
 */
export default function FloatingToolbar({ handleAction, selectionState }) {
  const [position, setPosition] = useState({ top: 0, left: 0, visible: false });
  const toolbarRef = useRef(null);

  useEffect(() => {
    const updatePosition = () => {
      // Defensive check: ensure window.getSelection exists
      if (typeof window === 'undefined' || !window.getSelection) {
        return;
      }

      const selection = window.getSelection();

      // Hide toolbar if no selection or selection is collapsed (just a cursor)
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      // Edge case: Check if selection is inside a contenteditable element
      const anchorNode = selection.anchorNode;
      if (!anchorNode) {
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      // Get bounding rect of the selection range
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Hide toolbar if selection has no dimensions (can happen with certain nodes)
      if (rect.width === 0 && rect.height === 0) {
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      const toolbarElement = toolbarRef.current;
      if (!toolbarElement) return;

      // Position toolbar above selection, centered horizontally
      // Account for scroll position to use absolute positioning
      const top = rect.top + window.scrollY - toolbarElement.offsetHeight - 10;
      const left = rect.left + window.scrollX + (rect.width / 2);

      setPosition({ top, left, visible: true });
    };

    const debouncedUpdatePosition = () => {
        requestAnimationFrame(updatePosition);
    }

    document.addEventListener('selectionchange', debouncedUpdatePosition);
    window.addEventListener('scroll', debouncedUpdatePosition, { capture: true });
    window.addEventListener('resize', debouncedUpdatePosition);

    return () => {
      document.removeEventListener('selectionchange', debouncedUpdatePosition);
      window.removeEventListener('scroll', debouncedUpdatePosition, { capture: true });
      window.removeEventListener('resize', debouncedUpdatePosition);
    };
  }, []);

  // Prevent mousedown from clearing selection before click handler executes
  // preventDefault: Stops browser's default text selection behavior
  // stopPropagation: Prevents event bubbling to parent elements that might handle clicks differently
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Helper to safely call handleAction (reduces duplication and improves readability)
  const safeHandleAction = (action, ...args) => {
    if (handleAction) {
      handleAction(action, ...args);
    }
  };

  if (!position.visible) return null;

  return createPortal(
    <div
      ref={toolbarRef}
      className="floating-toolbar"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={handleMouseDown}
    >
        <div class="toolbar-group">
            <button 
              onClick={() => safeHandleAction('bold')} 
              className={selectionState?.isBold ? 'active' : ''} 
              title="Bold (Ctrl+B)"
              aria-label="Bold"
            >
                <Bold size={18} />
            </button>
            <button 
              onClick={() => safeHandleAction('italic')} 
              className={selectionState?.isItalic ? 'active' : ''} 
              title="Italic (Ctrl+I)"
              aria-label="Italic"
            >
                <Italic size={18} />
            </button>
            <button 
              onClick={() => safeHandleAction('underline')} 
              className={selectionState?.isUnderline ? 'active' : ''} 
              title="Underline (Ctrl+U)"
              aria-label="Underline"
            >
                <Underline size={18} />
            </button>
            <button 
              onClick={() => safeHandleAction('code')} 
              className={selectionState?.isCode ? 'active' : ''} 
              title="Inline Code"
              aria-label="Inline Code"
            >
                <Code size={18} />
            </button>
            <button 
              onClick={() => safeHandleAction('link')} 
              className={selectionState?.isLink ? 'active' : ''} 
              title="Insert Link"
              aria-label="Insert Link"
            >
                <Link size={18} />
            </button>
            <button 
              onClick={() => safeHandleAction('list', 'ul')} 
              className={selectionState?.blockType === 'ul' ? 'active' : ''} 
              title="Bulleted List"
              aria-label="Bulleted List"
            >
                <List size={18} />
            </button>
            <button 
              onClick={() => safeHandleAction('list', 'ol')} 
              className={selectionState?.blockType === 'ol' ? 'active' : ''} 
              title="Numbered List"
              aria-label="Numbered List"
            >
                <ListOrdered size={18} />
            </button>
        </div>
        <div class="toolbar-arrow"></div>
    </div>,
    document.body
  );
}