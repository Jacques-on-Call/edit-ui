import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Home, ArrowLeft, Plus } from 'lucide-preact';
import { CreateModal } from './CreateModal';
import { LiquidGlassButton } from './LiquidGlassButton';

export function BottomToolbar() {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const handleCreateNew = () => {
    setCreateModalOpen(true);
  };

  return (
    <>
      <footer
        className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-900 to-black border-t border-blue-400"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(0, 0, 10, 0.5)', // Slightly bluer transparent fallback
        }}
      >
        <div className="flex items-center justify-between h-full px-4">
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="p-2 text-white transition-transform duration-150 ease-in-out rounded-full hover:bg-white/10 active:scale-90"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>

          {/* Create New Button */}
          <LiquidGlassButton onClick={handleCreateNew}>
            <Plus size={32} />
          </LiquidGlassButton>

          {/* Home Button */}
          <button
            onClick={() => route('/')}
            className="p-2 text-white transition-transform duration-150 ease-in-out rounded-full hover:bg-white/10 active:scale-90"
            aria-label="Go home"
          >
            <Home size={24} />
          </button>
        </div>
      </footer>
      {isCreateModalOpen && (
        <CreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
        />
      )}
    </>
  );
}
