import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, MicOff, Building2, Gamepad2, X } from 'lucide-react';

/**
 * Search bar with:
 *  - Voice input (Web Speech API)
 *  - Steam-style autocomplete dropdown (studios + projects as you type)
 *  - onSelectStudio(idx) — selects that studio index in the cross-scroll rail
 */
export default function DevSearchBar({ studios, onSelectStudio, onSearchChange }) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Compute autocomplete results from the full studio list
  const results = React.useMemo(() => {
    if (!query.trim()) return { studios: [], projects: [] };
    const q = query.toLowerCase();
    const studioMatches = [];
    const projectMatches = [];

    studios.forEach((dev, devIdx) => {
      if (dev.name.toLowerCase().includes(q) || dev.tagline.toLowerCase().includes(q)) {
        studioMatches.push({ dev, devIdx });
      }
      dev.inDevelopment.forEach((proj) => {
        if (proj.title.toLowerCase().includes(q) || proj.genre.toLowerCase().includes(q)) {
          projectMatches.push({ dev, devIdx, proj });
        }
      });
      dev.releasedGames.forEach((game) => {
        if (game.title.toLowerCase().includes(q) || game.genre.toLowerCase().includes(q)) {
          projectMatches.push({ dev, devIdx, proj: { ...game, isReleased: true } });
        }
      });
    });

    return { studios: studioMatches.slice(0, 6), projects: projectMatches.slice(0, 6) };
  }, [query, studios]);

  const totalResults = results.studios.length + results.projects.length;

  // Notify parent of search text (for cross-scroll filtering)
  useEffect(() => {
    onSearchChange(query);
  }, [query, onSearchChange]);

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
      setQuery(transcript);
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
      setQuery('');
      setShowResults(true);
      setIsListening(true);
      try { recognitionRef.current.start(); } catch {}
    }
  }, [isListening]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectStudio = (devIdx) => {
    onSelectStudio(devIdx);
    setShowResults(false);
    setQuery('');
  };

  // Keyboard navigation in results
  const handleKeyDown = (e) => {
    if (!showResults || totalResults === 0) return;
    const all = [...results.studios.map((s) => ({ type: 'studio', ...s })), ...results.projects.map((p) => ({ type: 'project', ...p }))];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((p) => (p + 1) % all.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((p) => (p - 1 + all.length) % all.length);
    } else if (e.key === 'Enter' && all[highlightIdx]) {
      e.preventDefault();
      handleSelectStudio(all[highlightIdx].devIdx);
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-80">
      {/* Input + voice button */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
        <input
          type="text"
          placeholder="Search studios or projects..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); setHighlightIdx(0); }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-20 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-white text-xs placeholder-white/40 focus:outline-none focus:border-amber-400/40 transition-all"
        />
        {/* Clear button */}
        {query && !isListening && (
          <button
            onClick={() => { setQuery(''); setHighlightIdx(0); }}
            className="absolute right-9 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        {/* Voice button */}
        <button
          onClick={toggleVoice}
          title={isListening ? 'Stop listening' : 'Voice search'}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            isListening
              ? 'bg-red-500/30 border border-red-400/40 text-red-300 animate-pulse'
              : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80'
          }`}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {showResults && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto scrollbar-hide"
          >
            {isListening && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-red-500/5">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ height: [4, 10, 4] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      className="w-0.5 bg-red-400 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-[10px] text-red-300/80 font-medium">Listening...</span>
              </div>
            )}

            {totalResults === 0 && !isListening ? (
              <div className="px-4 py-6 text-center">
                <Search className="w-6 h-6 mx-auto mb-2 text-white/15" />
                <p className="text-xs text-white/40">No matches for "{query}"</p>
              </div>
            ) : (
              <div className="py-1">
                {/* Studios section */}
                {results.studios.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-widest font-black text-white/30 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Studios
                    </p>
                    {results.studios.map((s) => {
                      const flatIdx = results.studios.indexOf(s);
                      const isActive = flatIdx === highlightIdx;
                      return (
                        <button
                          key={`studio-${s.dev.id}`}
                          onClick={() => handleSelectStudio(s.devIdx)}
                          onMouseEnter={() => setHighlightIdx(flatIdx)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                            isActive ? 'bg-white/8' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                            <img src={s.dev.logo} alt={s.dev.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{highlightMatch(s.dev.name, query)}</p>
                            <p className="text-[9px] text-white/40 truncate">{s.dev.tagline}</p>
                          </div>
                          <span className="text-[8px] text-white/30 font-mono">{s.dev.inDevelopment.length} projects</span>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Projects section */}
                {results.projects.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-widest font-black text-white/30 flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3" /> Projects & Games
                    </p>
                    {results.projects.map((p) => {
                      const flatIdx = results.studios.length + results.projects.indexOf(p);
                      const isActive = flatIdx === highlightIdx;
                      return (
                        <button
                          key={`proj-${p.dev.id}-${p.proj.title}`}
                          onClick={() => handleSelectStudio(p.devIdx)}
                          onMouseEnter={() => setHighlightIdx(flatIdx)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                            isActive ? 'bg-white/8' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="w-7 h-9 rounded overflow-hidden border border-white/10 flex-shrink-0">
                            <img src={p.proj.cover} alt={p.proj.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{highlightMatch(p.proj.title, query)}</p>
                            <p className="text-[9px] text-white/40 truncate">
                              {p.proj.genre} · {p.proj.isReleased ? 'Released' : p.proj.status}
                              <span className="text-white/25"> · {p.dev.name}</span>
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Highlight matched portion of text
function highlightMatch(text, query) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-amber-300 font-bold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}