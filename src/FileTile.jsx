import { useRef, useState, useEffect } from 'react';
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

function FileTile({ file, isSelected, metadata, onClick, onLongPress, onRename, onDelete }) {
  const iconName = getIconNameForFile(file);
  const tileClassName = `file-tile ${isSelected ? 'selected' : ''} ${file.type === 'dir' ? 'is-folder' : ''}`;

  const [translateX, setTranslateX] = useState(0);
  const [ripples, setRipples] = useState([]);
  const swipeStartX = useRef(null);
  const pressTimer = useRef(null);
  const isSwiping = useRef(false);

  const handlePointerDown = (e) => {
    if (e.button === 2) return;
    swipeStartX.current = e.clientX;
    isSwiping.current = false;
    pressTimer.current = setTimeout(() => {
      onLongPress(file, e);
    }, 500);
  };
  
  const handlePointerMove = (e) => {
    if (swipeStartX.current === null) return;

    const currentX = e.clientX;
    const diff = currentX - swipeStartX.current;

    // Start swiping only after a certain threshold
    if (Math.abs(diff) > 10 || isSwiping.current) {
      isSwiping.current = true;
      clearTimeout(pressTimer.current); // Prevent long press if swiping
      // Allow swiping left only, up to a max of 120px
      const newTranslateX = Math.min(0, Math.max(-120, diff));
      setTranslateX(newTranslateX);
    }
  };

  const handlePointerUp = () => {
    clearTimeout(pressTimer.current);
    swipeStartX.current = null;

    // Snap logic
    if (translateX < -60) { // If swiped more than halfway
      setTranslateX(-120); // Snap open
    } else {
      setTranslateX(0); // Snap closed
    }
  };

  const handleOnClick = (e) => {
    if (isSwiping.current) {
        isSwiping.current = false;
        return; // Don't trigger click if it was a swipe
    }
    
    // --- Ripple Effect Logic (React Way) ---
    const tile = e.currentTarget.querySelector('.tile-content');
    if (!tile) return;
    const rect = tile.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = { x, y, size, key: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    // --- End Ripple ---

    onClick(file);
  };
  
  useEffect(() => {
    // Clean up ripples after animation
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples(prev => prev.slice(1));
      }, 600); // Match animation duration in CSS
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    clearTimeout(pressTimer.current);
    onLongPress(file, e);
  };
  
  const handleActionClick = (e, action) => {
      e.stopPropagation(); // Prevent click from bubbling to the tile itself
      setTranslateX(0); // Close the tile
      action(file);
  }

  return (
    <div className="tile-swipe-container">
      <div className="tile-actions">
        <button className="action-button rename" onClick={(e) => handleActionClick(e, onRename)}>Rename</button>
        <button className="action-button delete" onClick={(e) => handleActionClick(e, onDelete)}>Delete</button>
      </div>
      <div
        className={tileClassName}
        style={{ transform: `translateX(${translateX}px)`, transition: swipeStartX.current === null ? 'transform 0.3s ease' : 'none' }}
        onClick={handleOnClick}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp} // End swipe if mouse leaves tile
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onContextMenu={handleContextMenu}
      >
        <div className="tile-content">
          {ripples.map(r => (
            <span
              key={r.key}
              className="ripple"
              style={{
                left: r.x,
                top: r.y,
                width: r.size,
                height: r.size,
              }}
            />
          ))}
          <div className="icon">
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
      </div>
    </div>
  );
}

export default FileTile;
