import React from 'react';

const Toolbox = ({ isOpen, onClose, onAddComponent, componentTypes, targetParentId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Component</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl font-bold">×</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(componentTypes).map(([type, def]) => {
            const Icon = def.icon;
            return (
              <button
                key={type}
                onClick={() => onAddComponent(targetParentId, type)}
                className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Icon className="w-8 h-8 text-gray-700" />
                <span className="text-sm font-medium text-gray-800">{def.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Toolbox;