import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, MicOff, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AchievementSearch({ onSearch }) {
  const [isListening, setIsListening] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recognition, setRecognition] = useState(null);

  const handleSearch = useCallback((query) => {
    onSearch(query);
  }, [onSearch]);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        handleSearch(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => setIsListening(false);
      recognitionInstance.onend = () => setIsListening(false);

      setRecognition(recognitionInstance);
    }
  }, [handleSearch]);

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  return (
    <div className="relative flex-grow min-w-[250px]">
      <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 h-12">
        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <Input
          placeholder="Search achievements..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleSearch(e.target.value);
          }}
          className="bg-transparent border-none focus:ring-0 text-white w-full"
        />
        {searchTerm && (
          <Button
            onClick={() => {
              setSearchTerm('');
              handleSearch('');
            }}
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-slate-400"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <Button
          onClick={startListening}
          size="icon"
          variant="ghost"
          className={`h-8 w-8 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-white'}`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}