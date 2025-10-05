import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

function TopToolbar() {
  return (
    <header className="bg-light-grey shadow-md px-4 py-2 flex justify-between items-center w-full">
      <Link to="/explorer" className="flex items-center space-x-2 rounded-lg hover:bg-gray-200 p-2">
        <Icon name="arrow-left" />
        <span>Back to Files</span>
      </Link>
      <div className="flex-grow"></div>
      <button className="px-6 py-2 bg-bark-blue text-white rounded-lg font-semibold hover:bg-opacity-90">
        Publish
      </button>
    </header>
  );
}

export default TopToolbar;