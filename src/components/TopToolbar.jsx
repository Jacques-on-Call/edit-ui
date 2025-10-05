import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from './Icon';

function TopToolbar() {
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get('path');

  return (
    <header className="bg-light-grey shadow-md px-4 py-2 flex justify-between items-center w-full">
      <Link to="/explorer" className="flex items-center space-x-2 rounded-lg hover:bg-gray-200 p-2 text-sm">
        <Icon name="arrow-left" />
        <span>Back to Files</span>
      </Link>
      <div className="flex-grow"></div>
      <div className="flex items-center space-x-4">
        {filePath && (
          <Link
            to={`/preview?path=${encodeURIComponent(filePath)}`}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 text-sm"
          >
            Preview
          </Link>
        )}
        <button className="px-6 py-2 bg-bark-blue text-white rounded-lg font-semibold hover:bg-opacity-90 text-sm">
          Publish
        </button>
      </div>
    </header>
  );
}

export default TopToolbar;