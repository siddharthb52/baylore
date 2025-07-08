
import React from 'react';

export const MapCompass: React.FC = () => {
  return (
    <div className="absolute top-20 left-4 z-[1000]">
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg">
        <div className="relative w-6 h-6">
          <img 
            src="/compass.png" 
            alt="Compass" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};
