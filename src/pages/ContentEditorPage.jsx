import { h } from 'preact';
import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { fetchPageJson } from '../lib/mockApi';
import useAutosave from '../hooks/useAutosave';
import { Home, Plus, UploadCloud } from 'lucide-preact';

export default function ContentEditorPage(props) {
  const pageId = props.pageId || 'home';
  const [pageJson, setPageJson] = useState(null);
  const [content, setContent] = useState('');
  const editorRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, unsaved, saving
  const isProgrammaticUpdateRef = useRef(false);
  const lastAcceptedContentRef = useRef(null);
  const lastSavedContentRef = useRef(null);

  const autosaveCallback = useCallback((newContent) => {
    if (newContent === lastSavedContentRef.current) {
      return;
    }
    setSaveStatus('saving');
    try {
      const key = `easy-seo-draft:${pageId}`;
      const draft = JSON.parse(localStorage.getItem(key) || '{}');
      const payload = {
        ...draft,
        slug: pageId,
        content: newContent,
        meta: pageJson?.meta || { title: 'New Page' },
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
      lastSavedContentRef.current = newContent;
      console.log(`[ContentEditor] draftSaved -> slug: ${pageId}, key: ${key}`);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('saved'), 2000); // Revert to neutral after 2s
    } catch (error) {
      console.error('[ContentEditor] Failed to autosave content to local storage:', error);
      setSaveStatus('unsaved');
    }
  }, [pageId, pageJson]);

  const { triggerSave } = useAutosave(autosaveCallback, 1000);

  useEffect(() => {
    console.log('[ContentEditor] Loading page:', pageId);

    const draftKey = `easy-seo-draft:${pageId}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      console.log(`[ContentEditor] loadedDraft -> slug: ${draft.slug}, savedAt: ${draft.savedAt}`);
      lastAcceptedContentRef.current = draft.content;
      lastSavedContentRef.current = draft.content;
      setContent(draft.content);
      if (editorRef.current) {
        isProgrammaticUpdateRef.current = true;
        editorRef.current.innerHTML = draft.content;
        isProgrammaticUpdateRef.current = false;
      }
      setPageJson({ meta: draft.meta });
    } else {
      fetchPageJson(pageId).then((pj) => {
        console.log('[ContentEditor] page.json loaded:', pj);
        setPageJson(pj);
        const initialContent = pj?.content || '<p>Start typing...</p>';
        lastAcceptedContentRef.current = initialContent;
        lastSavedContentRef.current = initialContent;
        setContent(initialContent);
        if (editorRef.current) {
          isProgrammaticUpdateRef.current = true;
          editorRef.current.innerHTML = initialContent;
          isProgrammaticUpdateRef.current = false;
        }
      });
    }
  }, [pageId]);

  function handleEditorInput(e) {
    if (isProgrammaticUpdateRef.current) {
      return;
    }
    const newContent = e.currentTarget.innerHTML;
    if (newContent !== lastAcceptedContentRef.current) {
      lastAcceptedContentRef.current = newContent;
      setContent(newContent);
      setSaveStatus('unsaved');
      triggerSave(newContent);
    }
  }

  const handleHome = () => {
    console.log('[BottomBar] Home clicked');
    route('/explorer');
  };
  const handleAdd = () => console.log('[BottomBar] Add clicked');
  const handlePublish = () => {
    console.log('[ContentEditor] handlePublish triggered');
    try {
      console.log(`[ContentEditor] Saving content to local storage for page: ${pageId}...`);
      const key = `easy-seo-draft:${pageId}`;
      const payload = {
        content: content,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
      console.log(`[ContentEditor] Content successfully saved to local storage with key: ${key}`);
      setSaveStatus('saved');
    } catch (error) {
      console.error('[ContentEditor] Failed to save content to local storage:', error);
      setSaveStatus('unsaved');
    }
  };

  return (
    <div class="flex flex-col h-screen bg-gray-900 text-white">
      {/* Global Header Shell */}
      <header class="flex items-center p-2 border-b border-gray-700 flex-shrink-0 h-14"></header>

      {/* Editable Area */}
      <main
        class="flex-grow overflow-y-auto p-4"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          class="w-full h-full focus:outline-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </main>

      {/* Bottom Action Bar */}
      <footer class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around items-center p-2 pb-[calc(0.5rem_+_env(safe-area-inset-bottom))]">
        <button onClick={handleHome} class="p-2">
          <Home size={24} />
        </button>
        <button onClick={handleAdd} class="p-2">
          <Plus size={24} />
        </button>
        <div class="flex items-center">
          <button onClick={handlePublish} class="p-2">
            <UploadCloud size={24} />
          </button>
          <div
            class={`w-3 h-3 rounded-full ml-2 ${
              saveStatus === 'unsaved'
                ? 'bg-red-500' // --scarlet: #FF2400
                : saveStatus === 'saving'
                ? 'bg-yellow-500' // A temporary saving color
                : 'bg-green-500' // --light-green: #C7EA46
            }`}
            style={{
              backgroundColor:
                saveStatus === 'unsaved'
                  ? '#FF2400'
                  : saveStatus === 'saving'
                  ? '#FBBF24' // Tailwind yellow-500
                  : '#C7EA46',
            }}
          ></div>
        </div>
      </footer>
    </div>
  );
}
