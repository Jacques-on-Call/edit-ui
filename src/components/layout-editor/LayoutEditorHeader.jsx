import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon';

export const LayoutEditorHeader = ({ onSave, onToggleSidebar, onToggleDebug, isDebugVisible }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-md p-2 flex justify-between items-center z-10">
      <button
        onClick={() => navigate('/layouts')}
        className="p-2 rounded-md hover:bg-gray-200"
        title="Back to Layouts"
      >
        <Icon name="arrow-left" className="w-5 h-5 text-gray-600" />
      </button>

      <h1 className="text-lg font-semibold text-gray-800">Layout Editor</h1>

      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleDebug}
          className={`p-2 rounded-md ${isDebugVisible ? 'bg-red-100 text-red-700' : 'hover:bg-gray-200'}`}
          title="Toggle Debug Panel"
        >
          <Icon name="bug" className="w-5 h-5" />
        </button>
        <button
          onClick={onSave}
          className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          title="Save Layout"
        >
          <Icon name="save" className="w-5 h-5" />
        </button>
        {/* This button will only be shown on mobile/tablet to toggle the sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-gray-200 md:hidden"
          title="Toggle Tools"
        >
          <Icon name="settings" className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
};