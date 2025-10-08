import React from 'react';
import Icon from '../../Icon';

export const BoundInput = ({ label, value, onChange, onBind, as = 'input', ...props }) => {
  const InputComponent = as;

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <InputComponent
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
          {...props}
        />
        <button
          onClick={onBind}
          className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-400 hover:text-blue-500 transition-colors"
          title="Bind to a data source"
        >
          <Icon name="link" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};