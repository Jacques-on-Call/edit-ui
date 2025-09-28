import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './ReadmeDisplay.module.css';
import Icon from './icons.jsx';

function ReadmeDisplay({ content, onToggle, isVisible }) {
  // The visibility of the content is handled by the conditional rendering below.
  // The main container div should always have the same base class.
  return (
    <div className={styles.readmeDisplay}>
      <div className={styles.readmeHeader} onClick={onToggle}>
        <h3>
          <Icon name="book-open" />
          README
        </h3>
        <button className={styles.toggleButton}>
          <Icon name={isVisible ? 'chevron-up' : 'chevron-down'} />
        </button>
      </div>
      {/* Conditionally render the content based on the isVisible prop */}
      {isVisible && (
        <div className={styles.readmeContent}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default ReadmeDisplay;
