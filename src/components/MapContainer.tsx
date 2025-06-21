
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLandmarks } from '@/hooks/useLandmarks';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { MapToggleControl } from '@/components/MapToggleControl';
import { LandmarkPopup } from '@/components/LandmarkPopup';
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

export const MapContainer: React.FC<MapContainerProps> = ({ 
  onLocationSelect, 
  selectedLandmark, 
  onLandmarkSelect
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [useImageIcons, setUseImageIcons] = useState(false);
  
  const { data: landmarks, isLoading, error } = useLandmarks();

  // Initialize map markers using the custom hook
  const { markersRef } = useMapMarkers({
    map: mapInstanceRef.current,
    landmarks,
    useImageIcons,
    onLandmarkSelect
  });

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on SF Bay Area with lower zoom level
    const map = L.map(mapRef.current, {
      minZoom: 8,
      maxZoom: 18,
      zoomControl: true,
    }).setView([37.3745, -122.0025], 9);

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

      <MapToggleControl 
        useImageIcons={useImageIcons}
        onToggle={setUseImageIcons}
      />

      {selectedLandmark && (
        <LandmarkPopup 
          landmark={selectedLandmark}
          onClose={() => onLandmarkSelect(null)}
        />
      )}
    </div>
  );
};
