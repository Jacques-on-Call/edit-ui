import { h } from 'preact';
import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { fetchPageJson } from '../lib/mockApi';
import useAutosave from '../hooks/useAutosave';
import LexicalEditor from '../components/LexicalEditor';
import SectionsEditor from '../components/SectionsEditor';
import EditorHeader from '../components/EditorHeader';
import { Home, Plus, UploadCloud } from 'lucide-preact';

// NOTE: This file is intentionally minimal: we only add detection for frontmatter.sections
// and render a SectionsEditor. No file writes or remote API changes here.

export default function ContentEditorPage(props) {
  const filePathRef = useRef(null);
  const pageIdFromProps = props.pageId || 'home';
  const encodedPathProp = props.filePath || props.filePathEncoded || null;
  const rawPathInitial = encodedPathProp ? decodeURIComponent(encodedPathProp) : `src/pages/${pageIdFromProps}.astro`;

  const [content, setContent] = useState(null); // HTML body for Lexical
  const [sections, setSections] = useState(null); // frontmatter.sections if present
  const [frontmatter, setFrontmatter] = useState(null); // store raw frontmatter object if present
  const [saveStatus, setSaveStatus] = useState('saved');
  const lastSavedContentRef = useRef(null);
  const editorApiRef = useRef(null);

  // derive pageId slug from path (handle index.astro)
  const rawPath = filePathRef.current || rawPathInitial;
  let pageId = 'home';
  try {
    const p = rawPath;
    pageId = p.endsWith('/index.astro') ? (p.split('/').slice(-2, -1)[0] || 'home') : p.split('/').pop().replace(/\.astro$/, '') || 'home';
  } catch (e) {
    pageId = pageIdFromProps;
  }

  // Autosave callback works for both HTML (content) and sections (serialize sections to draft)
  const autosaveCallback = useCallback((newContent) => {
    console.log(`[ContentEditor] autosave-callback TIMESTAMP=${new Date().toISOString()} len=${String(newContent?.length || 0)}`);
    // we store either content HTML string or a sections JSON payload depending on editing mode
    try {
      const key = `easy-seo-draft:${pageId}`;
      const draftRaw = localStorage.getItem(key);
      const draft = draftRaw ? JSON.parse(draftRaw) : {};
      const payload = {
        ...draft,
        slug: pageId,
        savedAt: new Date().toISOString(),
      };
      if (sections) {
        payload.sections = sections;
      } else {
        payload.content = newContent;
      }
      localStorage.setItem(key, JSON.stringify(payload));
      lastSavedContentRef.current = sections ? JSON.stringify(sections) : newContent;
      console.log(`[ContentEditor] Content successfully autosaved to local storage with key: ${key}`);
      setSaveStatus('saved');
    } catch (error) {
      console.error('[ContentEditor] Failed to autosave content to local storage:', error);
      setSaveStatus('unsaved');
    }
  }, [pageId, sections]);

  const { triggerSave } = useAutosave(autosaveCallback, 1000);

  useEffect(() => {
    console.log('[ContentEditor] Loading page:', rawPathInitial);
    filePathRef.current = rawPathInitial;

    // Attempt to load local draft first
    const draftKey = `easy-seo-draft:${pageId}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      console.log(`[ContentEditor] loadedDraft -> slug: ${draft.slug}, savedAt: ${draft.savedAt}`);
      if (draft.sections) {
        setSections(draft.sections);
        setFrontmatter({ ...(draft.meta || {}) });
        lastSavedContentRef.current = JSON.stringify(draft.sections);
        console.log('[ContentEditor] initialSections ->', draft.sections);
        return;
      }
      let initialContent = draft.content || '';
      if (!initialContent.startsWith('<')) {
        initialContent = initialContent.split('\n').filter(line => line.trim() !== '').map(line => `<p>${line}</p>`).join('');
      }
      lastSavedContentRef.current = initialContent;
      console.log('[ContentEditor] initialContent ->', initialContent);
      setContent(initialContent);
      return;
    }

    // No local draft — use mockApi or remote fetch path (remote fetch handled elsewhere)
    fetchPageJson(pageId).then((pj) => {
      console.log('[ContentEditor] page.json loaded:', pj);
      // If the page JSON or frontmatter includes sections, open SectionsEditor
      const fmSections = pj?.meta?.sections || pj?.sections || null;
      if (fmSections && Array.isArray(fmSections)) {
        setSections(fmSections);
        setFrontmatter(pj.meta || {});
        lastSavedContentRef.current = JSON.stringify(fmSections);
        console.log('[ContentEditor] initialSections ->', fmSections);
        return;
      }

      let initialContent = pj?.content || pj?.meta?.initialContent || '';
      if (!initialContent.startsWith('<')) {
        initialContent = initialContent.split('\n').filter(line => line.trim() !== '').map(line => `<p>${line}</p>`).join('');
      }
      console.log('[ContentEditor] initialContent ->', initialContent);
      lastSavedContentRef.current = initialContent;
      setContent(initialContent);
    });
  }, []); // run on mount only

  function handleLexicalChange(newContent) {
    console.log(`[ContentEditor] lexical-change len: ${newContent.length}`);
    setContent(newContent);
    setSaveStatus('unsaved');
    triggerSave(newContent);
  }

  // Sections editor change handler — updates state and triggers autosave
  function handleSectionsChange(newSections) {
    console.log('[ContentEditor] sections-change ->', newSections);
    setSections(newSections);
    setSaveStatus('unsaved');
    // triggerSave must accept some content param; pass serialized sections string so autosave saves it
    triggerSave(JSON.stringify(newSections));
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
        {/* If sections are present, render the SectionsEditor. Otherwise, fall back to Lexical. */}
        {sections ? (
          <div class="mx-auto w-full px-4 md:px-6" style={{ maxWidth: '65ch' }}>
            <SectionsEditor sections={sections} onChange={handleSectionsChange} pageId={pageId} />
          </div>
        ) : content !== null ? (
          <div class="mx-auto w-full px-4 md:px-6" style={{ maxWidth: '65ch' }}>
            <LexicalEditor
              ref={editorApiRef}
              slug={pageId}
              initialContent={content}
              onChange={handleLexicalChange}
            />
          </div>
        ) : (
          <div class="p-6">Loading editor...</div>
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
                  ' : saveStatus === 'saving'
                  ? '#FBBF24'
                  : '#C7EA46',
            }}
          ></div>
        </div>
      </footer>
    </div>
  );
}
