import { memo } from 'preact/compat';
import Icon from './Icon';

const FileTile = memo(({ file, isSelected, onClick, onDoubleClick, onLongPress }) => {
  const tileClasses = `
    relative flex flex-col items-center justify-center
    p-4 rounded-lg
    border-2
    transition-all duration-150 ease-in-out
    cursor-pointer
    h-36
    ${isSelected ? 'bg-blue-100 border-blue-400 shadow-lg' : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'}
  `;

  const handleLongPress = (e) => {
    e.preventDefault();
    if (onLongPress) {
      const coords = { clientX: e.clientX, clientY: e.clientY };
      onLongPress(file, coords);
    }
  };

  return (
    <div
      className={tileClasses}
      onClick={() => onClick(file)}
      onDblClick={() => onDoubleClick(file)}
      onContextMenu={handleLongPress}
    >
      <div className="flex-grow flex items-center justify-center">
        <Icon
          name={file.type === 'dir' ? 'Folder' : 'File'}
          className="w-16 h-16 text-gray-500"
        />
      </div>
      <div className="w-full text-center mt-2">
        <span className="text-sm font-semibold text-gray-700 truncate">{file.name}</span>
      </div>
    </div>
  );
});

export default FileTile;
