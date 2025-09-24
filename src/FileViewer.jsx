import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { parseJsFrontmatter } from './utils/frontmatterParser';
import SectionRenderer from './SectionRenderer';
import HeadEditor from './HeadEditor';
import './FileViewer.css';

function FileViewer({ repo, path }) {
  const [isHeadEditorOpen, setIsHeadEditorOpen] = useState(false);
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

  const fetchFromServer = useCallback(() => {
    setLoading(true);
    fetch(`/api/file?repo=${repo}&path=${path}`, { credentials: 'include' })
    .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch')))
    .then(data => {
      const decodedContent = atob(data.content);
      const fm = parseJsFrontmatter(decodedContent);

      setContent({
        sections: fm.sections || [],
        rawContent: decodedContent,
        sha: data.sha,
        body: '',
        frontmatter: fm,
      });
      setLoading(false);
      setIsDraft(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [repo, path]);

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
      const { frontmatter, rawContent, sha } = draftData;

      // New JS Frontmatter Saving Logic
      const newMetaString = `const meta = ${JSON.stringify(frontmatter, null, 2)};`;
      const metaRegex = /const\s+meta\s*=\s*{([\s\S]*?)};/m;

      // Replace the old meta block with the new one in the original raw content
      const newFileContent = rawContent.replace(metaRegex, newMetaString);

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
    </div>
  );
}

export default FileViewer;
