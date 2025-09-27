import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './ReadmeDisplay.module.css';
import Icon from './icons.jsx';

function ReadmeDisplay({ content, onToggle, isVisible }) {
  return (
    <div className={`${styles.readmeDisplay} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.readmeHeader} onClick={onToggle}>
        <h3>
          <Icon name="book-open" />
          README
        </h3>
        <button className={styles.toggleButton}>
          <Icon name={isVisible ? 'chevron-up' : 'chevron-down'} />
        </button>
      </div>
      {isVisible && (
        <div className={styles.readmeContent}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default ReadmeDisplay;
