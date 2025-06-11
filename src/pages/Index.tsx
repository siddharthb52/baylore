
import React, { useState } from 'react';
import { MapContainer } from '@/components/MapContainer';
import { ChatInterface } from '@/components/ChatInterface';
import { Header } from '@/components/Header';
import { Landmark } from '@/types/landmarks';

const Index = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [landmarkBeforeChat, setLandmarkBeforeChat] = useState<Landmark | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    console.log('Location selected:', { lat, lng });
  };

  const handleChatToggle = () => {
    if (!isChatOpen) {
      // Opening chat - remember current landmark and hide it
      setLandmarkBeforeChat(selectedLandmark);
      setSelectedLandmark(null);
    } else {
      // Closing chat - restore the landmark that was showing before chat opened
      setSelectedLandmark(landmarkBeforeChat);
      setLandmarkBeforeChat(null);
    }
    setIsChatOpen(!isChatOpen);
  };

  const handleLandmarkSelect = (landmark: Landmark | null) => {
    if (isChatOpen) {
      // If chat is open, update what landmark should be restored when chat closes
      setLandmarkBeforeChat(landmark);
    } else {
      // If chat is closed, show the landmark immediately
      setSelectedLandmark(landmark);
    }
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
        isOpen={isChatOpen}
        onToggle={handleChatToggle}
      />

      {/* Welcome overlay for first-time users. This will disappear once the user clicks the map and the current location becomes defined. */}
      {!currentLocation && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-[999] pointer-events-none">
          <div className="text-center text-white bg-black/50 p-8 rounded-lg backdrop-blur-sm pointer-events-auto max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4">Welcome to BayLore!</h2>
            <p className="text-gray-200 mb-6">
              Click anywhere on the map or tap the historical markers to discover the hidden stories of the San Francisco Bay Area.
            </p>
            <div className="text-golden-accent font-medium">
              ✨ Start exploring to uncover local history
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
