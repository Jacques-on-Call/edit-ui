import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { fetchPageJson } from '../lib/mockApi';
import BottomActionBar from '../components/BottomActionBar';
import './ContentEditorPage.css';

export default function ContentEditorPage(props) {
  const pageId = (props && props.pageId) || (typeof window !== 'undefined' && new URL(window.location.href).pathname.split('/').pop()) || 'home';
  const [content, setContent] = useState('');

  // Load page JSON
  useEffect(() => {
    console.log('[ContentEditor] Loading page:', pageId);
    fetchPageJson(pageId).then((pj) => {
      console.log('[ContentEditor] page.json loaded:', pj);
      const firstTextNode = (pj?.blocks || []).find((c) => c.type === 'paragraph' || c.type === 'heading') || null;
      setContent(firstTextNode?.content || pj?.content || '<p>Your content here</p>');
    }).catch((err) => {
      console.error('[ContentEditor] fetchPageJson error:', err);
    });
  }, [pageId]);

  // avoid repeated setContent if identical
  function handleEditorInput(e) {
    const val = e.currentTarget.innerHTML;
    if (val === content) return;
    setContent(val);
  }

  return (
    <div className="editor-container">
      <div
        className="editor-area"
        contentEditable
        onInput={handleEditorInput}
        dangerouslySetInnerHTML={{ __html: content }}
        role="textbox"
        aria-multiline="true"
        suppressContentEditableWarning
        onFocus={() => console.log('[ContentEditor] editor focus')}
      />
      <BottomActionBar />
    </div>
  );
}
