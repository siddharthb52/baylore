
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface MapToggleControlProps {
  useImageIcons: boolean;
  onToggle: (checked: boolean) => void;
}

export const MapToggleControl: React.FC<MapToggleControlProps> = ({ 
  useImageIcons, 
  onToggle 
}) => {
  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-700">Icons</span>
            <Switch
              checked={useImageIcons}
              onCheckedChange={onToggle}
              className="scale-75"
            />
            <span className="text-xs font-medium text-gray-700">Images</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
