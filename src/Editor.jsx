import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseAstroFile } from './utils/astroFileParser';
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

        const { model } = await parseAstroFile(decodedContent);

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

  // This function now needs to know which section to update
  const handleSectionContentChange = (newContent, index) => {
    setFileData(prevData => {
      const newSections = [...prevData.frontmatter.sections];
      newSections[index] = { ...newSections[index], content: newContent };

      return {
        ...prevData,
        frontmatter: {
          ...prevData.frontmatter,
          sections: newSections
        }
      };
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

  const handleEditorInit = (evt, editor) => {
    setEditorInstance(editor);
  };

  const handleDone = () => {
    // The debounced save will have already run, so we can just navigate.
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
        {(fileData?.frontmatter?.sections || []).map((section, index) => {
          if (section.type === 'text_block') {
            return (
              <div key={index} className="section-wrapper">
                <SectionEditor
                  initialContent={section.content}
                  onContentChange={(newContent) => handleSectionContentChange(newContent, index)}
                  onInit={handleEditorInit}
                  onNodeChange={handleNodeChange}
                />
              </div>
            );
          }
          // Render a placeholder for non-editable sections
          return <VisualSectionPreview key={index} section={section} />;
        })}
      </div>
      <div className="editor-footer" style={{ backgroundColor: '#005A9E' }}>
        <BottomToolbar editor={editorInstance} activeFormats={activeFormats} />
      </div>
    </div>
  );
};

export default Editor;