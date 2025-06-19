
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark } from '@/types/landmarks';

interface LandmarkPopupProps {
  landmark: Landmark;
  onClose: () => void;
}

export const LandmarkPopup: React.FC<LandmarkPopupProps> = ({ 
  landmark, 
  onClose 
}) => {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] w-[30vw] min-w-[320px] max-w-[480px] max-h-[70vh]">
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl animate-fade-in">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base lg:text-lg text-bay-blue pr-2">{landmark.title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-auto p-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
            >
              ×
            </Button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-golden-accent/10 text-golden-accent text-xs">
              {landmark.category}
            </Badge>
            {landmark.year_built && (
              <Badge variant="outline" className="text-xs">
                Built {landmark.year_built}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 overflow-y-auto max-h-[50vh]">
          {landmark.image_url && (
            <div className="w-full h-32 sm:h-40 lg:h-48 rounded-lg overflow-hidden">
              <img 
                src={landmark.image_url} 
                alt={landmark.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{landmark.summary}</p>
          
          {landmark.architect && (
            <div className="text-xs text-gray-600">
              <strong>Architect:</strong> {landmark.architect}
            </div>
          )}
          
          {landmark.fun_facts && landmark.fun_facts.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">Fun Facts:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {landmark.fun_facts.slice(0, 2).map((fact, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-golden-accent mt-1">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
