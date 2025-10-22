import React, { useEffect, useRef } from 'react';

export default function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);

  // Close the menu if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="absolute bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
      style={{ top: y, left: x }}
    >
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => {
                item.action();
                onClose();
              }}
              className={`w-full text-left px-4 py-2 text-sm ${
                item.isDestructive ? 'text-red-600' : 'text-gray-700'
              } hover:bg-gray-100`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
