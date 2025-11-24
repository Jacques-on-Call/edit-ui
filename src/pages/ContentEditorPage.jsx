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
import BottomActionBar from '../components/BottomActionBar';
import { Home, Plus, UploadCloud, RefreshCw } from 'lucide-preact';

export default function ContentEditorPage(props) {
  const { selectedRepo } = useAuth();

  // State for content, sections, and save status
  const [contentBody, setContentBody] = useState(null); // For Lexical
  const [sections, setSections] = useState(null); // For SectionsEditor
  const [saveStatus, setSaveStatus] = useState('saved');
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [viewMode, setViewMode] = useState('editor'); // 'editor' or 'preview'
  const [isPreviewBuilding, setIsPreviewBuilding] = useState(false);
  const [previewKey, setPreviewKey] = useState(Date.now());

  // Refs for editor API and tracking the file path
  const editorApiRef = useRef(null);
  const filePathRef = useRef(null);

  // Deriving a stable pageId (slug) for drafts and keys
  const pathIdentifier = props.filePath ? decodeURIComponent(props.filePath) : (props.pageId || 'home');
  const pageId = pathIdentifier.endsWith('/index.astro')
    ? (pathIdentifier.split('/').slice(-2, -1)[0] || 'home')
    : pathIdentifier.split('/').pop().replace(/\.astro$/, '') || 'home';

  // Determine editor mode based on the path
  const isTestFile = pathIdentifier.startsWith('src/pages/json-preview/') && pathIdentifier.endsWith('.astro');
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

  const { triggerSave } = useAutosave(autosaveCallback, 1500);

  // --- DATA LOADING & PARSING ---
  useEffect(() => {
    console.log('[ContentEditor] useEffect running...');
    try {
      filePathRef.current = pathIdentifier.startsWith('src/pages/') ? pathIdentifier : `src/pages/${pathIdentifier}`;

      const loadJsonModeContent = async () => {
        const draftKey = `easy-seo-draft:${pageId}`;
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
          console.log('[ContentEditor-JSON] Found local draft. Loading from localStorage.');
          try {
            const draft = JSON.parse(savedDraft);
            if (draft.sections) {
              console.log('[ContentEditor] Setting sections state from draft...');
              setSections(draft.sections);
            } else {
              console.warn('[ContentEditor-JSON] Draft found but has no sections. Falling back to default.');
              console.log('[ContentEditor] Setting sections state to default...');
              setSections(getDefaultSections());
            }
          } catch (e) {
            console.error('[ContentEditor-JSON] Failed to parse draft. Loading default sections.', e);
            console.log('[ContentEditor] Setting sections state to default after parse failure...');
            setSections(getDefaultSections());
          }
          return;
        }

        console.log('[ContentEditor-JSON] No local draft. Fetching from repository...');
        const repo = selectedRepo?.full_name || 'Jacques-on-Call/StrategyContent';
        try {
          const url = `/api/page-json?repo=${encodeURIComponent(repo)}&slug=${encodeURIComponent(pageId)}`;
          const pageJson = await fetchJson(url);

          if (pageJson && pageJson.sections) {
            console.log('[ContentEditor-JSON] Successfully fetched from repository.');
            console.log('[ContentEditor] Setting sections state from fetched data...');
            setSections(pageJson.sections);
          } else {
            console.warn('[ContentEditor-JSON] Fetched data but it has no sections. Falling back to default.');
            console.log('[ContentEditor] Setting sections state to default after fetch...');
            setSections(getDefaultSections());
          }
        } catch (error) {
          if (error.message.includes('404')) {
            console.log('[ContentEditor-JSON] No remote JSON found. Initializing with default sections.');
          } else {
            console.error('[ContentEditor-JSON] Failed to fetch remote JSON. Falling back to default.', error);
          }
          console.log('[ContentEditor] Setting sections state to default after fetch error...');
          setSections(getDefaultSections());
        }
      };

      const loadAstroModeContent = async () => {
        const draftKey = `easy-seo-draft:${pageId}`;
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
          console.log('[ContentEditor-Astro] Found local draft. Loading from localStorage.');
          const draft = JSON.parse(savedDraft);
          if (draft.sections) {
            console.log('[ContentEditor] Setting sections state from Astro draft...');
            setSections(draft.sections);
            return;
          }
          console.log('[ContentEditor] Setting contentBody state from Astro draft...');
          setContentBody(draft.content || '');
          return;
        }

        console.log('[ContentEditor-Astro] No local draft. Fetching file from repository...');
        const repo = selectedRepo?.full_name || 'Jacques-on-Call/StrategyContent';
        const path = filePathRef.current;
        try {
          const url = `/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`;
          const json = await fetchJson(url);
          const decodedContent = atob(json.content || '');
          const { data: frontmatter, content: body } = matter(decodedContent);

          if (frontmatter && frontmatter.sections && Array.isArray(frontmatter.sections)) {
            console.log('[ContentEditor] Setting sections state from Astro frontmatter...');
            setSections(frontmatter.sections);
          } else {
            console.log('[ContentEditor] Setting contentBody state from Astro body...');
            setContentBody(body);
          }
        } catch (error) {
          console.error('[ContentEditor-Astro] Failed to fetch or parse file content:', error);
          console.log('[ContentEditor] Setting contentBody state to error message...');
          setContentBody('// Error loading content. Please try again.');
        }
      };

      if (editorMode === 'json') {
        loadJsonModeContent();
      } else {
        loadAstroModeContent();
      }

      // Trigger build on first open
      const buildFlag = `has-built-${pageId}`;
      if (editorMode === 'json' && selectedRepo && !sessionStorage.getItem(buildFlag)) {
        triggerBuild();
        sessionStorage.setItem(buildFlag, 'true');
      }
    } catch (e) {
      console.error('[ContentEditor] useEffect crash:', e);
    }
  }, [pageId, selectedRepo, editorMode, triggerBuild]);

  // Helper to generate default sections for JSON mode
  const getDefaultSections = () => [
    {
      id: `section-${Date.now()}-1`,
      type: 'hero',
      props: {
        title: 'Placeholder Hero Title',
        subtitle: 'Placeholder hero subtitle text.',
        body: '<p>This is the default body content for the hero section. You can edit this.</p>',
      },
    },
    {
      id: `section-${Date.now()}-2`,
      type: 'textSection',
      props: {
        title: 'Placeholder Text Section',
        body: '<p>This is some default placeholder text for a standard text section.</p>',
        ctaText: 'Learn More',
        ctaHref: '#',
      },
    },
  ];

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

  const handleAddSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: 'textSection',
      props: {
        title: 'New Section',
        body: '<p>Start writing your content here.</p>',
        ctaText: '',
        ctaHref: '',
      },
    };
    const newSections = [...(sections || []), newSection];
    setSections(newSections);
    triggerSave(newSections);
  };

  const handlePreview = () => {
    setViewMode(prevMode => prevMode === 'editor' ? 'preview' : 'editor');
  };

  const handleSync = async () => {
    console.log('[DEBUG-BUILD] Trigger Build button clicked.');
    if (!selectedRepo) {
      console.error('[Sync] Cannot sync: repository not selected.');
      setSyncStatus('error');
      return;
    }

    setSyncStatus('syncing');
    console.log('[Sync] Starting sync to GitHub...');

    try {
      // Step 1: Save the content first
      const draftKey = `easy-seo-draft:${pageId}`;
      const savedDraft = localStorage.getItem(draftKey);

      if (!savedDraft) {
        throw new Error('No local draft found to sync.');
      }
      const draftData = JSON.parse(savedDraft);

      if (editorMode !== 'json' || !draftData.sections) {
        throw new Error('Sync is currently only supported for JSON-mode pages with sections.');
      }

      const savePayload = {
        repo: selectedRepo.full_name,
        pageData: {
          slug: draftData.slug,
          meta: draftData.meta || { title: draftData.slug },
          sections: draftData.sections,
        },
      };

      await fetchJson('/api/page-json/update', {
        method: 'POST',
        body: JSON.stringify(savePayload),
      });
      console.log('[Sync] Content save successful.');

      // Step 2: Trigger the build automatically
      triggerBuild();

      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2500);

    } catch (error) {
      console.error('[DEBUG-BUILD] An error occurred during sync or build trigger:', error.message, error.stack);
      setSyncStatus('error');
    }
  };

  const triggerBuild = useCallback(async () => {
    if (!selectedRepo) {
      console.warn('[Build] Cannot trigger build: repository not selected.');
      return;
    }

    console.log('[Build] Triggering background build...');
    setIsPreviewBuilding(true);

    try {
      const buildPayload = { repo: selectedRepo.full_name };
      await fetchJson('/api/trigger-build', {
        method: 'POST',
        body: JSON.stringify(buildPayload),
      });
      console.log('[Build] Build trigger API call successful.');

      // Start a timer to refresh the preview after a delay
      setTimeout(() => {
        console.log('[Build] Refreshing preview after build delay.');
        setIsPreviewBuilding(false);
        setPreviewKey(Date.now()); // Force iframe refresh
      }, 30000); // 30-second delay

    } catch (error) {
      console.error('[Build] Failed to trigger build:', error.message, error.stack);
      setIsPreviewBuilding(false); // Reset on error
    }
  }, [selectedRepo]);

  const previewPath = pathIdentifier
    .replace(/^src\/pages\//, '')
    .replace(/\.astro$/, '');
  const previewUrl = `/preview/${previewPath}`;

  return (
    <div class="flex flex-col h-screen bg-gray-900 text-white">
      <EditorHeader editorApiRef={editorApiRef} />
      <main class="flex-grow overflow-y-auto" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        {viewMode === 'editor' ? (
          <div class="w-full">
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
        ) : (
          <div class="w-full h-full bg-white relative">
            {isPreviewBuilding && (
              <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div class="text-white text-center">
                  <RefreshCw size={48} className="animate-spin mb-4 mx-auto" />
                  <p class="text-lg font-semibold">Building preview...</p>
                  <p class="text-sm">This may take a moment.</p>
                </div>
              </div>
            )}
            <iframe
              key={previewKey}
              src={previewUrl}
              title="Live Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </main>
      <BottomActionBar
        saveStatus={saveStatus}
        syncStatus={syncStatus}
        viewMode={viewMode}
        onAdd={handleAddSection}
        onSync={handleSync}
        onPreview={editorMode === 'json' ? handlePreview : null}
      />
    </div>
  );
}