import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { parseFrontmatter } from './utils/frontmatterParser'; // Use the new robust parser
import SectionRenderer from './SectionRenderer';
import HeadEditor from './HeadEditor';
import './FileViewer.css';

function FileViewer({ repo, path }) {
  const [isHeadEditorOpen, setIsHeadEditorOpen] = useState(false);
  const [fileData, setFileData] = useState(null); // Will hold { sha, frontmatter, body, sections, rawContent }
  const [parseFailed, setParseFailed] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const draftKey = `draft-content-${path}`;

  const fetchFromServer = useCallback(() => {
    setLoading(true);
    setError(null);
    setParseFailed(false);
    console.log(`DEBUG: Fetching /api/file?repo=${repo}&path=${path}`);

    fetch(`/api/file?repo=${repo}&path=${path}`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`API Error: ${res.statusText}`)))
      .then(data => {
        console.log(`DEBUG: API response { sha: "${data.sha}", size: ${data.content.length} }`);
        const decodedContent = atob(data.content);
        console.log(`DEBUG: Decoded content startsWith: "${decodedContent.substring(0, 40).replace(/\n/g, '\\n')}..."`);

        const parsed = parseFrontmatter(decodedContent);
        const frontmatter = parsed.data;
        const body = parsed.content;

        if (Object.keys(frontmatter).length === 0 && body.length > 0) {
            console.log("DEBUG: Parsing resulted in no frontmatter. Displaying raw content.");
            setParseFailed(true);
        }

        setFileData({
          sha: data.sha,
          frontmatter: frontmatter,
          body: body,
          sections: frontmatter.sections || [],
          rawContent: decodedContent,
        });
        setIsDraft(false);
      })
      .catch(err => {
        console.error("Fetch or parse error:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [repo, path]);

  useEffect(() => {
    const localDraft = localStorage.getItem(draftKey);
    if (localDraft) {
      try {
        setFileData(JSON.parse(localDraft));
        setIsDraft(true);
        setLoading(false);
      } catch (e) {
        fetchFromServer();
      }
    } else {
      fetchFromServer();
    }
  }, [draftKey, fetchFromServer]);

  // This simple effect handles saving the entire fileData object to the draft.
  useEffect(() => {
      if (isDraft && !loading && fileData) {
          localStorage.setItem(draftKey, JSON.stringify(fileData));
      }
  }, [fileData, isDraft, loading, draftKey]);


  const handlePublish = async () => {
    // This function will need to be updated to handle both YAML and JS formats,
    // but for now, we focus on making the viewer robust.
    alert("Publishing logic needs to be updated for multi-format support.");
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard your draft?')) {
      localStorage.removeItem(draftKey);
      fetchFromServer();
    }
  };

  // Generic update handler for any part of the fileData
  const handleDataUpdate = (newData) => {
    setFileData(prev => ({...prev, ...newData}));
    if (!isDraft) setIsDraft(true);
  }

  const renderContent = () => {
    if (!fileData) return null;

    if (parseFailed) {
        return (
            <div className="no-content-warning">
                <h4 style={{color: 'orange'}}>Warning: Frontmatter not recognized.</h4>
                <p>Showing raw file content. Any edits will be saved to the raw file.</p>
                <pre className="raw-content-viewer">{fileData.rawContent}</pre>
            </div>
        );
    }

    if (fileData.sections && fileData.sections.length > 0) {
      return <SectionRenderer sections={fileData.sections} />;
    }

    if (fileData.body) {
      const html = marked(fileData.body);
      return <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} />;
    }

    return <p>No viewable content found.</p>;
  };

  if (loading) return <div className="file-viewer-container">Loading...</div>;
  if (error) return <div className="file-viewer-container">Error: {error}</div>;

  return (
    <div className="file-viewer-container">
       {isHeadEditorOpen && fileData.sha && (
        <HeadEditor
          frontmatter={fileData.frontmatter}
          onUpdate={(newFm) => handleDataUpdate({ frontmatter: newFm })}
          onClose={() => setIsHeadEditorOpen(false)}
          path={path}
        />
      )}
      {isDraft && (
        <div className="draft-banner">
          <p>You are viewing a draft.</p>
          <div className="draft-actions">
            <button className="viewer-button publish-button" onClick={handlePublish}>Publish</button>
            <button className="viewer-button discard-button" onClick={handleDiscard}>Discard Draft</button>
          </div>
        </div>
      )}
      <div className="file-viewer-header">
        <h1>{fileData.frontmatter.title || path.split('/').pop()}</h1>
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