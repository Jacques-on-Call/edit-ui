import React from 'react';

function BottomToolbar() {
  return (
    <footer className="bg-light-grey px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] flex justify-center items-center border-t w-full">
      <p className="text-sm text-gray-500">Draft saved locally.</p>
    </footer>
  );
}

export default BottomToolbar;