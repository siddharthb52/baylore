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

// Function to get icon based on category
const getIconForCategory = (category: string) => {
  const getIconHtml = (iconPath: string, bgColor: string) => `
    <div class="rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white" style="background-color: ${bgColor}">
      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
        ${iconPath}
      </svg>
    </div>
  `;

  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('bridge')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path fill-rule="evenodd" d="M2 10a8 8 0 018-8 8 8 0 018 8 8 8 0 01-8 8 8 8 0 01-8-8zm4-2a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />',
        '#4F46E5'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  if (categoryLower.includes('building') || categoryLower.includes('architecture')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>',
        '#059669'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  if (categoryLower.includes('park') || categoryLower.includes('garden')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />',
        '#10B981'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  if (categoryLower.includes('street') || categoryLower.includes('road')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />',
        '#DC2626'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  if (categoryLower.includes('museum') || categoryLower.includes('gallery')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
        '#7C3AED'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Default icon for unmatched categories
  return L.divIcon({
    className: 'custom-marker',
    html: getIconHtml(
      '<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />',
      '#6366F1'
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

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

    // Add landmarks to map with category-specific icons
    landmarks.forEach(landmark => {
      const categoryIcon = getIconForCategory(landmark.category);
      const marker = L.marker([landmark.latitude, landmark.longitude], { icon: categoryIcon })
        .addTo(mapInstanceRef.current!);
      
      // Store landmark data on the marker for later use
      (marker as any).landmarkData = landmark;
      markersRef.current.push(marker);
    });

    setMarkersAdded(true);
  }, [landmarks, markersAdded]);

  // Separate effect to handle marker click events with current isChatOpen state
  useEffect(() => {
    if (!markersAdded || markersRef.current.length === 0) return;

    // Remove existing click handlers
    markersRef.current.forEach(marker => {
      marker.off('click');
    });

    // Add fresh click handlers with current state
    markersRef.current.forEach(marker => {
      marker.on('click', (e) => {
        const landmark = (marker as any).landmarkData;
        console.log('Marker clicked:', landmark.title);
        console.log('isChatOpen at marker click:', isChatOpen);
        // Stop event propagation to prevent map click
        L.DomEvent.stopPropagation(e);
        onLandmarkSelect(landmark);
      });
    });
  }, [markersAdded, isChatOpen, onLandmarkSelect]);

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
