import { memo } from 'preact/compat';
import Icon from './Icon';

const ContextMenu = memo(({ x, y, file, onClose, onRename, onDelete }) => {
  const menuStyle = {
    top: `${y}px`,
    left: `${x}px`,
  };

  const handleAction = (action) => {
    action(file);
    onClose();
  };

  return (
    <div
      className="fixed top-0 left-0 w-full h-full z-50"
      onClick={onClose}
    >
      <div
        style={menuStyle}
        className="absolute bg-white rounded-md shadow-lg border border-gray-200 w-48 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <ul className="py-1">
          <li>
            <button
              onClick={() => handleAction(onRename)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Icon name="edit" className="mr-3" size={16} />
              Rename
            </button>
          </li>
          <li>
            <button
              onClick={() => handleAction(onDelete)}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <Icon name="trash" className="mr-3" size={16} />
              Delete
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
});

export default ContextMenu;
