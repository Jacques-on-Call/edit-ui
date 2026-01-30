import { h } from 'preact';
import { Menu } from 'lucide-preact';

/**
 * HamburgerTrigger - Floating hamburger button to open the vertical toolbox
 * Sits in top-left corner, floats over content
 */
export default function HamburgerTrigger({ onClick, isOpen }) {
  return (
    <button
      className="hamburger-trigger"
      onClick={onClick}
      aria-label={isOpen ? 'Close insert menu' : 'Open insert menu'}
      aria-expanded={isOpen}
      title="Insert elements"
    >
      <Menu size={24} />
    </button>
  );
}
