// easy-seo/src/pages/ContentEditorPage.jsx
import { h } from 'preact';
import { useEffect, useState, useCallback, useRef } from 'preact/hooks';
import * as mockApi from '../lib/mockApi';
import { useAutosave } from '../hooks/useAutosave';

// Import new components
import EditorHeader from '../components/EditorHeader';
import BlockTree from '../components/BlockTree';
import BottomActionBar from '../components/BottomActionBar';

const ContentEditorPage = ({ pageId }) => {
  const [pageData, setPageData] = useState(null);
  const [content, setContent] = useState('');
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  // Load initial page data
  useEffect(() => {
    console.log(`[ContentEditor] Loading page: ${pageId}`);
    mockApi.fetchPageJson(pageId)
      .then(data => {
        console.log(`[ContentEditor] page.json loaded:`, JSON.stringify(data));
        setPageData(data);
        setContent(data.content || '');
      })
      .catch(err => {
        console.error(`[ContentEditor] Failed to load page data:`, err);
        setError('Failed to load page data.');
      });
  }, [pageId]);

  // Iframe communication
  useEffect(() => {
    const handleMessage = (event) => {
      // Basic security check
      if (event.source !== iframeRef.current?.contentWindow) return;
      console.log("[ContentEditor] received message from preview iframe:", event.data);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const sendPreviewPatch = useCallback((newContent) => {
    if (iframeRef.current?.contentWindow) {
      const msg = { type: 'preview-patch', payload: { content: newContent } };
      console.log("[ContentEditor] sending postMessage to preview iframe:", msg);
      iframeRef.current.contentWindow.postMessage(msg, '*'); // Use specific origin in production
    }
  }, []);

  // Autosave handler
  const handleAutosave = useCallback((dataToSave) => {
    console.log("[ContentEditor] autosave onSave handler triggered");
    mockApi.saveDraft(pageId, { content: dataToSave })
      .then(() => {
        console.log("[ContentEditor] autosave success");
        sendPreviewPatch(dataToSave); // Send patch after successful save
      })
      .catch(err => {
        console.error("[ContentEditor] autosave failed:", err);
      });
  }, [pageId, sendPreviewPatch]);

  const scheduleSave = useAutosave({ onSave: handleAutosave, data: content });

  const handleContentChange = (e) => {
    const newContent = e.currentTarget.innerText;
    console.log(`[ContentEditor] content changed, length: ${newContent.length}`);
    setContent(newContent);
    scheduleSave();
  };

  const handleSelectBlock = (id) => {
      console.log(`[ContentEditor] selected block: ${id}`);
      setSelectedBlock(id);
  };

  const handlePublish = (slug) => {
      console.log(`[ContentEditor] publish requested for page: ${slug}`);
  };

  if (error) {
    return <div class="p-4 text-red-500">{error}</div>;
  }

  if (!pageData) {
    return <div class="p-4 text-gray-400">Loading editor...</div>;
  }

  return (
    <div class="flex flex-col h-screen">
      <EditorHeader />
      <div class="flex flex-grow overflow-hidden">
        <div class="w-1/4 overflow-y-auto">
          <BlockTree blocks={pageData.blocks} onSelectBlock={handleSelectBlock} />
        </div>
        <div class="w-1/2 flex flex-col">
          <div class="p-2 border-b border-gray-700">
            <button class="px-3 py-1 text-sm bg-gray-700 rounded mr-2">Content</button>
            <button class="px-3 py-1 text-sm bg-gray-900 rounded">Visual</button>
          </div>
          <div
            contentEditable
            onInput={handleContentChange}
            class="flex-grow p-4 bg-gray-900 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
        <div class="w-1/4 flex flex-col border-l border-gray-700">
            <div class="p-2 border-b border-gray-700">Inspector</div>
            <div class="p-4 flex-grow">
                {selectedBlock ? `Selected: ${selectedBlock}` : 'Nothing selected'}
            </div>
            <iframe
                ref={iframeRef}
                src="/preview/mock-preview.html"
                class="w-full h-1/2 border-t border-gray-700"
                title="Preview"
            />
        </div>
      </div>
      <BottomActionBar onPublish={handlePublish} slug={pageId} />
    </div>
  );
};

export default ContentEditorPage;
