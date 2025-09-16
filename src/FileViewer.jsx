import { useState, useEffect } from 'react';

function FileViewer({ repo, path }) {
  const [content, setContent] = useState('');
  const [sha, setSha] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/github/file?repo=${repo}&path=${path}`, {
      credentials: 'include',
    })
    .then(res => {
      if (res.ok) {
        return res.json();
      }
      throw new Error('Failed to fetch file content');
    })
    .then(data => {
      setContent(atob(data.content));
      setSha(data.sha);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [repo, path]);

  const handleSave = () => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/github/file`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        repo,
        path,
        content,
        sha,
      }),
    })
    .then(res => {
      if (res.ok) {
        setIsEditing(false);
      } else {
        throw new Error('Failed to save file');
      }
    })
    .catch(err => {
      setError(err.message);
    });
  };

  if (loading) {
    return <div>Loading file...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (isEditing) {
    return (
      <div className="file-editor">
        <h3>Editing: {path}</h3>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} />
        <button onClick={handleSave}>Save</button>
        <button onClick={() => setIsEditing(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="file-viewer">
      <h3>{path}</h3>
      <button onClick={() => setIsEditing(true)}>Edit</button>
      <pre>{content}</pre>
    </div>
  );
}

export default FileViewer;
