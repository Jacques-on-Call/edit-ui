import { useRef } from 'preact/hooks';
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

function FileTile({ file, isSelected, metadata, onClick, onLongPress, onDoubleClick }) {
  const pressTimer = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const lastTapTime = useRef(0);

  const isDir = file.type === 'dir';
  const iconName = isDir ? 'Folder' : 'File';

  const tileClassName = `
    p-2 rounded-lg cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-center h-32
    ${isSelected ? 'bg-accent/20 border-accent shadow-lg' : 'bg-surface border-border hover:shadow-md hover:border-gray-700'}
    select-none touch-none [-webkit-touch-callout:none]
  `;

  const clearTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerDown = (e) => {
    if (e.type === 'touchstart') {
      e.preventDefault?.();
    }
    if (e.button === 2) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };

    const coords = { clientX, clientY };

    pressTimer.current = setTimeout(() => {
      onLongPress?.(file, coords);
    }, 500);
  };

  const handlePointerUp = (e) => {
    clearTimer();

    if (e.type === 'touchend') {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        e.preventDefault?.();
        if (onDoubleClick) {
          onDoubleClick(file);
        } else {
          onClick?.(file);
        }
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = now;
      }
    }
  };

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
      onDblClick={() => onDoubleClick?.(file)}
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
          <Icon name={iconName} className="w-12 h-12 text-text" />
        </div>
        <div className="w-full">
          <div className="font-semibold text-blue-300 truncate" title={file.name}>
            {file.name}
          </div>
          {metadata?.lastEditor && (
            <div className="text-xs text-muted-text mt-1 truncate">
              {metadata.lastEditor} - {formatRelativeDate(metadata.lastModified)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileTile;
