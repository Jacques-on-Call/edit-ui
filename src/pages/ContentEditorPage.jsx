import { h } from 'preact';
import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import matter from 'gray-matter';
import { useAuth } from '../contexts/AuthContext';
import { fetchJson } from '../lib/fetchJson';
import useAutosave from '../hooks/useAutosave';
import LexicalEditor from '../components/LexicalEditor';
import SectionsEditor from '../components/SectionsEditor';
import EditorHeader from '../components/EditorHeader';
import { Home, Plus, UploadCloud } from 'lucide-preact';

export default function ContentEditorPage(props) {
  const { selectedRepo } = useAuth();

  // State for content, sections, and save status
  const [contentBody, setContentBody] = useState(null); // For Lexical
  const [sections, setSections] = useState(null); // For SectionsEditor
  const [saveStatus, setSaveStatus] = useState('saved');

  // Refs for editor API and tracking the file path
  const editorApiRef = useRef(null);
  const filePathRef = useRef(null);

  // Deriving a stable pageId (slug) for drafts and keys
  const pathIdentifier = props.filePath ? decodeURIComponent(props.filePath) : (props.pageId || 'home');
  const pageId = pathIdentifier.endsWith('/index.astro')
    ? (pathIdentifier.split('/').slice(-2, -1)[0] || 'home')
    : pathIdentifier.split('/').pop().replace(/\.astro$/, '') || 'home';

  // Determine editor mode based on the path
  const isTestFile = pathIdentifier.startsWith('src/pages/_test/') && pathIdentifier.endsWith('.astro');
  const editorMode = isTestFile ? 'json' : 'astro';

  // Verification log for Step 3
  console.log(`[ContentEditorPage] mode=${editorMode} slug=${pageId} path=${pathIdentifier}`);

  // --- AUTOSAVE LOGIC ---
  const autosaveCallback = useCallback((dataToSave) => {
    setSaveStatus('saving');
    try {
      const key = `easy-seo-draft:${pageId}`;
      const draft = JSON.parse(localStorage.getItem(key) || '{}');

      const payload = {
        ...draft,
        slug: pageId,
        savedAt: new Date().toISOString(),
      };

      // Save either sections or content based on which editor is active
      if (sections) {
        payload.sections = dataToSave;
      } else {
        payload.content = dataToSave;
      }

      localStorage.setItem(key, JSON.stringify(payload));
      console.log(`[ContentEditor] Draft successfully saved to key: ${key}`);
      setSaveStatus('saved');
    } catch (error) {
      console.error('[ContentEditor] Failed to autosave draft:', error);
      setSaveStatus('unsaved');
    }
  }, [pageId, sections]);

  const { triggerSave } = useAutosave(autosaveCallback, 1000);

  // --- DATA LOADING & PARSING ---
  useEffect(() => {
    filePathRef.current = pathIdentifier.startsWith('src/pages/') ? pathIdentifier : `src/pages/${pathIdentifier}`;

    const loadContent = async () => {
      // 1. Try to load from local draft first
      const draftKey = `easy-seo-draft:${pageId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        console.log('[ContentEditor] Found local draft. Loading from localStorage.');
        const draft = JSON.parse(savedDraft);
        if (draft.sections) {
          setSections(draft.sections);
          return;
        }
        setContentBody(draft.content || '');
        return;
      }

      // 2. If no draft, fetch from the repository
      console.log('[ContentEditor] No local draft. Fetching file from repository...');
      const repo = selectedRepo?.full_name || 'Jacques-on-Call/StrategyContent';
      const path = filePathRef.current;

      try {
        const url = `/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`;
        const json = await fetchJson(url);
        const decodedContent = atob(json.content || '');

        // Use gray-matter to parse the file content
        const { data: frontmatter, content: body } = matter(decodedContent);

        // 3. Decide which editor to show based on parsed content
        if (frontmatter && frontmatter.sections && Array.isArray(frontmatter.sections)) {
          console.log('[ContentEditor] Frontmatter with sections found. Loading SectionsEditor.');
          setSections(frontmatter.sections);
        } else {
          console.log('[ContentEditor] No sections found. Loading LexicalEditor with file body.');
          setContentBody(body);
        }
      } catch (error) {
        console.error('[ContentEditor] Failed to fetch or parse file content:', error);
        setContentBody('// Error loading content. Please try again.');
      }
    };

    loadContent();
  }, [pageId, selectedRepo]);

  // --- EVENT HANDLERS ---
  const handleLexicalChange = (newContent) => {
    setContentBody(newContent);
    setSaveStatus('unsaved');
    triggerSave(newContent);
  };

  const handleSectionsChange = (newSections) => {
    setSections(newSections);
    setSaveStatus('unsaved');
    triggerSave(newSections);
  };

  return (
    <div class="flex flex-col h-screen bg-gray-900 text-white">
      <EditorHeader editorApiRef={editorApiRef} />
      <main class="flex-grow overflow-y-auto p-4 md:p-6" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        <div class="mx-auto w-full" style={{ maxWidth: '80ch' }}>
          {sections ? (
            <SectionsEditor sections={sections} onChange={handleSectionsChange} />
          ) : contentBody !== null ? (
            <LexicalEditor
              ref={editorApiRef}
              slug={pageId}
              initialContent={contentBody}
              onChange={handleLexicalChange}
            />
          ) : (
            <div>Loading Editor...</div>
          )}
        </div>
      </main>
      {/* Footer remains the same */}
    </div>
  );
}