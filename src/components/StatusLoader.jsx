import React from 'react';

const StatusLoader = ({ status = 'building' }) => {
  const isBuilding = status === 'building';

  const pageStyle = (index) => ({
    animation: isBuilding ? `flow 1.8s ease-in-out infinite` : 'none',
    animationDelay: `${index * 0.25}s`,
    transformOrigin: 'bottom left',
  });

  const buildingContent = (
    <>
      <p className="text-gray-600 font-semibold text-lg">Building Preview...</p>
      <p className="text-sm text-gray-500">This may take a few moments.</p>
    </>
  );

  const errorContent = (
    <>
      <p className="text-red-600 font-semibold text-lg">Build Failed</p>
      <p className="text-sm text-red-500">The preview could not be generated.</p>
    </>
  );

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
          <rect x="30" y="40" width="50" height="40" rx="3" fill={isBuilding ? "#d1d5db" : "#fca5a5"} style={pageStyle(2)} />
          <rect x="25" y="35" width="50" height="40" rx="3" fill={isBuilding ? "#9ca3af" : "#f87171"} style={pageStyle(1)} />
          <rect x="20" y="30" width="50" height="40" rx="3" fill={isBuilding ? "#4b5563" : "#ef4444"} style={pageStyle(0)} />
        </g>
      </svg>
      {isBuilding ? buildingContent : errorContent}
    </div>
  );
};

export default StatusLoader;