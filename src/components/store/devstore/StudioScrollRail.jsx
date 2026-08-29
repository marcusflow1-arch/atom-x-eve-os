import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Mic, MicOff, X } from 'lucide-react';

const ACCENT_DOT = { cyan: 'bg-cyan-400', orange: 'bg-orange-400', purple: 'bg-purple-400', blue: 'bg-blue-400', red: 'bg-red-400', green: 'bg-green-400' };
const ACCENT_GLOW = { cyan: 'shadow-[0_0_20px_rgba(34,211,238,0.6)]', orange: 'shadow-[0_0_20px_rgba(251,146,60,0.6)]', purple: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]', blue: 'shadow-[0_0_20px_rgba(96,165,250,0.6)]', red: 'shadow-[0_0_20px_rgba(248,113,113,0.6)]', green: 'shadow-[0_0_20px_rgba(74,222,128,0.6)]' };
const ACCENT_BORDER = { cyan: 'border-cyan-400/40', orange: 'border-orange-400/40', purple: 'border-purple-400/40', blue: 'border-blue-400/40', red: 'border-red-400/40', green: 'border-green-400/40' };
const ACCENT_TEXT = { cyan: 'text-cyan-400', orange: 'text-orange-400', purple: 'text-purple-400', blue: 'text-blue-400', red: 'text-red-400', green: 'text-green-400' };
const ITEM_HEIGHT = 68;

export default function StudioScrollRail({ studios, activeIndex, onSelect }) {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const [search, setSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => containerRef.current && setContainerHeight(containerRef.current.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setSearch(transcript);
      if (e.results[e.results.length - 1].isFinal) setIsListening(false);
    };
    rec.onerror = () => setIsListening(false); rec.onend = () => setIsListening(false); recognitionRef.current = rec;
    return () => { try { rec.abort(); } catch {} };
  }, []);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { setSearch(''); setIsListening(true); try { recognitionRef.current.start(); } catch {} }
  }, [isListening]);

  const displayStudios = useMemo(() => {
    if (!search.trim()) return studios;
    const q = search.toLowerCase();
    return studios.filter((s) => s.name.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q));
  }, [studios, search]);

  const activeStudio = studios[activeIndex];
  const filteredActiveIndex = displayStudios.findIndex((s) => s.id === activeStudio?.id);
  const effectiveActiveIndex = filteredActiveIndex >= 0 ? filteredActiveIndex : 0;
  const translateY = containerHeight / 2 - ITEM_HEIGHT / 2 - effectiveActiveIndex * ITEM_HEIGHT;

  const handleSelect = useCallback((studioId) => {
    const originalIdx = studios.findIndex((s) => s.id === studioId);
    if (originalIdx >= 0) onSelect(originalIdx);
  }, [studios, onSelect]);

  return (
    <div className="w-full h-full flex flex-col border-r border-white/[0.06]" style={{ background: 'rgba(8, 12, 18, 0.35)' }}>
      <div className="px-3 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 truncate">Studios A–Z</p>
          <p className="text-[8px] text-white/20 flex-shrink-0">{displayStudios.length}</p>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/35 pointer-events-none" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-7 pr-7 py-1.5 bg-white/[0.03] border-0 border-b border-white/10 text-white text-[10px] placeholder-white/30 focus:outline-none focus:border-amber-400/40" />
          {search && <button onClick={() => setSearch('')} className="absolute right-7 top-1/2 -translate-y-1/2 text-white/35 hover:text-white"><X className="w-2.5 h-2.5" /></button>}
          <button onClick={toggleVoice} title={isListening ? 'Stop listening' : 'Voice search'} className={`absolute right-1 top-1/2 -translate-y-1/2 ${isListening ? 'text-red-300 animate-pulse' : 'text-white/35 hover:text-white/70'}`}>
            {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[68px] pointer-events-none border-y border-white/10 bg-white/[0.035]" />
        <div className="absolute top-0 left-0 right-0 h-14 pointer-events-none z-10" style={{ background: 'linear-gradient(to bottom, rgba(8,12,18,0.95), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none z-10" style={{ background: 'linear-gradient(to top, rgba(8,12,18,0.95), transparent)' }} />
        {displayStudios.length > 0 ? <div className="absolute left-0 right-0" style={{ transform: `translateY(${translateY}px)`, transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {displayStudios.map((studio, idx) => {
            const distance = Math.abs(idx - effectiveActiveIndex);
            const scale = Math.max(0.58, 1 - distance * 0.11);
            const opacity = Math.max(0.12, 1 - distance * 0.27);
            const isActive = idx === effectiveActiveIndex;
            const dot = ACCENT_DOT[studio.accentColor] || ACCENT_DOT.cyan;
            const glow = ACCENT_GLOW[studio.accentColor] || ACCENT_GLOW.cyan;
            const border = ACCENT_BORDER[studio.accentColor] || ACCENT_BORDER.cyan;
            const accentText = ACCENT_TEXT[studio.accentColor] || ACCENT_TEXT.cyan;
            return <button key={studio.id} onClick={() => handleSelect(studio.id)} className="w-full flex items-center justify-center px-1" style={{ height: ITEM_HEIGHT }}>
              <div className="flex items-center gap-2 w-full transition-all duration-300" style={{ transform: `scale(${scale})`, opacity, padding: isActive ? '8px 8px' : '6px 7px', background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent', border: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent' }}>
                <div className={`overflow-hidden flex-shrink-0 border ${isActive ? border : 'border-white/5'}`} style={{ width: isActive ? 34 : 28, height: isActive ? 34 : 28 }}><img src={studio.logo} alt={studio.name} className="w-full h-full object-cover" /></div>
                <div className="flex-1 min-w-0 text-left"><p className={`font-bold truncate ${isActive ? 'text-white text-[11px]' : 'text-white/60 text-[10px]'}`}>{studio.name}</p><p className={`text-[7px] truncate ${isActive ? accentText : 'text-white/25'}`}>{studio.tagline}</p></div>
                <div className="flex-shrink-0 w-2.5">{isActive && <motion.div layoutId="studio-dot" className={`w-2 h-2 ${dot} ${glow}`} />}</div>
              </div>
            </button>;
          })}
        </div> : <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 px-3"><Search className="w-5 h-5 mb-2 opacity-30" /><p className="text-[9px] text-center">No studios match</p></div>}
      </div>
      <div className="flex-shrink-0 px-2 py-2 border-t border-white/[0.06]"><p className="text-[7px] text-white/20 text-center font-mono">Scroll / W S</p></div>
    </div>
  );
}
