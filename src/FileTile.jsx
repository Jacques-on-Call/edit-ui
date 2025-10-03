import { useRef } from 'react';
import Icon from './icons.jsx';

function formatRelativeDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDisplayName(name) {
  if (!name) return '';
  if (name.endsWith('.astro')) {
    name = name.slice(0, -6);
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const getIconNameForFile = (file) => {
  if (file.type === 'dir') {
    return 'folder';
  }
  return 'file';
};

function FileTile({ file, isSelected, metadata, onClick, onLongPress }) {
  const iconName = getIconNameForFile(file);
  const pressTimer = useRef(null);

  const baseClasses = 'flex flex-col items-center justify-center rounded-lg p-4 cursor-pointer transition-colors duration-200 ease-in-out border select-none';
  const folderClasses = 'bg-blue-100 border-transparent hover:bg-blue-200';
  const fileClasses = 'bg-gray-100 border-transparent hover:bg-gray-200';
  const selectedClasses = 'bg-blue-200 border-blue-300';

  const tileClassName = [
    baseClasses,
    isSelected ? selectedClasses : (file.type === 'dir' ? folderClasses : fileClasses),
  ].join(' ');

  const handlePointerDown = (e) => {
    if (e.button === 2) return;
    pressTimer.current = setTimeout(() => {
      onLongPress(file, e);
    }, 500);
  };

  const handlePointerUp = () => {
    clearTimeout(pressTimer.current);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    clearTimeout(pressTimer.current);
    onLongPress(file, e);
  };

  return (
    <div
      className={tileClassName}
      onClick={() => onClick(file)}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onContextMenu={handleContextMenu}
    >
      <div className="relative overflow-hidden flex flex-col items-center justify-center text-center w-full">
        <div className="mb-2">
          <Icon name={iconName} className={`w-12 h-12 ${file.type === 'dir' ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>
        <div className="text-sm font-medium text-gray-800 break-words leading-tight h-[2.4em] overflow-hidden">
          {formatDisplayName(file.name)}
        </div>
        <div className="text-xs text-gray-500 mt-1 flex gap-2">
          {metadata ? (
            <>
              <span className="font-medium">{metadata.author.split(' ')[0]}</span>
              <span>{formatRelativeDate(metadata.date)}</span>
            </>
          ) : (
            <span className="text-gray-400">--</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileTile;