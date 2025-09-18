import React from 'react';
import './FAB.css';

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const FAB = ({ onClick }) => {
  return (
    <button className="fab" onClick={onClick} aria-label="Create new file or folder">
      <PlusIcon />
    </button>
  );
};

export default FAB;
