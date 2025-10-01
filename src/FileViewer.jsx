import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { Buffer } from 'buffer';
import SectionRenderer from './SectionRenderer';
import SearchPreviewModal from './SearchPreviewModal';
import { unifiedParser } from './utils/unifiedParser';
import { stringifyAstroFile } from './utils/astroFileParser';
import { BackIcon, SearchIcon, EditIcon } from './icons';

function FileViewerV2({ repo, path, branch }) {
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

  const handleModalSave = (data) => {
    // data is { title, description, slug, jsonSchema }
    const newState = { ...content }; // copy existing state
    newState.frontmatter.title = data.title;
    newState.frontmatter.description = data.description;
    newState.frontmatter.jsonSchema = data.jsonSchema;

    setContent(newState);

    // Handle slug change for publishing
    const originalSlug = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
    if (data.slug && data.slug !== originalSlug) {
        setNewSlug(data.slug);
    }

    if (!isDraft) setIsDraft(true);
    localStorage.setItem(draftKey, JSON.stringify(newState)); // Save changes to the draft
    setIsHeadEditorOpen(false); // Close modal on save
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
      return <div className="leading-relaxed text-[#1d1d1f]" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <pre className="leading-relaxed text-[#1d1d1f] bg-[#f9f9f9] border border-[#d2d2d7] rounded-lg p-6 whitespace-pre-wrap break-words font-mono text-[14px]">{content.rawContent}</pre>;
  };

  const containerClasses = "flex-grow overflow-y-auto bg-white max-w-4xl mx-auto md:p-12 p-6 md:my-8 my-4 md:rounded-xl rounded-none md:shadow-[0_1px_2px_rgba(0,0,0,0.05),_0_2px_8px_rgba(0,0,0,0.03)] shadow-none md:border border-none border-[#d2d2d7]";

  if (loading) return <div className={containerClasses}>Loading...</div>;
  if (error) return <div className={containerClasses}>Error: {error}</div>;

  return (
    <div className="flex flex-col h-screen bg-[#f6f6f7] font-sans">
      <header className="flex justify-between items-center py-3 md:px-6 px-4 bg-white text-[#1d1d1f] sticky top-0 z-[100] border-b border-[#d2d2d7] h-[60px] box-border">
        <h1 className="text-base font-semibold m-0 whitespace-nowrap overflow-hidden text-ellipsis hidden md:block">{getFriendlyTitle(path)}</h1>
        <div className="flex items-center md:w-auto w-full md:justify-start justify-evenly gap-2 sm:gap-3">
          <span className="text-[13px] py-1 px-3 rounded-xl bg-[#f5f5f7] text-[#6e6e73] font-medium items-center hidden sm:flex">
            {isDraft ? 'Draft' : 'Published'}
          </span>
          <button className="flex items-center gap-1.5 bg-transparent text-[#007aff] border-none py-2 md:px-3 px-2 rounded-lg text-[14px] font-medium cursor-pointer transition-colors duration-200 ease-in-out hover:bg-[#f5f5f7] sm:flex-grow-0 flex-grow sm:justify-start justify-center" onClick={() => navigate('/explorer')} aria-label="Back to explorer">
            <BackIcon />
            <span className="hidden md:inline">Back</span>
          </button>
          <button className="flex items-center gap-1.5 bg-transparent text-[#007aff] border-none py-2 md:px-3 px-2 rounded-lg text-[14px] font-medium cursor-pointer transition-colors duration-200 ease-in-out hover:bg-[#f5f5f7] sm:flex-grow-0 flex-grow sm:justify-start justify-center" onClick={() => setIsHeadEditorOpen(true)} aria-label="Open search preview">
            <SearchIcon />
            <span className="hidden md:inline">Search Preview</span>
          </button>
          <button className="flex items-center gap-1.5 bg-transparent text-[#007aff] border-none py-2 md:px-3 px-2 rounded-lg text-[14px] font-medium cursor-pointer transition-colors duration-200 ease-in-out hover:bg-[#f5f5f7] sm:flex-grow-0 flex-grow sm:justify-start justify-center" onClick={() => navigate(`/edit/${repo}/${path}`)} aria-label="Edit file">
            <EditIcon />
            <span className="hidden md:inline">Edit</span>
          </button>
          <button className="flex items-center gap-1.5 border-none py-2 md:px-3 px-2 rounded-lg text-[14px] font-medium cursor-pointer transition-colors duration-200 ease-in-out sm:flex-grow-0 flex-grow sm:justify-start justify-center bg-[#007aff] text-white hover:bg-[#0071e3] disabled:bg-[#a0c3e8] disabled:text-[#e8f0f8] disabled:cursor-not-allowed" onClick={handlePublish} disabled={!isDraft}>
            Publish
          </button>
        </div>
      </header>

      <div className={containerClasses}>
        {isHeadEditorOpen && content.sha && (
          <SearchPreviewModal
            initialTitle={content.frontmatter.title}
            initialDescription={content.frontmatter.description}
            initialSlug={path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))}
            initialJsonSchema={content.frontmatter.jsonSchema}
            onClose={() => setIsHeadEditorOpen(false)}
            onSave={handleModalSave}
          />
        )}
        {isDraft && (
          <div className="bg-[#fff9e6] border border-[#ffd666] rounded-xl py-4 px-6 mb-8 flex justify-between items-center">
            <p className="m-0 font-medium text-[#594500]">You are viewing a draft. Your changes are not yet published.</p>
            <div className="flex gap-4">
              <button className="border py-2.5 px-5 rounded-lg text-base cursor-pointer transition-all bg-[#007aff] text-white border-transparent hover:bg-[#0071e3]" onClick={handlePublish}>Publish</button>
              <button className="border py-2.5 px-5 rounded-lg text-base cursor-pointer transition-all bg-[#ff3b30] text-white border-transparent hover:bg-[#e02c22]" onClick={handleDiscard}>Discard Draft</button>
            </div>
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
}

export default FileViewerV2;