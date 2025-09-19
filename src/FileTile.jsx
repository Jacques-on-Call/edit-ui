import { useRef } from 'react';
import './FileTile.css';
import Icon from './icons.jsx'; // Using the new SVG Icon component

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

// Updated logic to be more specific with icons in the future
const getIconNameForFile = (file) => {
  if (file.type === 'dir') {
    return 'folder';
  }
  // This can be expanded later with more file types
  // For now, all files are considered 'document'
  return 'document';
};

function FileTile({ file, isSelected, metadata, onClick, onLongPress }) {
  const iconName = getIconNameForFile(file);
  const tileClassName = `file-tile ${isSelected ? 'selected' : ''} ${file.type === 'dir' ? 'is-folder' : ''}`;

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
      <div className="icon">
        {/* The Icon component now renders our SVG */}
        <Icon name={iconName} />
      </div>
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
