import React, { useState, useRef, useEffect } from 'react';
import { Search, Mic, MicOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Compact search bar with voice-to-text for the Trading Post sub-nav.
export default function TradingPostSearchBar({ value, onChange, placeholder = 'Search games...' }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => {
        onChange(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, [onChange]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 transition-all focus-within:border-cyan-400/40 focus-within:bg-white/[0.08]">
      <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none text-white placeholder:text-white/40 text-xs font-medium w-40 lg:w-56"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange('')}
            className="text-white/30 hover:text-white/70 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
      <button
        onClick={toggleListening}
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
          isListening
            ? 'bg-red-500/30 text-red-400 animate-pulse'
            : 'text-white/40 hover:text-cyan-300 hover:bg-white/5'
        }`}
        title={isListening ? 'Stop listening' : 'Search with voice'}
      >
        {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
      </button>
    </div>
  );
}