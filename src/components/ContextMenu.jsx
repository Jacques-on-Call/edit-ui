import { memo } from 'preact/compat';

const ContextMenu = ({ x, y, options, onClose }) => {
  if (x === null || y === null) {
    return null;
  }

  const handleOptionClick = (action) => {
    action();
    onClose();
  };

  return (
    <div
      className="fixed bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <ul>
        {options.map((option, index) => (
          <li key={index}>
            <button
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
              onClick={() => handleOptionClick(option.action)}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default memo(ContextMenu);
