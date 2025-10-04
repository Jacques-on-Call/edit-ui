import RepoSelector from '../components/RepoSelector';
import { useNavigate } from 'react-router-dom';

function RepositorySelectionPage() {
  const navigate = useNavigate();

  const handleRepoSelect = (repo) => {
    localStorage.setItem('selectedRepo', repo);
    navigate('/explorer');
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center py-12">
      <div className="max-w-2xl w-full">
        <RepoSelector onRepoSelect={handleRepoSelect} />
      </div>
    </div>
  );
}

export default RepositorySelectionPage;