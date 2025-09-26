import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import matter from 'gray-matter';
import { unifiedParser } from './utils/unifiedParser';
import { stringifyAstroFile } from './utils/astroFileParser';
import SectionEditor from './SectionEditor';
import TopToolbar from './TopToolbar';
import './Editor.css';

const Editor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorInstance, setEditorInstance] = useState(null);
  const [activeFormats, setActiveFormats] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const pathWithRepo = location.pathname.replace('/edit/', '');
  const pathParts = pathWithRepo.split('/');
  const repoOwner = pathParts.shift();
  const repoName = pathParts.shift();
  const repo = `${repoOwner}/${repoName}`;
  const path = pathParts.join('/');
  const draftKey = `draft-content-${path}`;
  const isAstroFile = path.endsWith('.astro');
  const isMarkdownFile = path.endsWith('.md');

  // Function to combine content from text_block sections into a single string for Astro files
  const getCombinedContent = (sections) => {
    if (!sections) return '';
    return sections
      .filter(section => section.type === 'text_block' && section.content)
      .map(section => section.content)
      .join('<br />');
  };

  // Load content from draft or server
  useEffect(() => {
    const loadFile = async () => {
      setLoading(true);
      setError(null);

      const localDraft = localStorage.getItem(draftKey);
      if (localDraft) {
        try {
          const draftData = JSON.parse(localDraft);
          setFileData(draftData);
          setLoading(false);
          return;
        } catch (e) {
          console.error("Error parsing draft, fetching from server.", e);
        }
      }

      try {
        const res = await fetch(`/api/file?repo=${repo}&path=${path}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
        const data = await res.json();
        const decodedContent = atob(data.content);

        const { model } = await unifiedParser(decodedContent, path);

        const fullFileData = {
          sha: data.sha,
          frontmatter: model.frontmatter,
          body: model.body,
          path: data.path
        };
        setFileData(fullFileData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadFile();
  }, [path, repo, draftKey]);

  // Debounced auto-save to local draft
  useEffect(() => {
    if (!loading && fileData) {
      const handler = setTimeout(() => {
        localStorage.setItem(draftKey, JSON.stringify(fileData));
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [fileData, loading, draftKey]);

  // Differentiated content change handler
  const handleContentChange = (newContent) => {
    setFileData(prevData => {
      if (isMarkdownFile) {
        return { ...prevData, body: newContent };
      }

      if (isAstroFile) {
        const sections = prevData.frontmatter.sections || [];
        const firstTextBlockIndex = sections.findIndex(s => s.type === 'text_block');

        let newSections = [...sections];

        if (firstTextBlockIndex !== -1) {
          newSections[firstTextBlockIndex] = { ...newSections[firstTextBlockIndex], content: newContent };
          newSections = newSections.map((s, i) => {
              if (s.type === 'text_block' && i !== firstTextBlockIndex) {
                  return { ...s, content: '' };
              }
              return s;
          });
        } else {
          newSections.push({ type: 'text_block', content: newContent });
        }

        return {
          ...prevData,
          frontmatter: {
            ...prevData.frontmatter,
            sections: newSections
          }
        };
      }

      return { ...prevData, body: newContent };
    });
  };

  const handleNodeChange = (editor) => {
    const newFormats = {
      bold: editor.queryCommandState('bold'),
      italic: editor.queryCommandState('italic'),
      underline: editor.queryCommandState('underline'),
    };
    setActiveFormats(newFormats);
  };

  const handleEditorInit = (evt, editor) => {
    setEditorInstance(editor);
  };

  const handleDone = () => {
    navigate(`/explorer/file?path=${path}`);
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
        const { frontmatter, body, sha } = fileData;

        let newFileContent;
        if (isMarkdownFile) {
            newFileContent = matter.stringify(body || '', frontmatter);
        } else {
            newFileContent = stringifyAstroFile(frontmatter, body);
        }

        await fetch('/api/file', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo, path, content: btoa(newFileContent), sha }),
        });

        localStorage.removeItem(draftKey);
        alert('Publish successful!');
        navigate(`/explorer/file?path=${path}`);
    } catch(err) {
        alert(`An error occurred: ${err.message}`);
        setError(err.message);
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) return <div className="editor-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="editor-container">Error: {error}</div>;

  const initialContent = isAstroFile
    ? getCombinedContent(fileData?.frontmatter?.sections)
    : (fileData?.body || '');

  const placeholderText = isAstroFile
    ? 'The content of any text blocks in this file will appear here. Editing this text will consolidate all text blocks into one.'
    : 'You can write your Markdown content directly in this editor.';

  return (
    <div className="editor-container">
      <div className="editor-header">
        <TopToolbar onDone={handleDone} onPublish={handlePublish} isSaving={isSaving} />
      </div>
      <div className="editor-main-area">
        {isAstroFile || isMarkdownFile ? (
            <SectionEditor
                initialContent={initialContent}
                onContentChange={handleContentChange}
                onInit={handleEditorInit}
                onNodeChange={handleNodeChange}
                placeholder={placeholderText}
            />
        ) : (
            <div className="unsupported-file-message">
                <p>This file type cannot be edited with the rich-text editor.</p>
                <pre>{fileData?.body}</pre>
            </div>
        )}
      </div>
    </div>
  );
};

export default Editor;