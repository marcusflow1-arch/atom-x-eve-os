import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Mic, MicOff, Search, Sparkles, Clock, Trophy, Flame, Gem } from 'lucide-react';

const CATEGORY_PILLS = [
  { id: 'new_releases', label: 'New Release', icon: Clock },
  { id: 'recommended', label: 'Recommended', icon: Sparkles },
  { id: 'hidden_gems', label: 'Hidden Gems', icon: Gem },
  { id: 'trending', label: 'Trendy', icon: Flame },
  { id: 'top_rated', label: 'Top Rated', icon: Trophy },
];


export default function StoreBottomNav({ activeTab, onTabChange, libraryActive, onLibraryToggle, onSearch, activeFilters, onFilterChange, showDevLabel = false, activeCategory, onCategoryChange }) {
  const [searchValue, setSearchValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  const handleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => { const text = e.results[0][0].transcript; setSearchValue(text); onSearch?.(text); };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  };

  const handleChange = (e) => { setSearchValue(e.target.value); onSearch?.(e.target.value); };

  const isDevCardActive = activeTab === 'devcards';
  const isStoreActive = activeTab === 'store';
  const isTradingActive = activeTab === 'trading';

  return (
    <div className="flex items-center w-full relative">

      {/* ── LEFT: Category pills, flush left, no button styling ── */}
      <div className="flex items-center gap-5 flex-1">
        {CATEGORY_PILLS.map(({ id, label, icon: Icon }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              onClick={() => onCategoryChange?.(isActive ? null : id)}
              className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                isActive ? 'text-cyan-300' : 'text-white/45 hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : ''}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── CENTER: Divider | Store | Divider ── */}
      <div className="flex items-center flex-shrink-0">
        {/* Left divider */}
        <div className="w-px h-5 bg-white/20 mx-4" />

        <motion.button
          onClick={() => onTabChange('store')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className={`relative px-5 py-1.5 text-sm font-black uppercase tracking-wider transition-all ${
            isStoreActive ? 'text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          Store
          {isStoreActive && (
            <motion.div
              layoutId="store-tab-underline"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </motion.button>

        {/* Right divider */}
        <div className="w-px h-5 bg-white/20 mx-4" />
      </div>

      {/* ── RIGHT: Trading Post + Dev Cards + Search ── */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        <motion.button
          onClick={() => onTabChange('trading')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className={`relative text-[11px] font-bold uppercase tracking-wider transition-all ${
            isTradingActive ? 'text-white' : 'text-white/45 hover:text-white'
          }`}
        >
          Trading Post
          {isTradingActive && (
            <motion.div layoutId="store-tab-underline" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-blue-500 rounded-full" initial={false} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
          )}
        </motion.button>

        <motion.button
          onClick={() => onTabChange('devcards')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className={`relative text-[11px] font-black uppercase tracking-wider transition-all ${
            isDevCardActive ? 'text-amber-300' : 'text-amber-500/50 hover:text-amber-300'
          }`}
        >
          Dev Cards
          {isDevCardActive && (
            <motion.div layoutId="store-tab-underline" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-amber-400 rounded-full" initial={false} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
          )}
        </motion.button>

        {/* Search */}
        <div className="w-px h-4 bg-white/10 mx-1" />
        <div className="flex items-center gap-2 min-w-[180px]">
          <Search className="w-3.5 h-3.5 flex-shrink-0 text-white/30" />
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
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}