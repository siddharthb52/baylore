import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLandmarks } from '@/hooks/useLandmarks';
import { Landmark } from '@/types/landmarks';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapContainerProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLandmark: Landmark | null;
  onLandmarkSelect: (landmark: Landmark | null) => void;
  isChatOpen: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = ({ 
  onLocationSelect, 
  selectedLandmark, 
  onLandmarkSelect,
  isChatOpen
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [markersAdded, setMarkersAdded] = useState(false);
  
  const { data: landmarks, isLoading, error } = useLandmarks();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on SF Bay Area
    const map = L.map(mapRef.current).setView([37.7749, -122.4194], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      // Only clean up on component unmount
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Remove onLocationSelect from dependencies

  // Set up click handler separately
  useEffect(() => {
    if (!mapInstanceRef.current || !onLocationSelect) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    };

    mapInstanceRef.current.on('click', handleMapClick);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('click', handleMapClick);
      }
    };
  }, [onLocationSelect]);

  useEffect(() => {
    if (!mapInstanceRef.current || !landmarks || landmarks.length === 0 || markersAdded) return;

    // Create custom icon for historical points
    const historicalIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="bg-bay-blue rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Add landmarks to map
    landmarks.forEach(landmark => {
      const marker = L.marker([landmark.latitude, landmark.longitude], { icon: historicalIcon })
        .addTo(mapInstanceRef.current!);
      
      marker.on('click', (e) => {
        console.log('Marker clicked:', landmark.title);
        console.log('isChatOpen at marker click:', isChatOpen);
        // Stop event propagation to prevent map click
        L.DomEvent.stopPropagation(e);
        onLandmarkSelect(landmark);
      });

      markersRef.current.push(marker);
    });

    setMarkersAdded(true);
  }, [landmarks, markersAdded, onLandmarkSelect, isChatOpen]);

  if (error) {
    console.error('Error loading landmarks:', error);
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading landmarks</p>
          <p className="text-gray-500 text-sm">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />

      {isLoading && (
        <div className="absolute top-4 left-4 z-[1000]">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <p className="text-sm text-gray-600">Loading landmarks...</p>
          </div>
        </div>
      )}

      {/* Selected point popup */}
      {selectedLandmark && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] md:left-auto md:w-96">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl animate-fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg text-bay-blue">{selectedLandmark.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLandmarkSelect(null)}
                  className="h-auto p-1 text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-golden-accent/10 text-golden-accent">
                  {selectedLandmark.category}
                </Badge>
                {selectedLandmark.year_built && (
                  <Badge variant="outline" className="text-xs">
                    Built {selectedLandmark.year_built}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedLandmark.image_url && (
                <div className="w-full h-48 rounded-lg overflow-hidden">
                  <img 
                    src={selectedLandmark.image_url} 
                    alt={selectedLandmark.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <p className="text-gray-700 text-sm leading-relaxed">{selectedLandmark.summary}</p>
              
              {selectedLandmark.architect && (
                <div className="text-xs text-gray-600">
                  <strong>Architect:</strong> {selectedLandmark.architect}
                </div>
              )}
              
              {selectedLandmark.fun_facts && selectedLandmark.fun_facts.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">Fun Facts:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {selectedLandmark.fun_facts.slice(0, 2).map((fact, index) => (
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
      )}
    </div>
  );
};
