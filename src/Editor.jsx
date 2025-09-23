import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import jsyaml from 'js-yaml';
import { marked } from 'marked';
import TurndownService from 'turndown';
import SectionEditor from './SectionEditor';
import './Editor.css';

const Editor = () => {
  const location = useLocation();
  const [fileData, setFileData] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          setFileData(JSON.parse(localDraft));
          setLoading(false); return;
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

        setFileData({ sha: data.sha, frontmatter: fm, body: body, path: data.path, sections: fm.sections || [] });

      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    loadFile();
  }, [path, repo, draftKey]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!loading && fileData) {
      const handler = setTimeout(() => {
        localStorage.setItem(draftKey, JSON.stringify(fileData));
      }, 1000);
      return () => clearTimeout(handler);
    }
  }, [fileData, loading, draftKey]);

  const handleSectionChange = (index, updatedSection) => {
    const newSections = [...fileData.sections];
    newSections[index] = updatedSection;
    setFileData(prev => ({ ...prev, sections: newSections, frontmatter: { ...prev.frontmatter, sections: newSections } }));
  };

  const handleBodyChange = (newHtmlBody) => {
    const newMarkdownBody = turndownService.turndown(newHtmlBody);
    setFileData(prev => ({ ...prev, body: newMarkdownBody }));
  };

  if (loading || !fileData) return <div className="editor-container">Loading...</div>;
  if (error) return <div className="editor-container">Error: {error}</div>;

  return (
    <div className="editor-container">
      <div className="editor-header">
        {/* The TinyMCE top toolbar will be rendered here by SectionEditor */}
      </div>
      <div className="sections-list">
        {fileType === 'astro' ? (
        (fileData.sections || []).map((section, index) => (
            <SectionEditor
            key={index}
            section={section}
            onSectionChange={(updatedSection) => handleSectionChange(index, updatedSection)}
            />
        ))
        ) : (
        <SectionEditor
            section={{ type: 'main_content', content: marked(fileData.body || '') }}
            onSectionChange={(updatedSection) => handleBodyChange(updatedSection.content)}
        />
        )}
      </div>
      <div className="editor-footer">
        {/* The TinyMCE bottom toolbar will be rendered here */}
      </div>
    </div>
  );
};

export default Editor;
