import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { MapContainer } from '@/components/MapContainer';
import { ChatInterface } from '@/components/ChatInterface';
import { Header } from '@/components/Header';
import { Landmark } from '@/types/landmarks';

const Index = () => {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | undefined>();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
  };

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleLandmarkSelect = (landmark: Landmark | null) => {
    setSelectedLandmark(landmark);
  };

  const handleOverlayClick = () => {
    setCurrentLocation({ lat: 37.3745, lng: -122.0025 });
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <Header />

      <main className="pt-16 h-screen">
        <MapContainer
          onLocationSelect={handleLocationSelect}
          selectedLandmark={selectedLandmark}
          onLandmarkSelect={handleLandmarkSelect}
        />
      </main>

      <ChatInterface
        currentLocation={currentLocation}
        selectedLandmark={selectedLandmark}
        isOpen={isChatOpen}
        onToggle={handleChatToggle}
      />

      {!currentLocation && (
        <div
          className="absolute inset-0 bg-black/20 flex items-center justify-center z-[999] cursor-pointer"
          onClick={handleOverlayClick}
        >
          <div
            className="text-center text-white bg-black/50 p-8 rounded-lg backdrop-blur-sm max-w-md mx-4"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            <h2 className="text-3xl font-bold mb-4 tracking-wide">Welcome to BayLore!</h2>
            <div className="text-golden-accent font-medium flex items-center justify-center gap-2">
              <Globe className="h-5 w-5" aria-hidden="true" />
              <span>Click anywhere to start exploring local history</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
