import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Store, ShoppingBag, ArrowRightLeft, Mic, MicOff, Search } from 'lucide-react';

export default function StoreBottomNav({ activeTab, onTabChange, libraryActive, onLibraryToggle, onSearch, activeFilters, onFilterChange }) {
  const [searchValue, setSearchValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

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

  const handleClose = () => {
    inputRef.current?.blur();
    if (libraryActive) onLibraryToggle?.();
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [libraryActive]);
  const tabs = [
    { id: 'store', label: 'Store', icon: Store },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'trading', label: 'Trading Post', icon: ArrowRightLeft },
    { id: 'overview', label: 'Overview', icon: Eye },
  ];

  const isDevCardActive = activeTab === 'devcards';

  return (
    <div className="flex items-center justify-center gap-2 relative">
      {tabs.slice(0, 2).map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
              isActive ? 'text-white' : 'text-white/50 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="store-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </motion.button>
        );
      })}

      {/* Dev Cards — inline tab on the nav line */}
      <motion.button
        onClick={() => onTabChange('devcards')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className={`relative px-4 py-2 text-sm font-black uppercase tracking-wider transition-all ${
          isDevCardActive ? 'text-amber-300' : 'text-amber-500/60 hover:text-amber-300'
        }`}
      >
        Dev Cards
        {isDevCardActive && (
          <motion.div
            layoutId="store-tab-underline"
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400 rounded-full"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
      </motion.button>

      {tabs.slice(2).map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
              isActive ? 'text-white' : 'text-white/50 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="store-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </motion.button>
        );
      })}

      {/* Search bar */}
      <div className="w-px h-5 bg-white/10 mx-1" />
      <div
        ref={containerRef}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
          libraryActive
            ? 'border-white/10 bg-transparent shadow-none'
            : 'border-transparent bg-transparent'
        }`}
        style={{ minWidth: '220px' }}
      >
        <Search className="w-4 h-4 flex-shrink-0 text-white/30" />
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