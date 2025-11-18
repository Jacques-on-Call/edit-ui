import { h } from 'preact';
import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { fetchPageJson } from '../lib/mockApi';
import useAutosave from '../hooks/useAutosave';
import LexicalEditor from '../components/LexicalEditor';
import EditorHeader from '../components/EditorHeader';
import { Home, Plus, UploadCloud } from 'lucide-preact';

export default function ContentEditorPage(props) {
  const pageId = props.pageId || 'home';
  const [initialContent, setInitialContent] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const lastAcceptedContentRef = useRef(null);
  const editorApiRef = useRef(null);

  const autosaveCallback = useCallback((newContent) => {
    console.log(`[ContentEditor] autosave-callback TIMESTAMP=${new Date().toISOString()} len=${newContent.length}`);
    if (newContent === lastAcceptedContentRef.current) {
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
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
      lastAcceptedContentRef.current = newContent;
      console.log(`[ContentEditor] Content successfully autosaved to local storage with key: ${key}`);
      setSaveStatus('saved');
    } catch (error) {
      console.error('[ContentEditor] Failed to autosave content to local storage:', error);
      setSaveStatus('unsaved');
    }
  }, [pageId]);

  const { triggerSave } = useAutosave(autosaveCallback, 1000);

  useEffect(() => {
    const computeAndSetInitialContent = (pageJson = null) => {
      const draftKey = `easy-seo-draft:${pageId}`;
      const savedDraft = localStorage.getItem(draftKey);
      let finalContent = '';

      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        finalContent = draft.content || '';
      } else if (pageJson?.content) {
        finalContent = pageJson.content;
      } else if (pageJson?.meta?.initialContent) {
        finalContent = pageJson.meta.initialContent;
      }

      if (typeof finalContent === 'string' && !finalContent.startsWith('<')) {
        finalContent = finalContent.split('\n').filter(line => line.trim() !== '').map(line => `<p>${line}</p>`).join('');
      }

      console.log('[ContentEditor] initialContent ->', finalContent);

      setInitialContent(finalContent);
      lastAcceptedContentRef.current = finalContent;
    };

    const draftKey = `easy-seo-draft:${pageId}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      computeAndSetInitialContent();
    } else {
      fetchPageJson(pageId).then(computeAndSetInitialContent);
    }
  }, [pageId]);

  function handleLexicalChange(newContent) {
    console.log(`[ContentEditor] lexical-change len: ${newContent.length}`);
    if (newContent !== lastAcceptedContentRef.current) {
      setSaveStatus('unsaved');
      triggerSave(newContent);
    }
  }

  const handleHome = () => route('/explorer');
  const handleAdd = () => console.log('[BottomBar] Add clicked');
  const handlePublish = () => console.log('[ContentEditor] handlePublish triggered - Not implemented');

  return (
    <div class="flex flex-col h-screen bg-gray-900 text-white">
      <EditorHeader editorApiRef={editorApiRef} />

      <main
        class="flex-grow overflow-y-auto"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        {initialContent !== null ? (
          <LexicalEditor
            ref={editorApiRef}
            slug={pageId}
            initialContent={initialContent}
            onChange={handleLexicalChange}
          />
        ) : (
          <div>Loading editor...</div>
        )}
      </main>

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
                  ? '#FF2400'
                  : saveStatus === 'saving'
                  ? '#FBBF24'
                  : '#C7EA46',
            }}
          ></div>
        </div>
      </footer>
    </div>
  );
}
