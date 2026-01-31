
import React from 'react';
import { MapIcon } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] bg-bay-blue border-b border-bay-blue/80">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <MapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BayLore</h1>
              <p className="text-xs text-white/90">Explore Hidden History</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
