import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

function TopToolbar({ onPublish, isPublishing, onChangeLayout }) {
  const buttonClass = "p-2 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <header className="bg-light-grey px-4 py-2 flex justify-between items-center w-full border-b border-gray-200">
      <Link to="/explorer" className={buttonClass} aria-label="Back to File Explorer">
        <Icon name="home" className="text-gray-600" />
      </Link>
      <div className="flex-grow"></div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onChangeLayout}
          className={`${buttonClass} text-gray-600`}
          aria-label="Change Layout"
        >
          <Icon name="layout" className="text-gray-600" />
        </button>
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