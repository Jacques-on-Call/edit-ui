import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Icon from './icons.jsx';

function ReadmeDisplay({ content, onToggle, isVisible }) {
  return (
    <div className={`border border-gray-200 rounded-lg mb-4 overflow-hidden transition-all duration-300`}>
      <div className="flex justify-between items-center p-2 px-4 bg-[#003971] text-white cursor-pointer" onClick={onToggle}>
        <h3 className="m-0 text-base font-semibold flex items-center gap-2">
          <Icon name="book-open" />
          README
        </h3>
        <button className="bg-transparent border-none text-white cursor-pointer p-1">
          <Icon name={isVisible ? 'chevron-up' : 'chevron-down'} />
        </button>
      </div>
      {isVisible && (
        <div className="p-6 bg-white prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default ReadmeDisplay;