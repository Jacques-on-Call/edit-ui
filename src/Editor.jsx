import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import jsyaml from 'js-yaml';
import { marked } from 'marked';
import TurndownService from 'turndown';

import './Editor.css';

// Ensure the global tinymce object is available
const { tinymce } = window;

const TinyEditor = () => {
  const location = useLocation();
  const editorRef = useRef(null); // Ref to the TinyMCE editor instance
  const textareaRef = useRef(null); // Ref to the textarea element

  const [file, setFile] = useState(null);
  const [frontmatter, setFrontmatter] = useState({});
  const [body, setBody] = useState('');
  const [fileType, setFileType] = useState(null);
  const [isEditorInitialized, setIsEditorInitialized] = useState(false);

  const turndownService = new TurndownService();

  // Effect for initializing and destroying the editor
  useEffect(() => {
    if (!textareaRef.current || !tinymce) return;

    tinymce.init({
      selector: `#${textareaRef.current.id}`,
      plugins: 'lists link image code table',
      toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter | bullist numlist | link image | code',
      menubar: false,
      setup: (editor) => {
        editor.on('init', () => {
          console.log("Editor initialized");
          editorRef.current = editor;
          setIsEditorInitialized(true);
        });
      },
    });

    return () => {
      if (editorRef.current) {
        console.log("Destroying editor instance");
        tinymce.get(editorRef.current.id)?.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  // Effect for loading file content
  useEffect(() => {
    const loadFileContent = async () => {
      const path = location.pathname.replace('/edit/', '');
      if (!path || !isEditorInitialized) return;

      const type = path.endsWith('.md') ? 'md' : 'astro';
      setFileType(type);

      try {
        const workerUrl = import.meta.env.VITE_WORKER_URL;
        const res = await fetch(`${workerUrl}/api/file?repo=${import.meta.env.VITE_GITHUB_REPO}&path=${path}`);
        if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);

        const data = await res.json();
        if (!data || typeof data.content !== 'string') throw new Error('Invalid file content from API.');

        setFile(data);
        const decodedContent = atob(data.content);
        const match = decodedContent.match(/^---\\n(.*)\\n---\\n(.*)/s);

        let htmlContent = '';
        if (match) {
          const fm = jsyaml.load(match[1]);
          setFrontmatter(fm);
          const fileBody = match[2] || '';
          setBody(fileBody);

          if (type === 'astro') {
            htmlContent = fm.sections?.filter(s => s.type === 'text_block' && s.content).map(s => s.content).join('<hr>') || '';
          } else {
            htmlContent = marked(fileBody);
          }
        } else {
          htmlContent = (type === 'md') ? marked(decodedContent) : decodedContent;
        }

        editorRef.current.setContent(htmlContent);

      } catch (error) {
        console.error("Fatal error during file load:", error);
        if (editorRef.current) {
          editorRef.current.setContent(`<h2>Error Loading File</h2><p>${error.message}</p>`);
        }
      }
    };

    loadFileContent();
  }, [location.pathname, isEditorInitialized]);

  const handleSave = () => {
    if (!editorRef.current) return;

    const newHtmlContent = editorRef.current.getContent();
    let newFullContent = '';

    if (fileType === 'astro') {
      const newFrontmatter = { ...frontmatter };
      const firstTextBlockIndex = newFrontmatter.sections?.findIndex(s => s.type === 'text_block');
      if (firstTextBlockIndex > -1) {
        newFrontmatter.sections[firstTextBlockIndex].content = newHtmlContent;
      } else {
        console.warn("No 'text_block' to save to.");
        return;
      }
      newFullContent = `---\n${jsyaml.dump(newFrontmatter)}---\n${body}`;
    } else {
      const newMarkdownBody = turndownService.turndown(newHtmlContent);
      const fmString = Object.keys(frontmatter).length ? `---\n${jsyaml.dump(frontmatter)}---\n` : '';
      newFullContent = `${fmString}${newMarkdownBody}`;
    }

    const encodedContent = btoa(newFullContent);
    const workerUrl = import.meta.env.VITE_WORKER_URL;
    fetch(`${workerUrl}/api/file?repo=${import.meta.env.VITE_GITHUB_REPO}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: file.path, content: encodedContent, sha: file.sha }),
    })
    .then(res => res.json())
    .then(data => {
      console.log('File saved:', data);
      alert('File saved successfully!');
    })
    .catch(error => {
      console.error("Error saving file:", error);
      alert(`Error saving file: ${error.message}`);
    });
  };

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <button onClick={handleSave}>Save</button>
      </div>
      <textarea ref={textareaRef} id="tinymce-editor"></textarea>
    </div>
  );
};

export default TinyEditor;
