import React from 'react';
import SearchBar from './search-bar.jsx'; // Import the new Search component
import './Header.css';

const Header = ({ path, onNavigate, repo }) => { // Add repo to props
  const formatPath = (currentPath) => {
    if (!currentPath.startsWith('src/pages')) {
      return [];
    }
    // Remove the base path and split into segments
    const cleanedPath = currentPath.replace('src/pages', '').trim();
    if (!cleanedPath) {
      return [{ name: 'Home', path: 'src/pages' }];
    }
    const segments = cleanedPath.split('/').filter(Boolean);

    // Create the breadcrumb objects
    const breadcrumbs = [{ name: 'Home', path: 'src/pages' }];
    let builtPath = 'src/pages';
    for (const segment of segments) {
      builtPath += `/${segment}`;
      breadcrumbs.push({ name: segment, path: builtPath });
    }
    return breadcrumbs;
  };

  const breadcrumbs = formatPath(path);

  return (
    <header className="file-explorer-header">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <li key={index} className="breadcrumb-item">
              {index < breadcrumbs.length - 1 ? (
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate(crumb.path); }}>
                  {crumb.name}
                </a>
              ) : (
                <span>{crumb.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="header-actions">
        <SearchBar repo={repo} />
      </div>
    </header>
  );
};

export default Header;
