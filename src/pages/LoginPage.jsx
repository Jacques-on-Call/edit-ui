// Import the new icons from lucide-preact
import { Handshake, FilePenLine, Eye } from 'lucide-preact';

export function LoginPage() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    // --- RESPONSIVE FIX ---
    // Use fixed padding on mobile (px-6) and switch to margin on desktop (md:ml-[20%])
    // This provides consistent spacing on small screens.
    <div className="min-h-screen flex flex-col px-6 md:ml-[20%]">
      <div className="flex-grow flex flex-col justify-center">
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

            {/* --- ICON & LAYOUT FIX --- */}
            {/* Using specific, more meaningful icons for each feature. */}
            <ul className="space-y-4 text-left mb-12">
              <li className="flex items-center gap-3">
                <Handshake className="text-accent-lime w-6 h-6" />
                <span>Personalized guidance</span>
              </li>
              <li className="flex items-center gap-3">
                <FilePenLine className="text-accent-lime w-6 h-6" />
                <span>Simple to update</span>
              </li>
              <li className="flex items-center gap-3">
                <Eye className="text-accent-lime w-6 h-6" size={24} />
                <span>Easy SEO (search everywhere optimized)</span>
              </li>
            </ul>

            {/* --- BUTTON ICON FIX --- */}
            <button
              onClick={handleLogin}
              className="bg-button-bg text-button-text font-bold flex items-center gap-3 py-4 px-8 rounded-lg shadow-cta transition-transform transform hover:scale-105"
            >
              <img src="/ShowUp-Button-Logo.webp" alt="Button Logo" className="h-6 w-6 md:h-8 md:w-8" />
              <span>Sign Up Free</span>
            </button>

            <button onClick={() => window.location.href = '/api/login'} className="block mt-6 text-sm text-accent-lime hover:text-main-text cursor-pointer bg-transparent border-none p-0">
              Login
            </button>
          </main>
        </div>
      </div>
      <footer className="w-full text-center py-5 text-xs text-muted-text">
        <p>Powered by Strategy Content Agency</p>
      </footer>
    </div>
  );
}
