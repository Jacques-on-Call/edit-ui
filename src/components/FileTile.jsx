import { useState, useRef, useCallback } from 'preact/hooks';
import Icon from './Icon.jsx';
import ContextMenu from './ContextMenu.jsx';

function formatRelativeDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getIconForFile(fileName) {
  if (fileName.endsWith('.md')) return 'FileText';
  if (fileName.endsWith('.jsx')) return 'FileCode';
  if (fileName.endsWith('.js')) return 'FileCode';
  if (fileName.endsWith('.html')) return 'FileCode';
  if (fileName.endsWith('.css')) return 'FileCode';
  return 'File';
}

function FileTile({ file, isSelected, metadata, onClick, onDoubleClick, onDelete }) {
  const [contextMenu, setContextMenu] = useState({ x: null, y: null });
  const longPressTimer = useRef();

  const handleMouseDown = useCallback((e) => {
    longPressTimer.current = setTimeout(() => {
      e.preventDefault();
      setContextMenu({ x: e.pageX, y: e.pageY });
    }, 500);
  }, []);

  const handleMouseUp = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  const handleTouchStart = useCallback((e) => {
    longPressTimer.current = setTimeout(() => {
      e.preventDefault();
      const touch = e.touches[0];
      setContextMenu({ x: touch.pageX, y: touch.pageY });
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY });
  };

  const closeContextMenu = () => {
    setContextMenu({ x: null, y: null });
  };

  const menuOptions = [
    { label: 'Open', action: () => onDoubleClick(file) },
    { label: 'Delete', action: () => onDelete(file) },
  ];

  const isDir = file.type === 'dir';
  const iconName = isDir ? 'Folder' : getIconForFile(file.name);

  const tileClassName = `
    relative p-3 rounded-xl cursor-pointer transition-all duration-300 text-center
    flex flex-col items-center justify-between h-36 w-full
    bg-white/5 border border-white/10
    hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl
    ${isSelected ? 'bg-accent-lime/20 border-accent-lime/50 shadow-lg' : 'shadow-md'}
    select-none touch-manipulation
  `;

  const iconColor = isDir ? 'text-accent-lime' : 'text-cyan-400';

  return (
    <>
      <div
        className={tileClassName}
        onClick={() => onClick?.(file)}
        onDblClick={() => onDoubleClick?.(file)}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
          <div className="mb-2">
            <Icon name={iconName} className={`w-12 h-12 ${iconColor} transition-colors`} />
          </div>
          <div className="w-full">
            <div className="font-semibold text-sm text-white truncate" title={file.name}>
            {file.name.replace('.md', '')}
            </div>
          </div>
        </div>
        {metadata?.lastEditor && (
          <div className="flex-shrink-0 text-xs text-gray-400 mt-2 truncate w-full">
            {metadata.lastEditor} - {formatRelativeDate(metadata.lastModified)}
          </div>
        )}
      </div>
      {contextMenu.x !== null && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={menuOptions}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
}

export default FileTile;
