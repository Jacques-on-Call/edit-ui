import { useState, useEffect, useCallback } from 'preact/compat';
import { fetchJson } from '../lib/fetchJson';
import Icon from './Icon';

const ROOT_PATH = 'src/pages';

// Developer Note: This FolderTree component is intentionally scoped to the `src/pages`
// directory. The File Explorer in this application is designed for content editors
// who should only be interacting with files within this directory. This constraint
// simplifies the UI and prevents users from accidentally moving content to other
// parts of the repository, such as the application source or worker code.
function FolderTree({ repo, onSelectPath, currentPath, file }) {
  const [tree, setTree] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchFolders = useCallback(async (path) => {
    try {
      const files = await fetchJson(`/api/files?repo=${repo}&path=${path}`);
      return files
        .filter(file => file.type === 'dir')
        .map(dir => ({ ...dir, children: [] })); // Initialize children array
    } catch (error) {
      console.error(`Failed to fetch folders for path: ${path}`, error);
      return []; // Return empty array on error to prevent crashing
    }
  }, [repo]);

  useEffect(() => {
    const buildInitialTree = async () => {
      setIsLoading(true);
      const fileDir = file.path.substring(0, file.path.lastIndexOf('/'));

      // Fallback for files outside the target directory structure
      if (!fileDir.startsWith(ROOT_PATH)) {
        console.warn("File is outside the target directory structure. Displaying 'pages' root.");
        const rootFolders = await fetchFolders(ROOT_PATH);
        setTree({ path: ROOT_PATH, children: rootFolders, name: 'pages' });
        setExpandedPaths(new Set([ROOT_PATH]));
        setIsLoading(false);
        return;
      }

      const relativePath = fileDir.substring(ROOT_PATH.length);
      const pathSegments = relativePath.split('/').filter(Boolean);

      const pathsToFetch = [ROOT_PATH];
      let cumulativePath = ROOT_PATH;
      for (const segment of pathSegments) {
        cumulativePath = `${cumulativePath}/${segment}`;
        pathsToFetch.push(cumulativePath);
      }

      try {
        const fetchPromises = pathsToFetch.map(p => fetchFolders(p));
        const results = await Promise.all(fetchPromises);

        const directoryMap = new Map();
        pathsToFetch.forEach((path, index) => {
          directoryMap.set(path, results[index]);
        });

        const buildNode = (path) => {
          const children = directoryMap.get(path);
          if (!children) return [];
          return children.map(child => ({
            ...child,
            children: buildNode(child.path)
          }));
        };

        const rootChildren = buildNode(ROOT_PATH);
        const newTree = { path: ROOT_PATH, children: rootChildren, name: 'pages' };

        setTree(newTree);
        setExpandedPaths(new Set(pathsToFetch));
      } catch (error) {
        console.error("Failed to build the folder tree:", error);
        setTree({ path: ROOT_PATH, children: [], name: 'pages' });
      } finally {
        setIsLoading(false);
      }
    };

    buildInitialTree();
  }, [repo, file.path, fetchFolders]);

  const toggleExpand = async (node) => {
    const newExpandedPaths = new Set(expandedPaths);
    if (newExpandedPaths.has(node.path)) {
      newExpandedPaths.delete(node.path);
      setExpandedPaths(newExpandedPaths);
    } else {
      newExpandedPaths.add(node.path);
      setExpandedPaths(newExpandedPaths);

      if (!node.children || node.children.length === 0) {
        const children = await fetchFolders(node.path);
        setTree(prevTree => {
            const updateChildren = (n) => {
                if (n.path === node.path) {
                    return {...n, children: children.map(c => ({...c, children: []}))};
                }
                if (n.children) {
                    return {...n, children: n.children.map(updateChildren)}
                }
                return n;
            }
            return updateChildren(prevTree);
        });
      }
    }
  };

  const renderTree = (node) => {
    if (!node) return null;
    const isExpanded = expandedPaths.has(node.path);
    const isRoot = node.path === ROOT_PATH;

    return (
      <div className={!isRoot ? "ml-4" : ""}>
        <div
          className={`flex items-center p-1 cursor-pointer rounded ${currentPath === node.path ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          onClick={() => onSelectPath(node.path)}
        >
          <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} className="w-4 h-4 mr-2 flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleExpand(node); }} />
          <Icon name="Folder" className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="truncate">{node.name}</span>
        </div>
        {isExpanded && (
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
    return <div className="p-4 text-gray-400">Failed to load folder tree.</div>
  }

  return <div>{renderTree(tree)}</div>;
}


export function MoveModal({ file, repo, onClose, onMove }) {
  const initialPath = file.path.substring(0, file.path.lastIndexOf('/'));
  const [destinationPath, setDestinationPath] = useState(initialPath.startsWith(ROOT_PATH) ? initialPath : ROOT_PATH);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">Move {file.name}</h2>
        <p className="text-gray-400 mb-4">Select a new location inside `src/pages`:</p>

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
