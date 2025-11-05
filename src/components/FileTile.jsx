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

function FileTile({ file, isSelected, metadata, onClick, onDoubleClick }) {
  const isDir = file.type === 'dir';
  const iconName = isDir ? 'Folder' : 'FileText';

  const tileClassName = `
    relative p-3 rounded-xl cursor-pointer transition-all duration-300 text-center
    flex flex-col items-center justify-between h-36 w-full
    bg-white/5 border border-white/10
    hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl
    ${isSelected ? 'bg-accent-lime/20 border-accent-lime/50 shadow-lg' : 'shadow-md'}
    select-none touch-manipulation
  `;

  const iconColor = isDir ? 'text-accent-lime' : 'text-white/80';

  return (
    <div
      className={tileClassName}
      onClick={() => onClick?.(file)}
      onDblClick={() => onDoubleClick?.(file)}
    >
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
        <div className="mb-2">
          <Icon name={iconName} className={`w-12 h-12 ${iconColor} transition-colors`} />
        </div>
        <div className="w-full">
          <div className="font-semibold text-sm text-white truncate" title={file.name}>
            {file.name}
          </div>
        </div>
      </div>
      {metadata?.lastEditor && (
        <div className="flex-shrink-0 text-xs text-gray-400 mt-2 truncate w-full">
          {metadata.lastEditor} - {formatRelativeDate(metadata.lastModified)}
        </div>
      )}
    </div>
  );
}

export default FileTile;
