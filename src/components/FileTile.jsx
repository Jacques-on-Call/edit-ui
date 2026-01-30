import { memo } from 'preact/compat';
import { useState, useRef, useCallback, useEffect } from 'preact/hooks';
import Icon from './Icon.jsx';
import ContextMenu from './ContextMenu.jsx';
import { useOnScreen } from '../hooks/useOnScreen';

// ⚡ Bolt: Define Intersection Observer options outside the component.
// This ensures the options object is stable and not recreated on every render,
// preventing the `useOnScreen` hook from re-triggering its `useEffect` needlessly.
const onScreenOptions = { rootMargin: '200px' };

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

function FileTile({ file, isSelected, metadata, hasDraft, isPublished, onOpen, onShowActions, fetchDetailsForFile }) {
  // ⚡ Bolt: Set up Intersection Observer for lazy loading metadata.
  // The ref is attached to the tile's root element. `isOnScreen` becomes true
  // when the tile enters the viewport. We add a rootMargin to fetch data
  // just before the tile becomes visible for a smoother experience.
  const [ref, isOnScreen] = useOnScreen(onScreenOptions);

  // ⚡ Bolt: Trigger data fetching when the component becomes visible.
  useEffect(() => {
    // This effect runs when the tile's visibility changes.
    // It fetches details only if the tile is on screen, it's not a local draft,
    // and metadata hasn't already been loaded. This prevents the N+1 problem.
    if (isOnScreen && !file.isDraft && !metadata && fetchDetailsForFile) {
      fetchDetailsForFile(file);
    }
  }, [isOnScreen, file, metadata, fetchDetailsForFile]);

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
  const iconColor = isDir ? 'text-accent-lime' : 'text-cyan-400';
  const borderColor = isDir ? 'border-accent-lime' : 'border-cyan-400';

  const tileClassName = `
    relative p-3 rounded-xl cursor-pointer transition-all duration-300 text-center
    flex flex-col items-center justify-between h-36 w-full
    bg-white/5
    hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl
    border-2 ${isSelected ? borderColor : 'border-white/5'}
    select-none touch-manipulation
  `;

  return (
    <>
      <div
        ref={ref}
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
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          {file.hasDraft && (
            <span className="bg-amber-500/20 text-amber-500 border border-amber-500/50 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              📝 Draft
            </span>
          )}
          {file.hasLive && (
            <span className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              🌐 Live
            </span>
          )}
        </div>
        <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
          <div className="mb-2">
            <Icon name={iconName} className={`w-12 h-12 ${iconColor} transition-colors`} />
          </div>
          <div className="w-full">
            <div className="font-semibold text-sm text-white truncate" title={file.name}>
              {file.name.replace(/\.[^/.]+$/, "")}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 opacity-80">
              {isDir ? 'Click to open this folder' : 'Click to edit this page'}
            </div>
          </div>
        </div>
        {metadata ? (
          <div className="flex-shrink-0 text-xs text-gray-500 mt-1 truncate w-full">
            {metadata.lastEditor
              ? `${metadata.lastEditor} - ${formatRelativeDate(metadata.lastModified)}`
              : '\u00A0' /* &nbsp; to maintain layout */}
          </div>
        ) : (
          // ⚡ Bolt: Placeholder to prevent layout shift while metadata is loading.
          <div className="flex-shrink-0 h-4 w-full mt-1" />
        )}
      </div>
    </>
  );
}

// ⚡ Bolt: Memoized FileTile to prevent unnecessary re-renders in the file explorer.
// This is a significant performance boost when navigating and selecting files in large folders,
// as it avoids re-rendering every single tile when only one tile's state (e.g., isSelected) changes.
export default memo(FileTile);
