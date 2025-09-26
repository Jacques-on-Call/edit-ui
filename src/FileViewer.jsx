import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import SectionRenderer from './SectionRenderer';
import HeadEditor from './HeadEditor';
import './FileViewer.css';
import { parseAstroFile, stringifyAstroFile } from './utils/astroFileParser';

// Note: DebugPanel is not ported yet, so it's commented out.
// import DebugPanel from './components/DebugPanel';

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
  const [showDebug, setShowDebug] = useState(true);
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSlug, setNewSlug] = useState(null);
  const navigate = useNavigate();
  const draftKey = `draft-content-${path}`;

  // This effect runs when content changes, saving it to a local draft
  useEffect(() => {
    // Only save if it's a draft and not in the initial loading state
    if (isDraft && !loading) {
      localStorage.setItem(draftKey, JSON.stringify(content));
    }
  }, [content, isDraft, loading, draftKey]);

  const fetchFromServer = useCallback(async () => {
    setLoading(true);
    setError(null);
    const apiPath = `/api/file?repo=${repo}&path=${path}&ref=${branch || ''}`;
    setDebug(d => ({ ...d, apiPath, notes: ['Requesting file'] }));
    try {
      const res = await fetch(apiPath, { credentials: 'include' });
      const status = res.status;
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch file (status: ${status}): ${errorText}`);
      }
      const json = await res.json();
      const debugBase = { apiPath, status, apiResponse: json };

      let decoded = null;
      if (json && (json.content || json.encoding)) {
        try {
          decoded = json.encoding === 'base64' ? atob(json.content) : (json.decoded || json.content);
        } catch (e) {
          decoded = json.content; // fallback
        }
      } else if (json && typeof json === 'string') {
        decoded = json;
      }
      debugBase.decoded = decoded;
      debugBase.decodedSnippet = decoded ? decoded.slice(0, 2000) : null;
      debugBase.sha = json && json.sha;

      // Use the new Astro parser for .astro files, with a fallback for others.
      const { model, trace } = await parseAstroFile(decoded || '');
      debugBase.parse = trace || {};

      if (!model) {
        debugBase.notes = ['No model parsed; showing raw content'];
        setContent({
          sections: [],
          rawContent: decoded,
          sha: json.sha,
          body: '',
          frontmatter: {},
        });
      } else {
        debugBase.notes = ['Model parsed'];
        const fm = model.frontmatter || {};
        setContent({
            sections: fm.sections || [],
            rawContent: decoded,
            sha: json.sha,
            body: model.body || '',
            frontmatter: fm,
        });
      }
      setDebug(debugBase);
      setIsDraft(false);
    } catch (err) {
      setError(err.message);
      setDebug(d => ({ ...d, error: err && err.message, notes: ['Fetch error', String(err)] }));
    } finally {
      setLoading(false);
    }
  }, [repo, path, branch]);

  useEffect(() => {
    const localDraft = localStorage.getItem(draftKey);
    if (localDraft) {
      try {
        const draftData = JSON.parse(localDraft);
        setContent({ ...draftData, rawContent: 'Draft loaded' });
        setIsDraft(true);
        setLoading(false);
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
      // The body of the content is now the source of truth, not the original rawContent.
      const { frontmatter, body, sha } = draftData;

      // Use the new robust stringify function
      const newFileContent = stringifyAstroFile(frontmatter, body || '');

      const fileExtension = path.substring(path.lastIndexOf('.'));
      const originalSlug = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
      const parentPath = path.substring(0, path.lastIndexOf('/'));

      // Check if slug has changed
      if (newSlug && newSlug !== originalSlug) {
        // --- RENAME LOGIC ---
        const newPath = `${parentPath}/${newSlug}${fileExtension}`;

        // 1. Create the new file
        const createRes = await fetch('/api/file', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo, path: newPath, content: btoa(newFileContent), sha: null }), // No SHA for new file
        });

        if (!createRes.ok) {
            const errorData = await createRes.json();
            throw new Error(`Failed to create new file at '${newPath}': ${errorData.message || createRes.statusText}`);
        }
        await createRes.json(); // Consume the response but don't need the data

        // 2. Delete the old file
        const deleteRes = await fetch(`/api/file?repo=${repo}&path=${path}&sha=${draftData.sha}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!deleteRes.ok) {
            // This is a partial failure state. The new file was created, but the old one wasn't deleted.
            // Inform the user clearly.
            alert(`Rename partially failed! The new page was created at '${newSlug}', but we could not remove the old page. Please remove it manually.`);
        } else {
            alert('Page successfully renamed and published!');
        }

        // 3. Cleanup and navigate
        localStorage.removeItem(draftKey);
        navigate(`/explorer/file?path=${newPath}`); // Navigate to the new page

      } else {
        // --- UPDATE IN-PLACE LOGIC ---
        const res = await fetch('/api/file', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo, path, content: btoa(newFileContent), sha: sha }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Publish failed: ${errorData.message || res.statusText}`);
        }
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
    // When head is edited, update content and ensure we are in a draft state
    setContent(prev => ({
        ...prev,
        frontmatter: updatedFrontmatter,
    }));
    if (!isDraft) {
        setIsDraft(true);
    }
  };

  const handleSectionUpdate = (newSections) => {
    setContent(prev => ({
        ...prev,
        sections: newSections,
        frontmatter: { ...prev.frontmatter, sections: newSections },
    }));
    if (!isDraft) {
        setIsDraft(true);
    }
  };

  const handleSlugUpdate = (slug) => {
    setNewSlug(slug);
    // Also update the local draft so the slug change is persisted
    // before publishing.
    setContent(prev => ({ ...prev }));
    if (!isDraft) {
        setIsDraft(true);
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
    // For .astro files, render sections if they exist and are not empty
    if (path.endsWith('.astro')) {
      if (content.sections && content.sections.length > 0) {
        return <SectionRenderer sections={content.sections} />;
      }
      return <p>No viewable content found in sections.</p>;
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
          onSlugUpdate={handleSlugUpdate}
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
        <h1>{title}</h1>
        <div className="action-buttons">
          <button className="viewer-button" onClick={() => navigate('/explorer')}>Back</button>
          <button className="viewer-button" onClick={() => setIsHeadEditorOpen(true)}>Search Preview</button>
          <button className="viewer-button edit-button" onClick={() => navigate(`/edit/${repo}/${path}`)}>Edit</button>
        </div>
      </div>
      {renderContent()}
      {/* {showDebug && <DebugPanel debug={{ ...debug, editorReady: false }} onClose={() => setShowDebug(false)} />} */}
    </div>
  );
}

export default FileViewer;
