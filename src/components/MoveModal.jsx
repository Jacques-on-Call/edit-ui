import { useState, useEffect, useCallback } from 'preact/compat';
import { fetchJson } from '../lib/fetchJson';
import Icon from './Icon';

// A more robust FolderTree component
function FolderTree({ repo, onSelectPath, currentPath, file }) {
  const [tree, setTree] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Memoized function to fetch directory contents
  const fetchFolders = useCallback(async (path) => {
    const files = await fetchJson(`/api/files?repo=${repo}&path=${path}`);
    return files
      .filter(file => file.type === 'dir')
      .map(dir => ({ ...dir, children: null })); // Mark children as unloaded
  }, [repo]);

  // Recursively update a node's children in the tree (immutable)
  const updateNodeChildren = (node, path, children) => {
    if (node.path === path) {
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: node.children.map(child => updateNodeChildren(child, path, children)) };
    }
    return node;
  };

  // Effect to build the initial, pre-expanded tree
  useEffect(() => {
    const buildInitialTree = async () => {
      setIsLoading(true);
      const rootFolders = await fetchFolders('');
      let currentTree = { path: '', children: rootFolders, name: repo.split('/')[1] };

      const fileDir = file.path.substring(0, file.path.lastIndexOf('/'));
      const pathSegments = fileDir.split('/').filter(Boolean);
      const pathsToExpand = new Set(['']);

      let parentPath = '';
      for (const segment of pathSegments) {
        const currentSegmentPath = parentPath ? `${parentPath}/${segment}` : segment;
        pathsToExpand.add(currentSegmentPath);

        const children = await fetchFolders(currentSegmentPath);
        currentTree = updateNodeChildren(currentTree, currentSegmentPath, children);

        parentPath = currentSegmentPath;
      }

      setTree(currentTree);
      setExpandedPaths(pathsToExpand);
      setIsLoading(false);
    };

    buildInitialTree();
  }, [repo, file.path, fetchFolders]);

  // Handle expanding/collapsing folders
  const toggleExpand = async (path) => {
    const newExpandedPaths = new Set(expandedPaths);
    if (newExpandedPaths.has(path)) {
      newExpandedPaths.delete(path);
      setExpandedPaths(newExpandedPaths);
    } else {
      newExpandedPaths.add(path);
      setExpandedPaths(newExpandedPaths); // Update UI immediately

      // Fetch children if they haven't been loaded
      const children = await fetchFolders(path);
      setTree(prevTree => updateNodeChildren(prevTree, path, children));
    }
  };

  // Recursive function to render the tree nodes
  const renderTree = (node) => {
    if (!node) return null;
    const isExpanded = expandedPaths.has(node.path);

    return (
      <div className={node.path !== '' ? "ml-4" : ""}>
        <div
          className={`flex items-center p-1 cursor-pointer rounded ${currentPath === node.path ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          onClick={() => onSelectPath(node.path)}
        >
          <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} className="w-4 h-4 mr-2 flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleExpand(node.path); }} />
          <Icon name="Folder" className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="truncate">{node.name || repo.split('/')[1]}</span>
        </div>
        {isExpanded && (
          <div className="pl-4 border-l border-gray-600">
            {node.children === null ? (
              <div className="text-gray-500 text-sm italic ml-10">Loading...</div>
            ) : node.children.length > 0 ? (
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

  return <div>{renderTree(tree)}</div>;
}


export function MoveModal({ file, repo, onClose, onMove }) {
  const [destinationPath, setDestinationPath] = useState(file.path.substring(0, file.path.lastIndexOf('/')));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">Move {file.name}</h2>
        <p className="text-gray-400 mb-4">Select a new location:</p>

        <div className="bg-gray-900 p-2 rounded h-64 overflow-y-auto border border-gray-700">
          <FolderTree
            repo={repo}
            file={file}
            onSelectPath={setDestinationPath}
            currentPath={destinationPath}
          />
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
