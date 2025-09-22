import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsyaml from 'js-yaml';
import SectionRenderer from './SectionRenderer';
import './FileViewer.css';

function FileViewer({ repo, path }) {
  const [rawContent, setRawContent] = useState('');
  const [sections, setSections] = useState(null);
  const [sha, setSha] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setSections(null);
    setRawContent('');

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
      const decodedContent = atob(data.content);
      setRawContent(decodedContent);
      setSha(data.sha);

      if (path.endsWith('.astro')) {
        try {
          const match = decodedContent.match(/^---\n(.*)\n---\n/s);
          if (match) {
            const frontmatter = jsyaml.load(match[1]);
            if (frontmatter && frontmatter.sections) {
              setSections(frontmatter.sections);
            } else {
              setSections([]);
            }
          }
        } catch (e) {
          console.error("Error parsing frontmatter:", e);
          setError("Failed to parse file frontmatter.");
        }
      }
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [repo, path]);

  const handleSave = () => {
    // ... (save logic is unchanged)
  };

  const getFriendlyTitle = (filePath) => {
    if (!filePath) return '';
    const filename = filePath.split('/').pop();
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex > 0) {
      return filename.substring(0, lastDotIndex);
    }
    return filename;
  };

  const title = getFriendlyTitle(path);

  const renderContent = () => {
    if (sections) {
      return <SectionRenderer sections={sections} />;
    }
    return <pre className="raw-content-viewer">{rawContent}</pre>;
  };

  if (loading) {
    return <div className="file-viewer-container">Loading file...</div>;
  }

  if (error) {
    return <div className="file-viewer-container">Error: {error}</div>;
  }

  if (isEditing) {
    return (
      <div className="file-viewer-container">
        <div className="file-viewer-header">
            <h1>Editing: {title}</h1>
        </div>
        <textarea style={{ width: '100%', height: '60vh', border: '1px solid #ccc', borderRadius: '6px' }} value={rawContent} onChange={(e) => setRawContent(e.target.value)} />
        <div style={{marginTop: '1rem', display: 'flex', gap: '1rem'}}>
            <button className="viewer-button edit-button" onClick={handleSave}>Save Changes</button>
            <button className="viewer-button" onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="file-viewer-container">
      <div className="file-viewer-header">
        <h1>{title}</h1>
        <div className="action-buttons">
            <button className="viewer-button" onClick={() => navigate('/explorer')}>Back to Explorer</button>
            <button className="viewer-button edit-button" onClick={() => navigate(`/edit/${path}`)}>Edit</button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}

export default FileViewer;
