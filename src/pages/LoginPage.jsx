// Import the Icon component
import Icon from '../components/Icon';

export function LoginPage() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-2 sm:p-4 md:p-6 text-white border border-white/20">
        <header className="text-left mb-6 md:mb-8">
          <div className="flex flex-row items-center">
            <img src="/ShowUp-H1-Logo.webp" alt="ShowUp Logo" className="h-16 w-16 mr-4" />
            <h1 className="text-5xl font-bold">Show<span className="text-accent-magenta">Up</span></h1>
          </div>
          <p className="text-xl font-medium text-accent-lime mt-4">
            Build your business visibility, easily.
          </p>
        </header>

        <main>
          <p className="text-left text-gray-300 mb-6 md:mb-8">
            ShowUp helps professionals build high-ranking websites and attract new customers – fast.
          </p>

          <ul className="space-y-4 text-left mb-8 md:mb-10 bg-white/5 p-6 rounded-lg border border-white/10">
            <li className="flex items-center gap-4">
              <Icon name="Handshake" className="text-accent-lime w-6 h-6 flex-shrink-0" />
              <span>Personalized guidance to rank higher</span>
            </li>
            <li className="flex items-center gap-4">
              <Icon name="FilePenLine" className="text-accent-lime w-6 h-6 flex-shrink-0" />
              <span>Simple to update anytime</span>
            </li>
            <li className="flex items-center gap-4">
              <Icon name="Eye" className="text-accent-lime w-6 h-6 flex-shrink-0" />
              <span>Easy SEO (search everywhere optimized)</span>
            </li>
          </ul>

          <button
            onClick={handleLogin}
            className="w-full bg-black/30 text-white font-bold flex items-center justify-center gap-3 py-4 px-8 rounded-xl border border-accent-lime/50 backdrop-blur-sm shadow-lg transition-all duration-300 transform hover:bg-black/50 hover:shadow-xl hover:-translate-y-1"
          >
            <img src="/ShowUp-Button-Logo.webp" alt="Button Logo" className="h-7 w-7" />
            <span>Sign Up Free Use</span>
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">free tier forever no cards needed</p>

          <button onClick={() => window.location.href = '/api/login'} className="block w-full text-center mt-6 text-sm text-accent-lime hover:underline cursor-pointer bg-transparent border-none p-0">
            Already have an account? Login
          </button>
        </main>
      </div>
      <footer className="absolute bottom-5 w-full text-center text-xs text-gray-400/50">
        <p>Powered by Strategy Content Agency</p>
      </footer>
    </div>
  );
}
