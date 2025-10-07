import React from 'react';

export const Block = ({ children, style }) => {
  return (
    <div style={style} className="p-4 border border-dashed border-gray-400">
      {children}
    </div>
  );
};