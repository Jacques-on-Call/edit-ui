import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { debounce } from 'lodash';
import TopToolbar from '../components/TopToolbar';
import BottomToolbar from '../components/BottomToolbar';
import { parseContent, reconstructContent } from '../utils/contentParser';

function EditorPage() {
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get('path');
  const repo = localStorage.getItem('selectedRepo');

  const [frontmatter, setFrontmatter] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const draftKey = `draft_${repo}_${filePath}`;

  const saveDraft = useCallback(debounce((newContent) => {
    const fullContent = reconstructContent(frontmatter, newContent);
    localStorage.setItem(draftKey, fullContent);
    console.log('Draft saved.');
  }, 1000), [draftKey, frontmatter]);

  useEffect(() => {
    const fetchFileContent = async () => {
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
          // When loading a draft, we assume it's the full content for now.
          // The next step will refine this to save/load reconstructed content.
          fileContent = localDraft;
        } else {
          const res = await fetch(`/api/file?repo=${repo}&path=${filePath}`, { credentials: 'include' });
          if (!res.ok) throw new Error(`Failed to fetch file content: ${res.statusText}`);
          const data = await res.json();
          fileContent = atob(data.content);
        }

        const { frontmatter: parsedFrontmatter, body: parsedBody } = parseContent(fileContent);

        setFrontmatter(parsedFrontmatter);
        setInitialValue(parsedBody);
        setContent(parsedBody);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFileContent();
  }, [repo, filePath, draftKey]);

  const handleEditorChange = (newContent, editor) => {
    setContent(newContent);
    saveDraft(newContent);
  };

  if (loading) {
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
          initialValue={initialValue}
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