import { h } from 'preact';
import { Plus } from 'lucide-preact';
import './LiquidGlassButton.css';

export default function LiquidGlassButton({ onClick, ariaLabel = 'Create new file or folder', children }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="liquid-btn"
    >
      <div className="orb"></div>
      {children}
    </button>
  );
}
