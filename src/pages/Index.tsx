
import React, { useState } from 'react';
import { MapContainer } from '@/components/MapContainer';
import { ChatInterface } from '@/components/ChatInterface';
import { Header } from '@/components/Header';

const Index = () => {
  const [userType, setUserType] = useState<'visitor' | 'local'>('visitor');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLocationSelect = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    console.log('Location selected:', { lat, lng });
  };

  const handleUserTypeChange = (type: 'visitor' | 'local') => {
    setUserType(type);
    console.log('User type changed to:', type);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <Header userType={userType} onUserTypeChange={handleUserTypeChange} />
      
      <main className="pt-16 h-screen">
        <MapContainer 
          onLocationSelect={handleLocationSelect}
          userType={userType}
        />
      </main>

      <ChatInterface
        userType={userType}
        currentLocation={currentLocation}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Welcome overlay for first-time users */}
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
