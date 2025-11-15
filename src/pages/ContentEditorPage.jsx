import { h } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { fetchPageJson } from '../lib/mockApi';
import { Home, Plus, UploadCloud } from 'lucide-preact';

export default function ContentEditorPage(props) {
  const pageId = props.pageId || 'home';
  const [pageJson, setPageJson] = useState(null);
  const [content, setContent] = useState('');
  const editorRef = useRef(null);

  useEffect(() => {
    console.log('[ContentEditor] Loading page:', pageId);
    fetchPageJson(pageId).then((pj) => {
      console.log('[ContentEditor] page.json loaded:', pj);
      setPageJson(pj);
      const initialContent = pj?.content || '<p>Start typing...</p>';
      setContent(initialContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent;
      }
    });
  }, [pageId]);

  function handleEditorInput(e) {
    const newContent = e.currentTarget.innerHTML;
    if (newContent !== content) {
      console.log(`[ContentEditor] content changed, length: ${newContent.length}`);
      setContent(newContent);
    }
  }

  const handleHome = () => {
    console.log('[BottomBar] Home clicked');
    route('/explorer');
  };
  const handleAdd = () => console.log('[BottomBar] Add clicked');
  const handlePublish = () => {
    console.log('[ContentEditor] handlePublish triggered');
    try {
      console.log(`[ContentEditor] Saving content to local storage for page: ${pageId}...`);
      const key = `easy-seo-draft:${pageId}`;
      const payload = {
        content: content,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
      console.log(`[ContentEditor] Content successfully saved to local storage with key: ${key}`);
    } catch (error) {
      console.error('[ContentEditor] Failed to save content to local storage:', error);
    }
  };

  return (
    <div class="flex flex-col h-screen bg-gray-900 text-white">
      {/* Global Header Shell */}
      <header class="flex items-center p-2 border-b border-gray-700 flex-shrink-0 h-14"></header>

      {/* Editable Area */}
      <main
        class="flex-grow overflow-y-auto p-4"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          class="w-full h-full focus:outline-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </main>

      {/* Bottom Action Bar */}
      <footer class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around items-center p-2 pb-[calc(0.5rem_+_env(safe-area-inset-bottom))]">
        <button onClick={handleHome} class="p-2">
          <Home size={24} />
        </button>
        <button onClick={handleAdd} class="p-2">
          <Plus size={24} />
        </button>
        <button onClick={handlePublish} class="p-2">
          <UploadCloud size={24} />
        </button>
      </footer>
    </div>
  );
}
