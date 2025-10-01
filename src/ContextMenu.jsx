import { useEffect, useRef } from 'react';

function ContextMenu({ x, y, file, onClose, onRename, onDelete, onDuplicate, onMove }) {
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

  const handleAction = (action, actionName) => {
    console.log(`[ContextMenu.jsx] Action triggered: ${actionName} for file:`, file.name);
    onClose();
    action(file);
  };

  const menuItemClasses = "px-5 py-3 cursor-pointer text-base text-black transition-colors duration-200 ease-in-out hover:bg-gray-100";
  const menuItemWithBorder = `${menuItemClasses} border-b border-gray-200`;

  return (
    <div className="fixed inset-0 z-[2000]" onClick={onClose}>
      <div
        ref={menuRef}
        className="fixed bg-white rounded-lg shadow-lg py-2 min-w-[180px] z-[2001]"
        style={{ top: `${y}px`, left: `${x}px` }}
      >
        <ul className="list-none m-0 p-0">
          <li className={menuItemWithBorder} onClick={() => handleAction(onRename, 'onRename')}>Rename</li>
          <li className={menuItemWithBorder} onClick={() => handleAction(onDelete, 'onDelete')}>Delete</li>
          {file.type !== 'dir' && (
            <li className={menuItemWithBorder} onClick={() => handleAction(onDuplicate, 'onDuplicate')}>Duplicate</li>
          )}
          <li className={menuItemClasses} onClick={() => handleAction(onMove, 'onMove')}>Move</li>
        </ul>
      </div>
    </div>
  );
}

export default ContextMenu;
