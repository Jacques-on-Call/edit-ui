import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';

function TopToolbar({ onPublish, isPublishing, onChangeLayout, layoutPath, filePath, activeTab, setActiveTab }) {
  const location = useLocation();
  const currentPath = new URLSearchParams(location.search).get('path');
  const buttonClass = "p-2 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";
  const tabButton = (tabName, label) => (
    <button
      className={`px-6 py-3 text-sm font-semibold focus:outline-none transition-colors duration-200 ${activeTab === tabName ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
      onClick={() => setActiveTab(tabName)}
    >
      {label}
    </button>
  );

  return (
    <header className="bg-light-grey px-4 py-2 flex justify-between items-center w-full border-b border-gray-200">
      <Link to="/explorer" className={buttonClass} aria-label="Back to File Explorer">
        <Icon name="home" className="text-gray-600" />
      </Link>
      <div className="flex-grow flex justify-center">
        {tabButton('editor', 'Editor')}
        {tabButton('preview', 'Preview')}
      </div>
      <div className="flex items-center space-x-2">
        {layoutPath ? (
          <Link
            to={`/layout-editor?path=${layoutPath}&from=${currentPath}`}
            className={`${buttonClass} text-gray-600`}
            aria-label="Edit Layout"
            title="Edit Layout"
          >
            <Icon name="layout" className="text-gray-600" />
          </Link>
        ) : (
          <button
            onClick={onChangeLayout}
            className={`${buttonClass} text-gray-600`}
            aria-label="Change Layout"
            title="Assign Layout"
          >
            <Icon name="layout" className="text-gray-600" />
          </button>
        )}
        <Link
          to={`/visual-editor?path=${filePath}`}
          className={`${buttonClass} text-gray-600`}
          aria-label="Design"
          title="Design"
        >
          <Icon name="design" className="text-gray-600" />
        </Link>
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className={`${buttonClass} bg-bark-blue text-white hover:bg-bark-blue/90 disabled:bg-gray-400 disabled:cursor-not-allowed`}
          aria-label={isPublishing ? "Publishing..." : "Publish"}
        >
          <Icon name="publish" className="text-white" />
        </button>
      </div>
    </header>
  );
}

export default TopToolbar;
