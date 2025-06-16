import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      console.log('Calling bay-area-chat function...');
      const { data, error } = await supabase.functions.invoke('bay-area-chat', {
        body: {
          message: inputValue,
          currentLocation: currentLocation
        }
      });

      if (error) {
        throw error;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling AI:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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
        className="fixed bottom-6 right-6 z-[1000] bg-bay-blue hover:bg-bay-blue/90 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-lg"
        size="lg"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-2 right-4 z-[1000] w-[25vw] min-w-[300px] max-w-[400px] max-h-[calc(100vh-1rem)]">
      <Card className="bg-white border-0 shadow-2xl flex flex-col h-full">
        <CardHeader className="pb-2 bg-bay-blue text-white rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm lg:text-base flex items-center gap-2">
              <Bot className="w-4 h-4 lg:w-5 lg:h-5" />
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
        
        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-3 lg:p-4 space-y-2 lg:space-y-3 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-2 lg:p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-bay-blue text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-1 lg:gap-2">
                    {message.type === 'bot' && <Bot className="w-3 h-3 lg:w-4 lg:h-4 mt-0.5 flex-shrink-0" />}
                    {message.type === 'user' && <User className="w-3 h-3 lg:w-4 lg:h-4 mt-0.5 flex-shrink-0" />}
                    <p className="text-xs lg:text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-2 lg:p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3 h-3 lg:w-4 lg:h-4" />
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 lg:p-4 border-t bg-gray-50 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about Bay Area history..."
                className="flex-1 text-xs lg:text-sm"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-bay-blue hover:bg-bay-blue/90 flex-shrink-0"
                size="sm"
              >
                <Send className="w-3 h-3 lg:w-4 lg:h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
