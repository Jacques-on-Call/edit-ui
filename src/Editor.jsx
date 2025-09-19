import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useLocation } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Toolbar from './Toolbar';
import { sanitize } from './sanitizer';
import { Callout } from './extensions/Callout';
import { parse } from 'node-html-parser';
import { tiptapToJSON, jsonToTiptap } from './converter';
import jsyaml from 'js-yaml';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import './Editor.css';
import './Toolbar.css';
import './extensions/Callout.css';

const Editor = forwardRef(({ initialContent, onContentChange }, ref) => {
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [frontmatter, setFrontmatter] = useState({});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {},
      }),
      Callout,
      Underline,
      Image,
    ],
    content: initialContent || '',
    onUpdate: ({ editor }) => {
      if (onContentChange) {
        onContentChange(editor.getJSON());
      }
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
      transformPastedHTML(html) {
        const sanitizedHtml = sanitize(html);
        const root = parse(sanitizedHtml);

        // Rule for code blocks
        const monoSpacedNodes = root.querySelectorAll('*[style*="font-family: monospace"]');
        monoSpacedNodes.forEach(node => {
          const pre = parse('<pre><code></code></pre>');
          pre.querySelector('code').set_content(node.innerHTML);
          node.replaceWith(pre);
        });

        // Rule for callouts
        const calloutNodes = root.querySelectorAll('p[style*="background-color"]');
        calloutNodes.forEach(node => {
          node.tagName = 'div';
          node.setAttribute('data-type', 'callout');
          node.setAttribute('data-style', 'info');
        });

        // Rule for tables
        const tableNodes = root.querySelectorAll('table');
        tableNodes.forEach(node => {
          node.replaceWith(parse('<p>[Table stripped]</p>'));
        });

        return root.toString();
      },
    },
  });

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
  }));

  useEffect(() => {
    const path = location.pathname.replace('/edit/', '');
    if (path && editor && !initialContent) { // only fetch if not used as a widget
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
            if (fm.contentBlocks) {
              const tiptapContent = jsonToTiptap(fm.contentBlocks);
              editor.commands.setContent(tiptapContent);
            }
          }
        });
    }
  }, [location.pathname, editor, initialContent]);

  const handleSave = () => {
    const json = tiptapToJSON(editor.getJSON());
    const newFrontmatter = { ...frontmatter, contentBlocks: json };
    const newContent = `---\n${jsyaml.dump(newFrontmatter)}---\n${''/* for now, the body is empty */}`;
    const encodedContent = btoa(newContent);

    const workerUrl = import.meta.env.VITE_WORKER_URL;
    fetch(`${workerUrl}/api/file?repo=${import.meta.env.VITE_GITHUB_REPO}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: file.path,
        content: encodedContent,
        sha: file.sha,
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('File saved:', data);
      });
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-container">
      <Toolbar editor={editor} onSave={handleSave} />
      <EditorContent editor={editor} />
    </div>
  );
});

export default Editor;
