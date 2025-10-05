import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { debounce } from 'lodash';
import matter from 'gray-matter';
import TopToolbar from '../components/TopToolbar';
import BottomToolbar from '../components/BottomToolbar';
import { unifiedParser } from '../utils/unifiedParser';
import { stringifyAstroFile } from '../utils/astroFileParser';

function EditorPage() {
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get('path');
  const repo = localStorage.getItem('selectedRepo');

  const [frontmatter, setFrontmatter] = useState({});
  const [content, setContent] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const draftKey = `draft_${repo}_${filePath}`;

  const saveDraft = useCallback(debounce((newContent) => {
    let fullContent;
    if (fileType === 'astro-js') {
      fullContent = stringifyAstroFile(frontmatter, newContent);
    } else {
      fullContent = matter.stringify(newContent, frontmatter);
    }
    localStorage.setItem(draftKey, fullContent);
    console.log(`Draft saved for ${filePath}.`);
  }, 1000), [draftKey, frontmatter, fileType]);

  useEffect(() => {
    const fetchAndParseContent = async () => {
      if (!filePath || !repo) {
        setError('Missing file path or repository information.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let fileContent;
        const localDraft = localStorage.getItem(draftKey);

        if (localDraft) {
          console.log('Loading from local draft.');
          fileContent = localDraft;
        } else {
          const res = await fetch(`/api/file?repo=${repo}&path=${filePath}`, { credentials: 'include' });
          if (!res.ok) throw new Error(`Failed to fetch file content: ${res.statusText}`);
          const data = await res.json();

          // Correctly decode base64 content with UTF-8 support.
          const binaryString = atob(data.content);
          const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
          fileContent = new TextDecoder('utf-8').decode(bytes);
        }

        const { model } = await unifiedParser(fileContent, filePath);

        if (model) {
          setFrontmatter(model.frontmatter);
          setContent(model.body);
          setFileType(model.rawType);
        } else {
          throw new Error('Failed to parse file content.');
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAndParseContent();
  }, [repo, filePath, draftKey]);

  const handleEditorChange = (newContent, editor) => {
    setContent(newContent);
    saveDraft(newContent);
  };

  if (loading || content === null) {
    return <div className="text-center p-8">Loading editor...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <TopToolbar />
      <div className="flex-grow w-full">
        <Editor
          value={content}
          init={{
            height: '100%',
            width: '100%',
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}
          onEditorChange={handleEditorChange}
        />
      </div>
      <BottomToolbar />
    </div>
  );
}

export default EditorPage;