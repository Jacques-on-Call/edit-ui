import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Toolbox } from './Toolbox';
import Icon from '../Icon';

export const EditorHeader = ({ onSave }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-md p-2 flex items-center justify-between z-10">
      {/* Left side: Back button */}
      <button
        onClick={() => navigate('/layouts')}
        className="p-2 rounded-md hover:bg-gray-100"
        title="Back to Layouts"
      >
        <Icon name="arrow-left" className="w-6 h-6 text-gray-700" />
      </button>

      {/* Center: Toolbox */}
      <div className="flex-1 mx-4">
        <Toolbox />
      </div>

      {/* Right side: Save button */}
      <button
        onClick={onSave}
        className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
        title="Save Layout"
      >
        <Icon name="save" className="w-6 h-6" />
      </button>
    </div>
  );
};