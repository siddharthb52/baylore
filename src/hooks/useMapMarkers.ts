
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Landmark } from '@/types/landmarks';
import { getImageIcon, getIconForCategory } from '@/utils/mapIcons';

interface UseMapMarkersProps {
  map: L.Map | null;
  landmarks: Landmark[] | undefined;
  useImageIcons: boolean;
  onLandmarkSelect: (landmark: Landmark | null) => void;
}

export const useMapMarkers = ({ map, landmarks, useImageIcons, onLandmarkSelect }: UseMapMarkersProps) => {
  const markersRef = useRef<L.Marker[]>([]);
  const [markersAdded, setMarkersAdded] = useState(false);

  // Updated markers effect to handle icon toggle
  useEffect(() => {
    if (!map || !landmarks || landmarks.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add landmarks to map with appropriate icons
    landmarks.forEach(landmark => {
      const icon = useImageIcons ? getImageIcon(landmark) : getIconForCategory(landmark.category);
      const marker = L.marker([landmark.latitude, landmark.longitude], { icon })
        .addTo(map);
      
      // Store landmark data on the marker for later use
      (marker as any).landmarkData = landmark;
      markersRef.current.push(marker);
    });

    setMarkersAdded(true);
  }, [map, landmarks, useImageIcons]);

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

  return { markersRef };
};
