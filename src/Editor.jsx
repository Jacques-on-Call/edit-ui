import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import jsyaml from 'js-yaml';
import { marked } from 'marked';
import TurndownService from 'turndown';
import SectionEditor from './SectionEditor';
import BottomToolbar from './BottomToolbar';
import TopToolbar from './TopToolbar';
import './Editor.css';

const Editor = () => {
  const location = useLocation();
  const [fileData, setFileData] = useState(null);
  const [combinedContent, setCombinedContent] = useState('');
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorInstance, setEditorInstance] = useState(null);
  const [activeFormats, setActiveFormats] = useState({});

  const turndownService = new TurndownService();
  const pathWithRepo = location.pathname.replace('/edit/', '');
  const pathParts = pathWithRepo.split('/');
  const repoOwner = pathParts.shift();
  const repoName = pathParts.shift();
  const repo = `${repoOwner}/${repoName}`;
  const path = pathParts.join('/');
  const draftKey = `draft-content-${path}`;

  // Load content
  useEffect(() => {
    const loadFile = async () => {
      setLoading(true);
      setError(null);
      const type = path.endsWith('.md') ? 'md' : 'astro';
      setFileType(type);

      const localDraft = localStorage.getItem(draftKey);
      if (localDraft) {
        try {
          const draftData = JSON.parse(localDraft);
          setFileData(draftData);
          if (type === 'astro') {
            const content = (draftData.sections || []).map(s => s.content).join('');
            setCombinedContent(content);
          } else {
            setCombinedContent(marked(draftData.body || ''));
          }
          setLoading(false);
          return;
        } catch (e) { console.error("Error parsing draft", e); }
      }

      try {
        const res = await fetch(`/api/file?repo=${repo}&path=${path}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
        const data = await res.json();
        const decodedContent = atob(data.content);
        const match = decodedContent.match(/^---\n(.*)\n---\n(.*)/s);

        let fm = {};
        let body = decodedContent;
        if (match) {
          fm = jsyaml.load(match[1]);
          body = match[2] || '';
        }

        const fullFileData = { sha: data.sha, frontmatter: fm, body: body, path: data.path, sections: fm.sections || [] };
        setFileData(fullFileData);

        if (type === 'astro') {
            const content = (fullFileData.sections || []).filter(s => s.type === 'text_block').map(s => s.content).join('<hr />');
            setCombinedContent(content);
        } else {
            setCombinedContent(marked(fullFileData.body || ''));
        }

      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    loadFile();
  }, [path, repo, draftKey]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!loading && fileData) {
      const handler = setTimeout(() => {
        // Create a new file data object with the updated content
        const newFileData = { ...fileData };
        if (fileType === 'astro') {
            // For now, consolidating all content into one text_block section
            newFileData.sections = [{ type: 'text_block', content: combinedContent }];
            newFileData.frontmatter.sections = newFileData.sections;
        } else {
            newFileData.body = turndownService.turndown(combinedContent);
        }
        localStorage.setItem(draftKey, JSON.stringify(newFileData));
      }, 1000);
      return () => clearTimeout(handler);
    }
  }, [combinedContent, fileData, loading, draftKey, fileType, turndownService]);

  const handleContentChange = (newContent) => {
    setCombinedContent(newContent);
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

  if (loading) return <div className="editor-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="editor-container">Error: {error}</div>;

  return (
    <div className="editor-container">
      <div className="editor-header">
        <TopToolbar editor={editorInstance} activeFormats={activeFormats} />
      </div>
      <div className="sections-list">
        <SectionEditor
            initialContent={combinedContent}
            onContentChange={handleContentChange}
            onInit={(evt, editor) => setEditorInstance(editor)}
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
