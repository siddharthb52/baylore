
import React from 'react';

export const MapCompass: React.FC = () => {
  return (
    <div className="absolute top-20 left-4 z-[1000]">
      <img 
        src="/compass.png" 
        alt="Compass" 
        className="w-20 h-20 object-contain"
      />
    </div>
  );
};
