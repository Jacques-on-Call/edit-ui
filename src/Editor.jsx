import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Buffer } from 'buffer';
import { unifiedParser } from './utils/unifiedParser';
import SectionEditor from './SectionEditor';
import VisualSectionPreview from './VisualSectionPreview';
import BottomToolbar from './BottomToolbar';
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

  const pathWithRepo = location.pathname.replace('/edit/', '');
  const pathParts = pathWithRepo.split('/');
  const repoOwner = pathParts.shift();
  const repoName = pathParts.shift();
  const repo = `${repoOwner}/${repoName}`;
  const path = pathParts.join('/');
  const draftKey = `draft-content-${path}`;
  const isAstroFile = path.endsWith('.astro');
  const isMarkdownFile = path.endsWith('.md');

  // Combines content from all text_block sections into a single string for the editor.
  const getCombinedContent = (sections) => {
    if (!sections) return '';
    return sections
      .filter(section => section.type === 'text_block' && section.content)
      .map(section => section.content)
      .join('<hr style="border: 0; border-top: 1px solid #ccc; margin: 1em 0;" />');
  };

  // Load content from draft or server
  useEffect(() => {
    const loadFile = async () => {
      setLoading(true);
      setError(null);

      const localDraft = localStorage.getItem(draftKey);
      if (localDraft) {
        try {
          setFileData(JSON.parse(localDraft));
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
        const decodedContent = Buffer.from(data.content, 'base64').toString('utf8');
        const { model } = await unifiedParser(decodedContent, path);

        setFileData({
          sha: data.sha,
          frontmatter: model.frontmatter,
          body: model.body,
          path: data.path
        });

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

  // Unified content change handler
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
          newSections = newSections.map((s, i) =>
            (s.type === 'text_block' && i !== firstTextBlockIndex) ? { ...s, content: '' } : s
          );
        } else {
          newSections.push({ type: 'text_block', content: newContent });
        }

        return { ...prevData, frontmatter: { ...prevData.frontmatter, sections: newSections } };
      }

      return { ...prevData, body: newContent };
    });
  };

  const handleNodeChange = (editor) => {
    const newFormats = {
      bold: editor.queryCommandState('bold'),
      italic: editor.queryCommandState('italic'),
      underline: editor.queryCommandState('underline'),
      justifyLeft: editor.queryCommandState('JustifyLeft'),
      justifyCenter: editor.queryCommandState('JustifyCenter'),
      justifyRight: editor.queryCommandState('JustifyRight'),
      justifyFull: editor.queryCommandState('JustifyFull'),
      unorderedList: editor.queryCommandState('InsertUnorderedList'),
    };
    setActiveFormats(newFormats);
  };

  const handleEditorInit = (evt, editor) => setEditorInstance(editor);

  const handleDone = () => {
    if (fileData) {
      localStorage.setItem(draftKey, JSON.stringify(fileData));
    }
    navigate(`/explorer/file?path=${path}`);
  };

  if (loading) return <div className="editor-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="editor-container">Error: {error}</div>;

  const initialContent = isAstroFile
    ? getCombinedContent(fileData?.frontmatter?.sections)
    : (fileData?.body || '');

  return (
    <div className="editor-container">
      <div className="editor-header">
        <TopToolbar editor={editorInstance} activeFormats={activeFormats} onDone={handleDone} />
      </div>
      <div className="sections-list">
        {isAstroFile || isMarkdownFile ? (
            <SectionEditor
              initialContent={initialContent}
              onContentChange={handleContentChange}
              onInit={handleEditorInit}
              onNodeChange={handleNodeChange}
            />
        ) : (
          <div className="unsupported-file-message">
            <p>This file type is not supported by the editor.</p>
            <pre>{fileData?.body || ''}</pre>
          </div>
        )}
      </div>
      <div className="editor-footer">
        <BottomToolbar editor={editorInstance} activeFormats={activeFormats} />
      </div>
    </div>
  );
};

export default Editor;