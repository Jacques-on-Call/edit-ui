import React from 'react';
import Search from './search-bar';
import { HomeIcon } from './icons';

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
    <header className="bg-blue text-white py-[10px] px-4 border-b border-[#002a52] sticky top-0 z-20 flex justify-between items-center gap-4">
      <div className="flex items-center flex-grow min-w-0">
        <button
          onClick={handleHomeClick}
          className="bg-transparent border-none text-white cursor-pointer p-1 mr-2 flex items-center justify-center rounded transition-colors duration-200 ease-in-out hover:bg-white/10 flex-shrink-0"
          aria-label="Go to root folder"
          title="Go to root"
        >
          <HomeIcon />
        </button>
        <nav aria-label="breadcrumb" className="overflow-hidden">
          <ol className="list-none m-0 p-0 flex items-center text-base whitespace-nowrap">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center after:content-['>'] after:mx-2 after:text-white/50 last:after:content-none">
                {index < breadcrumbs.length - 1 ? (
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onNavigate(crumb.path); }}
                    className="text-light-green no-underline font-medium py-1 px-2 rounded transition-colors duration-200 ease-in-out hover:bg-white/10 hover:no-underline"
                  >
                    {crumb.name}
                  </a>
                ) : (
                  <span className="font-bold py-1 px-2 text-white">{crumb.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <div className="flex items-center flex-shrink-0 ml-4">
        <Search repo={repo} onNavigate={onNavigate} />
      </div>
    </header>
  );
};

export default Header;
