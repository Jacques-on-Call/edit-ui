import { useRef, useState } from 'react';
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
  const pressTimer = useRef(null);

  // Note: The click-pulse animation was removed during refactoring as it requires
  // custom keyframes in tailwind.config.js. This can be re-added later.
  const baseTileClasses = 'flex flex-col items-center justify-center rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out bg-gray-50 border border-gray-200 select-none relative hover:-translate-y-0.5 hover:shadow-md';
  const selectedClasses = 'bg-[#e0eafc] border-[#003971]'; // Uses custom colors for brand alignment

  const tileClassName = `${baseTileClasses} ${isSelected ? selectedClasses : ''}`;

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
      <div className="flex flex-col items-center justify-center text-center w-full">
        <div className="mb-3">
          {file.type === 'dir'
            ? <FolderIcon className="w-12 h-12 text-blue" />
            : <FileIcon className="w-12 h-12 text-green" />}
        </div>
        <div className="text-sm font-medium text-gray-800 break-words leading-tight h-[2.6em] overflow-hidden">
            {formatDisplayName(file.name)}
        </div>
        <div className="text-xs text-gray-500 mt-1.5 flex gap-2 h-[18px]">
          {metadata ? (
            <>
              <span className="font-medium">{metadata.author.split(' ')[0]}</span>
              <span>{formatRelativeDate(metadata.date)}</span>
            </>
          ) : (
            <span className="text-gray-300">&nbsp;</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileTile;