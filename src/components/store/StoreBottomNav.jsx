import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, Store, ShoppingBag, ArrowRightLeft, Mic, MicOff, Search } from 'lucide-react';

export default function StoreBottomNav({ activeTab, onTabChange, libraryActive, onLibraryToggle, onSearch }) {
  const [searchValue, setSearchValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  const handleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setSearchValue(text);
      onSearch?.(text);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  };

  const handleChange = (e) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };
  const tabs = [
    { id: 'store', label: 'Store', icon: Store },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'trading', label: 'Trading Post', icon: ArrowRightLeft },
    { id: 'overview', label: 'Overview', icon: Eye },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all border ${
              isActive
                ? 'bg-white/15 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        );
      })}

      {/* Search bar */}
      <div className="w-px h-5 bg-white/10 mx-1" />
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all ${
          libraryActive
            ? 'border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
            : 'border-white/15 bg-white/[0.06]'
        }`}
        style={{ minWidth: '220px' }}
      >
        <Search className={`w-4 h-4 flex-shrink-0 ${libraryActive ? 'text-cyan-400' : 'text-white/40'}`} />
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleChange}
          onFocus={() => { if (!libraryActive) onLibraryToggle?.(); }}
          placeholder="Search bar"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
        <button onClick={handleMic} className={`flex-shrink-0 transition-colors ${isListening ? 'text-red-400' : 'text-white/40 hover:text-white'}`}>
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}