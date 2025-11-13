import { useRef, useCallback } from 'preact/hooks';
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

function getIconForFile(fileName) {
  if (fileName.endsWith('.md')) return 'FileText';
  if (fileName.endsWith('.jsx')) return 'FileCode';
  if (fileName.endsWith('.js')) return 'FileCode';
  if (fileName.endsWith('.html')) return 'FileCode';
  if (fileName.endsWith('.css')) return 'FileCode';
  return 'File';
}

function FileTile(props) {
  const { file, isSelected, metadata, onOpen, onShowActions } = props;

  const isDir = file.type === 'dir';
  const iconName = isDir ? 'Folder' : getIconForFile(file.name);
  const iconColor = isDir ? 'text-accent-lime' : 'text-cyan-400';

  const selectedClass = isSelected ? 'ring-2 ring-accent-lime border-accent-lime' : 'border-transparent';

  return (
    <div
      className={`relative flex flex-col items-start p-3 rounded-lg border ${selectedClass} bg-slate-800/60`}
      onClick={(e) => props.onClick ? props.onClick(props.file) : (onOpen && onOpen(props.file))}
      onDoubleClick={(e) => props.onDoubleClick ? props.onDoubleClick(props.file) : (onOpen && onOpen(props.file))}
      onContextMenu={(e) => {
        e.preventDefault();
        if (props.onShowActions) props.onShowActions(props.file, e);
      }}
    >
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
          <div className="mb-2">
            <Icon name={iconName} className={`w-12 h-12 ${iconColor} transition-colors`} />
          </div>
          <div className="w-full">
            <div className="font-semibold text-sm text-white truncate" title={file.name}>
              {file.name.replace(/\.[^/.]+$/, "")}
            </div>
          </div>
        </div>
        {metadata?.lastEditor && (
          <div className="flex-shrink-0 text-xs text-gray-500 mt-1 truncate w-full">
            {metadata.lastEditor} - {formatRelativeDate(metadata.lastModified)}
          </div>
        )}
    </div>
  );
}

export default FileTile;
