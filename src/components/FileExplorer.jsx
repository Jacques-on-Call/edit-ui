import { useState, useEffect, useCallback } from 'preact/compat';
import { route } from 'preact-router';
import Icon from './Icon';
import FileTile from './FileTile';
import ReadmeDisplay from './ReadmeDisplay';
import matter from 'gray-matter';

function FileExplorer({ repo, searchQuery }) {
  const [files, setFiles] = useState([]);
  const [path, setPath] = useState('src/pages');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [metadataCache, setMetadataCache] = useState({});
  const [readmeContent, setReadmeContent] = useState(null);
  const [isReadmeLoading, setReadmeLoading] = useState(false);
  const [isReadmeVisible, setReadmeVisible] = useState(true);

  const fetchMetadata = useCallback(async (file) => {
    if (file.type === 'dir') return;
    try {
      // Fetch frontmatter
      const fileRes = await fetch(`/api/files?repo=${repo}&path=${file.path}`, { credentials: 'include' });
      if (!fileRes.ok) throw new Error(`Failed to fetch file content: ${fileRes.statusText}`);
      const fileData = await fileRes.json();
      const decodedContent = atob(fileData.content);
      const { data } = matter(decodedContent);

      // Fetch commit data
      const commitRes = await fetch(`/api/file/commits?repo=${repo}&path=${file.path}`, { credentials: 'include' });
      if (!commitRes.ok) throw new Error(`Failed to fetch commit data: ${commitRes.statusText}`);
      const commitData = await commitRes.json();
      const lastCommit = commitData[0];

      const metadata = {
        ...data,
        lastEditor: lastCommit?.commit?.author?.name,
        lastModified: lastCommit?.commit?.author?.date,
      };

      if (metadata) {
        setMetadataCache(prev => ({ ...prev, [file.sha]: metadata }));
      }
    } catch (err) {
      console.error(`Failed to fetch metadata for ${file.path}:`, err);
    }
  }, [repo]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files?repo=${repo}&path=${path}`, { credentials: 'include' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${response.statusText} - ${errorText}`);
      }
      let data = await response.json();

      const sortedData = data.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(sortedData);

      sortedData.forEach(file => {
        fetchMetadata(file);
      });

      const readmeFile = data.find(file => file.name.toLowerCase() === 'readme.md');
      if (readmeFile) {
        setReadmeLoading(true);
        try {
          const readmeRes = await fetch(`/api/files?repo=${repo}&path=${readmeFile.path}`, { credentials: 'include' });
          if (!readmeRes.ok) throw new Error('Could not fetch README content.');
          const readmeData = await readmeRes.json();
          const decodedContent = atob(readmeData.content);
          setReadmeContent(decodedContent);
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
  }, [repo, path, fetchMetadata]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

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

  const handleOpen = (fileToOpen) => {
    const file = fileToOpen || selectedFile;
    if (!file) return;

    if (file.type === 'dir') {
      setPath(file.path);
    } else {
      // For now, just log the file path. Routing will be handled later.
      console.log(`Navigating to editor for: ${file.path}`);
    }
  };

  const handleGoHome = () => setPath('src/pages');

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleReadme = () => setReadmeVisible(prev => !prev);

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
    <div className="flex flex-col h-screen bg-transparent text-white">
      {/* Main content area */}
      <main className="flex-grow overflow-y-auto pb-24"> {/* Add padding-bottom to avoid overlap with toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
          {Array.isArray(filteredFiles) && filteredFiles.filter(file => !file.name.startsWith('.') && file.name.toLowerCase() !== 'readme.md').map(file => (
            <FileTile
              key={file.sha}
              file={file}
              metadata={metadataCache[file.sha]}
              isSelected={selectedFile && selectedFile.sha === file.sha}
              onClick={handleFileClick}
              onDoubleClick={handleFileDoubleClick}
            />
          ))}
        </div>
        {isReadmeLoading && <div className="text-center text-gray-400 my-8">Loading README...</div>}
        {readmeContent && !isReadmeLoading && (
          <div className="p-4">
             <div className="bg-black/20 p-6 rounded-lg border border-white/10">
                <ReadmeDisplay
                  content={readmeContent}
                  isVisible={isReadmeVisible}
                  onToggle={handleToggleReadme}
                />
             </div>
          </div>
        )}
      </main>

      {/* Bottom Toolbar */}
      <footer className="fixed bottom-0 left-0 right-0 p-3 z-20">
         <div className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl shadow-lg flex justify-between items-center p-2 border border-white/20">
            <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors disabled:opacity-40"
                onClick={handleGoHome}
                disabled={path === 'src/pages'}
                title="Go to root directory"
            >
                <Icon name="Home" className="w-5 h-5" />
                <span className="font-semibold text-sm">Home</span>
            </button>

            <button
                className="bg-black/30 text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg border border-accent-lime/50 backdrop-blur-sm transform transition-transform hover:scale-110"
                title="Create a new file or folder"
            >
                <Icon name="Plus" className="w-8 h-8"/>
            </button>

            <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                title="Back to repository selection"
                onClick={() => route('/repo-select')}
            >
                 <Icon name="ArrowLeft" className="w-5 h-5" />
                <span className="font-semibold text-sm">Back</span>
            </button>
         </div>
      </footer>
    </div>
  );
}

export default FileExplorer;
