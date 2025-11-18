import { h } from 'preact';
import { useEffect, useState, useRef, useCallback } from 'preact/hooks';

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\\/g, '\\\\');
}
import { route } from 'preact-router';
import { fetchPageJson } from '../lib/mockApi';
import useAutosave from '../hooks/useAutosave';
import LexicalEditor from '../components/LexicalEditor';
import EditorHeader from '../components/EditorHeader';
import { Home, Plus, UploadCloud } from 'lucide-preact';

export default function ContentEditorPage(props) {
  const encodedPath = props.filePath || props.filePathEncoded || null;
  const rawPath = encodedPath ? decodeURIComponent(encodedPath) : (props.pageId || 'home');
  const pageId = rawPath.includes('/') ? rawPath.split('/').pop().replace(/\.astro$/, '') : rawPath;
  const filePathRef = useRef(rawPath);

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
    const processAndSetInitialContent = (contentSource) => {
      let finalContent = contentSource || '';

      if (typeof finalContent === 'string' && !finalContent.startsWith('<')) {
        finalContent = finalContent
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => `<p>${escapeHtml(line.trim())}</p>`)
          .join('');
      }

      console.log('[ContentEditor] initialContent ->', finalContent);
      lastAcceptedContentRef.current = finalContent;
      setInitialContent(finalContent);
    };

    const draftKey = `easy-seo-draft:${pageId}`;
    const savedDraftJSON = localStorage.getItem(draftKey);
    let draft = null;

    if (savedDraftJSON) {
      try {
        draft = JSON.parse(savedDraftJSON);
      } catch (e) {
        console.error(`[ContentEditor] Failed to parse draft for ${pageId}:`, e);
      }
    }

    if (draft && typeof draft.content !== 'undefined') {
      processAndSetInitialContent(draft.content);
    } else {
      fetchPageJson(pageId).then(pageJson => {
        const content = pageJson?.content || pageJson?.meta?.initialContent || '';
        processAndSetInitialContent(content);
      });
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
