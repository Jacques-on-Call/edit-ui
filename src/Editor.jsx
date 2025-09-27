import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Buffer } from 'buffer';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { unifiedParser } from './utils/unifiedParser';
import { stringifyAstroFile } from './utils/astroFileParser';
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

  // Converts the structured section data into a single HTML string for the editor.
  const getCombinedHtmlContent = (frontmatter, body) => {
    if (isMarkdownFile) return new DOMParser().parseFromString(marked(body || ''), 'text/html').body.innerHTML;
    if (isAstroFile && frontmatter?.sections) {
      let htmlParts = [];
      const heroSection = frontmatter.sections.find(s => s.type === 'hero');
      if (heroSection) {
        if (heroSection.title) htmlParts.push(`<h1>${heroSection.title}</h1>`);
        if (heroSection.subtitle) htmlParts.push(`<h2>${heroSection.subtitle}</h2>`);
      }
      const textBlocks = frontmatter.sections.filter(s => s.type === 'text_block');
      textBlocks.forEach(block => {
        if (block.content) {
            // Use marked to convert markdown content from each section into HTML
            htmlParts.push(new DOMParser().parseFromString(marked(block.content), 'text/html').body.innerHTML);
        }
      });
      return htmlParts.join('<hr />');
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

  // This function is now a stub, as saving is handled synchronously in handleDone.
  const handleContentChange = () => {};

  const handleNodeChange = (editor) => {
    const newFormats = {
      bold: editor.queryCommandState('bold'),
      italic: editor.queryCommandState('italic'),
      underline: editor.queryCommandState('underline'),
    };
    setActiveFormats(newFormats);
  };

  const handleEditorInit = (evt, editor) => setEditorInstance(editor);

  const handleDone = () => {
    if (editorInstance && fileData) {
      const latestHtml = editorInstance.getContent();
      const updatedFileData = JSON.parse(JSON.stringify(fileData)); // Deep copy

      if (isMarkdownFile) {
        updatedFileData.body = turndownService.turndown(latestHtml);
      } else if (isAstroFile) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = latestHtml;
        const h1 = tempDiv.querySelector('h1');
        const h2 = tempDiv.querySelector('h2');

        const heroSection = updatedFileData.frontmatter.sections.find(s => s.type === 'hero');
        if(heroSection) {
            if(h1) heroSection.title = h1.textContent;
            if(h2) heroSection.subtitle = h2.textContent;
        }

        const contentParts = latestHtml.split('<hr />');
        let textBlockIndex = 0;
        updatedFileData.frontmatter.sections.forEach(section => {
            if(section.type === 'text_block') {
                const contentHtml = contentParts[textBlockIndex + (heroSection ? 1 : 0)] || '';
                section.content = turndownService.turndown(contentHtml);
                textBlockIndex++;
            }
        });
      }

      localStorage.setItem(draftKey, JSON.stringify(updatedFileData));
    }
    navigate(`/explorer/file?path=${path}`);
  };

  if (loading) return <div className="editor-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="editor-container">Error: {error}</div>;

  const initialContent = getCombinedHtmlContent(fileData?.frontmatter, fileData?.body);

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