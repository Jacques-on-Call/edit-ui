// easy-seo/src/pages/RepoSelectPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';
import { AlertTriangle, Github, Loader } from 'lucide-preact';
import { route } from 'preact-router';
import { useState } from 'preact/hooks';
import { fetchJson } from '../lib/fetchJson';


export function RepoSelectPage() {
  const { user, isAuthenticated, isLoading, repositories, selectRepo } = useAuth();
  const [validationState, setValidationState] = useState({});
  const [error, setError] = useState(null);


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

  const handleSelectRepo = async (repo) => {
    // Set loading state for the specific repo
    setValidationState(prev => ({ ...prev, [repo.full_name]: 'validating' }));
    setError(null);

    try {
      // Check if src/pages exists
      const response = await fetchJson(`/api/repo/validate?repo=${repo.full_name}`);

      if (response && response.isValid) {
        setValidationState(prev => ({ ...prev, [repo.full_name]: 'valid' }));
        selectRepo(repo);
        route('/explorer');
      } else {
        throw new Error("Repository does not contain a 'src/pages' directory.");
      }
    } catch (err) {
      console.error("Repo validation error:", err);
      setValidationState(prev => ({ ...prev, [repo.full_name]: 'invalid' }));
      setError(`'${repo.full_name}' is not a valid project. It must contain a 'src/pages' directory.`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-2 sm:p-6 md:p-8 text-white border border-white/20">
        <header className="flex flex-col items-center text-center mb-6 md:mb-8">
          <img src={user?.avatar_url} alt="User Avatar" className="h-16 w-16 md:h-20 md:w-20 mb-4 rounded-full border-2 border-accent-lime/50" />
          <h1 className="text-3xl font-bold">Welcome, {user?.login}</h1>
          <p className="text-lg text-gray-300 mt-2">
            Select a repository to start editing.
          </p>
        </header>

        <main className="w-full">
          <div className="flex flex-col items-center gap-4">
            {error && (
                <div className="w-full bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-center">
                    {error}
                </div>
            )}
            {repositories.length > 0 ? (
              repositories.map((repo) => {
                const isvalidating = validationState[repo.full_name] === 'validating';
                return (
                    <button
                      key={repo.id}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-white/20 backdrop-blur-sm shadow-md transition-all duration-300 transform hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleSelectRepo(repo)}
                      disabled={isvalidating}
                    >
                      {isvalidating ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Github className="w-5 h-5 text-accent-lime" />
                      )}
                      <span>{repo.name}</span>
                    </button>
                )
            })
            ) : (
              <div className="text-center bg-black/20 p-6 rounded-lg border border-white/10">
                <AlertTriangle className="mx-auto h-12 w-12 text-accent-lime/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Repositories Found</h3>
                <p className="text-gray-400">
                  Please make sure the application has access to your repositories.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
