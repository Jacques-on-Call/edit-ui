import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsyaml from 'js-yaml';
import { marked } from 'marked';
import TurndownService from 'turndown';

import './Editor.css';

// Ensure the global tinymce object is available
const { tinymce } = window;

const TinyEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
    if (!textareaRef.current || !tinymce) {
      console.log("DEBUG: Prereqs for editor init not met", { hasTextarea: !!textareaRef.current, hasTinymce: !!tinymce });
      return;
    }
    console.log("DEBUG: Initializing TinyMCE...");
    tinymce.init({
      selector: `#${textareaRef.current.id}`,
      plugins: 'lists link image code table placeholder',
      toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter | bullist numlist | link image | code',
      menubar: false,
      license_key: 'gpl',
      skin_url: '/tinymce/skins/ui/oxide',
      content_css: '/tinymce/skins/content/default/content.css',
      placeholder: 'Start writing your content here...',
      setup: (editor) => {
        editor.on('init', () => {
          console.log("DEBUG: TinyMCE 'init' event fired. Editor is ready.");
          editorRef.current = editor;
          setIsEditorInitialized(true);
        });
      },
    });

    return () => {
      if (editorRef.current) {
        console.log("DEBUG: Destroying editor instance.");
        tinymce.get(editorRef.current.id)?.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  // Effect for loading file content
  useEffect(() => {
    const loadFileContent = async () => {
      if (!location.pathname.startsWith('/edit/')) {
        return; // Do not run if we are not on an edit page.
      }
      const path = location.pathname.replace('/edit/', '');
      console.log(`DEBUG: loadFileContent effect triggered. Path: "${path}", Editor Initialized: ${isEditorInitialized}`);
      if (!path || !isEditorInitialized) return;

      const type = path.endsWith('.md') ? 'md' : 'astro';
      console.log(`DEBUG: File type detected: ${type}`);
      setFileType(type);

      try {
        const workerUrl = import.meta.env.VITE_WORKER_URL || '';
        const repo = localStorage.getItem('selectedRepo');
        const apiUrl = `${workerUrl}/api/file?repo=${repo}&path=${path}`;
        console.log(`DEBUG: Fetching file content from: ${apiUrl}`);
        const res = await fetch(apiUrl, { credentials: 'include' });

        if (!res.ok) {
          throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("DEBUG: Received data from API:", data);
        if (!data || typeof data.content !== 'string') throw new Error('Invalid file content from API.');

        setFile(data);
        const decodedContent = atob(data.content);
        console.log("DEBUG: Decoded content length:", decodedContent.length);

        const match = decodedContent.match(/^---\n(.*)\n---\n(.*)/s);
        console.log("DEBUG: Frontmatter regex match result:", match ? `Found ${match.length -1} parts` : "No match");

        let htmlContent = '';
        if (match) {
          const fm = jsyaml.load(match[1]);
          setFrontmatter(fm);
          console.log("DEBUG: Parsed frontmatter:", fm);
          const fileBody = match[2] || '';
          setBody(fileBody);
          console.log("DEBUG: Extracted body length:", fileBody.length);

          if (type === 'astro') {
            htmlContent = fm.sections?.filter(s => s.type === 'text_block' && s.content).map(s => s.content).join('<hr>') || '';
            console.log("DEBUG: Generated HTML for Astro sections:", htmlContent);
          } else {
            htmlContent = marked(fileBody);
            console.log("DEBUG: Converted Markdown body to HTML:", htmlContent);
          }
        } else {
          console.log("DEBUG: No frontmatter found, processing entire file content.");
          htmlContent = (type === 'md') ? marked(decodedContent) : decodedContent;
        }

        console.log("DEBUG: Final HTML content length to be set in editor:", htmlContent.length);
        editorRef.current.setContent(htmlContent);
        console.log("DEBUG: Successfully set content in TinyMCE editor.");

      } catch (error) {
        console.error("DEBUG: Fatal error during file load:", error);
        if (editorRef.current) {
          editorRef.current.setContent(`<h2>Error Loading File</h2><p>${error.message}</p>`);
        }
      }
    };

    loadFileContent();
  }, [location.pathname, isEditorInitialized]);

  const handleSave = () => {
    console.log("DEBUG: 'Save' button clicked.");
    if (!editorRef.current) {
      console.error("DEBUG: Save failed, editor reference is not available.");
      return;
    }

    const newHtmlContent = editorRef.current.getContent();
    console.log("DEBUG: Got new HTML content from editor length:", newHtmlContent.length);
    let newFullContent = '';

    if (fileType === 'astro') {
      console.log("DEBUG: Saving as 'astro' file type.");
      const newFrontmatter = { ...frontmatter };
      const firstTextBlockIndex = newFrontmatter.sections?.findIndex(s => s.type === 'text_block');
      if (firstTextBlockIndex > -1) {
        newFrontmatter.sections[firstTextBlockIndex].content = newHtmlContent;
        console.log("DEBUG: Updated existing 'text_block' in frontmatter sections.");
      } else {
        // If no text_block exists, create one.
        if (!newFrontmatter.sections) {
          newFrontmatter.sections = [];
        }
        newFrontmatter.sections.push({ type: 'text_block', content: newHtmlContent });
        console.log("DEBUG: No 'text_block' section found. Created a new one.");
      }
      newFullContent = `---\n${jsyaml.dump(newFrontmatter)}---\n${body}`;
    } else {
      console.log("DEBUG: Saving as 'md' file type.");
      const newMarkdownBody = turndownService.turndown(newHtmlContent);
      console.log("DEBUG: Converted HTML back to Markdown, length:", newMarkdownBody.length);
      const fmString = Object.keys(frontmatter).length ? `---\n${jsyaml.dump(frontmatter)}---\n` : '';
      newFullContent = `${fmString}${newMarkdownBody}`;
    }

    console.log("DEBUG: Final file content to be saved length:", newFullContent.length);
    const workerUrl = import.meta.env.VITE_WORKER_URL || '';
    const repo = localStorage.getItem('selectedRepo');
    const apiUrl = `${workerUrl}/api/file?repo=${repo}`;
    console.log(`DEBUG: Sending save request to: ${apiUrl}`);

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: file.path, content: newFullContent, sha: file.sha }),
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`API returned ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      console.log('DEBUG: File saved successfully. API response:', data);
      alert('File saved successfully!');
      navigate(-1); // Go back to the previous page (FileViewer)
    })
    .catch(error => {
      console.error("DEBUG: Error saving file:", error);
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
