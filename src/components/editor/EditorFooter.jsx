import React from 'react';
import { Bars3BottomLeftIcon, LinkIcon, PhotoIcon } from '@heroicons/react/24/outline';

function EditorFooter() {
  return (
    <footer className="bg-gray-100 text-gray-600 p-2 border-t border-gray-200 w-full flex justify-around items-center">
      <button className="text-gray-500 hover:text-gray-800"><Bars3BottomLeftIcon className="h-5 w-5" /></button>
      <button className="text-gray-500 hover:text-gray-800"><LinkIcon className="h-5 w-5" /></button>
      <button className="text-gray-500 hover:text-gray-800"><PhotoIcon className="h-5 w-5" /></button>
    </footer>
  );
}
export default EditorFooter;