// easy-seo/src/pages/LoginPage.jsx
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../themes/theme';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div>
      <h2 className={theme.typography.h2}>Login Page</h2>
      {isLoading ? (
        <p>Checking auth status...</p>
      ) : isAuthenticated ? (
        <p>You are already logged in.</p>
      ) : (
        <a href="https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&scope=repo,user&redirect_uri=https://edit.strategycontent.agency/api/callback">
          Login with GitHub
        </a>
      )}
    </div>
  );
}
