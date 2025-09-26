import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Buffer } from 'buffer';
import { marked } from 'marked';
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

  const getCombinedHtmlContent = (sections) => {
    if (!sections) return '';
    const markdown = sections
      .filter(section => section.type === 'text_block' && section.content)
      .map(section => section.content)
      .join('\\n\\n<hr style="border:none;border-top:1px solid #ccc;" />\\n\\n');
    return marked(markdown);
  };

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
        } catch (e) { console.error("Error parsing draft, fetching from server.", e); }
      }
      try {
        const res = await fetch(`/api/file?repo=${repo}&path=${path}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
        const data = await res.json();
        const decodedContent = Buffer.from(data.content, 'base64').toString('utf8');
        const { model } = await unifiedParser(decodedContent, path);
        setFileData({ sha: data.sha, frontmatter: model.frontmatter, body: model.body, path: data.path });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadFile();
  }, [path, repo, draftKey]);

  // This debounced effect is now just for background saving, not for the final save.
  useEffect(() => {
    if (!loading && fileData) {
      const handler = setTimeout(() => localStorage.setItem(draftKey, JSON.stringify(fileData)), 500);
      return () => clearTimeout(handler);
    }
  }, [fileData, loading, draftKey]);

  // Centralized helper to update file data based on editor content
  const updateFileDataWithContent = (prevData, newContent) => {
    if (isMarkdownFile) {
      // For Markdown, we will need to convert HTML back to Markdown before saving to the server.
      // For now, we store the raw HTML in the body for the draft.
      return { ...prevData, body: newContent };
    }
    if (isAstroFile) {
      const sections = prevData.frontmatter.sections || [];
      const firstTextBlockIndex = sections.findIndex(s => s.type === 'text_block');
      let newSections = [...sections];

      if (firstTextBlockIndex !== -1) {
        newSections[firstTextBlockIndex] = { ...newSections[firstTextBlockIndex], content: newContent };
        newSections = newSections.map((s, i) => (s.type === 'text_block' && i !== firstTextBlockIndex) ? { ...s, content: '' } : s);
      } else {
        newSections.push({ type: 'text_block', content: newContent });
      }
      return { ...prevData, frontmatter: { ...prevData.frontmatter, sections: newSections } };
    }
    return { ...prevData, body: newContent };
  };

  const handleContentChange = (newContent) => {
    setFileData(prevData => updateFileDataWithContent(prevData, newContent));
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

  // This is the fix for the content-loss bug.
  const handleDone = () => {
    if (editorInstance && fileData) {
      const latestContent = editorInstance.getContent();
      const updatedFileData = updateFileDataWithContent(fileData, latestContent);
      // Synchronously save the absolute latest content to the draft before navigating.
      localStorage.setItem(draftKey, JSON.stringify(updatedFileData));
    }
    navigate(`/explorer/file?path=${path}`);
  };

  if (loading) return <div className="editor-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="editor-container">Error: {error}</div>;

  const initialContent = isAstroFile
    ? getCombinedHtmlContent(fileData?.frontmatter?.sections)
    : marked(fileData?.body || '');

  return (
    <div className="editor-container">
      <div className="editor-header">
        <TopToolbar editor={editorInstance} activeFormats={activeFormats} onDone={handleDone} />
      </div>
      <div className="sections-list">
        <SectionEditor
          initialContent={initialContent}
          onContentChange={handleContentChange}
          onInit={handleEditorInit}
          onNodeChange={handleNodeChange}
        />
      </div>
      <div className="editor-footer">
        <BottomToolbar editor={editorInstance} activeFormats={activeFormats} />
      </div>
    </div>
  );
};

export default Editor;