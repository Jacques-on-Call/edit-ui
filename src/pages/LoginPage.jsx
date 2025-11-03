import { Zap, Check, TrendingUp } from 'lucide-preact';

export function LoginPage() {
  return (
    <div className="flex items-center min-h-screen bg-primary">
      <div className="w-full max-w-md px-8 ml-[20%]">

        <header className="flex items-center gap-4 mb-4">
          <img src="/ShowUp-H1-Logo.webp" alt="ShowUp Logo" className="h-16" />
        </header>

        <main>
          <p className="mb-4 text-2xl font-medium text-text">Build your business visibility, easily.</p>
          <p className="mb-8 text-lg text-textSecondary">
            ShowUp helps professionals build high-ranking websites and attract new customers – fast.
          </p>

          <ul className="space-y-4 text-lg text-text mb-9">
            <li className="flex items-center gap-3">
              <Zap size={24} className="text-text" />
              <span>Personalized guidance</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={24} className="text-text" />
              <span>Simple to update</span>
            </li>
            <li className="flex items-center gap-3">
              <TrendingUp size={24} className="text-text" />
              <span>Easy SEO (search everywhere optimized)</span>
            </li>
          </ul>

          <a
            href="/api/login/github"
            className="flex items-center justify-center w-full gap-4 px-6 py-4 font-bold transition-shadow duration-200 ease-in-out border-2 border-white rounded-lg shadow-[-4px_4px_0px_#D8F21D] hover:shadow-[-6px_6px_0px_#D8F21D] bg-button text-buttonText text-xl"
          >
            <img src="/ShowUp-button-Logo.webp" alt="ShowUp Button Logo" className="w-8 h-8" />
            <span>Sign Up Free</span>
          </a>

          <div className="mt-6 text-center">
            <a href="/api/login/github" className="text-lg text-textSecondary hover:text-accent">
              Login
            </a>
          </div>
        </main>

        <footer className="mt-12">
          <p className="text-sm text-textSecondary">Powered by Strategy Content Agency</p>
        </footer>

      </div>
    </div>
  );
}
