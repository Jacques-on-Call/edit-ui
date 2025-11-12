
import { useState, useEffect, useCallback } from 'preact/compat';
import { useFileManifest } from '../hooks/useFileManifest';
import { fetchJson } from '/src/lib/fetchJson.js';
import FileTile from './FileTile';
import matter from 'gray-matter';

function FileExplorer({ repo, searchQuery }) {
  console.log(`[FileExplorer.jsx] searchQuery prop: "${searchQuery}"`);

  const { fileManifest } = useFileManifest(repo);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [path, setPath] = useState('src/pages');
  const [metadataCache, setMetadataCache] = useState({});

  const fetchDetailsForFile = useCallback(async (file) => {
      if (file.type === 'dir') return;
      try {
        const url = `/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(file.path)}`;
        const response = await fetchJson(url);
        const { data: frontmatter } = matter(response.content);
        if (frontmatter) {
          setMetadataCache(prev => ({ ...prev, [file.sha]: frontmatter }));
        }
      } catch (err) {
        console.error(`Failed to fetch details for ${file.path}:`, err);
      }
    }, [repo]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await fetchJson(`/api/files?repo=${repo}&path=${path}`);
      const sortedData = data.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(sortedData);
      sortedData.forEach(file => fetchDetailsForFile(file));
    } catch (err) {
      setError(`Failed to load repository contents: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [repo, path, fetchDetailsForFile]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  if (loading) return <p>Loading files...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>File Explorer (File Fetching Test)</h1>
      <p>Current search query: {searchQuery}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {files.map(file => (
          <FileTile
            key={file.sha}
            file={file}
            metadata={metadataCache[file.sha]}
            isSelected={false}
            onOpen={() => {}}
            onShowActions={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

export default FileExplorer;
