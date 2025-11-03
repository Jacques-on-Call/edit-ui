import { h } from 'preact';
import { Zap, Check, TrendingUp, ArrowUpRight, CircleArrowOutUpRight } from 'lucide-preact';

const LoginPage = () => {
  return (
    <div
      className="flex flex-col min-h-screen text-white p-8"
      style={{ backgroundColor: '#191970' }}
    >
      <header className="flex items-center mb-12">
        <h1 className="text-4xl font-bold">ShowUp</h1>
        <div className="ml-4 bg-yellow-400 rounded-full p-1">
          <CircleArrowOutUpRight color="black" size={32}/>
        </div>
      </header>

      <main className="flex flex-col flex-1">
        <h2
          className="text-4xl font-bold mb-4"
          style={{ color: '#D8F21D' }}
        >
          Build your business visibility, easily.
        </h2>
        <p className="text-lg max-w-2xl mb-12" style={{ color: '#D9D9D9' }}>
          ShowUp helps professionals build high-ranking websites and attract new
          customers - fast.
        </p>

        <div className="space-y-6 text-left max-w-md mb-12">
          <div className="flex items-center">
            <Zap color="#D8F21D" className="mr-4" />
            <span className="text-xl" style={{ color: '#D9D9D9' }}>Personalized guidance</span>
          </div>
          <div className="flex items-center">
            <Check color="#D8F21D" className="mr-4" />
            <span className="text-xl" style={{ color: '#D9D9D9' }}>Simple to update</span>
          </div>
          <div className="flex items-center">
            <TrendingUp color="#D8F21D" className="mr-4" />
            <span className="text-xl" style={{ color: '#D9D9D9' }}>
              Easy SEO (search everywhere optimized)
            </span>
          </div>
        </div>

        <button
          className="bg-black text-white font-bold py-4 px-8 rounded-lg text-2xl flex items-center justify-center w-full max-w-md"
        >
          <ArrowUpRight className="mr-2" />
          Sign Up Free
        </button>

        <a href="#" className="mt-8 text-xl" style={{ color: '#D9D9D9' }}>
          Login
        </a>
      </main>

      <footer className="w-full text-center py-4" style={{ color: '#D9D9D9' }}>
        <p>Powered by Strategy Content Agency</p>
      </footer>
    </div>
  );
};

export default LoginPage;
