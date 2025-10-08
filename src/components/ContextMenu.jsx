import { useEffect, useRef } from 'react';

function ContextMenu({ x, y, file, onClose, onRename, onDelete, onDuplicate, onShare }) {
  const menuRef = useRef(null);

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

  const handleAction = (action) => {
    if (action) {
      action(file);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white shadow-2xl rounded-lg py-2 w-48 z-50 animate-fade-in-fast"
      style={{ top: `${y}px`, left: `${x}px` }}
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
          <li>
            <button onClick={() => handleAction(onDuplicate)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              Duplicate
            </button>
          </li>
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