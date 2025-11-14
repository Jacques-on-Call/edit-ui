// easy-seo/src/components/EditorHeader.jsx
import Icon from './Icon';

const EditorHeader = ({ title, activeTab, onTabChange, onPublish, isSaving }) => {
  const getTabClass = (tabName) => {
    return `px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
      activeTab === tabName
        ? 'bg-white/20 text-white'
        : 'bg-transparent text-gray-400 hover:bg-white/10'
    }`;
  };

  return (
    <header className="sticky top-0 z-10 bg-black/50 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white truncate">{title || 'Loading...'}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-black/30 p-1 rounded-lg">
          <button onClick={() => onTabChange('content')} className={getTabClass('content')}>
            Content
          </button>
          <button onClick={() => onTabChange('visual')} className={getTabClass('visual')}>
            Visual
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400 transition-opacity">
          {isSaving ? 'Saving...' : 'Saved'}
        </span>
        <button
          onClick={onPublish}
          className="bg-accent-lime text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-lime-400 transition-colors"
        >
          <Icon name="UploadCloud" className="w-5 h-5" />
          <span>Publish</span>
        </button>
      </div>
    </header>
  );
};

export default EditorHeader;
