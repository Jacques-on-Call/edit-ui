import React from 'react';
import { ArrowDownTrayIcon, CloudArrowUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

function EditorHeader() {
  return (
    <header className="bg-gray-100 text-gray-600 p-2 border-b border-gray-200 w-full flex justify-between items-center">
      <div className="flex items-center space-x-2">
        {/* Placeholder for future elements like a back button or document title */}
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-gray-800"><ArrowDownTrayIcon className="h-5 w-5" /></button>
        <button className="text-gray-500 hover:text-gray-800"><CloudArrowUpIcon className="h-5 w-5" /></button>
        <button className="text-gray-500 hover:text-gray-800"><InformationCircleIcon className="h-5 w-5" /></button>
      </div>
    </header>
  );
}
export default EditorHeader;