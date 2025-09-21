import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useLocation } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import jsyaml from 'js-yaml';
import { marked } from 'marked';
import TurndownService from 'turndown';

import './Editor.css';

const TinyEditor = forwardRef(({ initialContent, onContentChange }, ref) => {
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [frontmatter, setFrontmatter] = useState({});
  const [body, setBody] = useState(''); // For MD files, to preserve non-editable parts
  const [fileType, setFileType] = useState(null); // 'astro' or 'md'
  const [content, setContent] = useState(''); // The HTML content for the editor
  const editorRef = useRef(null);

  const turndownService = new TurndownService();

  useEffect(() => {
    const loadContent = async () => {
      const path = location.pathname.replace('/edit/', '');
      if (!path) return;

      console.log('[DEBUG] 1. Starting file load for path:', path);
      setContent('<h2>Loading file...</h2>');
      const type = path.endsWith('.md') ? 'md' : 'astro';
      setFileType(type);

      try {
        const workerUrl = import.meta.env.VITE_WORKER_URL;
        console.log('[DEBUG] 2. Fetching from URL:', `${workerUrl}/api/file?repo=${import.meta.env.VITE_GITHUB_REPO}&path=${path}`);
        const res = await fetch(`${workerUrl}/api/file?repo=${import.meta.env.VITE_GITHUB_REPO}&path=${path}`);

        console.log('[DEBUG] 3. Received response. Status:', res.status);
        if (!res.ok) {
          throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();

        console.log('[DEBUG] 4. Parsed JSON data from response:', data);

        if (!data || typeof data.content !== 'string') {
          console.error('[DEBUG] ERROR: data.content is invalid.', data.content);
          throw new Error('Invalid or missing file content from API.');
        }

        setFile(data);
        console.log('[DEBUG] 5. About to decode Base64 content.');
        const decodedContent = atob(data.content);
        console.log('[DEBUG] 6. Successfully decoded content.');

        const frontmatterRegex = /^---\n(.*)\n---\n(.*)/s;
        console.log('[DEBUG] 7. About to match frontmatter regex.');
        const match = decodedContent.match(frontmatterRegex);
        console.log('[DEBUG] 8. Regex match result:', match ? `Found ${match.length - 1} parts` : 'No match');

        if (match) {
          console.log('[DEBUG] 9. Frontmatter found. Parsing YAML.');
          const fm = jsyaml.load(match[1]);
          setFrontmatter(fm);
          const fileBody = match[2] || '';
          setBody(fileBody);
          console.log('[DEBUG] 10. Parsed YAML:', fm);

          if (type === 'astro') {
            console.log('[DEBUG] 11a. Handling as .astro file.');
            if (fm.sections && Array.isArray(fm.sections)) {
              const htmlContent = fm.sections
                .filter(section => section.type === 'text_block' && section.content)
                .map(section => section.content)
                .join('\\n<hr>\\n');
              setContent(htmlContent);
            } else {
              setContent('');
            }
          } else { // md
            console.log('[DEBUG] 11b. Handling as .md file.');
            const htmlContent = marked(fileBody);
            setContent(htmlContent);
          }
        } else {
          console.log('[DEBUG] 9b. No frontmatter found.');
          if (type === 'md') {
            setContent(marked(decodedContent));
          } else {
            setContent(decodedContent);
          }
        }
        console.log('[DEBUG] 12. Successfully set content.');
      } catch (error) {
        console.error("[DEBUG] A fatal error occurred during file load:", error);
        setContent(`<h2>Error Loading File</h2><p>The file could not be loaded or parsed. Please check the browser console for details.</p><p>Error: ${error.message}</p>`);
      }
    };

    loadContent();
  }, [location.pathname]);

  const handleSave = () => {
    if (editorRef.current) {
      const newHtmlContent = editorRef.current.getContent();
      let newFullContent = '';

      if (fileType === 'astro') {
        const newFrontmatter = { ...frontmatter };
        // Find the first text_block and update it. A more robust solution might be needed later.
        const firstTextBlockIndex = newFrontmatter.sections?.findIndex(s => s.type === 'text_block');
        if (firstTextBlockIndex > -1) {
          newFrontmatter.sections[firstTextBlockIndex].content = newHtmlContent;
        } else {
          // If no text_block exists, we might need to add one or handle this case.
          // For now, we'll just not change anything.
          console.warn("No 'text_block' section found in frontmatter to save content to.");
          return;
        }
        newFullContent = `---\n${jsyaml.dump(newFrontmatter)}---\n${body}`;
      } else { // md
        const newMarkdownBody = turndownService.turndown(newHtmlContent);
        const fmString = frontmatter ? `---\n${jsyaml.dump(frontmatter)}---\n` : '';
        newFullContent = `${fmString}${newMarkdownBody}`;
      }

      const encodedContent = btoa(newFullContent);
      const workerUrl = import.meta.env.VITE_WORKER_URL;
      fetch(`${workerUrl}/api/file?repo=${import.meta.env.VITE_GITHUB_REPO}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: file.path,
          content: encodedContent,
          sha: file.sha,
        }),
      })
      .then(res => res.json())
      .then(data => {
        console.log('File saved:', data);
        alert('File saved successfully!');
      });
    }
  };

  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current,
  }));

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <button onClick={handleSave}>Save</button>
      </div>
      <Editor
        onInit={(evt, editor) => editorRef.current = editor}
        initialValue="<p>Loading content...</p>"
        value={content}
        onEditorChange={(newContent, editor) => setContent(newContent)}
        init={{
          height: '100%',
          menubar: false,
          plugins: 'lists link image code table',
          toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter | bullist numlist | link image | code',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
        }}
      />
    </div>
  );
});

export default TinyEditor;
