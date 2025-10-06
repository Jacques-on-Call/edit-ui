import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';

function ExplorerHeader() {
  const repo = localStorage.getItem('selectedRepo') || '';

  return (
    <header className="bg-light-grey shadow-md">
      <div className="px-4 sm:px-6 lg:px-8 py-2 flex items-center">
        <div className="flex-grow">
          <SearchBar repo={repo} />
        </div>
        <div className="ml-4 flex items-center space-x-4">
          {/* The Live Preview link has been removed as per user feedback for a cleaner UI */}
        </div>
      </div>
    </header>
  );
}

export default ExplorerHeader;