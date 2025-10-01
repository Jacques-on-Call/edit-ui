import React from 'react';
import { ArrowDownTrayIcon, CloudArrowUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

function EditorHeader() {
  return (
    <header className="bg-blue text-white p-4 w-full flex justify-between items-center">
      <div className="flex items-center space-x-4"></div>
      <div className="flex items-center space-x-6">
        <button className="text-white hover:text-gray-200"><ArrowDownTrayIcon className="h-6 w-6" /></button>
        <button className="text-white hover:text-gray-200"><CloudArrowUpIcon className="h-6 w-6" /></button>
        <button className="text-white hover:text-gray-200"><InformationCircleIcon className="h-6 w-6" /></button>
      </div>
    </header>
  );
}
export default EditorHeader;