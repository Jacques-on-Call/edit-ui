import React from 'react';

export const Footer = ({ text, style }) => {
  return (
    <footer style={style} className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} {text}
          </p>
        </div>
      </div>
    </footer>
  );
};