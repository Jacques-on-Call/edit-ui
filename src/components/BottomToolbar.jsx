import { route } from 'preact-router';
import { Home, ArrowLeft, Plus } from 'lucide-preact';
import LiquidGlassButton from './LiquidGlassButton';
import { useUI } from '../contexts/UIContext';

export function BottomToolbar() {
  const { setCreateOpen } = useUI();

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-midnight-blue border-t border-blue-400/50 shadow-2xl z-20"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(0, 0, 10, 0.7)',
      }}
    >
      <div className="flex items-center justify-around h-full px-4 max-w-screen-xl mx-auto">
        <button
          onClick={() => route('/explorer')}
          className="p-3 text-white transition-transform duration-150 ease-in-out rounded-full hover:bg-white/10 active:scale-90"
          aria-label="Go home"
        >
          <Home size={24} />
        </button>

        <LiquidGlassButton onClick={() => setCreateOpen(true)}>
          <Plus size={32} />
        </LiquidGlassButton>

        <button
          onClick={() => window.history.back()}
          className="p-3 text-white transition-transform duration-150 ease-in-out rounded-full hover:bg-white/10 active:scale-90"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
      </div>
    </footer>
  );
}
