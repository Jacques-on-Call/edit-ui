import RepoSelector from '../components/RepoSelector';
import { useNavigate } from 'react-router-dom';

function RepositorySelectionPage() {
  const navigate = useNavigate();

  const handleRepoSelect = (repo) => {
    localStorage.setItem('selectedRepo', repo);
    // Navigate to the explorer with the initial path set to src/pages
    navigate('/explorer?path=src/pages', { state: { selectedRepo: repo } });
  };

  return (
    <div className="bg-bark-blue min-h-screen flex flex-col items-center justify-center py-12 text-center">
      <div className="max-w-2xl w-full px-4">
        <img src="/logo.webp" className="h-20 w-auto mx-auto mb-8" alt="Easy SEO Logo" />
        <RepoSelector onRepoSelect={handleRepoSelect} />
      </div>
    </div>
  );
}

export default RepositorySelectionPage;
