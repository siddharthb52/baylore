
import React from 'react';
import { Button } from '@/components/ui/button';
import { MapIcon, Users, User } from 'lucide-react';

interface HeaderProps {
  userType: 'visitor' | 'local';
  onUserTypeChange: (type: 'visitor' | 'local') => void;
}

export const Header: React.FC<HeaderProps> = ({ userType, onUserTypeChange }) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-bay-blue rounded-lg flex items-center justify-center">
              <MapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-bay-blue">BayLore</h1>
              <p className="text-xs text-gray-600">Explore Hidden History</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:block">I am a:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={userType === 'visitor' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUserTypeChange('visitor')}
                className={`text-xs ${
                  userType === 'visitor' 
                    ? 'bg-bay-blue text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Users className="w-3 h-3 mr-1" />
                Visitor
              </Button>
              <Button
                variant={userType === 'local' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUserTypeChange('local')}
                className={`text-xs ${
                  userType === 'local' 
                    ? 'bg-bay-blue text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <User className="w-3 h-3 mr-1" />
                Local
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
