
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] bg-bay-blue border-b border-bay-blue/80">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-sm overflow-hidden border border-white/50 shrink-0">
            <img
              src="/bay-sym.png"
              alt="BayLore symbol"
              className="w-full h-full object-cover block"
            />
          </div>
            <div>
            <h1
              className="text-4xl font-bold text-white tracking-wide leading-none underline decoration-white/80 decoration-2 underline-offset-4"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              BayLore
            </h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
