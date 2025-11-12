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

function FileTile({ file, isSelected, metadata, onOpen, onShowActions }) {
  const longPressTimer = useRef();
  const isLongPress = useRef(false);

  const handleMouseDown = useCallback((e) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      e.preventDefault();
      onShowActions?.(file, e);
    }, 500);
  }, [file, onShowActions]);

  const handleMouseUp = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  const handleTouchStart = useCallback((e) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      e.preventDefault();
      onShowActions?.(file, e);
    }, 500);
  }, [file, onShowActions]);

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  const handleClick = (e) => {
    if (isLongPress.current) {
      e.preventDefault();
      return;
    }
    onOpen?.(file);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    onShowActions?.(file, e);
  };

  const isDir = file.type === 'dir';
  const iconName = isDir ? 'Folder' : getIconForFile(file.name);
  console.log(`[FileTile] file: ${file.name}, icon: ${iconName}`);

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
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
          <div className="mb-2">
            <Icon name={iconName} className={`w-12 h-12 ${iconColor} transition-colors`} />
          </div>
          <div className="w-full">
            <div className="font-semibold text-sm text-white truncate" title={file.name}>
              {file.name.replace(/\.[^/.]+$/, "")}
            </div>
          </div>
        </div>
        {metadata?.lastEditor && (
          <div className="flex-shrink-0 text-xs text-gray-500 mt-1 truncate w-full">
            {metadata.lastEditor} - {formatRelativeDate(metadata.lastModified)}
          </div>
        )}
      </div>
    </>
  );
}

export default FileTile;
