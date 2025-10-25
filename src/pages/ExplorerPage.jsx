import { useEffect } from 'react';
import FileExplorer from '../components/FileExplorer';
import { Link, useLocation } from 'react-router-dom';

function ExplorerPage() {
  useEffect(() => {
    console.log('Explorer mounted');
  }, []);

  const location = useLocation();
  // Prioritize repo from navigation state, fall back to localStorage.
  const selectedRepo = location.state?.selectedRepo || localStorage.getItem('selectedRepo');

  if (!selectedRepo) {
    // This can happen if the user navigates here directly without selecting a repo
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">No Repository Selected</h1>
        <p className="text-gray-600 mb-8">Please go back to the repository selection page to choose a repository.</p>
        <Link
          to="/repository-selection"
          className="bg-bark-blue text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bark-blue transition-all"
        >
          Select a Repository
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <FileExplorer repo={selectedRepo} />
    </div>
  );
}

export default ExplorerPage;