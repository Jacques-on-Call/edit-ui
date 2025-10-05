import SearchBar from './SearchBar';

function ExplorerHeader() {
  const repo = localStorage.getItem('selectedRepo') || '';

  return (
    <header className="bg-light-grey shadow-md">
      <div className="px-4 sm:px-6 lg:px-8 py-2 flex items-center">
        <div className="flex-grow">
          {/* The SearchBar will take up the majority of the header space */}
          <SearchBar repo={repo} />
        </div>
        {/* Future tools and buttons can be added here */}
        {/* Example:
        <div className="ml-4">
          <button className="p-2 rounded-full hover:bg-gray-200">
            [Some Icon]
          </button>
        </div>
        */}
      </div>
    </header>
  );
}

export default ExplorerHeader;