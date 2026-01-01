import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}
import { useState, useEffect, useCallback } from 'preact/compat';
import { route } from 'preact-router';
import matter from 'gray-matter';
import Icon from './Icon';
import FileTile from './FileTile';
import ReadmeDisplay from './ReadmeDisplay';
import { FileContextMenu } from './FileContextMenu';
import { MoveModal } from './MoveModal';
import { RenameModal } from './RenameModal';
import { SearchResultItem } from './SearchResultItem';
import { useSearch } from '../hooks/useSearch';
import { useFileManifest } from '../hooks/useFileManifest';
import { fetchJson } from '/src/lib/fetchJson.js';
import './LiquidGlassButton.css';

function FileExplorer({ repo, searchQuery, onShowCreate, onPathChange, refreshTrigger }) {
  console.log(`[FileExplorer.jsx] searchQuery prop: "${searchQuery}"`);
  const { fileManifest } = useFileManifest(repo);
  const [files, setFiles] = useState([]);
  const [path, setPath] = useState('src/pages');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [metadataCache, setMetadataCache] = useState({});
  const [readmeContent, setReadmeContent] = useState(null);
  const [isReadmeLoading, setReadmeLoading] = useState(false);
  const [isReadmeVisible, setReadmeVisible] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [moveFile, setMoveFile] = useState(null);
  const [renameItem, setRenameItem] = useState(null);
  const { searchResults, performSearch, isSearching } = useSearch(repo, fileManifest);

  // Notify parent of path changes
  useEffect(() => {
    if (onPathChange) {
      onPathChange(path);
    }
  }, [path, onPathChange]);

  const handleLongPress = useCallback((file, event) => {
    event.preventDefault();
    const x = event.touches ? event.touches[0].pageX : event.pageX;
    const y = event.touches ? event.touches[0].pageY : event.pageY;
    setContextMenu({ x, y, file });
  }, []); // setContextMenu is stable

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextMenuAction = (action, file) => {
    switch (action) {
      case 'delete':
        handleDelete(file);
        break;
      case 'duplicate':
        handleDuplicate(file);
        break;
      case 'move':
        setMoveFile(file);
        break;
      case 'rename':
        setRenameItem(file);
        break;
      default:
        console.warn(`Unknown context menu action: ${action}`);
    }
  };

  const handleDuplicate = async (file) => {
    try {
      const body = {
        repo: repo,
        path: file.path,
      };

      const newFile = await fetchJson('/api/files/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Add the new file to the UI
      setFiles(prevFiles => [...prevFiles, newFile.content]);

    } catch (err) {
      console.error('Failed to duplicate file:', err);
      setError(`Failed to duplicate ${file.name}: ${err.message}.`);
    }
  };

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  const RELEVANT_EXTENSIONS = ['.md', '.mdx', '.astro'];

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Fetch the initial file list
      let data = await fetchJson(`/api/files?repo=${repo}&path=${path}`);

      // Merge with drafts from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('easy-seo-draft:')) {
          const draftData = JSON.parse(localStorage.getItem(key));
          const draftPath = draftData.path || '';
          const draftDir = draftPath.substring(0, draftPath.lastIndexOf('/'));

          if (draftDir === path) {
            const slug = key.replace('easy-seo-draft:', '');
            const filename = draftPath.substring(draftPath.lastIndexOf('/') + 1);

            // Avoid duplicates
            if (!data.some(file => file.path === draftPath)) {
              data.push({
                name: filename,
                path: draftPath,
                sha: `draft-${slug}`,
                type: 'file',
                isDraft: true,
              });
            }
          }
        }
      }

      const sortedData = data.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(sortedData);

      // ⚡ Bolt: Batch fetch details for all files in a single network request.
      const pathsToFetch = sortedData
        .filter(file => file.type === 'file' && !file.isDraft)
        .map(file => file.path);

      if (pathsToFetch.length > 0) {
        const detailsMap = await fetchJson('/api/files/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo, paths: pathsToFetch }),
        });

        const newMetadata = {};
        sortedData.forEach(file => {
          if (file.type === 'file' && detailsMap[file.path] && file.sha) {
            const details = detailsMap[file.path];
            if (details.error) {
              console.error(`Error fetching details for ${file.path}:`, details.error);
              newMetadata[file.sha] = { error: 'Failed to load details' };
            } else {
              let metadata = {};
              const lastCommit = details.lastCommit;
              if (lastCommit) {
                metadata.lastEditor = lastCommit.commit?.author?.name;
                metadata.lastModified = lastCommit.commit?.author?.date;
              }

              const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
              if (RELEVANT_EXTENSIONS.includes(fileExtension) && typeof details.content === 'string') {
                try {
                  const binaryString = atob(details.content);
                  const decodedContent = decodeURIComponent(escape(binaryString));
                  const { data: frontmatter } = matter(decodedContent);
                  metadata = { ...metadata, ...frontmatter };
                } catch (e) {
                  console.error(`Error decoding or parsing frontmatter for ${file.path}:`, e);
                  metadata.error = 'Invalid content';
                }
              }
              newMetadata[file.sha] = metadata;
            }
          }
        });
        setMetadataCache(prev => ({ ...prev, ...newMetadata }));
      }

      // Fetch README content
      const readmeFile = data.find(file => file.name.toLowerCase() === 'readme.md');
      if (readmeFile) {
        setReadmeLoading(true);
        try {
          const readmeData = await fetchJson(`/api/get-file-content?repo=${repo}&path=${readmeFile.path}`);
          if (readmeData.content) {
            const binaryString = atob(readmeData.content);
            const decodedContent = decodeURIComponent(escape(binaryString));
            setReadmeContent(decodedContent);
          } else {
            setReadmeContent('Could not load README.');
          }
        } catch (readmeErr) {
          console.error("Failed to fetch or decode README:", readmeErr);
          setReadmeContent('Could not load README.');
        } finally {
          setReadmeLoading(false);
        }
      }

    } catch (err) {
      console.error("Error fetching files:", err);
      setError(`Failed to load repository contents. Please check your connection and repository permissions. Details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [repo, path]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Refresh files when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchFiles();
    }
  }, [refreshTrigger, fetchFiles]);

  const showSearchResults = searchQuery.trim().length > 0;

  const handleFileClick = (file) => {
    if (selectedFile && selectedFile.sha === file.sha) {
      handleOpen(file);
    } else {
      setSelectedFile(file);
    }
  };

  const handleFileDoubleClick = (file) => {
    handleOpen(file);
  };


  const handleDelete = async (file) => {
    if (confirm(`Are you sure you want to delete ${file.name}? This action cannot be undone.`)) {
      try {
        const body = {
          repo: repo,
          path: file.path,
          sha: file.sha,
          type: file.type, // Add the type of the item to the request body
        };

        await fetchJson('/api/files', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        // Optimistically remove the file from the UI
        setFiles(prevFiles => prevFiles.filter(f => f.sha !== file.sha));

        // Optionally, show a success notification here

      } catch (err) {
        console.error(`Failed to delete ${file.type}:`, err);
        setError(`Failed to delete ${file.name}: ${err.message}. Please refresh and try again.`);
        // Optionally, show an error notification here
      }
    }
  };

  const handleMove = async (file, destinationPath) => {
    const newPath = `${destinationPath}/${file.name}`;
    try {
      const body = {
        repo: repo,
        path: file.path,
        newPath: newPath,
        sha: file.sha,
      };

      await fetchJson('/api/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Sync localStorage drafts
      const oldSlug = (file.name || '').replace(/\.[^/.]+$/, '');
      const newName = newPath.split('/').pop();
      const newSlug = newName.replace(/\.[^/.]+$/, '');
      const oldDraftKey = `easy-seo-draft:${oldSlug}`;
      const newDraftKey = `easy-seo-draft:${newSlug}`;

      const draft = localStorage.getItem(oldDraftKey);
      if (draft) {
        const draftData = JSON.parse(draft);
        draftData.path = newPath;
        draftData.slug = newSlug;
        localStorage.setItem(newDraftKey, JSON.stringify(draftData));
        if (oldDraftKey !== newDraftKey) {
          localStorage.removeItem(oldDraftKey);
        }
      }

      setFiles(prevFiles => prevFiles.filter(f => f.sha !== file.sha));
      setMoveFile(null);

    } catch (err) {
      console.error(`Failed to move file:`, err);
      if (err.response && err.response.status === 409) {
        setError(`Failed to move ${file.name}: A file with that name already exists in the destination folder.`);
      } else {
        setError(`Failed to move ${file.name}: ${err.message}.`);
      }
      setMoveFile(null); // Close modal on error
    }
  };

  const handleRename = async (item, newName) => {
    try {
      const body = {
        repo: repo,
        path: item.path,
        newFilename: newName,
        sha: item.sha,
      };

      await fetchJson('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Sync localStorage drafts
      const oldSlug = (item.name || '').replace(/\.[^/.]+$/, '');
      const newSlug = newName.replace(/\.[^/.]+$/, '');
      const oldDraftKey = `easy-seo-draft:${oldSlug}`;
      const newDraftKey = `easy-seo-draft:${newSlug}`;

      const draft = localStorage.getItem(oldDraftKey);
      if (draft) {
        const draftData = JSON.parse(draft);
        const dir = item.path.substring(0, item.path.lastIndexOf('/'));
        const newPath = `${dir}/${newName}`;
        draftData.path = newPath;
        draftData.slug = newSlug;
        localStorage.setItem(newDraftKey, JSON.stringify(draftData));
        if (oldDraftKey !== newDraftKey) {
          localStorage.removeItem(oldDraftKey);
        }
      }

      // Optimistically update the UI
      setFiles(prevFiles => prevFiles.map(f => {
        if (item.type === 'dir' && f.path.startsWith(item.path + '/')) {
          return { ...f, path: f.path.replace(item.path, item.path.substring(0, item.path.lastIndexOf('/')) + '/' + newName) };
        }
        if (f.sha === item.sha) {
          const dir = f.path.substring(0, f.path.lastIndexOf('/'));
          const newPath = `${dir}/${newName}`;
          return { ...f, name: newName, path: newPath };
        }
        return f;
      }));
      setRenameItem(null);

    } catch (err) {
      console.error(`Failed to rename item:`, err);
      setError(`Failed to rename ${item.name}: ${err.message}.`);
      setRenameItem(null); // Close modal on error
    }
  };

  const handleOpen = useCallback((fileToOpen) => {
    const file = fileToOpen || selectedFile;
    if (!file) return;

    if (file.type === 'dir') {
      setPath(file.path);
    } else {
      const slug = (file.name || file.path || '').replace(/\.[^/.]+$/, '');
      const target = `/editor/${encodeURIComponent(file.path)}`;
      console.log(`[FileExplorer] navigate attempt -> ${file.path} -> slug: ${slug} -> target: ${target}`);
      try {
        console.log('[FileExplorer] trying preact-router route()');
        route(target);
      } catch (err) {
        console.warn('[FileExplorer] route() threw an error:', err);
      }
      const normalizedPathname = decodeURI(window.location.pathname || '');
      const expectedPathname = decodeURI(new URL(target, window.location.origin).pathname);
      if (normalizedPathname !== expectedPathname) {
        console.warn('[FileExplorer] route() did not change location. Trying history.pushState + popstate fallback.');
        try {
          window.history.pushState({}, '', target);
          window.dispatchEvent(new Event('popstate'));
          setTimeout(() => {
            const nowPath = decodeURI(window.location.pathname || '');
            if (nowPath === expectedPathname) {
              console.log('[FileExplorer] navigation succeeded via pushState + popstate.');
            } else {
              console.error('[FileExplorer] pushState fallback did not work; falling back to full reload.');
              window.location.href = target;
            }
          }, 50);
        } catch (err) {
          console.error('[FileExplorer] pushState fallback threw:', err, '- attempting full reload.');
          window.location.href = target;
        }
      } else {
        console.log('[FileExplorer] route() appears to have succeeded (location updated).');
      }
    }
  }, [selectedFile]);

  const handleGoHome = () => setPath('src/pages');

  const handleGoBack = () => {
    const parentPath = path.split('/').slice(0, -1).join('/');
    setPath(parentPath || 'src/pages'); // Default to root if empty
  };

  const handleToggleReadme = () => setReadmeVisible(prev => !prev);

  const filesToDisplay = showSearchResults ? searchResults : files;

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-center p-8 text-gray-500 animate-pulse">Loading files...</div></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="container max-w-2xl mx-auto mt-12 p-8 border-2 border-red-200 bg-red-50 rounded-lg text-center shadow-md">
          <h2 className="text-2xl font-bold text-red-700 mb-4">An Error Occurred</h2>
          <p className="text-red-600 mb-6 break-words">{error}</p>
          <button onClick={fetchFiles} className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-red-700">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" onClick={handleCloseContextMenu}>
      <main className="flex-grow overflow-y-auto p-4 pb-24">
        {showSearchResults ? (
          <div>
            <h2 className="text-xl font-bold mb-4">Search Results</h2>
            {isSearching ? (
              <p>Searching...</p>
            ) : (
              <div>
                {searchResults.map(result => (
                  <SearchResultItem key={result.path} result={result} query={searchQuery} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.isArray(filesToDisplay) && filesToDisplay
                .filter(file => !file.name.startsWith('.') && file.name.toLowerCase() !== 'readme.md')
                .map(file => {
                  const slug = (file.name || file.path || '').replace(/\.[^/.]+$/, '');
                  const hasDraft = localStorage.getItem(`easy-seo-draft:${slug}`) !== null;
                  const isPublished = localStorage.getItem(`easy-seo-published:${slug}`) !== null;
                  console.log(`[FileExplorer] fileState -> slug: ${slug}, draft: ${hasDraft}, published: ${isPublished}`);

                  return (
                    <FileTile
                      key={file.sha}
                      file={file}
                      metadata={metadataCache[file.sha]}
                      isSelected={selectedFile && selectedFile.sha === file.sha}
                      hasDraft={hasDraft}
                      isPublished={isPublished}
                      onOpen={handleOpen}
                      onShowActions={handleLongPress}
                    />
                  );
                })}
            </div>
            {contextMenu && (
              <FileContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                file={contextMenu.file}
                onClose={handleCloseContextMenu}
                onAction={handleContextMenuAction}
              />
            )}
            {isReadmeLoading && <div className="text-center text-gray-400 my-8">Loading README...</div>}
            {readmeContent && !isReadmeLoading && (
              <div className="w-full max-w-screen-md mx-auto mt-8">
                <div className="bg-black/20 p-2 sm:p-6 rounded-lg border border-white/10">
                  <ReadmeDisplay
                    content={readmeContent}
                    isVisible={isReadmeVisible}
                    onToggle={handleToggleReadme}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
      {moveFile && (
        <MoveModal
          file={moveFile}
          repo={repo}
          onClose={() => setMoveFile(null)}
          onMove={handleMove}
        />
      )}
      {renameItem && (
        <RenameModal
          item={renameItem}
          onClose={() => setRenameItem(null)}
          onRename={handleRename}
        />
      )}
    </div>
  );
}

export default FileExplorer;
