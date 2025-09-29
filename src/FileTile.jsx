import { useRef, useState } from 'react';
import styles from './FileTile.module.css';
import { FolderIcon, FileIcon } from './icons.jsx';

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
  const [isAnimating, setIsAnimating] = useState(false);
  const pressTimer = useRef(null);

  const tileClassName = `
    ${styles.fileTile}
    ${isSelected ? styles.selected : ''}
    ${isAnimating ? (file.type === 'dir' ? styles.pulseFolder : styles.pulseFile) : ''}
  `;

  const handlePointerDown = (e) => {
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
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 300); // This duration must match the animation duration in CSS
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    clearTimeout(pressTimer.current);
    onLongPress(file, e);
  };

  return (
    <div
      className={tileClassName.trim()}
      onClick={handleOnClick}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.tileContent}>
        <div className={styles.icon}>
          {file.type === 'dir' ? <FolderIcon /> : <FileIcon />}
        </div>
        <div className={styles.name}>{formatDisplayName(file.name)}</div>
        <div className={styles.metadata}>
          {metadata ? (
            <>
              <span className={styles.metadataAuthor}>{metadata.author.split(' ')[0]}</span>
              <span className={styles.metadataDate}>{formatRelativeDate(metadata.date)}</span>
            </>
          ) : (
            <span className={styles.metadataPlaceholder}>&nbsp;</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileTile;