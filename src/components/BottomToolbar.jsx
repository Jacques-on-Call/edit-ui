import { Home, ArrowLeft, Plus } from 'lucide-preact';
import LiquidGlassButton from './LiquidGlassButton';
import { useUI } from '../contexts/UIContext';

export function BottomToolbar() {
  const { setCreateOpen, navigateHome, navigateBack } = useUI();

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-midnight-blue/20 border-t border-white/10 shadow-2xl z-20"
      style={{
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        backgroundColor: 'rgba(0, 0, 10, 0.4)',
      }}
    >
      <div className="flex items-center justify-around h-full px-4 max-w-screen-xl mx-auto">
        <button
          onClick={navigateHome}
          className="p-3 text-white transition-transform duration-150 ease-in-out rounded-full hover:bg-white/10 active:scale-90"
          aria-label="Go to home folder (src/pages)"
        >
          <Home size={24} />
        </button>

        <LiquidGlassButton onClick={() => setCreateOpen(true)}>
          <Plus size={32} />
        </LiquidGlassButton>

        <button
          onClick={navigateBack}
          className="p-3 text-white transition-transform duration-150 ease-in-out rounded-full hover:bg-white/10 active:scale-90"
          aria-label="Go back one folder"
        >
          <ArrowLeft size={24} />
        </button>
      </div>
    </footer>
  );
}
