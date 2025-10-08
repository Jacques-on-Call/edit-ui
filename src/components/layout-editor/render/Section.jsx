import React from 'react';

export const Section = ({ children, style }) => {
  return (
    <div style={style} className="p-4 border border-dashed border-gray-400 min-h-[100px]">
      {children}
    </div>
  );
};