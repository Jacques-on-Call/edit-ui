// Minimal ensured handlePublish implementation and instrumentation
import { h } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import EditorHeader from '../components/EditorHeader';
import BottomActionBar from '../components/BottomActionBar';
import BlockTree from '../components/BlockTree';
import { fetchPageJson, saveDraft, publishPage } from '../lib/mockApi';
import useAutosave from '../hooks/useAutosave';
import './ContentEditorPage.css';

export default function ContentEditorPage(props) {
  const pageId = (props && props.pageId) || (typeof window !== 'undefined' && new URL(window.location.href).pathname.split('/').pop()) || 'home';
  const [pageJson, setPageJson] = useState(null);
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    console.log('[ContentEditor] Loading page:', pageId);
    fetchPageJson(pageId).then((pj) => {
      if (!mounted.current) return;
      console.log('[ContentEditor] page.json loaded:', pj);
      setPageJson(pj);
      const firstTextNode = (pj?.blocks || []).find((c) => c.type === 'paragraph' || c.type === 'heading') || null;
      setContent(firstTextNode?.content || pj?.content || '<p>Your content here</p>');
    });
  }, [pageId]);

  // simplified autosave hook usage (kept as-is)
  const { scheduleSave, isSaving } = useAutosave({
    onSave: async (payload) => {
      console.log('[ContentEditor] autosave onSave handler triggered');
      await saveDraft(payload);
    },
    delay: 1500,
  });

  useEffect(() => {
    if (!pageJson) return;
    console.log('[ContentEditor] content changed, length:', content.length);
    scheduleSave({ slug: pageJson.meta?.slug || pageId, content, meta: pageJson.meta || {} });
  }, [content, pageJson, scheduleSave, pageId]);

  // Ensure this is the handler used by the bottom bar
  async function handlePublish() {
    console.log('[ContentEditor] handlePublish triggered'); // <<---- diagnostic log
    console.log('[ContentEditor] publish requested for page:', pageJson?.meta?.slug || pageId);
    if (!pageJson) {
      console.warn('[ContentEditor] publish aborted: no pageJson loaded');
      return;
    }

    const slug = pageJson.meta?.slug || pageId;
    const payload = { slug, content, meta: pageJson.meta || {} };

    setIsPublishing(true);
    console.log('[ContentEditor] publish start - ensuring draft saved');
    const saveRes = await saveDraft(payload);
    console.log('[ContentEditor] saveDraft result:', saveRes);
    if (!saveRes || !saveRes.ok) {
      console.error('[ContentEditor] publish aborted: saveDraft error', saveRes);
      setIsPublishing(false);
      return;
    }
    console.log('[ContentEditor] draft saved, key=', saveRes.key);

    console.log('[ContentEditor] calling publishPage for', slug);
    const publishRes = await publishPage(payload);
    console.log('[ContentEditor] publishPage result:', publishRes);
    if (!publishRes || !publishRes.ok) {
      console.error('[ContentEditor] publish failed:', publishRes);
      setIsPublishing(false);
      return;
    }
    console.log('[ContentEditor] publish success, url=', publishRes.url);
    try { window.open(publishRes.url, '_blank'); } catch (err) { console.warn('[ContentEditor] open preview failed', err); }
    setIsPublishing(false);
  }

  function handleEditorInput(e) {
    const val = e.currentTarget.innerHTML;
    if (val === content) return;
    setContent(val);
  }

  return (
    <div className="editor-shell">
      <EditorHeader title={pageJson?.meta?.title || 'Untitled Page'} onPublish={handlePublish} isSaving={isSaving || isPublishing} isMobile={true} />
      <div className="editor-body">
        <main className="main-pane">
          <div className="content-editor">
            <div className="editor-instructions">[Sprint] Content editor</div>
            <div className="editor-area" contentEditable onInput={handleEditorInput} dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </main>
      </div>
      <BottomActionBar onAdd={() => console.log('[ContentEditor] Add requested')} onPublish={handlePublish} />
    </div>
  );
}
