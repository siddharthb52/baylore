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
}

// Function to get icon based on category
const getIconForCategory = (category: string) => {
  const getIconHtml = (iconPath: string, bgColor: string) => `
    <div class="rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white" style="background-color: ${bgColor}">
      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
        ${iconPath}
      </svg>
    </div>
  `;

  console.log('Processing category:', category);
  
  // Golden Gate - Use Golden Gate SVG (exact match with space)
  if (category === 'Golden Gate') {
    console.log('Matched Golden Gate category, using golden-gate.svg');
    return L.icon({
      iconUrl: '/golden-gate.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  }
  
  // Prison - Lock/Shield icon
  if (category.toLowerCase().includes('prison')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M6 10a2 2 0 114 0v1h4V10a6 6 0 10-12 0v1h4v-1zm0 4v7h4v-7H6zm8 0v7h4v-7h-4z"/>',
        '#DC2626'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Architecture - Building icon
  if (category.toLowerCase().includes('architecture')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M3 21h18V9l-9-6-9 6v12zm7-11h4v2h-4v-2zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2z"/>',
        '#4F46E5'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Museum - Classical building icon
  if (category.toLowerCase().includes('museum')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M2 20h20v2H2v-2zm2-8h16l-8-6-8 6zm2 2v6h2v-6H6zm4 0v6h2v-6h-4zm0 4h6v2H8v-2zm0 4h4v2H8v-2z"/>',
        '#7C3AED'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Monument - Tower/Obelisk icon
  if (category.toLowerCase().includes('monument')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M10 2l2 2v16l-2 2h4l-2-2V4l2-2h-4zm-2 18h8v2H8v-2z"/>',
        '#6B7280'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Cultural Site - Pagoda/Temple icon
  if (category.toLowerCase().includes('cultural')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M12 2l-2 3v2l2-1 2 1V5l-2-3zm-6 8l6-3 6 3v2l-6-2-6 2v-2zm0 6l6-2 6 2v2l-6-2-6 2v-2z"/>',
        '#EC4899'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Tech Landmark - Computer/Chip icon
  if (category.toLowerCase().includes('tech')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h6v2H8v-2zm0 4h4v2H8v-2z"/>',
        '#059669'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Nature Preserve - Custom trees SVG
  if (category.toLowerCase().includes('nature') || category.toLowerCase().includes('preserve')) {
    return L.icon({
      iconUrl: '/trees.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  }
  
  // Street - Road icon
  if (category.toLowerCase().includes('street') || category.toLowerCase().includes('road')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M4 12h16M4 8h16M4 16h16M8 4v16M16 4v16"/>',
        '#F59E0B'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Misc. - General location pin
  if (category.toLowerCase().includes('misc')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>',
        '#6366F1'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Default icon for unmatched categories
  return L.divIcon({
    className: 'custom-marker',
    html: getIconHtml(
      '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>',
      '#6366F1'
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

export const MapContainer: React.FC<MapContainerProps> = ({ 
  onLocationSelect, 
  selectedLandmark, 
  onLandmarkSelect
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

  // Simplified marker click event handling
  useEffect(() => {
    if (!markersAdded || markersRef.current.length === 0) return;

    // Remove existing click handlers
    markersRef.current.forEach(marker => {
      marker.off('click');
    });

    // Add fresh click handlers
    markersRef.current.forEach(marker => {
      marker.on('click', (e) => {
        const landmark = (marker as any).landmarkData;
        console.log('Marker clicked:', landmark.title);
        // Stop event propagation to prevent map click
        L.DomEvent.stopPropagation(e);
        onLandmarkSelect(landmark);
      });
    });
  }, [markersAdded, onLandmarkSelect]);

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

      {/* Selected point popup - moved to top-right */}
      {selectedLandmark && (
        <div className="absolute top-4 right-4 z-[1000] w-80 md:w-96">
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
