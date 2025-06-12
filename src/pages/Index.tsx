import React, { useState } from 'react';
import { MapContainer } from '@/components/MapContainer';
import { ChatInterface } from '@/components/ChatInterface';
import { Header } from '@/components/Header';
import { Landmark } from '@/types/landmarks';

const Index = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [landmarkToRestoreAfterChat, setLandmarkToRestoreAfterChat] = useState<Landmark | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    console.log('Location selected:', { lat, lng });
  };

  const handleChatToggle = () => {
    console.log('Chat toggle - before:', { isChatOpen, selectedLandmark: selectedLandmark?.title, landmarkToRestoreAfterChat: landmarkToRestoreAfterChat?.title });
    
    if (!isChatOpen) {
      // Opening chat - remember current landmark to restore later and hide it
      setLandmarkToRestoreAfterChat(selectedLandmark);
      setSelectedLandmark(null);
      console.log('Opening chat - storing landmark:', selectedLandmark?.title);
    } else {
      // Closing chat - restore the landmark that should be shown
      console.log('Closing chat - restoring landmark:', landmarkToRestoreAfterChat?.title);
      setSelectedLandmark(landmarkToRestoreAfterChat);
      setLandmarkToRestoreAfterChat(null);
    }
    setIsChatOpen(!isChatOpen);
  };

  const handleLandmarkSelect = (landmark: Landmark | null) => {
    console.log('Landmark select called:', { landmark: landmark?.title, isChatOpen, currentSelected: selectedLandmark?.title });
    
    if (isChatOpen) {
      // If chat is open, update what landmark should be shown when chat closes
      console.log('Chat is open - updating landmarkToRestoreAfterChat to:', landmark?.title);
      setLandmarkToRestoreAfterChat(landmark);
    } else {
      // If chat is closed, show the landmark immediately
      console.log('Chat is closed - setting selectedLandmark to:', landmark?.title);
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
