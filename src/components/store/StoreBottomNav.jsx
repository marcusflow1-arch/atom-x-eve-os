import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, Mic, MicOff, Search, Sparkles, Clock, Trophy, Flame, Gem, Settings, ChevronUp } from 'lucide-react';
import { createPageUrl } from '@/utils';
import ViewModeToggle from '@/components/mobile/ViewModeToggle';
import CategoryFloatingMenu from './CategoryFloatingMenu';

const CATEGORY_LABELS = {
  new_releases: 'New Release',
  recommended: 'Recommended',
  hidden_gems: 'Hidden Gems',
  trending: 'Trending',
  top_rated: 'Top Rated',
};


export default function StoreBottomNav({ activeTab, onTabChange, libraryActive, onLibraryToggle, onSearch, activeFilters, onFilterChange, showDevLabel = false, activeCategory, onCategoryChange }) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
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

      {/* ── LEFT: Category trigger button ── */}
      <div className="flex items-center gap-5 flex-1">
        <motion.button
          onClick={() => setCatMenuOpen(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
            activeCategory
              ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20'
              : 'text-white/45 hover:text-white bg-white/[0.04] border border-white/10 hover:border-white/20'
          }`}
        >
          <span>{activeCategory ? CATEGORY_LABELS[activeCategory] : 'Categories'}</span>
          <ChevronUp className={`w-3.5 h-3.5 ${catMenuOpen ? 'rotate-180' : ''} transition-transform`} />
        </motion.button>
      </div>

      {/* Floating Category Menu — slides up from the bottom header */}
      <CategoryFloatingMenu
        isOpen={catMenuOpen}
        onClose={() => setCatMenuOpen(false)}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
      />

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

      {/* ── RIGHT: Trading Post + Dev Cards (close to center divider) + Search (far right) ── */}
      <div className="flex items-center flex-1">
        {/* Trading Post & Dev Cards — immediately after the center divider */}
        <div className="flex items-center gap-4">
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
        </div>

        {/* Spacer pushes the controls to the far right */}
        <div className="flex-1" />

        {/* Far right — view-mode toggle + settings gear */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <ViewModeToggle />
          <button
            onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=settings')}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
            style={{
              background: 'rgba(10, 14, 20, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>
      </div>
    </div>
  );
}