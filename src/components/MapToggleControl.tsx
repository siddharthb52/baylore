
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MapPin, Image } from 'lucide-react';
import { MapLegend } from '@/components/MapLegend';

interface MapToggleControlProps {
  useImageIcons: boolean;
  onToggle: (checked: boolean) => void;
}

export const MapToggleControl: React.FC<MapToggleControlProps> = ({ 
  useImageIcons, 
  onToggle 
}) => {
  return (
    <div className="absolute top-4 right-4 z-[1000] space-y-3">
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800 text-center">
              Marker Style
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <MapPin size={14} />
                <span>Category</span>
              </div>
              <Switch
                checked={useImageIcons}
                onCheckedChange={onToggle}
                className="scale-90"
              />
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <Image size={14} />
                <span>Photos</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <MapLegend />
    </div>
  );
};
