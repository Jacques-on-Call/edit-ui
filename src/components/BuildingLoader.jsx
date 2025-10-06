import React from 'react';

const BuildingLoader = () => {
  // Inline styles for animation delay to create the sequential effect
  const pageStyle = (index) => ({
    animation: `flow 1.8s ease-in-out infinite`,
    animationDelay: `${index * 0.25}s`,
    transformOrigin: 'bottom left',
  });

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <svg width="100" height="100" viewBox="0 0 100 100" className="mb-4">
        <defs>
          <style>
            {`
              @keyframes flow {
                0% {
                  opacity: 0;
                  transform: translateX(-25px) translateY(25px) scale(0.7);
                }
                50% {
                  opacity: 1;
                  transform: translateX(0) translateY(0) scale(1);
                }
                100% {
                  opacity: 0;
                  transform: translateX(25px) translateY(-25px) scale(0.7);
                }
              }
            `}
          </style>
        </defs>
        <g>
          {/* Three rectangles to represent the flowing pages */}
          <rect x="30" y="40" width="50" height="40" rx="3" fill="#d1d5db" style={pageStyle(2)} />
          <rect x="25" y="35" width="50" height="40" rx="3" fill="#9ca3af" style={pageStyle(1)} />
          <rect x="20" y="30" width="50" height="40" rx="3" fill="#4b5563" style={pageStyle(0)} />
        </g>
      </svg>
      <p className="text-gray-600 font-semibold text-lg">Building Preview...</p>
      <p className="text-sm text-gray-500">This may take a few moments.</p>
    </div>
  );
};

export default BuildingLoader;