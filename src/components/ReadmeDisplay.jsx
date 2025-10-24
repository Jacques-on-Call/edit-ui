import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Icon from './Icon.jsx';

function ReadmeDisplay({ content, onToggle, isVisible }) {
  return (
    <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="bg-gray-100 px-4 py-3 flex justify-between items-center cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <Icon name="BookOpen" />
          <span>README.md</span>
        </h3>
        <button className="text-gray-500 hover:text-gray-800">
          <Icon name={isVisible ? 'EyeOff' : 'Eye'} />
        </button>
      </div>
      {isVisible && (
        <div className="p-6 bg-white">
          <article className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        </div>
      )}
    </div>
  );
}

export default ReadmeDisplay;