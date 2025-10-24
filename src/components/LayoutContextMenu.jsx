import { useEffect, useRef, useState } from 'react';

function LayoutContextMenu({ x, y, layout, onClose, onRename, onDelete, onDuplicate, onShare, onToggleAstro, onAssignToFolder }) {
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
      action(layout);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      data-testid="layout-context-menu"
      className="fixed bg-white shadow-2xl rounded-lg py-2 w-56 z-50 animate-fade-in-fast"
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
        <li>
          <button
            onClick={() => handleAction(onDuplicate)}
            className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
            disabled
          >
            Duplicate (Coming Soon)
          </button>
        </li>
        <div className="border-t my-1"></div>
        <li>
          <button onClick={() => handleAction(onToggleAstro)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Toggle Astro
          </button>
        </li>
        <li>
          <button onClick={() => handleAction(onAssignToFolder)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Assign to Folder
          </button>
        </li>
        <li>
          <button onClick={() => handleAction(onShare)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            Share
          </button>
        </li>
      </ul>
    </div>
  );
}

export default LayoutContextMenu;
