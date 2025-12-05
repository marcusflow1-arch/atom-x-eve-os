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
      <button
        onClick={startListening}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
      </button>
      
      {searchTerm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 left-0 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl z-10 whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">Searching:</span>
            <span className="text-blue-400 font-medium">{searchTerm}</span>
            <button
              onClick={() => {
                setSearchTerm('');
                handleSearch('');
              }}
              className="w-6 h-6 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}