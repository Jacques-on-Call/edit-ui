import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TurndownService from 'turndown';
import { parseAstroFile } from './utils/astroFileParser';
import SectionEditor from './SectionEditor';
import BottomToolbar from './BottomToolbar';
import TopToolbar from './TopToolbar';
import './Editor.css';

const Editor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [fileData, setFileData] = useState(null);
  const [bodyContent, setBodyContent] = useState('');
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
          setBodyContent(draftData.body || '');
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

        // Use the new, correct parser
        const { model } = await parseAstroFile(decodedContent);

        const fullFileData = {
          sha: data.sha,
          frontmatter: model.frontmatter,
          body: model.body, // Use the body from the parser
          path: data.path
        };
        setFileData(fullFileData);
        setBodyContent(model.body || '');

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
        const newFileData = { ...fileData, body: bodyContent };
        localStorage.setItem(draftKey, JSON.stringify(newFileData));
      }, 500); // Save after 500ms of inactivity
      return () => clearTimeout(handler);
    }
  }, [bodyContent, fileData, loading, draftKey]);

  const handleContentChange = (newContent) => {
    // The editor gives us HTML, so we store it as is for now.
    // We'll convert it back to markdown on save if needed.
    setBodyContent(newContent);
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

  const handleEditorInit = (evt, editor) => {
    setEditorInstance(editor);
  };

  const handleDone = () => {
    // Final save to local storage before navigating
    if (fileData) {
      const newFileData = { ...fileData, body: bodyContent };
      localStorage.setItem(draftKey, JSON.stringify(newFileData));
    }
    // Navigate back to the viewer page
    navigate(`/explorer/file?path=${path}`);
  };

  if (loading) return <div className="editor-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="editor-container">Error: {error}</div>;

  return (
    <div className="editor-container">
      <div className="editor-header">
        <TopToolbar editor={editorInstance} activeFormats={activeFormats} onDone={handleDone} />
      </div>
      <div className="sections-list">
        <SectionEditor
            // The editor now works directly with the body content
            initialContent={bodyContent}
            onContentChange={handleContentChange}
            onInit={handleEditorInit}
            onNodeChange={handleNodeChange}
        />
      </div>
      <div className="editor-footer" style={{ backgroundColor: '#005A9E' }}>
        <BottomToolbar editor={editorInstance} activeFormats={activeFormats} />
      </div>
      {/* Debug panel is commented out as it's not ported yet */}
      {/* <DebugPanel debug={{ ...debug, editorReady }} /> */}
    </div>
  );
};

export default Editor;