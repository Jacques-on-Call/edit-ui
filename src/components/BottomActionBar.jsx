// easy-seo/src/components/BottomActionBar.jsx
import { h } from 'preact';

const BottomActionBar = ({ children, onPublish, slug }) => {
  const handlePublish = () => {
    console.log('[BottomBar] Publish clicked');
    if (onPublish) {
      onPublish(slug);
    }
  };

  return (
    <div
      class="bg-gray-800 border-t border-gray-700 flex items-center justify-between p-2"
      style={{
        height: 'var(--bottom-bar-height, 64px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom))'
      }}
    >
      <div class="flex items-center gap-2">
        {children}
      </div>
      <button
        onClick={handlePublish}
        class="p-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold"
        style={{ minHeight: '44px' }}
      >
        Publish
      </button>
    </div>
  );
};

export default BottomActionBar;
