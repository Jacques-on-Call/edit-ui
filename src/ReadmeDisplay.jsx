import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Icon from './icons.jsx';

function ReadmeDisplay({ content, onToggle, isVisible }) {
  return (
    <div className="border border-gray-200 rounded-md mb-4 overflow-hidden transition-all duration-300 ease-in-out">
      <div
        className="flex justify-between items-center p-2 px-4 bg-blue text-white cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="m-0 text-base flex items-center gap-2">
          <Icon name="book-open" />
          README
        </h3>
        <button className="bg-transparent border-none text-white cursor-pointer p-1">
          <Icon name={isVisible ? 'chevron-up' : 'chevron-down'} />
        </button>
      </div>
      {isVisible && (
        <div className="p-6 bg-white text-gray-800">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose prose-sm max-w-none prose-a:text-green prose-a:no-underline hover:prose-a:underline"
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default ReadmeDisplay;
