// easy-seo/src/pages/RepoSelectPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import Icon from '../components/Icon';
import Button from '../components/ui/Button';
import { route } from 'preact-router';
import { useState } from 'preact/hooks';
import { fetchJson } from '../lib/fetchJson';


export function RepoSelectPage() {
  const { user, isAuthenticated, isLoading, repositories, selectRepo } = useAuth();
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-lime"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    route('/', true); // Redirect to login page
    return null;
  }

  // The repository list is pre-filtered by the backend (`/api/repos`) to only include
  // repositories that contain a `src/pages` directory. Therefore, no additional
  // client-side validation is needed before selecting a repository.
  const handleSelectRepo = (repo) => {
    selectRepo(repo);
    route('/explorer');
  };

  const handleCreateRepo = async () => {
    setIsCreatingRepo(true);
    try {
      const newRepo = await fetchJson('/api/user/repos/create-starter', {
        method: 'POST',
      });
      if (newRepo) {
        selectRepo(newRepo);
        route('/explorer', true);
      }
    } catch (error) {
      console.error("Failed to create repository:", error);
      // Optionally: show an error message to the user
    } finally {
      setIsCreatingRepo(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-2 sm:p-6 md:p-8 text-white border border-white/20">
        <header className="flex flex-col items-center text-center mb-6 md:mb-8">
          <img src={user?.avatar_url} alt="User Avatar" className="h-16 w-16 md:h-20 md:w-20 mb-4 rounded-full border-2 border-accent-lime/50" />
          <h1 className="text-3xl font-bold">Welcome, {user?.login}</h1>
          <p className="text-lg text-gray-300 mt-2">
            {repositories.length > 0 ? 'Select a repository to start editing.' : 'You seem new here.'}
          </p>
        </header>

        <main className="w-full">
          <div className="flex flex-col items-center gap-4">
            {repositories.length > 0 ? (
              repositories.map((repo) => (
                <Button
                  key={repo.id}
                  className="w-full flex items-center justify-center gap-3"
                  onClick={() => handleSelectRepo(repo)}
                >
                  <Icon name="Github" className="w-5 h-5 text-accent-lime" />
                  <span>{repo.name}</span>
                </Button>
              ))
            ) : (
              <>
                <div className="text-center bg-black/20 p-6 rounded-lg border border-white/10 w-full mb-4">
                  <Icon name="AlertTriangle" className="mx-auto h-12 w-12 text-accent-lime/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Repositories Found</h3>
                  <p className="text-gray-400">
                    Please make sure the application has access to your repositories.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-3"
                  onClick={handleCreateRepo}
                  disabled={isCreatingRepo}
                >
                  {isCreatingRepo ? (
                    <>
                      <Icon name="Loader" className="w-6 h-6 animate-spin" />
                      <span>Creating your site...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="Rocket" className="w-6 h-6" />
                      <span>Click here to get started</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
