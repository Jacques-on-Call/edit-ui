import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { debounce } from 'lodash';
import fm from 'front-matter';
import yaml from 'js-yaml';
import { marked } from 'marked';
import TurndownService from 'turndown';

import TopToolbar from '../components/TopToolbar';
import AssignLayoutModal from '../components/AssignLayoutModal';
import { unifiedParser } from '../utils/unifiedParser';
import { stringifyAstroFile } from '../utils/astroFileParser';
import { sectionsToEditableHTML, editableHTMLToSections } from '../utils/sectionContentMapper';
import { generatePreviewHtml } from '../utils/htmlGenerator';

const turndownService = new TurndownService();

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

function EditorPage() {
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get('path');
  const repo = localStorage.getItem('selectedRepo');

  if (!repo) {
    return (
      <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center text-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Repository Context Missing</h1>
          <p className="text-gray-600 mb-6">This editor requires a selected repository to function. Please select a repository to continue.</p>
          <Link
            to="/repository-selection"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Select a Repository
          </Link>
        </div>
      </div>
    );
  }

  // Core state
  const [frontmatter, setFrontmatter] = useState({});
  const [content, setContent] = useState(null); // This is always HTML for the editor
  const [fileSha, setFileSha] = useState(null);
  const [originalBody, setOriginalBody] = useState('');
  const [originalSections, setOriginalSections] = useState([]);
  const [fileType, setFileType] = useState(null);

  // UI/Loading state
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [parsingError, setParsingError] = useState(null);
  const [rawContentOnError, setRawContentOnError] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [previewHtml, setPreviewHtml] = useState('');
  const [isAssignLayoutModalOpen, setAssignLayoutModalOpen] = useState(false);
  
  const draftKey = `draft_${repo}_${filePath}`;

  const handleAssignLayoutConfirm = async (layoutIdentifier) => {
    try {
      const response = await fetch('/api/assign-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'credentials': 'include' },
        body: JSON.stringify({
          repo,
          path: filePath,
          layout: layoutIdentifier,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to assign layout.');
      }
      // Update local state to reflect the change immediately
      const newFrontmatter = { ...frontmatter, layout: layoutIdentifier };
      setFrontmatter(newFrontmatter);
      // Trigger a preview refresh with the new layout info
      const newPreviewHtml = generatePreviewHtml(newFrontmatter, content, repo);
      setPreviewHtml(newPreviewHtml);
      console.log('Layout assigned successfully and preview updated!');
    } catch (err) {
      console.error(err);
      setError(err.message); // Show error to the user
    } finally {
      setAssignLayoutModalOpen(false);
    }
  };

  const handlePublish = async () => {
    if (!filePath || !repo) {
      setError('Cannot publish without file path and repository information.');
      return;
    }
    setIsPublishing(true);
    setError(null);
    try {
      let fullContent;
      if (fileType === 'astro-ast' && originalSections.length > 0) {
        const updatedSections = editableHTMLToSections(content, originalSections);
        const updatedFrontmatter = { ...frontmatter, sections: updatedSections };
        fullContent = stringifyAstroFile(updatedFrontmatter, originalBody);
      } else {
        const markdownBody = turndownService.turndown(content);
        const frontmatterString = yaml.dump(frontmatter);
        fullContent = `---\n${frontmatterString}---\n${markdownBody}`;
      }

      const res = await fetch(`/api/file?repo=${repo}&path=${filePath}`, { credentials: 'include' });
      const data = await res.json();
      if (data.sha !== fileSha) {
        if (!window.confirm('The file has been modified since you opened it. Do you want to overwrite the changes?')) {
          setIsPublishing(false);
          return;
        }
      }

      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          path: filePath,
          content: btoa(unescape(encodeURIComponent(fullContent))),
          message: `docs: update content for ${filePath}`,
          sha: data.sha,
        }),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred during publishing.' }));
        throw new Error(errorData.message);
      }
      localStorage.removeItem(draftKey);
      console.log('Publish successful. Draft removed from local storage.');
    } catch (err) {
      console.error('Publishing failed:', err);
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateDraftAndPreview = useCallback(
    debounce((newContent, currentFrontmatter, currentFileType, currentOriginalBody, currentOriginalSections) => {
      let fullContentString;
      let updatedFrontmatter = currentFrontmatter;

      if (currentFileType === 'astro-ast' && currentOriginalSections.length > 0) {
        const updatedSections = editableHTMLToSections(newContent, currentOriginalSections);
        updatedFrontmatter = { ...currentFrontmatter, sections: updatedSections };
        fullContentString = stringifyAstroFile(updatedFrontmatter, currentOriginalBody);
      } else {
        const markdownBody = turndownService.turndown(newContent);
        updatedFrontmatter = currentFrontmatter;
        const frontmatterString = yaml.dump(updatedFrontmatter);
        fullContentString = `---\n${frontmatterString}---\n${markdownBody}`;
      }

      localStorage.setItem(draftKey, fullContentString);
      console.log(`Draft saved for ${filePath}.`);

      const generatedHtml = generatePreviewHtml(updatedFrontmatter, newContent, repo);
      setPreviewHtml(generatedHtml);

      if (currentFileType === 'astro-ast') {
        setFrontmatter(updatedFrontmatter);
      }
    }, 500),
    [repo, draftKey, filePath]
  );

  const handleEditorChange = (newContent) => {
    setContent(newContent);
    updateDraftAndPreview(newContent, frontmatter, fileType, originalBody, originalSections);
  };

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
          setFileSha(data.sha);
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

          let bodyAsHtml;
          if (model.rawType === 'astro-ast') {
             setOriginalBody(model.originalBody || '');
             if (model.frontmatter.sections) {
                setOriginalSections(model.frontmatter.sections);
                bodyAsHtml = await sectionsToEditableHTML(model.frontmatter.sections);
             } else {
                bodyAsHtml = '<p><em>This Astro file does not have a sections array to edit.</em></p>';
             }
          } else {
            setOriginalBody(model.body);
            bodyAsHtml = marked(model.body);
          }

          setContent(bodyAsHtml);
          const initialPreviewHtml = generatePreviewHtml(model.frontmatter, bodyAsHtml, repo);
          setPreviewHtml(initialPreviewHtml);
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
  }, [repo, filePath, draftKey, updateDraftAndPreview]);

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
      'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright | bullist numlist outdent indent | link | removeformat',
    content_style: `body {  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;  font-size: 16px; line-height: 1.6; padding: 1rem; } .section { margin-bottom: 2rem; padding: 1rem; background: #f9fafb; border-radius: 8px; } .hero-section { text-align: center; padding: 2rem 1rem; } .grid-section { padding: 1rem; } .grid-items { display: grid; gap: 1rem; margin-top: 1rem; } .grid-item { padding: 1rem; background: white; border-radius: 6px; border: 1px solid #e5e7eb; } hr { margin: 2rem 0; border: none; border-top: 2px dashed #d1d5db; }`,
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="sticky top-0 z-10">
        <TopToolbar
          onPublish={handlePublish}
          isPublishing={isPublishing}
          onChangeLayout={() => setAssignLayoutModalOpen(true)}
          layoutPath={frontmatter.layout}
          filePath={filePath}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </header>
      {isAssignLayoutModalOpen && (
        <AssignLayoutModal
          onClose={() => setAssignLayoutModalOpen(false)}
          onAssign={handleAssignLayoutConfirm}
          currentPath={filePath}
        />
      )}
      {parsingError && <ErrorDisplay error={parsingError} rawContent={rawContentOnError} />}

      <main className="flex-grow w-full overflow-y-auto">
        {activeTab === 'editor' && (
          <div className="w-full h-full flex flex-col bg-white">
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
          <div className="w-full h-full bg-white">
            <iframe
              srcDoc={previewHtml}
              title="Live Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default EditorPage;