import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import jsyaml from 'js-yaml';
import { marked } from 'marked';
import TurndownService from 'turndown';

import './Editor.css';

const TinyEditor = () => {
  const location = useLocation();

  const [file, setFile] = useState(null);
  const [frontmatter, setFrontmatter] = useState({});
  const [body, setBody] = useState('');
  const [fileType, setFileType] = useState(null);
  const [initialContent, setInitialContent] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const turndownService = new TurndownService();

  // Effect for loading file content
  useEffect(() => {
    const loadFileContent = async () => {
      let path = location.pathname.replace('/edit/', '');
      // Defensively remove any query strings that might have been included in the path
      if (path.includes('?')) {
        path = path.split('?')[0];
      }

      if (!path) {
        return;
      }

      setIsLoading(true);
      const type = path.endsWith('.md') ? 'md' : 'astro';
      setFileType(type);

      try {
        const workerUrl = import.meta.env.VITE_WORKER_URL || '';
        const apiUrl = `${workerUrl}/api/file?repo=${import.meta.env.VITE_GITHUB_REPO}&path=${path}`;
        const res = await fetch(apiUrl);

        if (!res.ok) {
          throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        if (!data || typeof data.content !== 'string') throw new Error('Invalid file content from API.');

        setFile(data);
        const decodedContent = atob(data.content);

        const match = decodedContent.match(/^---\n(.*)\n---\n(.*)/s);

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

        setInitialContent(htmlContent);
        setCurrentContent(htmlContent);
      } catch (error) {
        console.error("Error during file load:", error);
        setInitialContent(`<h2>Error Loading File</h2><p>${error.message}</p>`);
      } finally {
        setIsLoading(false);
      }
    };

    loadFileContent();
  }, [location.pathname]);

  const handleSave = () => {
    if (!file) {
      console.error("Save failed, file metadata not available.");
      return;
    }

    let newFullContent = '';
    if (fileType === 'astro') {
      const newFrontmatter = { ...frontmatter };
      const firstTextBlockIndex = newFrontmatter.sections?.findIndex(s => s.type === 'text_block');
      if (firstTextBlockIndex > -1) {
        newFrontmatter.sections[firstTextBlockIndex].content = currentContent;
      } else {
        alert("Save failed: Could not find a 'text_block' section in the file's frontmatter.");
        return;
      }
      newFullContent = `---\n${jsyaml.dump(newFrontmatter)}---\n${body}`;
    } else {
      const newMarkdownBody = turndownService.turndown(currentContent);
      const fmString = Object.keys(frontmatter).length ? `---\n${jsyaml.dump(frontmatter)}---\n` : '';
      newFullContent = `${fmString}${newMarkdownBody}`;
    }

    const encodedContent = btoa(newFullContent);
    const workerUrl = import.meta.env.VITE_WORKER_URL || '';
    const apiUrl = `${workerUrl}/api/file?repo=${import.meta.env.VITE_GITHUB_REPO}`;

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: file.path, content: encodedContent, sha: file.sha }),
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`API returned ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      alert('File saved successfully!');
    })
    .catch(error => {
      alert(`Error saving file: ${error.message}`);
    });
  };

  if (isLoading) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <button onClick={handleSave}>Save</button>
      </div>
      <Editor
        apiKey={import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key'}
        initialValue={initialContent}
        value={currentContent}
        onEditorChange={(newValue, editor) => setCurrentContent(newValue)}
        init={{
          plugins: 'lists link image code table',
          toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter | bullist numlist | link image | code',
          menubar: false,
          script_url: '/tinymce/tinymce.min.js',
          skin_url: '/tinymce',
          content_css: '/tinymce/skins/content/default/content.min.css',
          height: 500,
          promotion: false,
        }}
      />
    </div>
  );
};

export default TinyEditor;
