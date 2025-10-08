import React from 'react';

export const Hero = ({ title, subtitle, style }) => {
  return (
    <div
      style={style}
      className="w-full text-center py-20 px-4"
    >
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
        {title}
      </h1>
      <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
        {subtitle}
      </p>
    </div>
  );
};