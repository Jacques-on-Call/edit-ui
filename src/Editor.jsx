import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useLocation } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import jsyaml from 'js-yaml';
import { marked } from 'marked';
import TurndownService from 'turndown';

import './Editor.css';

const TinyEditor = forwardRef((props, ref) => {
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [frontmatter, setFrontmatter] = useState({});
  const [body, setBody] = useState(''); // For MD files, to preserve non-editable parts
  const [fileType, setFileType] = useState(null); // 'astro' or 'md'
  const [content, setContent] = useState(''); // The HTML content for the editor
  const editorRef = useRef(null);

  const turndownService = new TurndownService();

  useEffect(() => {
    const path = location.pathname.replace('/edit/', '');
    if (path) {
      const type = path.endsWith('.md') ? 'md' : 'astro';
      setFileType(type);

      const workerUrl = import.meta.env.VITE_WORKER_URL;
      fetch(`${workerUrl}/api/file?repo=${import.meta.env.VITE_GITHUB_REPO}&path=${path}`)
        .then(res => res.json())
        .then(data => {
          setFile(data);
          const decodedContent = atob(data.content);
          const frontmatterRegex = /^---\n(.*)\n---\n(.*)/s;
          const match = decodedContent.match(frontmatterRegex);

          if (match) {
            const fm = jsyaml.load(match[1]);
            setFrontmatter(fm);
            const fileBody = match[2] || '';
            setBody(fileBody);

            if (type === 'astro') {
              if (fm.sections && Array.isArray(fm.sections)) {
                const htmlContent = fm.sections
                  .filter(section => section.type === 'text_block' && section.content)
                  .map(section => section.content)
                  .join('\\n<hr>\\n'); // Separate sections with a line
                setContent(htmlContent);
              }
            } else { // md
              const htmlContent = marked(fileBody);
              setContent(htmlContent);
            }
          } else {
            // No frontmatter, treat as plain markdown/text
            if (type === 'md') {
              setContent(marked(decodedContent));
            } else {
              setContent(decodedContent); // Assume it's HTML if it's an astro file without frontmatter
            }
          }
        });
    }
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
        onEditorChange={(newContent) => setContent(newContent)}
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
