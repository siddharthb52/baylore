
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  currentLocation?: { lat: number; lng: number };
  isOpen: boolean;
  onToggle: () => void;
}

const sampleResponses = [
  "Welcome to the Bay Area! Based on your location, I'd recommend visiting the nearby Golden Gate Bridge - it's an absolute must-see with incredible views and fascinating construction history.",
  "You might enjoy exploring Fisherman's Wharf and taking a ferry to Alcatraz Island. The prison tour offers amazing insights into San Francisco's past!",
  "For a unique experience, take a ride on the historic cable cars - they've been operating since 1873 and offer a fun way to see the city's steep hills.",
  "Have you explored the Columbarium in Richmond? It's a beautiful, peaceful spot with stunning architecture that many visitors overlook.",
  "Check out the lesser-known history of Balmy Alley's murals in the Mission - they tell incredible stories of Central American culture and politics.",
  "The Wave Organ near the Marina is fascinating - this acoustic sculpture uses wave action to create music, and it's especially beautiful at sunset."
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  currentLocation, 
  isOpen, 
  onToggle 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi there! Welcome to BayLore. I'm your AI guide to Bay Area history. What would you like to explore today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const randomResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-[1000] bg-bay-blue hover:bg-bay-blue/90 text-white rounded-full w-14 h-14 shadow-lg"
        size="lg"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[1000] w-80 md:w-96">
      <Card className="bg-white border-0 shadow-2xl max-h-96 flex flex-col">
        <CardHeader className="pb-2 bg-bay-blue text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5" />
              BayLore Guide
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-white hover:bg-white/20 h-auto p-1"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-64">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-bay-blue text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about Bay Area history..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-bay-blue hover:bg-bay-blue/90"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
