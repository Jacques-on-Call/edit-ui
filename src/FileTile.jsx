import { useRef } from 'react';
import './FileTile.css';

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
  // Remove .astro extension
  if (name.endsWith('.astro')) {
    name = name.slice(0, -6);
  }
  // Capitalize the first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
}


function FileTile({ file, isSelected, metadata, onClick, onLongPress }) {
  const isDirectory = file.type === 'dir';
  const icon = isDirectory ? '📁' : '📄';
  const tileClassName = `file-tile ${isSelected ? 'selected' : ''}`;

  const pressTimer = useRef(null);

  const handlePointerDown = (e) => {
    // Prevent triggering long press on right-click
    if (e.button === 2) return;
    pressTimer.current = setTimeout(() => {
      onLongPress(file, e);
    }, 500);
  };

  const handlePointerUp = () => {
    clearTimeout(pressTimer.current);
  };

  const handleOnClick = () => {
    onClick(file);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    clearTimeout(pressTimer.current); // Stop long press if right-click happens
    onLongPress(file, e);
  };

  return (
    <div
      className={tileClassName}
      onClick={handleOnClick}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onContextMenu={handleContextMenu}
    >
      <div className="icon">{icon}</div>
      <div className="name">{formatDisplayName(file.name)}</div>
      <div className="metadata">
        {metadata ? (
          <>
            <span className="metadata-author">{metadata.author.split(' ')[0]}</span>
            <span className="metadata-date">{formatRelativeDate(metadata.date)}</span>
          </>
        ) : (
          <span className="metadata-placeholder">--</span>
        )}
      </div>
    </div>
  );
}

export default FileTile;
