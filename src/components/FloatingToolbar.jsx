import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { Bold, Italic, Underline, Code, Link, List, ListOrdered } from 'lucide-preact';

export default function FloatingToolbar({ handleAction, selectionState }) {
  const [position, setPosition] = useState({ top: 0, left: 0, visible: false });
  const toolbarRef = useRef(null);

  useEffect(() => {
    const updatePosition = () => {
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      const toolbarElement = toolbarRef.current;
      if (!toolbarElement) return;

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

  const handleMouseDown = (e) => e.preventDefault();

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
            <button onClick={() => handleAction('bold')} className={selectionState?.isBold ? 'active' : ''} title="Bold">
                <Bold size={18} />
            </button>
            <button onClick={() => handleAction('italic')} className={selectionState?.isItalic ? 'active' : ''} title="Italic">
                <Italic size={18} />
            </button>
            <button onClick={() => handleAction('underline')} className={selectionState?.isUnderline ? 'active' : ''} title="Underline">
                <Underline size={18} />
            </button>
            <button onClick={() => handleAction('code')} className={selectionState?.isCode ? 'active' : ''} title="Code">
                <Code size={18} />
            </button>
            <button onClick={() => handleAction('link')} className={selectionState?.isLink ? 'active' : ''} title="Link">
                <Link size={18} />
            </button>
            <button onClick={() => handleAction('list', 'ul')} className={selectionState?.blockType === 'ul' ? 'active' : ''} title="Bulleted List">
                <List size={18} />
            </button>
            <button onClick={() => handleAction('list', 'ol')} className={selectionState?.blockType === 'ol' ? 'active' : ''} title="Numbered List">
                <ListOrdered size={18} />
            </button>
        </div>
        <div class="toolbar-arrow"></div>
    </div>,
    document.body
  );
}