import React from 'react';
import './MiniBreadcrumb.css';

const MiniBreadcrumb = ({ path, onNavigate }) => {
  if (path === 'src/pages') {
    // At the root, we don't need to show any breadcrumb text besides the Home icon.
    // The parent component already handles the Home icon.
    return <div className="mini-breadcrumb-placeholder"></div>;
  }

  // Remove the base 'src/pages' and split the remaining path
  const parts = path.replace('src/pages', '').split('/').filter(p => p);

  const handleNavigate = (index) => {
    const newPath = 'src/pages' + (index >= 0 ? '/' + parts.slice(0, index + 1).join('/') : '');
    onNavigate(newPath);
  };

  return (
    <div className="mini-breadcrumb">
      {/* The home button is now separate, so we just add a separator if needed */}
      <span className="breadcrumb-separator">&gt;</span>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index < parts.length - 1 ? (
            // These are the clickable parent folders
            <button className="breadcrumb-button" onClick={() => handleNavigate(index)}>
              {part}
            </button>
          ) : (
            // This is the current, non-clickable folder
            <span className="breadcrumb-text">{part}</span>
          )}
          {index < parts.length - 1 && (
            <span className="breadcrumb-separator">&gt;</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default MiniBreadcrumb;
