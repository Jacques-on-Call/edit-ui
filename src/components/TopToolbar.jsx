import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';

function TopToolbar({ onPublish, isPublishing, onChangeLayout, layoutPath, filePath, activeTab, setActiveTab }) {
  const location = useLocation();
  const currentPath = new URLSearchParams(location.search).get('path');
  const buttonClass = "p-2 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-10 h-16 flex items-center px-4">
      <div className="flex items-center flex-1">
        <Link to="/explorer" className={buttonClass} aria-label="Back to File Explorer">
          <Icon name="Home" className="text-gray-600" />
        </Link>
      </div>

      <div className="flex items-center justify-center flex-1">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-2 text-sm font-semibold focus:outline-none transition-colors duration-200 ${activeTab === 'editor' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
            onClick={() => setActiveTab('editor')}
          >
            Content
          </button>
          <Link
            to={`/visual-editor?path=${filePath}`}
            className={`px-6 py-2 text-sm font-semibold focus:outline-none transition-colors duration-200 text-gray-500 hover:text-gray-700 border-b-2 border-transparent`}
          >
            Visual Editor
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 flex-1">
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className={`${buttonClass} bg-bark-blue text-white hover:bg-bark-blue/90 disabled:bg-gray-400 disabled:cursor-not-allowed`}
          aria-label={isPublishing ? "Publishing..." : "Publish"}
        >
          <Icon name="UploadCloud" className="text-white" />
        </button>
      </div>
    </header>
  );
}

export default TopToolbar;
