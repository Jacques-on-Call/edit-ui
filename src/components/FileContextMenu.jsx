import { useEffect, useRef } from 'preact/hooks';
import Icon from './Icon';

const MENU_ITEM_CLASS = "flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer";

export function FileContextMenu({ x, y, file, onClose, onAction }) {
  const menuRef = useRef(null);

  // Close the menu if the user clicks outside of it
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
    onAction(action, file);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50"
      style={{ top: y, left: x }}
    >
      <div className="py-1">
        <div className="px-4 py-2 border-b border-gray-600">
          <p className="text-sm font-semibold text-white truncate">{file.name}</p>
          <p className="text-xs text-gray-400 truncate">{file.type === 'dir' ? 'Folder' : 'File'}</p>
        </div>
        {file.type === 'file' && (
          <div onClick={() => handleAction('duplicate')} className={MENU_ITEM_CLASS}>
            <Icon name="Copy" className="w-4 h-4 mr-3" />
            <span>Duplicate</span>
          </div>
        )}
        <div onClick={() => handleAction('rename')} className={MENU_ITEM_CLASS}>
          <Icon name="Pencil" className="w-4 h-4 mr-3" />
          <span>Rename</span>
        </div>
        <div onClick={() => handleAction('move')} className={MENU_ITEM_CLASS}>
          <Icon name="Move" className="w-4 h-4 mr-3" />
          <span>Move</span>
        </div>
        <div onClick={() => handleAction('delete')} className={`${MENU_ITEM_CLASS} text-red-400 hover:bg-red-500 hover:text-white`}>
          <Icon name="Trash2" className="w-4 h-4 mr-3" />
          <span>Delete</span>
        </div>
      </div>
    </div>
  );
}
