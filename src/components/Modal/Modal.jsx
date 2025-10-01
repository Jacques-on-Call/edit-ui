import React from 'react';

/**
 * A reusable modal component that provides a consistent layout and styling for pop-up dialogs.
 * It includes a backdrop overlay, a content container, a title, and an action area.
 *
 * @param {object} props
 * @param {string} props.title - The title to be displayed in the modal header.
 * @param {function} props.onClose - The function to call when the modal should be closed (e.g., clicking the overlay).
 * @param {React.ReactNode} props.children - The content to be rendered inside the modal's body.
 * @param {React.ReactNode} props.actions - The buttons or other controls to be rendered in the modal's footer.
 */
function Modal({ title, onClose, children, actions }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mt-0 mb-6 text-xl font-semibold text-gray-800">{title}</h2>

        {children}

        <div className="flex justify-end gap-4 mt-8">
          {actions}
        </div>
      </div>
    </div>
  );
}

// Add keyframes for the animations to global styles or a PostCSS file if they don't exist
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
// For Tailwind JIT, you might need to add these to your main CSS file.
// Or define them in `tailwind.config.js`. For now, we'll rely on the animation classes.

export default Modal;