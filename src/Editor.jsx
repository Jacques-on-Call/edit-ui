import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Buffer } from 'buffer';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { unifiedParser } from './utils/unifiedParser';
import SectionEditor from './SectionEditor';
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
  const turndownService = new TurndownService({ hr: '---' });

  // Combines all relevant text content into a single Markdown string for the editor.
  const getCombinedMarkdown = (frontmatter, body) => {
    if (isMarkdownFile) return body || '';
    if (isAstroFile && frontmatter?.sections) {
      const heroSection = frontmatter.sections.find(s => s.type === 'hero');
      const textBlocks = frontmatter.sections.filter(s => s.type === 'text_block');
      let contentParts = [];
      if (heroSection?.title) contentParts.push(`# ${heroSection.title}`);
      if (heroSection?.subtitle) contentParts.push(`## ${heroSection.subtitle}`);
      textBlocks.forEach(block => {
        if (block.content) contentParts.push(block.content);
      });
      return contentParts.join('\\n\\n---\\n\\n');
    }
    return '';
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

  // This function is now a stub, as the debounced auto-save was the source of the bug.
  // The save is now handled synchronously in `handleDone`.
  const handleContentChange = (newContent) => {};

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

  // This is the permanent fix for the content-loss bug.
  const handleDone = () => {
    if (editorInstance && fileData) {
      const latestHtml = editorInstance.getContent();
      const latestMarkdown = turndownService.turndown(latestHtml);

      const updatedFileData = JSON.parse(JSON.stringify(fileData)); // Deep copy

      if (isMarkdownFile) {
        updatedFileData.body = latestMarkdown;
      } else if (isAstroFile) {
        const sections = updatedFileData.frontmatter.sections || [];
        const firstTextBlockIndex = sections.findIndex(s => s.type === 'text_block');
        if (firstTextBlockIndex !== -1) {
          sections[firstTextBlockIndex].content = latestMarkdown;
          sections.forEach((s, i) => {
            if (s.type === 'text_block' && i !== firstTextBlockIndex) s.content = '';
          });
        } else {
          sections.push({ type: 'text_block', content: latestMarkdown });
        }
        updatedFileData.frontmatter.sections = sections;
      } else {
          updatedFileData.body = latestMarkdown;
      }

      localStorage.setItem(draftKey, JSON.stringify(updatedFileData));
    }
    navigate(`/explorer/file?path=${path}`);
  };

  if (loading) return <div className="editor-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="editor-container">Error: {error}</div>;

  const initialMarkdown = getCombinedMarkdown(fileData?.frontmatter, fileData?.body);
  const initialContent = marked(initialMarkdown);

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