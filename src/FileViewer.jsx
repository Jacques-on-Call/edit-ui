import { useState, useEffect } from 'react';

function FileViewer({ repo, path }) {
  const [content, setContent] = useState('');
  const [sha, setSha] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    // The API endpoint was hardcoded to an old auth service.
    // The README implies the API is at the same origin, e.g., /api/file
    fetch(`/api/file?repo=${repo}&path=${path}`, {
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
    fetch('/api/file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        repo,
        path,
        content: btoa(content), // Content should be base64 encoded
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

  const getFriendlyTitle = (filePath) => {
    if (!filePath) return '';
    const filename = filePath.split('/').pop();
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex > 0) { // Ensure it's not a leading dot
      return filename.substring(0, lastDotIndex);
    }
    return filename;
  };

  const title = getFriendlyTitle(path);

  if (loading) {
    return <div>Loading file...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (isEditing) {
    return (
      <div className="file-editor">
        <h3>Editing: {title}</h3>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} />
        <button onClick={handleSave}>Save</button>
        <button onClick={() => setIsEditing(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="file-viewer">
      <h3>{title}</h3>
      <button onClick={() => setIsEditing(true)}>Edit</button>
      <pre>{content}</pre>
    </div>
  );
}

export default FileViewer;
