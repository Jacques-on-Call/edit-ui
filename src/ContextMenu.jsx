import { useEffect, useRef } from 'react';

function ContextMenu({ x, y, file, onClose, onRename, onDelete, onDuplicate, onShare }) {
  const menuRef = useRef(null);

  // Close menu if clicking outside
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
    <div className="fixed inset-0 z-[2000]" onClick={onClose}>
      <div
        ref={menuRef}
        className="fixed bg-white rounded-lg shadow-xl py-2 min-w-[180px] z-[2001]"
        style={{ top: `${y}px`, left: `${x}px` }}
      >
        <ul className="list-none m-0 p-0">
          <li className="px-5 py-3 cursor-pointer text-base text-gray-800 transition-colors duration-200 hover:bg-gray-100 border-b border-gray-100 last:border-b-0" onClick={() => handleAction(onRename)}>Rename</li>
          <li className="px-5 py-3 cursor-pointer text-base text-gray-800 transition-colors duration-200 hover:bg-gray-100 border-b border-gray-100 last:border-b-0" onClick={() => handleAction(onDelete)}>Delete</li>
          {file.type !== 'dir' && (
            <li className="px-5 py-3 cursor-pointer text-base text-gray-800 transition-colors duration-200 hover:bg-gray-100 border-b border-gray-100 last:border-b-0" onClick={() => handleAction(onDuplicate)}>Duplicate</li>
          )}
          <li className="px-5 py-3 cursor-pointer text-base text-gray-800 transition-colors duration-200 hover:bg-gray-100" onClick={() => handleAction(onShare)}>Share</li>
        </ul>
      </div>
    </div>
  );
}

export default ContextMenu;