import React from 'react';
import { useNavigate } from 'react-router-dom';

function TopToolbar({ onSave, templateName }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between p-2 border-b bg-gray-50">
      <button 
        onClick={() => navigate('/layouts')} 
        title="Back to Layouts"
        className="px-4 py-2 font-semibold text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300"
      >
        ⤴️ Back
      </button>
      <span className="font-semibold">{templateName || 'Layout Editor'}</span>
      <button 
        onClick={onSave} 
        title="Save Layout"
        className="px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600"
      >
        💾 Save
      </button>
    </div>
  );
}

export default TopToolbar;