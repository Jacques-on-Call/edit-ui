import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { debounce } from 'lodash';
import matter from 'gray-matter';
import TopToolbar from '../components/TopToolbar';
import BottomToolbar from '../components/BottomToolbar';
import StatusLoader from '../components/StatusLoader';
import { unifiedParser } from '../utils/unifiedParser';
import { stringifyAstroFile } from '../utils/astroFileParser';
import { sectionsToEditableHTML, editableHTMLToSections } from '../utils/sectionContentMapper';

const ErrorDisplay = ({ error, rawContent }) => (
  <div className="p-4 sm:p-6 lg:p-8 bg-red-50">
    <h1 className="text-2xl font-bold text-red-700 mb-4">File Parsing Error</h1>
    <p className="text-red-600 mb-2">The editor could not parse the file content due to the following error. This usually means there is a syntax error (like a missing comma or unclosed quote) in the frontmatter.</p>
    <pre className="bg-white p-4 rounded-lg border border-red-200 text-red-800 whitespace-pre-wrap font-mono text-sm">
      <code>{error}</code>
    </pre>
    <p className="mt-4 text-gray-700 font-semibold">Problematic File Content:</p>
    <p className="text-gray-600 mb-2">The full, raw content of the file is shown below. You can copy this content, correct the error in your local code editor, and then commit the fix.</p>
    <textarea
      className="w-full h-64 p-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
      readOnly
      defaultValue={rawContent}
    />
  </div>
);

const PreviewInstructions = ({ onBuild }) => (
  <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
    <h2 className="text-xl font-bold text-gray-800">Live Preview Generator</h2>
    <p className="mt-2 text-gray-600">
      Click the button below to generate a preview of your page.
    </p>
    <p className="mt-4 text-sm text-gray-500">
      This will start a build process that may take a few moments. The preview will load automatically when it's ready.
    </p>
    <button
      onClick={onBuild}
      className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
    >
      Generate Preview
    </button>
  </div>
);

function EditorPage() {
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get('path');
  const repo = localStorage.getItem('selectedRepo');

  const [frontmatter, setFrontmatter] = useState({});
  const [content, setContent] = useState(null);
  const [originalBody, setOriginalBody] = useState('');
  const [originalSections, setOriginalSections] = useState([]);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parsingError, setParsingError] = useState(null);
  const [rawContentOnError, setRawContentOnError] = useState('');

  const [activeTab, setActiveTab] = useState('editor');
  const [buildInfo, setBuildInfo] = useState(null);
  const [previewDisplay, setPreviewDisplay] = useState('instructions'); // 'instructions', 'loading', 'iframe', 'error'
  
  const draftKey = `draft_${repo}_${filePath}`;

  const saveDraft = useCallback(
    debounce((htmlContent, currentFrontmatter, currentOriginalBody, currentOriginalSections) => {
      const updatedSections = editableHTMLToSections(htmlContent, currentOriginalSections);
      const updatedFrontmatter = { ...currentFrontmatter, sections: updatedSections };
      const fullContent = stringifyAstroFile(updatedFrontmatter, currentOriginalBody);
      localStorage.setItem(draftKey, fullContent);
      console.log(`Draft saved for ${filePath}.`);
    }, 1000),
    [draftKey, filePath]
  );

  useEffect(() => {
    const fetchAndParseContent = async () => {
      if (!filePath || !repo) {
        setError('Missing file path or repository information.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setParsingError(null);
      setRawContentOnError('');

      try {
        let fileContent;
        const localDraft = localStorage.getItem(draftKey);

        if (localDraft) {
          fileContent = localDraft;
        } else {
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
          setParsingError(trace.error);
          setRawContentOnError(fileContent);
          setContent('');
        } else if (model) {
          setFrontmatter(model.frontmatter);
          setFileType(model.rawType);
          setOriginalBody(model.originalBody || model.body || '');

          if (model.rawType === 'astro-ast' && model.frontmatter.sections) {
            const sections = model.frontmatter.sections;
            setOriginalSections(sections);
            const editableHTML = await sectionsToEditableHTML(sections);
            setContent(editableHTML);
          } else if (model.rawType === 'astro-ast') {
            setContent('<p><em>This Astro file does not have a sections array to edit.</em></p>');
          } else {
            setContent(model.body);
          }
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

  useEffect(() => {
    // When the user switches to the preview tab, check if a preview already exists.
    if (activeTab === 'preview') {
      loadPreview();
    }
  }, [activeTab]);

  const handleEditorChange = (newContent, editor) => {
    setContent(newContent);

    if (fileType === 'astro-ast' && originalSections.length > 0) {
      saveDraft(newContent, frontmatter, originalBody, originalSections);
    } else if (fileType !== 'astro-ast') {
      const fullContent = matter.stringify(newContent, frontmatter);
      localStorage.setItem(draftKey, fullContent);
    }
  };
  
  const triggerBuild = async () => {
    console.log('Triggering preview build...');
    setPreviewDisplay('loading'); // Show loading state immediately
    try {
      await fetch('/api/trigger-build', { method: 'POST' });
      pollForBuildStatus(); // Start polling immediately
    } catch (error) {
      console.error('Failed to trigger build:', error);
      setBuildInfo({ message: 'Failed to start the build process.', details: error.message });
      setPreviewDisplay('error');
    }
  };

  const pollForBuildStatus = () => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/preview/build-status.json?t=${Date.now()}`);
        if (!response.ok) {
          // If the file doesn't exist yet (404), just continue polling
          return;
        }

        // Check content type to prevent parsing HTML as JSON during race conditions
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // If it's not JSON, it's probably the fallback HTML page. Ignore and continue polling.
          return;
        }

        const data = await response.json();

        if (data.status === 'success' || data.status === 'error') {
          clearInterval(intervalId);
          setBuildInfo(data);
          setPreviewDisplay(data.status === 'success' ? 'iframe' : 'error');
        }
        // If status is 'building', do nothing and let the interval continue.

      } catch (error) {
        // This catches network errors etc. during polling
        clearInterval(intervalId);
        setBuildInfo({ message: 'Error checking build status.', details: error.message });
        setPreviewDisplay('error');
      }
    }, 2000); // Poll every 2 seconds

    // Optional: Add a timeout to stop polling after a certain duration
    setTimeout(() => {
        clearInterval(intervalId);
        // You might want to update the UI to indicate a timeout here
    }, 120000); // Stop polling after 2 minutes
  };

  // This function is now only for loading an *existing* preview without rebuilding.
  const loadPreview = async () => {
    try {
      const response = await fetch(`/preview/build-status.json?t=${Date.now()}`);
      if (!response.ok) {
        // If no status file, it means no build has been run. Show instructions.
        setPreviewDisplay('instructions');
        return;
      }
      const data = await response.json();
      setBuildInfo(data);
      if (data.status === 'success') {
        setPreviewDisplay('iframe');
      } else {
        // If the last build failed or is somehow stuck, show instructions to trigger a new build.
        setPreviewDisplay('instructions');
      }
    } catch (error) {
      setPreviewDisplay('instructions');
    }
  }


  if (loading || content === null) {
    return <div className="text-center p-8">Loading editor…</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">{error}</div>;
  }

  const editorConfig = {
    height: '100%',
    width: '100%',
    menubar: false,
    mobile: {
      theme: 'silver',
      plugins: 'lists link',
      toolbar: 'undo redo | bold italic | bullist numlist | link'
    },
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
      'searchreplace', 'visualblocks', 'code',
      'insertdatetime', 'table', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link | removeformat',
    content_style: `body {  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;  font-size: 16px; line-height: 1.6; padding: 1rem; } .section { margin-bottom: 2rem; padding: 1rem; background: #f9fafb; border-radius: 8px; } .hero-section { text-align: center; padding: 2rem 1rem; } .grid-section { padding: 1rem; } .grid-items { display: grid; gap: 1rem; margin-top: 1rem; } .grid-item { padding: 1rem; background: white; border-radius: 6px; border: 1px solid #e5e7eb; } hr { margin: 2rem 0; border: none; border-top: 2px dashed #d1d5db; }`,
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopToolbar />
      {parsingError && <ErrorDisplay error={parsingError} rawContent={rawContentOnError} />}

      <div className="flex border-b border-gray-200 bg-white shadow-sm">
        <button
          className={`px-6 py-3 text-sm font-semibold focus:outline-none transition-colors duration-200 ${activeTab === 'editor' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
          onClick={() => setActiveTab('editor')}
        >
          Editor
        </button>
        <button
          className={`px-6 py-3 text-sm font-semibold focus:outline-none transition-colors duration-200 ${activeTab === 'preview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>

      <div className="flex-grow w-full overflow-y-auto">
        {activeTab === 'editor' && (
          <div className="w-full h-full flex flex-col bg-white">
            {fileType === 'astro-ast' && originalSections.length > 0 && (
              <div className="bg-blue-50 border-b border-blue-200 p-3 text-sm text-blue-800">
                📝 <strong>Section Editor:</strong> Edit the content below. Each section is clearly marked. Changes are auto-saved.
              </div>
            )}
            <div className="flex-grow">
              <Editor
                value={content}
                init={editorConfig}
                onEditorChange={handleEditorChange}
              />
            </div>
          </div>
        )}
        {activeTab === 'preview' && (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            {previewDisplay === 'instructions' && <PreviewInstructions onBuild={triggerBuild} />}
            {previewDisplay === 'loading' && <StatusLoader status="building" />}
            {previewDisplay === 'error' && (
              <div className="text-center p-8">
                <StatusLoader status="error" />
                <pre className="mt-4 bg-white text-left text-sm text-red-900 p-4 rounded-lg border border-red-200 w-full max-w-3xl h-64 overflow-auto font-mono whitespace-pre-wrap">
                  <code>{buildInfo?.message}\n\n{buildInfo?.details}</code>
                </pre>
                <button
                  onClick={triggerBuild}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                >
                  Rebuild Preview
                </button>
              </div>
            )}
            {previewDisplay === 'iframe' && (
              <div className="w-full h-full flex flex-col">
                <div className="p-2 bg-white border-b flex items-center gap-4">
                  <button 
                    onClick={triggerBuild}
                    className="px-4 py-1 bg-blue-500 text-white text-sm font-semibold rounded hover:bg-blue-600"
                  >
                    Rebuild Preview
                  </button>
                  <p className="text-sm text-gray-600">
                    Last built: {buildInfo ? new Date(buildInfo.timestamp).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <iframe
                  key={buildInfo ? buildInfo.timestamp : 'initial'} // Force re-render on new build
                  src={`/preview/index.html`}
                  title="Static Preview"
                  className="w-full flex-grow border-0"
                />
              </div>
            )}
          </div>
        )}
      </div>
      <BottomToolbar />
    </div>
  );
}

export default EditorPage;
