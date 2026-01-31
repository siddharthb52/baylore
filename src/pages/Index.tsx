import React, { useState, lazy, Suspense, Component } from 'react';
import { Header } from '@/components/Header';
import { Landmark } from '@/types/landmarks';

const MapContainer = lazy(() => import('@/components/MapContainer').then(m => ({ default: m.MapContainer })));

class MapErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded">
          <strong>Map failed to load:</strong>
          <pre className="mt-2 text-sm overflow-auto">{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const Index = () => {
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-16 h-screen">
        <MapErrorBoundary>
          <Suspense fallback={<div className="p-4">Loading map…</div>}>
            <MapContainer
              selectedLandmark={selectedLandmark}
              onLandmarkSelect={setSelectedLandmark}
            />
          </Suspense>
        </MapErrorBoundary>
      </main>
    </div>
  );
};

export default Index;
