import { useEffect, useRef, useState } from 'react';

function ContextMenu({ x, y, file, onClose, onRename, onDelete, onDuplicate, onShare, onAssignLayout }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ x, y });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Clamp position so the menu stays within viewport
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;

    // Allow the element to render once so width/height are measurable
    // Temporarily position at given x/y
    const PADDING = 8;
    const viewportW = window.innerWidth || document.documentElement.clientWidth;
    const viewportH = window.innerHeight || document.documentElement.clientHeight;

    const rect = el.getBoundingClientRect();
    const width = rect.width || 0;
    const height = rect.height || 0;

    let newX = x;
    let newY = y;

    if (newX + width + PADDING > viewportW) {
      newX = Math.max(PADDING, viewportW - width - PADDING);
    } else {
      newX = Math.max(PADDING, newX);
    }

    if (newY + height + PADDING > viewportH) {
      newY = Math.max(PADDING, viewportH - height - PADDING);
    } else {
      newY = Math.max(PADDING, newY);
    }

    setPos({ x: newX, y: newY });
    setReady(true);
  }, [x, y]);

  const handleAction = (action) => {
    if (action) {
      action(file);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      data-testid="context-menu"
      className="fixed bg-white shadow-2xl rounded-lg py-2 w-48 z-50 animate-fade-in-fast"
      style={{
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        visibility: ready ? 'visible' : 'hidden',
      }}
    >
      <ul>
        <li>
          <button onClick={() => handleAction(onRename)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Rename
          </button>
        </li>
        <li>
          <button onClick={() => handleAction(onDelete)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700">
            Delete
          </button>
        </li>
        {file.type !== 'dir' && (
          <>
            <li>
              <button onClick={() => handleAction(onDuplicate)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                Duplicate
              </button>
            </li>
            <div className="border-t my-1"></div>
            <li>
              <button onClick={() => handleAction(onAssignLayout)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                Assign Layout
              </button>
            </li>
          </>
        )}
        <li>
          <button onClick={() => handleAction(onShare)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Share
          </button>
        </li>
      </ul>
    </div>
  );
}

export default ContextMenu;
