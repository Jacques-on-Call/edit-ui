import { h } from 'preact';
import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from '../contexts/AuthContext';
import { fetchJson } from '../lib/fetchJson';
import { fetchPageJson } from '../lib/mockApi';
import useAutosave from '../hooks/useAutosave';
import LexicalEditor from '../components/LexicalEditor';
import EditorHeader from '../components/EditorHeader';
import { Home, Plus, UploadCloud } from 'lucide-preact';

export default function ContentEditorPage(props) {
  // Step 1: Establish a single source of truth for the path string.
  // It can come from an encoded filePath prop or a pageId prop.
  let pathIdentifier = props.filePath ? decodeURIComponent(props.filePath) : (props.pageId || 'home');

  // Step 2: Normalize the identifier into a full, canonical path.
  // This prevents the `src/pages/src/pages` duplication bug.
  let rawPath;
  if (pathIdentifier.startsWith('src/pages/')) {
      rawPath = pathIdentifier; // It's already a full path.
  } else if (pathIdentifier.includes('/')) {
      rawPath = `src/pages/${pathIdentifier}`; // It's a relative path, prefix it.
  } else {
      rawPath = `src/pages/${pathIdentifier}.astro`; // It's a simple slug.
  }

  // Just in case a slug like "index.astro" was passed, clean up the extension.
  if (rawPath.endsWith('.astro.astro')) {
      rawPath = rawPath.slice(0, -6);
  }

  // Step 3: Derive a stable `pageId` (slug) from the canonical path.
  // This logic correctly handles root and nested index pages.
  let pageId;
  if (rawPath.endsWith('/index.astro')) {
    const parts = rawPath.split('/');
    // Get the directory name before '/index.astro'.
    const parentDir = parts.length > 2 ? parts[parts.length - 2] : '';
    // The root index's parent is 'pages', which should map to 'home'.
    pageId = (parentDir === 'pages' || parentDir === '') ? 'home' : parentDir;
  } else {
    // For any other page, the slug is the filename without the extension.
    pageId = rawPath.split('/').pop().replace(/\.astro$/, '');
  }
  // Final fallback to ensure pageId is never empty.
  pageId = pageId || 'home';

  console.log('[ContentEditor] resolvedPath ->', { rawPath, pageId });
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

  const { selectedRepo } = useAuth();
  const { triggerSave } = useAutosave(autosaveCallback, 1000);

  useEffect(() => {
    const processAndSetInitialContent = (contentSource) => {
      let finalContent = contentSource || '';
      if (typeof finalContent === 'string' && !finalContent.startsWith('<')) {
        finalContent = finalContent.split('\n').filter(line => line.trim() !== '').map(line => `<p>${line}</p>`).join('');
      }
      console.log('[ContentEditor] initialContent ->', finalContent);
      setInitialContent(finalContent);
      lastAcceptedContentRef.current = finalContent;
    };

    const fetchAndProcessRealContent = async () => {
      const repo = selectedRepo?.full_name || window.selectedRepo || 'Jacques-on-Call/StrategyContent';
      const path = filePathRef.current;
      console.log('[ContentEditor] fetching real file ->', { repo, path });

      try {
        const url = `/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`;
        const json = await fetchJson(url);

        const base64Content = json.content || json.data || json.file;
        if (!base64Content) throw new Error('No content in API response');

        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decodedContent = new TextDecoder('utf-8').decode(bytes);

        const frontmatterRegex = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/;
        const match = decodedContent.match(frontmatterRegex);

        let bodyContent = decodedContent;
        if (match) {
          console.log('[ContentEditor] frontmatter detected and stripped:', match[0]);
          bodyContent = decodedContent.substring(match[0].length);
        }

        processAndSetInitialContent(bodyContent);

      } catch (err) {
        console.warn(`[ContentEditor] fetch repo file failed, falling back to mockApi:`, err);
        const pageJson = await fetchPageJson(pageId);
        processAndSetInitialContent(pageJson.content || pageJson.meta?.initialContent);
      }
    };

    const draftKey = `easy-seo-draft:${pageId}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      processAndSetInitialContent(draft.content);
    } else {
      fetchAndProcessRealContent();
    }
  }, [pageId, selectedRepo]);

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
