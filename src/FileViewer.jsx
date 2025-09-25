import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { parseJsFrontmatter } from './utils/frontmatterParser';
import SectionRenderer from './SectionRenderer';
import HeadEditor from './HeadEditor';
import ErrorBoundary from './ErrorBoundary'; // Import the new ErrorBoundary
import './FileViewer.css';

// Per Copilot's suggestion, this function ensures the data conforms to a predictable shape.
function normalizeFileContent(data, rawFileContent) {
  const frontmatter = data.frontmatter || {};
  const sections = Array.isArray(data.sections) ? data.sections : [];

  const normalizedSections = sections.map(s => ({
    type: s.type || 'unknown',
    content: s.content ?? s.body ?? s.html ?? '',
    ...s,
  }));

  return {
    ...data,
    rawContent: rawFileContent, // Ensure rawContent is always present
    frontmatter,
    sections: normalizedSections,
  };
}


function FileViewer({ repo, path }) {
  const [isHeadEditorOpen, setIsHeadEditorOpen] = useState(false);
  const [content, setContent] = useState({
    sections: null,
    rawContent: '',
    sha: null,
    body: '',
    frontmatter: {},
  });
  const [parseWarnings, setParseWarnings] = useState([]);
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSlug, setNewSlug] = useState(null);
  const navigate = useNavigate();
  const draftKey = `draft-content-${path}`;

  useEffect(() => {
    if (isDraft && !loading) {
      localStorage.setItem(draftKey, JSON.stringify(content));
    }
  }, [content, isDraft, loading, draftKey]);

  const fetchFromServer = useCallback(() => {
    setLoading(true);
    setParseWarnings([]); // Reset warnings on new fetch
    fetch(`/api/file?repo=${repo}&path=${path}`, { credentials: 'include' })
    .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch file content')))
    .then(data => {
      const decodedContent = atob(data.content);
      const frontmatter = parseJsFrontmatter(decodedContent);

      // The parser returns the 'meta' object directly. We need to structure it
      // correctly for the rest of the component.
      const fileData = {
        sha: data.sha,
        frontmatter: frontmatter,
        sections: frontmatter.sections || [], // Ensure sections array exists
        rawContent: decodedContent,
      };

      // Now, pass the correctly structured object to the normalizer.
      let normalized = normalizeFileContent(fileData, decodedContent);

      // Smart Default Logic: If no top-level image is set, try to find one in a hero section.
      if (!normalized.frontmatter.image && normalized.sections) {
        const heroSection = normalized.sections.find(s => s.type === 'hero' && s.image);
        if (heroSection) {
          // Promote the hero image to the top-level for the preview
          normalized.frontmatter.image = heroSection.image;
          normalized.frontmatter.imageAlt = heroSection.imageAlt;
        }
      }

      if (normalized.sections.length === 0 && decodedContent) {
        setParseWarnings(prev => [...prev, 'No structured sections were found in this file.']);
      }

      setContent(normalized);
      setIsDraft(false);
    })
    .catch(err => {
      setError(err.message);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [repo, path]);

  useEffect(() => {
    const loadContent = () => {
      const localDraft = localStorage.getItem(draftKey);
      if (localDraft) {
        try {
          const draftData = JSON.parse(localDraft);
          setContent(draftData);
          setIsDraft(true);
          setLoading(false);
        } catch (e) {
          console.error("Failed to parse draft, fetching from server.", e);
          fetchFromServer();
        }
      } else {
        fetchFromServer();
      }
    };

    loadContent();

    // Add a storage event listener to reload content if the draft is updated in another tab/window
    const handleStorageChange = (e) => {
      if (e.key === draftKey) {
        loadContent();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [draftKey, fetchFromServer]);

  const handlePublish = async () => {
    const draftString = localStorage.getItem(draftKey);
    if (!draftString) return alert("Error: No draft found to publish.");

    try {
        const draftData = JSON.parse(draftString);
        // We need the *original* raw content to replace the meta block, not the draft's.
        // Let's fetch it again to be safe.
        const res = await fetch(`/api/file?repo=${repo}&path=${path}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Could not fetch original file to perform update.');
        const originalFileData = await res.json();
        const originalDecodedContent = atob(originalFileData.content);

        // Reconstruct the `meta` object string from the draft data
        const newMetaString = `const meta = ${JSON.stringify(draftData.frontmatter, null, 2)};`;
        const metaRegex = /const\s+meta\s*=\s*{([\s\S]*?)};/sm;

        // Replace the meta block in the original content
        const newFileContent = originalDecodedContent.replace(metaRegex, newMetaString);

        const fileExtension = path.substring(path.lastIndexOf('.'));
        const originalSlug = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
        const parentPath = path.substring(0, path.lastIndexOf('/'));

        if (newSlug && newSlug !== originalSlug) {
            const newPath = `${parentPath}/${newSlug}${fileExtension}`;
            const createRes = await fetch('/api/file', {
                method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo, path: newPath, content: btoa(newFileContent), sha: null }),
            });
            if (!createRes.ok) throw new Error(`Failed to create new file at '${newPath}'.`);

            const deleteRes = await fetch(`/api/file?repo=${repo}&path=${path}&sha=${originalFileData.sha}`, { method: 'DELETE', credentials: 'include' });
            if (!deleteRes.ok) {
                alert(`Rename partially failed! The new page was created at '${newSlug}', but the old page could not be removed. Please remove it manually.`);
            } else {
                alert('Page successfully renamed and published!');
            }
            localStorage.removeItem(draftKey);
            navigate(`/explorer/file?path=${newPath}`);
        } else {
            const updateRes = await fetch('/api/file', {
                method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo, path, content: btoa(newFileContent), sha: originalFileData.sha }),
            });
            if (!updateRes.ok) throw new Error('Publish failed.');
            alert('Publish successful!');
            localStorage.removeItem(draftKey);
            fetchFromServer();
        }
    } catch (err) {
        alert(`An error occurred during publishing: ${err.message}`);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard your draft?')) {
      localStorage.removeItem(draftKey);
      fetchFromServer();
    }
  };

  const handleFrontmatterChange = (updatedFrontmatter) => {
    setContent(prev => normalizeFileContent({ ...prev, frontmatter: updatedFrontmatter }, prev.rawContent));
    if (!isDraft) setIsDraft(true);
  };

  const handleSectionUpdate = (newSections) => {
    setContent(prev => normalizeFileContent({ ...prev, sections: newSections, frontmatter: { ...prev.frontmatter, sections: newSections } }, prev.rawContent));
    if (!isDraft) setIsDraft(true);
  };

  const handleSlugUpdate = (slug) => {
    setNewSlug(slug);
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

  const title = getFriendlyTitle(path);

  const renderContent = () => {
    if (!content) return null;

    if (path.endsWith('.astro')) {
        if (!Array.isArray(content.sections) || content.sections.length === 0) {
            return (
                <div className="no-content-warning">
                    <p>No structured content available for preview.</p>
                    {parseWarnings.length > 0 && (
                        <div className="parse-warnings" style={{ border: '1px solid orange', padding: '10px', margin: '10px' }}>
                            <strong>Parser warnings:</strong>
                            <ul>{parseWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                        </div>
                    )}
                    <h4>Raw File Content:</h4>
                    <pre className="raw-content-viewer">{content.rawContent}</pre>
                </div>
            );
        }
        return <SectionRenderer sections={content.sections} />;
    }

    if (path.endsWith('.md')) {
        const html = content.body ? marked(content.body) : marked(content.rawContent);
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
      <ErrorBoundary>
        {renderContent()}
      </ErrorBoundary>
    </div>
  );
}

export default FileViewer;