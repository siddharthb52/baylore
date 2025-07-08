
import React from 'react';
import { Compass } from 'lucide-react';

export const MapCompass: React.FC = () => {
  return (
    <div className="absolute top-4 left-4 z-[1000]">
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg">
        <div className="relative">
          <Compass size={20} className="text-gray-600" />
          {/* Red tip for north */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-l-transparent border-r-transparent border-b-red-500" />
        </div>
      </div>
    </div>
  );
};
