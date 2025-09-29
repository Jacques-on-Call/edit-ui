import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Buffer } from 'buffer';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { unifiedParser } from './utils/unifiedParser';
import { stringifyAstroFile } from './utils/astroFileParser';
import SectionEditor from './SectionEditor';
import BottomToolbar from './BottomToolbar';
import TopToolbar from './TopToolbar';
import styles from './Editor.module.css'; // Keep for special footer and global styles

const Editor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorInstance, setEditorInstance] = useState(null);
  const [activeFormats, setActiveFormats] = useState({});
  const [contentStyle, setContentStyle] = useState({});
  const headerRef = useRef(null);
  const footerRef = useRef(null);

  // This effect is crucial for dynamically setting the content padding
  // to prevent it from being hidden by the fixed toolbars.
  useLayoutEffect(() => {
    const updatePadding = () => {
      const headerHeight = headerRef.current ? headerRef.current.offsetHeight : 0;
      const footerHeight = footerRef.current ? footerRef.current.offsetHeight : 0;
      setContentStyle({
        paddingTop: `${headerHeight}px`,
        paddingBottom: `${footerHeight}px`,
      });
    };

    updatePadding();
    const resizeObserver = new ResizeObserver(updatePadding);
    if (headerRef.current) resizeObserver.observe(headerRef.current);
    if (footerRef.current) resizeObserver.observe(footerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

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
      const updatedFileData = JSON.parse(JSON.stringify(fileData));

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

  if (loading) return (
    <div className="flex flex-col h-dvh w-full bg-gray-50 justify-center items-center">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-[#007aff] rounded-full animate-spin"></div>
    </div>
  );
  if (error) return <div className="flex flex-col h-dvh w-full bg-gray-50 justify-center items-center">Error: {error}</div>;

  const initialContent = getCombinedHtmlContent(fileData?.frontmatter, fileData?.body);

  return (
    <div className="flex flex-col h-dvh w-full bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-10" ref={headerRef}>
        <TopToolbar editor={editorInstance} activeFormats={activeFormats} onDone={handleDone} />
      </div>
      <div className="flex-grow overflow-y-auto flex flex-col" style={contentStyle}>
        <SectionEditor
          initialContent={initialContent}
          onContentChange={handleContentChange}
          onInit={handleEditorInit}
          onNodeChange={handleNodeChange}
        />
      </div>
      <div className={styles.editorFooter} ref={footerRef}>
        <BottomToolbar editor={editorInstance} activeFormats={activeFormats} />
      </div>
    </div>
  );
};

export default Editor;