import { useState, useEffect, useCallback } from 'preact/compat';
import { fetchJson } from '../lib/fetchJson';
import Icon from './Icon';

function FolderTree({ repo, onSelectPath, currentPath, initialExpandedPaths, rootPath = 'src/pages' }) {
  const [tree, setTree] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState(new Set(initialExpandedPaths));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTree = async () => {
      setIsLoading(true);
      try {
        const treeData = await fetchJson(`/api/files/tree?repo=${repo}&path=${encodeURIComponent(rootPath)}`);
        setTree(treeData);
      } catch (error) {
        console.error("Failed to fetch folder tree:", error);
        setTree(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTree();
  }, [repo, rootPath]);

  const toggleExpand = (path) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderTree = (node) => {
    if (!node) return null;
    const isExpanded = expandedPaths.has(node.path);

    return (
      <div className={node.path !== 'src/pages' ? "ml-4" : ""}>
        <div
          className={`flex items-center p-1 cursor-pointer rounded ${currentPath === node.path ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          onClick={() => onSelectPath(node.path)}
        >
          {node.children && node.children.length > 0 && (
            <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} className="w-4 h-4 mr-2 flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleExpand(node.path); }} />
          )}
          <Icon name="Folder" className="w-5 h-5 mr-2 flex-shrink-0" style={{ marginLeft: (!node.children || node.children.length === 0) ? '1.5rem' : '' }} />
          <span className="truncate">{node.name}</span>
        </div>
        {isExpanded && node.children && (
          <div className="pl-4 border-l border-gray-600">
            {node.children.length > 0 ? (
              node.children.map(child => renderTree(child))
            ) : (
              <div className="text-gray-500 text-sm italic ml-10">No sub-folders</div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-4 text-gray-400">Loading folder tree...</div>;
  }
  if (!tree) {
    return <div className="p-4 text-red-400">Failed to load folder tree. Please check the console and try again.</div>;
  }

  return <div>{renderTree(tree)}</div>;
}

export function MoveModal({ file, repo, onClose, onMove }) {
  const initialPath = file.path.substring(0, file.path.lastIndexOf('/'));
  const [destinationPath, setDestinationPath] = useState(initialPath);

  const getInitialExpandedPaths = (filePath) => {
    const paths = new Set();
    const segments = filePath.split('/');
    let currentPath = '';
    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      paths.add(currentPath);
    }
    return paths;
  };

  const rootPath = file.path.startsWith('content/pages') ? 'content/pages' : 'src/pages';
  const initialExpandedPaths = getInitialExpandedPaths(initialPath);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">Move {file.name}</h2>
        <p className="text-gray-400 mb-4">Select a new location for the file:</p>

        <div className="bg-gray-900 p-2 rounded h-64 overflow-y-auto border border-gray-700">
          <FolderTree
            repo={repo}
            onSelectPath={setDestinationPath}
            currentPath={destinationPath}
            initialExpandedPaths={initialExpandedPaths}
            rootPath={rootPath}
          />
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>
          <button
            onClick={() => onMove(file, destinationPath)}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold"
            disabled={destinationPath === initialPath}
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
}
