import { useState, useEffect, useCallback } from 'preact/compat';
import { fetchJson } from '../lib/fetchJson';
import Icon from './Icon';

function FolderTree({ repo, onSelectPath, currentPath }) {
  const [tree, setTree] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  const fetchFolders = useCallback(async (path) => {
    const files = await fetchJson(`/api/files?repo=${repo}&path=${path}`);
    return files.filter(file => file.type === 'dir');
  }, [repo]);

  useEffect(() => {
    async function buildTree() {
      const rootFolders = await fetchFolders('');
      setTree({ path: '', children: rootFolders, name: repo.split('/')[1] });
      setExpandedPaths(new Set(['']));
    }
    buildTree();
  }, [fetchFolders, repo]);

  const toggleExpand = async (path) => {
    const newExpandedPaths = new Set(expandedPaths);
    if (newExpandedPaths.has(path)) {
      newExpandedPaths.delete(path);
    } else {
      newExpandedPaths.add(path);
      // You might need to fetch children here if not already loaded
    }
    setExpandedPaths(newExpandedPaths);
  };

  const renderTree = (node) => {
    if (!node) return null;
    const isExpanded = expandedPaths.has(node.path);
    return (
      <div className="ml-4">
        <div
          className={`flex items-center p-1 cursor-pointer rounded ${currentPath === node.path ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          onClick={() => onSelectPath(node.path)}
        >
          <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} className="w-4 h-4 mr-2" onClick={(e) => { e.stopPropagation(); toggleExpand(node.path); }} />
          <Icon name="Folder" className="w-5 h-5 mr-2" />
          <span>{node.name}</span>
        </div>
        {isExpanded && node.children && (
          <div className="pl-4 border-l border-gray-600">
            {node.children.map(child => renderTree(child))}
          </div>
        )}
      </div>
    );
  };

  return <div>{renderTree(tree)}</div>
}


export function MoveModal({ file, repo, onClose, onMove }) {
  const [destinationPath, setDestinationPath] = useState(file.path.substring(0, file.path.lastIndexOf('/')));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">Move {file.name}</h2>
        <p className="text-gray-400 mb-4">Select a new location:</p>

        <div className="bg-gray-900 p-2 rounded h-64 overflow-y-auto border border-gray-700">
          <FolderTree repo={repo} onSelectPath={setDestinationPath} currentPath={destinationPath} />
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>
          <button
            onClick={() => onMove(file, destinationPath)}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
}
