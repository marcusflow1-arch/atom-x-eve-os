import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff, X } from 'lucide-react';

export default function DevSearchBar({ searchTerm, onSearchChange }) {
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
        const result = event.results[0][0].transcript;
        onSearchChange(result);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [onSearchChange]);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 w-64 hover:bg-white/[0.07] focus-within:bg-white/[0.08] focus-within:border-white/20 transition-all">
      <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={isListening ? 'Listening...' : 'Search games & cards...'}
        className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30 w-full font-medium"
      />
      {searchTerm && (
        <button onClick={() => onSearchChange('')} className="text-white/40 hover:text-white flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={toggleVoice}
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
        }`}
      >
        {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}