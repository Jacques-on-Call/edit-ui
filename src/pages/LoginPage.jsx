import { Zap, Check, TrendingUp } from 'lucide-preact';

export function LoginPage() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col justify-center pl-[20vw] pr-4 sm:pr-6 md:pr-10">
        <div className="max-w-lg">
          <header className="flex items-center gap-3 mb-8">
            <img src="/ShowUp-H1-bigger-Logo.webp.jpeg" alt="ShowUp Logo" className="h-10 w-10" />
            <h1 className="text-4xl font-bold text-main-text">ShowUp</h1>
          </header>

          <main>
            <p className="text-xl font-medium text-accent-lime mb-4">
              Build your business visibility, easily.
            </p>
            <p className="mb-8 text-muted-text">
              ShowUp helps professionals build high-ranking websites and attract new customers – fast.
            </p>

            <ul className="space-y-4 text-left mb-12">
              <li className="flex items-center gap-3">
                <Zap size={24} className="text-accent-lime w-6 h-6" />
                <span>Personalized guidance</span>
              </li>
              <li className="flex items-center gap-3">
                <Check size={24} className="text-accent-lime w-6 h-6" />
                <span>Simple to update</span>
              </li>
              <li className="flex items-center gap-3">
                <TrendingUp size={24} className="text-accent-lime w-6 h-6" />
                <span>Easy SEO (search everywhere optimized)</span>
              </li>
            </ul>

            {/* --- Improved "Push-Down" Button --- */}
            <div className="relative group w-fit">
              {/* Base Layer (The Lime Color) */}
              <div className="absolute inset-0 bg-accent-lime rounded-lg"></div>

              {/* Top Layer (The Black Button) */}
              <button
                onClick={handleLogin}
                className="relative bg-button-bg text-button-text font-bold flex items-center gap-3 py-4 px-8 rounded-lg border-2 border-black transition-transform transform -translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0"
              >
                <img src="/ShowUp-Button-Logo.webp" alt="Button Logo" className="h-6 w-6" />
                <span>Sign Up Free</span>
              </button>
            </div>

            <a href="#" onClick={handleLogin} className="block mt-6 text-sm text-accent-lime hover:text-main-text">
              Login
            </a>
          </main>
        </div>
      </div>
      <footer className="w-full text-center py-5 text-xs text-muted-text">
        <p>Powered by Strategy Content Agency</p>
      </footer>
    </div>
  );
}
