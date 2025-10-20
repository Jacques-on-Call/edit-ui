import { useRef } from 'react';
import Icon from './Icon.jsx';

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

function FileTile({ file, isSelected, metadata, onClick, onLongPress }) {
  const pressTimer = useRef(null);
  const pointerDownTime = useRef(0);

  const isDir = file.type === 'dir';
  const iconName = isDir ? 'folder' : 'file';
  const iconClassName = isDir ? 'text-blue-500' : 'text-green-600';

  const tileClassName = `
    p-2 rounded-lg cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-center h-32
    ${isSelected ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100 hover:bg-gray-200'}
  `;

  const handlePointerDown = (e) => {
    // Ignore right-clicks
    if (e.button === 2) return;

    pointerDownTime.current = Date.now();
    pressTimer.current = setTimeout(() => {
      onLongPress(file, e);
      pressTimer.current = null; // Prevent click after long press
    }, 500);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      // This was a tap, not a long press
      const pressDuration = Date.now() - pointerDownTime.current;
      if (pressDuration < 500) {
        onClick(file);
      }
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    onLongPress(file, e);
  };

  return (
    <div
      className={tileClassName}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} // Cancel on drag away
      onContextMenu={handleContextMenu}
    >
      <div className="mb-2">
        <Icon name={iconName} className={iconClassName} />
      </div>
      <div className="font-semibold text-sm text-gray-800 truncate w-full px-1">
        {formatDisplayName(file.name)}
      </div>
      <div className="text-xs text-gray-500 mt-1 w-full px-1 truncate">
        {metadata ? (
          <div className="flex items-center justify-between w-full space-x-2">
            <span>{metadata.author.split(' ')[0]}</span>
            <span>{formatRelativeDate(metadata.date)}</span>
          </div>
        ) : (
          <span>--</span>
        )}
      </div>
    </div>
  );
}

export default FileTile;
