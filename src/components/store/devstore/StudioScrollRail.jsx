import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Mic, MicOff, X } from 'lucide-react';

const ACCENT_DOT = {
  cyan: 'bg-cyan-400',
  orange: 'bg-orange-400',
  purple: 'bg-purple-400',
  blue: 'bg-blue-400',
  red: 'bg-red-400',
  green: 'bg-green-400',
};

const ACCENT_GLOW = {
  cyan: 'shadow-[0_0_20px_rgba(34,211,238,0.6)]',
  orange: 'shadow-[0_0_20px_rgba(251,146,60,0.6)]',
  purple: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
  blue: 'shadow-[0_0_20px_rgba(96,165,250,0.6)]',
  red: 'shadow-[0_0_20px_rgba(248,113,113,0.6)]',
  green: 'shadow-[0_0_20px_rgba(74,222,128,0.6)]',
};

const ACCENT_BORDER = {
  cyan: 'border-cyan-400/40',
  orange: 'border-orange-400/40',
  purple: 'border-purple-400/40',
  blue: 'border-blue-400/40',
  red: 'border-red-400/40',
  green: 'border-green-400/40',
};

const ACCENT_TEXT = {
  cyan: 'text-cyan-400',
  orange: 'text-orange-400',
  purple: 'text-purple-400',
  blue: 'text-blue-400',
  red: 'text-red-400',
  green: 'text-green-400',
};

const ITEM_HEIGHT = 76;

export default function StudioScrollRail({ studios, activeIndex, onSelect }) {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const [search, setSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) setContainerHeight(containerRef.current.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Init speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setSearch(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        setIsListening(false);
      }
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    return () => { try { rec.abort(); } catch {} };
  }, []);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSearch('');
      setIsListening(true);
      try { recognitionRef.current.start(); } catch {}
    }
  }, [isListening]);

  // Filter studios by search query (affects only this rail)
  const displayStudios = useMemo(() => {
    if (!search.trim()) return studios;
    const q = search.toLowerCase();
    return studios.filter(
      (s) => s.name.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q)
    );
  }, [studios, search]);

  // Map the parent's activeIndex to the filtered list
  const activeStudio = studios[activeIndex];
  const filteredActiveIndex = displayStudios.findIndex((s) => s.id === activeStudio?.id);
  const effectiveActiveIndex = filteredActiveIndex >= 0 ? filteredActiveIndex : 0;

  // Translate so the active item is centered
  const translateY = containerHeight / 2 - ITEM_HEIGHT / 2 - effectiveActiveIndex * ITEM_HEIGHT;

  // When clicking a studio in the filtered list, find its original index
  const handleSelect = useCallback(
    (studioId) => {
      const originalIdx = studios.findIndex((s) => s.id === studioId);
      if (originalIdx >= 0) onSelect(originalIdx);
    },
    [studios, onSelect]
  );

  return (
    <div className="w-60 flex-shrink-0 h-full flex flex-col border-r border-white/[0.06]"
      style={{ background: 'rgba(8, 12, 18, 0.35)' }}
    >
      {/* Label + count */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Studios A–Z</p>
          <p className="text-[9px] text-white/20">{displayStudios.length}{search.trim() ? `/${studios.length}` : ''} total</p>
        </div>

        {/* Search bar — filters only this cross-scroll rail */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search studio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-16 py-1.5 bg-white/[0.04] border border-white/10 rounded-lg text-white text-xs placeholder-white/40 focus:outline-none focus:border-amber-400/40 transition-all"
          />
          {search && !isListening && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
          <button
            onClick={toggleVoice}
            title={isListening ? 'Stop listening' : 'Voice search'}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500/30 border border-red-400/40 text-red-300 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
          </button>
        </div>

        {isListening && (
          <div className="flex items-center gap-1.5 mt-1.5 px-1">
            <div className="flex gap-0.5 items-end h-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ height: [3, 8, 3] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  className="w-0.5 bg-red-400 rounded-full"
                />
              ))}
            </div>
            <span className="text-[9px] text-red-300/70">Listening...</span>
          </div>
        )}
      </div>

      {/* Cross-scroll area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {/* Center highlight band */}
        <div
          className="absolute left-2 right-2 pointer-events-none rounded-xl"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            height: ITEM_HEIGHT,
            background: 'rgba(255,255,255,0.04)',
            borderTop: '1px solid rgba(255,255,255,0.10)',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
          }}
        />

        {/* Top & bottom fade gradients */}
        <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, rgba(8,12,18,0.95), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, rgba(8,12,18,0.95), transparent)' }} />

        {/* Items */}
        {displayStudios.length > 0 ? (
          <div
            className="absolute left-0 right-0"
            style={{
              transform: `translateY(${translateY}px)`,
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {displayStudios.map((studio, idx) => {
              const distance = Math.abs(idx - effectiveActiveIndex);
              const scale = Math.max(0.55, 1 - distance * 0.12);
              const opacity = Math.max(0.12, 1 - distance * 0.28);
              const isActive = idx === effectiveActiveIndex;
              const dot = ACCENT_DOT[studio.accentColor] || ACCENT_DOT.cyan;
              const glow = ACCENT_GLOW[studio.accentColor] || ACCENT_GLOW.cyan;
              const border = ACCENT_BORDER[studio.accentColor] || ACCENT_BORDER.cyan;
              const accentText = ACCENT_TEXT[studio.accentColor] || ACCENT_TEXT.cyan;

              // Highlight matched portion of name
              const name = studio.name;
              const matchIdx = search.trim() ? name.toLowerCase().indexOf(search.toLowerCase()) : -1;

              return (
                <button
                  key={studio.id}
                  onClick={() => handleSelect(studio.id)}
                  data-studio-item
                  className="w-full flex items-center justify-center px-3"
                  style={{ height: ITEM_HEIGHT }}
                >
                  <div
                    className="flex items-center gap-3 w-full rounded-xl transition-all duration-300"
                    style={{
                      transform: `scale(${scale})`,
                      opacity,
                      padding: isActive ? '10px 14px' : '8px 12px',
                      background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: isActive ? `1px solid rgba(255,255,255,0.12)` : '1px solid transparent',
                      boxShadow: isActive ? `0 0 20px rgba(255,255,255,0.04)` : 'none',
                    }}
                  >
                    {/* Logo */}
                    <div
                      className={`rounded-lg overflow-hidden flex-shrink-0 border ${isActive ? border : 'border-white/5'}`}
                      style={{ width: isActive ? 40 : 32, height: isActive ? 40 : 32, transition: 'all 0.3s' }}
                    >
                      <img src={studio.logo} alt={studio.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Name + tagline */}
                    <div className="flex-1 min-w-0 text-left">
                      <p
                        className={`font-bold truncate ${isActive ? 'text-white text-sm' : 'text-white/60 text-xs'}`}
                        style={{ transition: 'all 0.3s' }}
                      >
                        {matchIdx >= 0 ? (
                          <>
                            {name.slice(0, matchIdx)}
                            <span className="text-amber-300">{name.slice(matchIdx, matchIdx + search.length)}</span>
                            {name.slice(matchIdx + search.length)}
                          </>
                        ) : name}
                      </p>
                      <p className={`text-[9px] truncate ${isActive ? `${accentText}` : 'text-white/25'}`}>
                        {studio.tagline}
                      </p>
                    </div>

                    {/* Active glow dot */}
                    <div className="flex-shrink-0 flex items-center justify-center w-3">
                      {isActive && (
                        <motion.div
                          layoutId="studio-dot"
                          className={`w-2.5 h-2.5 rounded-full ${dot} ${glow}`}
                        />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 px-4">
            <Search className="w-6 h-6 mb-2 opacity-30" />
            <p className="text-[10px] text-center">No studios match "{search}"</p>
          </div>
        )}
      </div>

      {/* Nav hint */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-white/[0.06]">
        <p className="text-[8px] text-white/20 text-center font-mono">W / S or Scroll to navigate</p>
      </div>
    </div>
  );
}