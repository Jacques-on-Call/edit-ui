import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { marked } from 'marked';
import { Buffer } from 'buffer';
import SectionRenderer from './SectionRenderer';
import RichResultsEditor from './RichResultsEditor';
import styles from './FileViewer.module.css';
import { unifiedParser } from './utils/unifiedParser';
import { stringifyAstroFile } from './utils/astroFileParser';

const TITLE_MAX_LENGTH = 60;
const DESC_MAX_LENGTH = 160;

function FileViewer({ repo, path, branch }) {
  const [content, setContent] = useState({
    sections: null,
    rawContent: '',
    sha: null,
    body: '',
    frontmatter: {},
  });
  const [slug, setSlug] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const draftKey = `draft-content-${path}`;

  const fetchFromServer = useCallback(async () => {
    setLoading(true);
    setError(null);
    const apiPath = `/api/file?repo=${repo}&path=${path}&ref=${branch || ''}`;
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

      if (path) {
        const pathParts = path.split('/');
        const filename = pathParts.pop();
        const initialSlug = filename.substring(0, filename.lastIndexOf('.')) || filename;
        setSlug(initialSlug);
      }
      setIsDraft(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [repo, path, branch]);

  useEffect(() => {
    const localDraft = localStorage.getItem(draftKey);
    if (localDraft) {
      try {
        const draftData = JSON.parse(localDraft);
        setContent(draftData.content);
        setSlug(draftData.slug);
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

  useEffect(() => {
    if (isDraft) {
      const draftData = { content, slug };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [content, slug, isDraft, draftKey]);

  const handlePublish = async () => {
    const draftString = localStorage.getItem(draftKey);
    if (!draftString) return alert("Error: No draft found.");

    try {
      const draftData = JSON.parse(draftString);
      const { frontmatter, body } = draftData.content;
      const newFileContent = stringifyAstroFile(frontmatter, body || '');
      const fileExtension = path.substring(path.lastIndexOf('.'));
      const originalSlug = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
      const parentPath = path.substring(0, path.lastIndexOf('/'));

      const sha = draftData.content.sha;

      if (slug && slug !== originalSlug) {
        const newPath = `${parentPath}/${slug}${fileExtension}`;
        const createRes = await fetch('/api/file', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo, path: newPath, content: btoa(newFileContent), sha: null }),
        });
        if (!createRes.ok) throw new Error(`Failed to create new file: ${await createRes.text()}`);

        await fetch(`/api/file?repo=${repo}&path=${path}&sha=${sha}`, { method: 'DELETE', credentials: 'include' });

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
    setContent(prev => ({
      ...prev,
      frontmatter: { ...prev.frontmatter, sections: newSections }
    }));
    if (!isDraft) setIsDraft(true);
  };

  const handleSlugChange = (e) => {
    const newSlugValue = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    setSlug(newSlugValue);
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
      return <div className={styles.markdownPreview} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <pre className={styles.rawContentViewer}>{content.rawContent}</pre>;
  };

  if (loading) return <div className={styles.fileViewerContainer}>Loading...</div>;
  if (error) return <div className={styles.fileViewerContainer}>Error: {error}</div>;

  const { title = '', description = '' } = content.frontmatter;

  return (
    <div className={styles.fileViewerPage}>
      <div className={styles.fileViewerContainer}>
        {isDraft && (
          <div className={styles.draftBanner}>
            <p>You are viewing a draft. Your changes are not yet published.</p>
            <div className={styles.draftActions}>
              <button className={`${styles.viewerButton} ${styles.publishButton}`} onClick={handlePublish}>Publish</button>
              <button className={`${styles.viewerButton} ${styles.discardButton}`} onClick={handleDiscard}>Discard</button>
            </div>
          </div>
        )}
        <header className={styles.viewerHeader}>
          <h1>{getFriendlyTitle(path)}</h1>
          <div className={styles.actionButtons}>
            <button className={styles.viewerButton} onClick={() => navigate('/explorer')}>Back</button>
            <button className={`${styles.viewerButton} ${styles.editButton}`} onClick={() => navigate(`/edit/${repo}/${path}`)}>Edit Content</button>
          </div>
        </header>

        <main className={styles.mainContent}>
          <div className={styles.previewColumn}>
            {renderContent()}
          </div>
          <div className={styles.editorColumn}>
            <div className={styles.editorCard}>
              <h3>Search Result Preview</h3>
              <div className={styles.serpPreview}>
                <div className={styles.serpPreviewTitle}>{title || 'Your Title Here'}</div>
                <div className={styles.serpPreviewUrl}>www.strategycontent.agency/{slug}</div>
                <div className={styles.serpPreviewDescription}>{description || 'Your meta description will appear here.'}</div>
              </div>
            </div>

            <div className={styles.editorCard}>
              <h3>Metadata</h3>
              <div className={styles.formGroup}>
                <label htmlFor="slug">URL Slug</label>
                <input id="slug" type="text" value={slug} onChange={handleSlugChange} placeholder="your-page-slug" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="title">SEO Title</label>
                <input id="title" type="text" value={title} onChange={(e) => handleFrontmatterChange({ ...content.frontmatter, title: e.target.value })} placeholder="Title for search results" maxLength={TITLE_MAX_LENGTH + 10} />
                <span className={`${styles.charCounter} ${title.length > TITLE_MAX_LENGTH ? styles.overLimit : ''}`}>{title.length}/{TITLE_MAX_LENGTH}</span>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="description">Meta Description</label>
                <textarea id="description" value={description} onChange={(e) => handleFrontmatterChange({ ...content.frontmatter, description: e.target.value })} placeholder="Summary for search results" rows="4" maxLength={DESC_MAX_LENGTH + 20} />
                <span className={`${styles.charCounter} ${description.length > DESC_MAX_LENGTH ? styles.overLimit : ''}`}>{description.length}/{DESC_MAX_LENGTH}</span>
              </div>
            </div>

            <div className={styles.editorCard}>
              <h3>Rich Results (JSON Schema)</h3>
              <RichResultsEditor
                sections={content.sections || []}
                onUpdate={handleSectionUpdate}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default FileViewer;