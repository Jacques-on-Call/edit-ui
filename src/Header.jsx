import React from 'react';
import Search from './search-bar';
import { HomeIcon } from './icons';
import styles from './Header.module.css';

const Header = ({ path, onNavigate, repo }) => {
  const handleHomeClick = (e) => {
    e.preventDefault();
    onNavigate('src/pages');
  };

  const formatPath = (currentPath) => {
    if (!currentPath.startsWith('src/pages')) {
      return [];
    }
    const cleanedPath = currentPath.replace('src/pages', '').trim();
    if (!cleanedPath) {
      return [{ name: 'Home', path: 'src/pages' }];
    }
    const segments = cleanedPath.split('/').filter(Boolean);

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
    <header className={styles.fileExplorerHeader}>
      <div className={styles.headerLeftSection}>
        <button
          onClick={handleHomeClick}
          className={styles.homeButton}
          aria-label="Go to root folder"
          title="Go to root"
        >
          <HomeIcon />
        </button>
        <nav aria-label="breadcrumb">
          <ol className={styles.breadcrumbs}>
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className={styles.breadcrumbItem}>
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
      </div>
      <div className={styles.headerActions}>
        <Search repo={repo} onNavigate={onNavigate} />
      </div>
    </header>
  );
};

export default Header;
