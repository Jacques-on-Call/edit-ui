import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsyaml from 'js-yaml';
import { marked } from 'marked';
import SectionRenderer from './SectionRenderer';
import './FileViewer.css';

function FileViewer({ repo, path }) {
  const [content, setContent] = useState({
    sections: null,
    rawContent: '',
    sha: null,
    body: '',
    frontmatter: {},
  });
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const draftKey = `draft-content-${path}`;

  const fetchFromServer = () => {
    setLoading(true);
    fetch(`/api/file?repo=${repo}&path=${path}`, { credentials: 'include' })
    .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch')))
    .then(data => {
      const decodedContent = atob(data.content);
      const match = decodedContent.match(/^---\n(.*)\n---\n(.*)/s);
      let fm = {};
      let body = decodedContent;
      if (match) {
        fm = jsyaml.load(match[1]);
        body = match[2] || '';
      }
      setContent({
        sections: fm.sections,
        rawContent: decodedContent,
        sha: data.sha,
        body,
        frontmatter: fm,
      });
      setLoading(false);
      setIsDraft(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  };

  useEffect(() => {
    const localDraft = localStorage.getItem(draftKey);
    if (localDraft) {
      try {
        const draftData = JSON.parse(localDraft);
        setContent({ ...draftData, rawContent: 'Draft loaded' });
        setIsDraft(true);
        setLoading(false);
      } catch (e) { fetchFromServer(); }
    } else {
      fetchFromServer();
    }
  }, [repo, path, draftKey]);

  const handlePublish = async () => {
    const draftString = localStorage.getItem(draftKey);
    if (!draftString) return alert("Error: No draft found.");

    try {
      const draftData = JSON.parse(draftString);
      let newContent;

      if (path.endsWith('.md')) {
        const fmString = Object.keys(draftData.frontmatter).length
          ? `---\n${jsyaml.dump(draftData.frontmatter)}---\n`
          : '';
        newContent = `${fmString}${draftData.body}`;
      } else { // .astro file
        const newFrontmatter = { ...draftData.frontmatter, sections: draftData.sections };
        newContent = `---\n${jsyaml.dump(newFrontmatter)}---\n${draftData.body}`;
      }

      const res = await fetch('/api/file', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo, path, content: btoa(newContent), sha: draftData.sha,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Publish failed: ${errorData.message || res.statusText}`);
      }
      alert('Publish successful!');
      localStorage.removeItem(draftKey);
      fetchFromServer();
    } catch (err) {
      alert(`Error publishing file: ${err.message}`);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard your draft?')) {
      localStorage.removeItem(draftKey);
      fetchFromServer();
    }
  };

  const getFriendlyTitle = (filePath) => {
    if (!filePath) return '';
    const filename = filePath.split('/').pop();
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex > 0) {
      // Capitalize the first letter for a nicer look
      const name = filename.substring(0, lastDotIndex);
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return filename;
  };

  const title = getFriendlyTitle(path);

  const renderContent = () => {
    // For .astro files, render sections if they exist
    if (path.endsWith('.astro') && content.sections) {
      return <SectionRenderer sections={content.sections} />;
    }
    // For .md files, render the body as markdown
    if (path.endsWith('.md')) {
      const html = content.body ? marked(content.body) : marked(content.rawContent);
      return <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    // Fallback for other file types or astro files without sections
    return <pre className="raw-content-viewer">{content.rawContent}</pre>;
  };

  if (loading) return <div className="file-viewer-container">Loading...</div>;
  if (error) return <div className="file-viewer-container">Error: {error}</div>;

  return (
    <div className="file-viewer-container">
      {isDraft && (
        <div className="draft-banner">
          <p>You are viewing a draft. Your changes are not yet published.</p>
          <div className="draft-actions">
            <button className="viewer-button publish-button" onClick={handlePublish}>Publish</button>
            <button className="viewer-button discard-button" onClick={handleDiscard}>Discard Draft</button>
          </div>
        </div>
      )}
      <div className="file-viewer-header">
        <h1>{title}</h1>
        <div className="action-buttons">
          <button className="viewer-button" onClick={() => navigate('/explorer')}>Back to Explorer</button>
          <button className="viewer-button edit-button" onClick={() => navigate(`/edit/${repo}/${path}`)}>Edit</button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}

export default FileViewer;
