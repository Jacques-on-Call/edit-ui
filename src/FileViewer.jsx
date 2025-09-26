import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { Buffer } from 'buffer';
import SectionRenderer from './SectionRenderer';
import HeadEditor from './HeadEditor';
import './FileViewer.css';
import { unifiedParser } from './utils/unifiedParser';
import { stringifyAstroFile } from './utils/astroFileParser';

function FileViewer({ repo, path, branch }) {
  const [isHeadEditorOpen, setIsHeadEditorOpen] = useState(false);
  const [content, setContent] = useState({
    sections: null,
    rawContent: '',
    sha: null,
    body: '',
    frontmatter: {},
  });
  const [debug, setDebug] = useState({ notes: [] });
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSlug, setNewSlug] = useState(null);
  const navigate = useNavigate();
  const draftKey = `draft-content-${path}`;

  const fetchFromServer = useCallback(async () => {
    setLoading(true);
    setError(null);
    const apiPath = `/api/file?repo=${repo}&path=${path}&ref=${branch || ''}`;
    setDebug(d => ({ ...d, apiPath, notes: ['Requesting file from server'] }));
    try {
      const res = await fetch(apiPath, { credentials: 'include' });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch file (status: ${res.status}): ${errorText}`);
      }
      const json = await res.json();
      const decoded = Buffer.from(json.content, 'base64').toString('utf8');
      const { model } = await unifiedParser(decoded, path);

      setContent({
        sections: model.frontmatter.sections || [],
        rawContent: decoded,
        sha: json.sha,
        body: model.body || '',
        frontmatter: model.frontmatter || {},
      });
      setIsDraft(false);
    } catch (err) {
      setError(err.message);
      setDebug(d => ({ ...d, error: err.message, notes: ['Fetch error', String(err)] }));
    } finally {
      setLoading(false);
    }
  }, [repo, path, branch]);

  useEffect(() => {
    const localDraft = localStorage.getItem(draftKey);
    if (localDraft) {
      try {
        const draftData = JSON.parse(localDraft);
        setContent(draftData); // Load the entire draft state
        setIsDraft(true);
        setLoading(false);
        setDebug(d => ({ ...d, notes: ['Loaded content from local draft.'] }));
      } catch (e) {
        console.error("Failed to parse draft, fetching from server.", e);
        fetchFromServer();
      }
    } else {
      fetchFromServer();
    }
  }, [draftKey, fetchFromServer]);

  const handlePublish = async () => {
    const draftString = localStorage.getItem(draftKey);
    if (!draftString) return alert("Error: No draft found.");

    try {
      const draftData = JSON.parse(draftString);
      const { frontmatter, body, sha } = draftData;
      const newFileContent = stringifyAstroFile(frontmatter, body || '');
      const fileExtension = path.substring(path.lastIndexOf('.'));
      const originalSlug = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
      const parentPath = path.substring(0, path.lastIndexOf('/'));

      if (newSlug && newSlug !== originalSlug) {
        const newPath = `${parentPath}/${newSlug}${fileExtension}`;
        const createRes = await fetch('/api/file', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo, path: newPath, content: btoa(newFileContent), sha: null }),
        });
        if (!createRes.ok) throw new Error(`Failed to create new file: ${await createRes.text()}`);

        await fetch(`/api/file?repo=${repo}&path=${path}&sha=${draftData.sha}`, { method: 'DELETE', credentials: 'include' });

        alert('Page successfully renamed and published!');
        localStorage.removeItem(draftKey);
        navigate(`/explorer/file?path=${newPath}`);

      } else {
        const res = await fetch('/api/file', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo, path, content: btoa(newFileContent), sha: sha }),
        });
        if (!res.ok) throw new Error(`Publish failed: ${await res.text()}`);
        alert('Publish successful!');
        localStorage.removeItem(draftKey);
        fetchFromServer();
      }
    } catch (err) {
      alert(`An error occurred: ${err.message}`);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard your draft?')) {
      localStorage.removeItem(draftKey);
      fetchFromServer();
    }
  };

  const handleFrontmatterChange = (updatedFrontmatter) => {
    setContent(prev => ({ ...prev, frontmatter: updatedFrontmatter }));
    if (!isDraft) setIsDraft(true);
  };

  const handleSectionUpdate = (newSections) => {
    setContent(prev => ({ ...prev, frontmatter: { ...prev.frontmatter, sections: newSections } }));
    if (!isDraft) setIsDraft(true);
  };

  const getFriendlyTitle = (filePath) => {
    if (!filePath) return '';
    const filename = filePath.split('/').pop();
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const name = filename.substring(0, lastDotIndex);
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return filename;
  };

  const renderContent = () => {
    if (path.endsWith('.astro')) {
      if (content.sections && content.sections.length > 0) {
        return <SectionRenderer sections={content.sections} />;
      }
      return <p>No viewable content found in sections.</p>;
    }
    if (path.endsWith('.md')) {
      const html = marked(content.body || '');
      return <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <pre className="raw-content-viewer">{content.rawContent}</pre>;
  };

  if (loading) return <div className="file-viewer-container">Loading...</div>;
  if (error) return <div className="file-viewer-container">Error: {error}</div>;

  return (
    <div className="file-viewer-container">
       {isHeadEditorOpen && content.sha && (
        <HeadEditor
          title={content.frontmatter.title}
          description={content.frontmatter.description}
          frontmatter={content.frontmatter}
          onUpdate={handleFrontmatterChange}
          onClose={() => setIsHeadEditorOpen(false)}
          path={path}
          sections={content.sections}
          onSectionUpdate={handleSectionUpdate}
        />
      )}
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
        <h1>{getFriendlyTitle(path)}</h1>
        <div className="action-buttons">
          <button className="viewer-button" onClick={() => navigate('/explorer')}>Back</button>
          <button className="viewer-button" onClick={() => setIsHeadEditorOpen(true)}>Search Preview</button>
          <button className="viewer-button edit-button" onClick={() => navigate(`/edit/${repo}/${path}`)}>Edit</button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}

export default FileViewer;