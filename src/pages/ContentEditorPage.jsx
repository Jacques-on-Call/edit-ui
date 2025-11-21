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
import { Home, Plus, UploadCloud } from 'lucide-preact';

export default function ContentEditorPage(props) {
  const { selectedRepo } = useAuth();

  // State for content, sections, and save status
  const [contentBody, setContentBody] = useState(null); // For Lexical
  const [sections, setSections] = useState(null); // For SectionsEditor
  const [saveStatus, setSaveStatus] = useState('saved');
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error

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
    filePathRef.current = pathIdentifier.startsWith('src/pages/') ? pathIdentifier : `src/pages/${pathIdentifier}`;

    const loadJsonModeContent = async () => {
      const draftKey = `easy-seo-draft:${pageId}`;
      const savedDraft = localStorage.getItem(draftKey);

      if (savedDraft) {
        console.log('[ContentEditor-JSON] Found local draft. Loading from localStorage.');
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.sections) {
            setSections(draft.sections);
          } else {
            console.warn('[ContentEditor-JSON] Draft found but has no sections. Falling back to default.');
            setSections(getDefaultSections());
          }
        } catch (e) {
          console.error('[ContentEditor-JSON] Failed to parse draft. Loading default sections.', e);
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
          setSections(pageJson.sections);
        } else {
          console.warn('[ContentEditor-JSON] Fetched data but it has no sections. Falling back to default.');
          setSections(getDefaultSections());
        }
      } catch (error) {
        if (error.message.includes('404')) {
          console.log('[ContentEditor-JSON] No remote JSON found. Initializing with default sections.');
        } else {
          console.error('[ContentEditor-JSON] Failed to fetch remote JSON. Falling back to default.', error);
        }
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
          setSections(draft.sections);
          return;
        }
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
          setSections(frontmatter.sections);
        } else {
          setContentBody(body);
        }
      } catch (error) {
        console.error('[ContentEditor-Astro] Failed to fetch or parse file content:', error);
        setContentBody('// Error loading content. Please try again.');
      }
    };

    if (editorMode === 'json') {
      loadJsonModeContent();
    } else {
      loadAstroModeContent();
    }
  }, [pageId, selectedRepo, editorMode]);

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

  const handlePreview = async () => {
    // This function now uses the path of the file, not its content.
    // It's designed to preview the last synced version from the repository.
    if (!filePathRef.current) {
        console.error('[Preview] Cannot generate preview: file path is not available.');
        return;
    }

    console.log(`[Preview] Requesting preview for path: ${filePathRef.current}`);

    try {
        const payload = {
            repo: selectedRepo.full_name,
            path: filePathRef.current,
        };

        const result = await fetchJson('/api/previews', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (result.previewUrl) {
            console.log(`[Preview] Opening preview in new tab: ${result.previewUrl}`);
            window.open(result.previewUrl, '_blank');
        } else {
            throw new Error('Preview API did not return a previewUrl.');
        }
    } catch (error) {
        console.error('[Preview] Failed to create preview:', error);
        // Optionally, show an error message to the user here.
    }
  };

  const handleSync = async () => {
    if (!selectedRepo) {
      console.error('[Sync] Cannot sync: repository not selected.');
      setSyncStatus('error');
      return;
    }

    setSyncStatus('syncing');
    console.log('[Sync] Starting sync to GitHub...');

    try {
      const draftKey = `easy-seo-draft:${pageId}`;
      const savedDraft = localStorage.getItem(draftKey);

      if (!savedDraft) {
        console.error('[Sync] No local draft found to sync.');
        setSyncStatus('error');
        return;
      }

      const draftData = JSON.parse(savedDraft);

      // For Phase 1, we only sync 'json' mode pages with sections.
      if (editorMode !== 'json' || !draftData.sections) {
        console.warn('[Sync] Sync is currently only supported for JSON-mode pages with sections.');
        setSyncStatus('error');
        return;
      }

      const payload = {
        repo: selectedRepo.full_name,
        pageData: {
          slug: draftData.slug,
          meta: draftData.meta || { title: draftData.slug }, // Ensure meta exists
          sections: draftData.sections,
        },
      };

      const result = await fetchJson('/api/page-json/update', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('[Sync] Sync successful:', result);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2500); // Reset after a short delay

    } catch (error)
    {
      console.error('[Sync] An error occurred during sync:', error);
      setSyncStatus('error');
    }
  };

  return (
    <div class="flex flex-col h-screen bg-gray-900 text-white">
      <EditorHeader editorApiRef={editorApiRef} />
      <main class="flex-grow overflow-y-auto" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
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
      </main>
      <BottomActionBar
        saveStatus={saveStatus}
        syncStatus={syncStatus}
        onAdd={handleAddSection}
        onSync={handleSync}
        onPreview={handlePreview}
      />
    </div>
  );
}