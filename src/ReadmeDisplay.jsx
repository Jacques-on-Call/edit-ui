import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ReadmeDisplay.css';
import Icon from './icons.jsx';

function ReadmeDisplay({ content, onToggle, isVisible }) {
  return (
    <div className={`readme-display ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="readme-header" onClick={onToggle}>
        <h3>
          <Icon name="book-open" />
          README
        </h3>
        <button className="toggle-button">
          <Icon name={isVisible ? 'chevron-up' : 'chevron-down'} />
        </button>
      </div>
      {isVisible && (
        <div className="readme-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default ReadmeDisplay;
