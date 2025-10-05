import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { unifiedParser } from '../utils/unifiedParser';
import { generateHtmlForPreview } from '../utils/htmlGenerator';

function PreviewPage() {
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get('path');
  const repo = localStorage.getItem('selectedRepo');
  const navigate = useNavigate();

  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  const draftKey = `draft_${repo}_${filePath}`;

  // We need to trigger a re-render when the draft is discarded
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const generatePreview = async () => {
      if (!filePath || !repo) {
        setError('Missing file path or repository information.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let fileContent;
        const localDraft = localStorage.getItem(draftKey);

        if (localDraft) {
          fileContent = localDraft;
          setHasDraft(true);
        } else {
          setHasDraft(false);
          const res = await fetch(`/api/file?repo=${repo}&path=${filePath}`, { credentials: 'include' });
          if (!res.ok) throw new Error(`Failed to fetch file content: ${res.statusText}`);
          const data = await res.json();
          const binaryString = atob(data.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          fileContent = new TextDecoder('utf-8').decode(bytes);
        }

        const { model, trace } = await unifiedParser(fileContent, filePath);

        if (trace.error) {
          throw new Error(`File parsing failed: ${trace.error}`);
        }

        if (model && model.frontmatter) {
          const html = generateHtmlForPreview(model.frontmatter, repo);
          setPreviewHtml(html);
        } else {
          throw new Error('Could not generate preview. The file may be empty or have invalid frontmatter.');
        }

      } catch (err) {
        setError(err.message);
        setPreviewHtml(''); // Clear previous preview on error
      } finally {
        setLoading(false);
      }
    };

    generatePreview();
  }, [repo, filePath, draftKey, refresh]);

  const handleDiscard = () => {
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    // Trigger a refresh of the preview to load the original content
    setRefresh(prev => prev + 1);
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get the latest SHA for the file
      const fileRes = await fetch(`/api/file?repo=${repo}&path=${filePath}`, { credentials: 'include' });
      if (!fileRes.ok) throw new Error('Could not fetch latest file version before publishing.');
      const fileData = await fileRes.json();
      const sha = fileData.sha;

      // 2. Get the draft content
      const content = localStorage.getItem(draftKey);
      if (!content) {
        throw new Error('No draft content found to publish.');
      }

      // 3. Make the API call to update the file
      const publishRes = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, path: filePath, content, sha }),
        credentials: 'include',
      });

      if (!publishRes.ok) {
        const errorData = await publishRes.json();
        throw new Error(errorData.message || 'Failed to publish the file.');
      }

      // 4. On success, remove the draft and update the UI
      localStorage.removeItem(draftKey);
      setHasDraft(false);
      alert('File published successfully!');
      // Refresh to show the now-published content as the main version
      setRefresh(prev => prev + 1);

    } catch (err) {
      setError(err.message);
      alert(`Error publishing: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-shrink-0 bg-white border-b p-2 flex items-center justify-between">
        <div className="flex items-center">
          <Link to={`/editor?path=${filePath}`} className="text-sm text-blue-600 hover:underline">
            &larr; Back to Editor
          </Link>
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-sm text-gray-700">Previewing: {filePath}</span>
        </div>
        <div className="flex items-center space-x-2">
          {hasDraft && (
            <>
              <div className="px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                Unpublished Draft
              </div>
              <button
                onClick={handleDiscard}
                className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-md hover:bg-red-200"
              >
                Discard
              </button>
              <button
                onClick={handlePublish}
                className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-grow bg-gray-200">
        {loading && <div className="text-center p-8">Loading Preview…</div>}
        {error && <div className="text-center p-8 text-red-600 bg-red-50">{error}</div>}
        {!loading && !error && (
          <iframe
            srcDoc={previewHtml}
            title="Page Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}

export default PreviewPage;