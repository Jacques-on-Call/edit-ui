import { h } from 'preact';
import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { fetchPageJson } from '../lib/mockApi';
import useAutosave from '../hooks/useAutosave';
import LexicalEditor from '../components/LexicalEditor'; // Import the new editor
import { Home, Plus, UploadCloud } from 'lucide-preact';

export default function ContentEditorPage(props) {
  const pageId = props.pageId || 'home';
  const [pageJson, setPageJson] = useState(null);
  const [content, setContent] = useState(null); // Initialize as null to show loading state
  const [saveStatus, setSaveStatus] = useState('saved');
  const lastSavedContentRef = useRef(null);

  const autosaveCallback = useCallback((newContent) => {
    // This callback is triggered by the useAutosave hook after debouncing
    console.log(`[ContentEditor] autosave-callback TIMESTAMP=${new Date().toISOString()} len=${newContent.length}`);
    if (newContent === lastSavedContentRef.current) {
      return;
    }
    setSaveStatus('saving');
    console.log('[ContentEditor] Autosaving content to local storage...');
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
      console.log(`[ContentEditor] Content successfully autosaved to local storage with key: ${key}`);
      setSaveStatus('saved');
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
      const initialContent = draft.content;
      lastSavedContentRef.current = initialContent;
      setContent(initialContent);
      setPageJson({ meta: draft.meta });
    } else {
      fetchPageJson(pageId).then((pj) => {
        console.log('[ContentEditor] page.json loaded:', pj);
        setPageJson(pj);
        const initialContent = pj?.content || '<p>Start typing...</p>';
        lastSavedContentRef.current = initialContent;
        setContent(initialContent);
      });
    }
  }, [pageId]);

  function handleLexicalChange(newContent) {
    // This function is called on every keystroke from the LexicalEditor
    console.log(`[ContentEditor] lexical-change len: ${newContent.length}`);
    setContent(newContent);
    setSaveStatus('unsaved');
    triggerSave(newContent);
  }

  const handleHome = () => route('/explorer');
  const handleAdd = () => console.log('[BottomBar] Add clicked');
  const handlePublish = () => console.log('[ContentEditor] handlePublish triggered - Not implemented in this sprint');


  return (
    <div class="flex flex-col h-screen bg-gray-900 text-white">
      {/* Global Header Shell */}
      <header class="flex items-center p-2 border-b border-gray-700 flex-shrink-0 h-14"></header>

      {/* Editable Area */}
      <main
        class="flex-grow overflow-y-auto"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        {content !== null ? (
          <LexicalEditor
            slug={pageId}
            initialContent={content}
            onChange={handleLexicalChange}
          />
        ) : (
          <div>Loading editor...</div>
        )}
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
            class="w-3 h-3 rounded-full ml-2"
            style={{
              backgroundColor:
                saveStatus === 'unsaved'
                  ? '#FF2400' // red
                  : saveStatus === 'saving'
                  ? '#FBBF24' // yellow
                  : '#C7EA46', // green
            }}
          ></div>
        </div>
      </footer>
    </div>
  );
}
