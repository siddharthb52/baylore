import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface HistoricalPoint {
  id: string;
  title: string;
  lat: number;
  lng: number;
  summary: string;
  category: string;
  imageUrl: string;
}

const sampleHistoricalPoints: HistoricalPoint[] = [
  {
    id: '1',
    title: 'Golden Gate Bridge',
    lat: 37.8199,
    lng: -122.4783,
    summary: 'Opened in 1937, this iconic suspension bridge was once called "the bridge that couldn\'t be built" due to treacherous currents and frequent fog.',
    category: 'Architecture',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'
  },
  {
    id: '2',
    title: 'Alcatraz Island',
    lat: 37.8267,
    lng: -122.4233,
    summary: 'Former federal prison that housed infamous inmates like Al Capone. Originally a military fortification before becoming "The Rock" in 1934.',
    category: 'Prison',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
  },
  {
    id: '3',
    title: 'Lombard Street',
    lat: 37.8021,
    lng: -122.4194,
    summary: 'Known as the "crookedest street in the world," this zigzag section was created in 1922 to reduce the hill\'s natural 27% grade.',
    category: 'Street',
    imageUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop'
  },
  {
    id: '4',
    title: 'Coit Tower',
    lat: 37.8024,
    lng: -122.4058,
    summary: 'Built in 1933 with funds from Lillie Hitchcock Coit, a socialite who loved firefighters and left money to beautify San Francisco.',
    category: 'Monument',
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
  },
  {
    id: '5',
    title: 'Palace of Fine Arts',
    lat: 37.8035,
    lng: -122.4486,
    summary: 'Originally built for the 1915 Panama-Pacific Exposition, this Roman-inspired structure was the only building meant to survive the fair.',
    category: 'Architecture',
    imageUrl: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop'
  }
];

interface MapContainerProps {
  onLocationSelect?: (lat: number, lng: number) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({ onLocationSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<HistoricalPoint | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on SF Bay Area
    const map = L.map(mapRef.current).setView([37.7749, -122.4194], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

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

    // Add historical points to map
    sampleHistoricalPoints.forEach(point => {
      const marker = L.marker([point.lat, point.lng], { icon: historicalIcon })
        .addTo(map);
      
      marker.on('click', () => {
        setSelectedPoint(point);
        if (onLocationSelect) {
          onLocationSelect(point.lat, point.lng);
        }
      });
    });

    // Map click handler
    map.on('click', (e) => {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
    };
  }, [onLocationSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />

      {/* Selected point popup */}
      {selectedPoint && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] md:left-auto md:w-96">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl animate-fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg text-bay-blue">{selectedPoint.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPoint(null)}
                  className="h-auto p-1 text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>
              <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-golden-accent/10 text-golden-accent">
                {selectedPoint.category}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="w-full h-48 rounded-lg overflow-hidden">
                <img 
                  src={selectedPoint.imageUrl} 
                  alt={selectedPoint.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{selectedPoint.summary}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
