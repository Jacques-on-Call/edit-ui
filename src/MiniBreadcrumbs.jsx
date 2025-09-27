import React from 'react';
import styles from './MiniBreadcrumbs.module.css';

const MiniBreadcrumbs = ({ path, onNavigate }) => {
  if (path === 'src/pages') {
    // At the root, we don't need to show any breadcrumb text besides the Home icon.
    // The parent component already handles the Home icon.
    return <div className={styles.miniBreadcrumbPlaceholder}></div>;
  }

  // Remove the base 'src/pages' and split the remaining path
  const parts = path.replace('src/pages', '').split('/').filter(p => p);

  const handleNavigate = (index) => {
    const newPath = 'src/pages' + (index >= 0 ? '/' + parts.slice(0, index + 1).join('/') : '');
    onNavigate(newPath);
  };

  return (
    <div className={styles.miniBreadcrumb}>
      {/* The home button is now separate, so we just add a separator if needed */}
      <span className={styles.breadcrumbSeparator}>&gt;</span>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index < parts.length - 1 ? (
            // These are the clickable parent folders
            <button className={styles.breadcrumbButton} onClick={() => handleNavigate(index)}>
              {part}
            </button>
          ) : (
            // This is the current, non-clickable folder
            <span className={styles.breadcrumbText}>{part}</span>
          )}
          {index < parts.length - 1 && (
            <span className={styles.breadcrumbSeparator}>&gt;</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default MiniBreadcrumbs;
