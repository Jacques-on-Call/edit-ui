import React from 'react';
import Icon from './icons.jsx';
import './MiniBreadcrumb.css';

const MiniBreadcrumb = ({ path, onNavigate }) => {
  const isAtRoot = path === 'src/pages';

  const getCurrentFolderName = () => {
    if (isAtRoot) {
      return 'Home';
    }
    const segments = path.split('/');
    return segments[segments.length - 1];
  };

  const handleHomeClick = () => {
    if (!isAtRoot) {
      onNavigate('src/pages');
    }
  };

  return (
    <div className={`mini-breadcrumb ${isAtRoot ? 'disabled' : ''}`} onClick={handleHomeClick}>
      <Icon name="home" className="breadcrumb-icon" />
      {!isAtRoot && (
        <>
          <span className="breadcrumb-separator">{'>'}</span>
          <span className="breadcrumb-text">{getCurrentFolderName()}</span>
        </>
      )}
    </div>
  );
};

export default MiniBreadcrumb;
