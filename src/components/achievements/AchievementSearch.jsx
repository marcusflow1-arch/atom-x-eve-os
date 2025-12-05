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
    <div className="relative">
      <Button
        onClick={startListening}
        size="lg"
        className={`rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isListening ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
        {isListening ? 'Listening...' : 'Voice Search'}
      </Button>
      
      {searchTerm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 left-0 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl z-10"
        >
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">Searching for:</span>
            <span className="text-blue-400 font-medium">{searchTerm}</span>
            <Button
              onClick={() => {
                setSearchTerm('');
                handleSearch('');
              }}
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}