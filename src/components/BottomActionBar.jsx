// easy-seo/src/components/BottomActionBar.jsx
import { route } from 'preact-router';
import Icon from './Icon';

const BottomActionBar = ({ onAdd, onPublish }) => {
  const handleHomeClick = () => {
    console.log('[BottomBar] Home clicked');
    route('/explorer');
  };

  const handleAddClick = () => {
    console.log('[BottomBar] Add clicked');
    alert('Add functionality is a stub for Sprint 1.');
    if (onAdd) onAdd();
  };

  const handlePublishClick = () => {
    console.log('[BottomBar] Publish clicked');
    if (onPublish) onPublish();
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md border-t border-white/10 z-10">
      <div className="w-full max-w-2xl mx-auto flex justify-around items-center p-2" style={{ minHeight: '48px' }}>
        <button
          className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
          onClick={handleHomeClick}
          title="Go to File Explorer"
        >
          <Icon name="Home" className="w-5 h-5" />
          <span className="text-xs sm:text-sm font-semibold">Home</span>
        </button>

        <button
          className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
          onClick={handleAddClick}
          title="Add a new block (stub)"
        >
          <Icon name="Plus" className="w-5 h-5" />
          <span className="text-xs sm:text-sm font-semibold">Add</span>
        </button>

        <button
          className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
          onClick={handlePublishClick}
          title="Publish changes"
        >
          <Icon name="UploadCloud" className="w-5 h-5" />
          <span className="text-xs sm:text-sm font-semibold">Publish</span>
        </button>
      </div>
    </footer>
  );
};

export default BottomActionBar;
