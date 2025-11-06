import { h } from 'preact';
import { Plus } from 'lucide-preact';

export default function LiquidGlassButton({ onClick, ariaLabel = 'Create new file or folder' }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="button"
    >
      <div className="base"></div>
      <div className="body"></div>
      <div className="surface"></div>
      <div className="icon">
        <Plus size={42} strokeWidth={3} />
      </div>
    </button>
  );
}
