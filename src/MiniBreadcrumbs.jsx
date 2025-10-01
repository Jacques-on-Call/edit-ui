import React from 'react';

const MiniBreadcrumbs = ({ path, onNavigate }) => {
  if (path === 'src/pages') {
    // At the root, we don't need to show any breadcrumb text besides the Home icon.
    // The parent component already handles the Home icon.
    return <div className="h-4"></div>;
  }

  // Remove the base 'src/pages' and split the remaining path
  const parts = path.replace('src/pages', '').split('/').filter(p => p);

  const handleNavigate = (index) => {
    const newPath = 'src/pages' + (index >= 0 ? '/' + parts.slice(0, index + 1).join('/') : '');
    onNavigate(newPath);
  };

  const separator = <span className="text-xs text-gray-400 mx-0.5 select-none">&gt;</span>;

  return (
    <div className="mini-breadcrumb flex items-center overflow-x-auto whitespace-nowrap flex-grow ml-2 pb-1.5">
      {/* The home button is now separate, so we just add a separator if needed */}
      {separator}
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index < parts.length - 1 ? (
            // These are the clickable parent folders
            <button
              className="bg-transparent border-none text-blue-600 cursor-pointer text-xs py-0.5 px-1 rounded-md transition-colors font-medium hover:bg-blue-100 hover:underline"
              onClick={() => handleNavigate(index)}
            >
              {part}
            </button>
          ) : (
            // This is the current, non-clickable folder
            <span className="text-xs text-dark-grey font-medium px-1">{part}</span>
          )}
          {index < parts.length - 1 && separator}
        </React.Fragment>
      ))}
    </div>
  );
};

export default MiniBreadcrumbs;
