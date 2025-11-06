import { h } from 'preact';
import { Plus } from 'lucide-preact';

/**
 * Glass-like, thick Create button with lime offset layer.
 * Props:
 * - onClick: function
 * - label: string (default: 'Create')
 * - ariaLabel: string for accessibility
 */
export default function CreateButton({ onClick, label = 'Create', ariaLabel = 'Create new file' }) {
  return (
    <div className="relative inline-block">
      {/* offset layer (lime) is produced by CSS pseudo or the .create-btn-offset element */}
      <div className="create-btn-offset rounded-2xl pointer-events-none" aria-hidden="true"></div>

      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className="create-btn relative flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-semibold focus:outline-none focus:ring-4 focus:ring-white/20 transition-transform duration-150"
      >
        <span className="create-btn-icon flex items-center justify-center w-8 h-8 rounded-lg bg-white/10">
          <Plus className="w-4 h-4 text-white" />
        </span>
        <span className="hidden sm:inline">{label}</span>
      </button>
    </div>
  );
}
