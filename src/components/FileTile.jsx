import { useState, useRef, useCallback } from 'preact/hooks';
import Icon from './Icon.jsx';
import ContextMenu from './ContextMenu.jsx';

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

function FileTile({ file, isSelected, metadata, onOpen, onShowActions }) {
const longPressTimer = useRef();
const isLongPress = useRef(false);

const handleMouseDown = useCallback((e) => {
isLongPress.current = false;
longPressTimer.current = setTimeout(() => {
isLongPress.current = true;
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
e.preventDefault(); // Prevent click event on touch devices after long press
onShowActions?.(file, e);
}, 500);
}, [file, onShowActions]);

const handleTouchEnd = useCallback(() => {
clearTimeout(longPressTimer.current);
}, []);

const handleClick = (e) => {
if (isLongPress.current) {
e.preventDefault();
e.stopPropagation();
isLongPress.current = false; // Reset for next interaction
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

const tileClassName = `
relative p-3 rounded-xl cursor-pointer transition-all duration-300 text-center
flex flex-col items-center justify-between h-36 w-full
bg-white/5 border border-white/10
hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl
${isSelected ? 'bg-accent-lime/20 border-accent-lime/50 shadow-lg' : 'shadow-md'}
select-none touch-manipulation
`;

const iconColor = isDir ? 'text-accent-lime' : 'text-cyan-400';

return (
<>
<div
className={tileClassName}
onClick={handleClick}
onMouseDown={handleMouseDown}
onMouseUp={handleMouseUp}
onMouseLeave={handleMouseUp}
onTouchStart={handleTouchStart}
onTouchEnd={handleTouchEnd}
onContextMenu={handleContextMenu}
>
<div className="flex-shrink-0">
<Icon name={iconName} className={`w-12 h-12 ${iconColor}`} />
</div>
<div className="flex-grow flex items-center">
<p className="text-sm font-medium text-main-text break-all">
{file.name.replace(/\.[^/.]+$/, "")}
</p>
</div>
<div className="flex-shrink-0 text-xs text-gray-400 h-4">
{metadata?.lastEditor && (
<span>
{metadata.lastEditor} - {formatRelativeDate(metadata.lastModified)}
</span>
)}
</div>
</div>
</>
);
}

export default FileTile;
