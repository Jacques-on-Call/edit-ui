import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FileExplorer.css';
import FileTile from './FileTile';

function FileExplorer({ repo }) {
  const [files, setFiles] = useState([]);
  const [path, setPath] = useState('src/pages');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/github/files?repo=${repo}&path=${path}`, {
      credentials: 'include',
    })
    .then(res => {
      if (res.ok) {
        return res.json();
      }
      throw new Error('Failed to fetch files');
    })
    .then(data => {
      setFiles(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [repo, path]);

  const handleFileClick = (file) => {
    if (file.type === 'dir') {
      setPath(file.path);
    } else {
      navigate(`/explorer/file?path=${file.path}`);
    }
  };

  const handleUpOneLayer = () => {
    if (path === 'src/pages') {
      return;
    }
    const newPath = path.substring(0, path.lastIndexOf('/'));
    setPath(newPath);
  };

  if (loading) {
    return <div>Loading files...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="file-explorer">
      <div className="top-bar">
        <input type="search" placeholder="Search files..." disabled />
      </div>
      <div className="file-grid">
        {Array.isArray(files) && files.map(file => (
          <FileTile key={file.sha} file={file} onClick={() => handleFileClick(file)} />
        ))}
      </div>
      <div className="bottom-toolbar">
        <button disabled>Create</button>
        <button disabled>Duplicate</button>
        <button onClick={handleUpOneLayer} disabled={!path}>Up One Layer</button>
      </div>
    </div>
  );
}

export default FileExplorer;
