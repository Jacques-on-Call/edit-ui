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
  const [parsingError, setParsingError] = useState(null);

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
      setParsingError(null); // Reset parsing error on new load

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

          const binaryString = atob(data.content);
          const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
          fileContent = new TextDecoder('utf-8').decode(bytes);
        }

        const { model, trace } = await unifiedParser(fileContent, filePath);

        if (trace.error) {
          setParsingError(trace.error);
          setContent(fileContent); // Show raw content on error
        } else if (model) {
          setFrontmatter(model.frontmatter);
          setContent(model.body);
          setFileType(model.rawType);
        } else {
          throw new Error('An unknown parsing error occurred.');
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

  if (loading) {
    return <div className="text-center p-8">Loading editor...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">{error}</div>;
  }

  // Display a dedicated error report if parsing fails
  if (parsingError) {
    return (
      <div className="h-screen flex flex-col">
        <TopToolbar />
        <div className="flex-grow p-4 sm:p-6 lg:p-8 bg-red-50">
          <h1 className="text-2xl font-bold text-red-700 mb-4">File Parsing Error</h1>
          <p className="text-red-600 mb-2">The editor could not separate the frontmatter from the body content because of the following error:</p>
          <pre className="bg-white p-4 rounded-lg border border-red-200 text-red-800 whitespace-pre-wrap font-mono text-sm">
            <code>{parsingError}</code>
          </pre>
          <p className="mt-4 text-gray-700">The full, raw content of the file is loaded in the editor below so you can manually correct the issue.</p>
        </div>
        <div className="flex-grow w-full">
          <Editor
            value={content} // Show raw content
            init={{
              height: '100%',
              width: '100%',
              menubar: false,
              toolbar: 'undo redo | code',
              plugins: 'code'
            }}
            onEditorChange={handleEditorChange}
          />
        </div>
        <BottomToolbar />
      </div>
    );
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