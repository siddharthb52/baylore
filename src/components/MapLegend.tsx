
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Map } from 'lucide-react';

const legendItems = [
  { category: 'Golden Gate', icon: '/golden-gate.svg', label: 'Golden Gate' },
  { category: 'Prison', icon: '/cuffs.png', label: 'Prison' },
  { category: 'Winery', icon: '/grapes.png', label: 'Winery' },
  { category: 'Museum', icon: '/museum.svg', label: 'Museum' },
  { category: 'Cultural', icon: '/palace.png', label: 'Cultural Site' },
  { category: 'Nature', icon: '/trees-realistic.png', label: 'Nature/Park' },
];

const svgIcons = [
  { 
    category: 'Architecture', 
    label: 'Architecture',
    svg: 'M3 21h18V9l-9-6-9 6v12zm7-11h4v2h-4v-2zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2z',
    color: '#4F46E5'
  },
  { 
    category: 'Monument', 
    label: 'Monument',
    svg: 'M10 2l2 3v2l2-1 2 1V5l-2-3zm-6 8l6-3 6 3v2l-6-2-6 2v-2zm0 6l6-2 6 2v2l-6-2-6 2v-2z',
    color: '#6B7280'
  },
  { 
    category: 'Tech', 
    label: 'Tech Landmark',
    svg: 'M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h6v2H8v-2zm0 4h4v2H8v-2z',
    color: '#059669'
  },
  { 
    category: 'Street', 
    label: 'Street/Road',
    svg: 'M4 12h16M4 8h16M4 16h16M8 4v16M16 4v16',
    color: '#F59E0B'
  },
  { 
    category: 'Misc', 
    label: 'Miscellaneous',
    svg: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    color: '#6366F1'
  },
];

export const MapLegend: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white/100"
        >
          <Map size={16} />
          <span className="ml-2 text-xs">Legend</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] z-[1100]">
        <DialogHeader>
          <DialogTitle>Map Legend</DialogTitle>
          <DialogDescription>
            Icon categories for map landmarks
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] space-y-3">
          {/* Image-based icons */}
          {legendItems.map((item) => (
            <div key={item.category} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
              <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                <img 
                  src={item.icon} 
                  alt={item.label} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </div>
          ))}
          
          {/* SVG-based icons */}
          {svgIcons.map((item) => (
            <div key={item.category} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.color }}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d={item.svg} />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
