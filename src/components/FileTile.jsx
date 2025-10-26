import { useRef } from 'react';
import Icon from './Icon.jsx';

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

function formatDisplayName(name) {
  if (!name) return '';
  const noExt = name.replace(/\.(md|astro|jsx?|tsx?)$/i, '');
  return noExt.charAt(0).toUpperCase() + noExt.slice(1);
}

function FileTile({ file, isSelected, metadata, onClick, onLongPress, onDoubleClick }) {
  const pressTimer = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const lastTapTime = useRef(0);

  const isDir = file.type === 'dir';
  const iconName = isDir ? 'folder' : 'file';
  const iconClassName = isDir ? 'text-blue-500' : 'text-green-600';

  // Replaced touch-none with touch-action-manipulation to allow scrolling on touch devices.
  const tileClassName = `
    p-2 rounded-lg cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-center h-32
    ${isSelected ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100 hover:bg-gray-200'}
    select-none touch-action-manipulation [-webkit-touch-callout:none]
  `;

  const clearTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerDown = (e) => {
    // Ignore right-clicks for mouse events.
    if (e.button === 2) return;

    // Capture start position for movement threshold
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };

    // Capture coordinates immediately; event object is reused
    const coords = { clientX, clientY };

    pressTimer.current = setTimeout(() => {
      onLongPress?.(file, coords);
    }, 500);
  };

  const handlePointerUp = (e) => {
    clearTimer();
    
    // Handle double-tap detection for touch events
    if (e.type === 'touchend') {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;
      
      // If less than 300ms since last tap, it's a double-tap
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Trigger double-tap action (open file/folder directly)
        e.preventDefault?.();
        if (onDoubleClick) {
          onDoubleClick(file);
        } else {
          // Fallback to onClick twice for opening
          onClick?.(file);
        }
        // Reset tap tracking
        lastTapTime.current = 0;
      } else {
        // Single tap - record the time
        lastTapTime.current = now;
      }
    }
  };

  // Cancel long-press if finger moves more than a small threshold
  const handleTouchMove = (e) => {
    if (!pressTimer.current || !e.touches || e.touches.length === 0) return;
    const { clientX, clientY } = e.touches[0];
    const dx = Math.abs(clientX - startPos.current.x);
    const dy = Math.abs(clientY - startPos.current.y);
    if (dx > 10 || dy > 10) {
      clearTimer();
    }
  };

  const handleTouchCancel = () => {
    clearTimer();
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    clearTimer();
    onLongPress?.(file, { clientX: e.clientX, clientY: e.clientY });
  };

  return (
    <div
      className={tileClassName}
      onClick={() => onClick?.(file)}
      onDoubleClick={() => onDoubleClick?.(file)}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchCancel={handleTouchCancel}
      onContextMenu={handleContextMenu}
    >
      <div className="flex flex-col items-center justify-center text-center w-full">
        <div className="mb-2">
          <Icon name={iconName} className={`w-12 h-12 ${iconClassName}`} />
        </div>
        <div className="w-full">
          <div className="font-semibold text-gray-800 truncate" title={file.name}>
            {formatDisplayName(file.name)}
          </div>
          {metadata?.lastModified && (
            <div className="text-xs text-gray-500 mt-1">
              {formatRelativeDate(metadata.lastModified)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileTile;