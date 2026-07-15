// StorefrontTopBar.jsx — Top header: nav pills, search, credits, cart, notifications, profile
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ShoppingCart, Coins, ChevronDown, Mic, MicOff, Settings } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function StorefrontTopBar({ user, cartCount = 0, searchTerm, onSearchChange, onSearchOpen }) {
  const navigate = useNavigate();
  const displayName = user?.username || user?.full_name || 'Player';
  const level = user?.level || 12;
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleMic = (e) => {
    e.stopPropagation();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
    rec.onresult = (ev) => onSearchChange?.(ev.results[0][0].transcript);
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  };

  return (
    <div className="flex items-center w-full gap-4">
      <style>{`
        .search-underline-line {
          background: rgba(255,255,255,0.18);
          transition: background 0.25s ease, box-shadow 0.25s ease;
        }
        .search-underline:hover .search-underline-line,
        .search-underline:focus-within .search-underline-line {
          background: #22d3ee;
          box-shadow: 0 0 8px 1px rgba(34,211,238,0.65), 0 0 16px 2px rgba(34,211,238,0.35);
        }
      `}</style>
      {/* Left — brand + nav pills */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="text-base font-black tracking-widest text-white whitespace-nowrap">ATOM X EVE</span>
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          <button onClick={() => navigate(createPageUrl('LunaTemplate'))} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/55 hover:text-white hover:bg-white/[0.06] transition-all">Luna</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/[0.1] border border-white/15">Store</button>
          <button onClick={() => navigate(createPageUrl('GenreMastery'))} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/55 hover:text-white hover:bg-white/[0.06] transition-all">Cards</button>
          <button onClick={() => navigate(createPageUrl('Community'))} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/55 hover:text-white hover:bg-white/[0.06] transition-all">Community</button>
        </div>
      </div>

      {/* Center-left — minimal underline search (right of the Luna/Store/Cards tabs) */}
      <div className="flex-1 flex justify-center min-w-0 pl-6">
        <div onClick={onSearchOpen}
          className="search-underline group flex items-center gap-2 w-full max-w-[420px] min-w-0 px-1 py-2 cursor-text relative">
          <Search className="w-4 h-4 text-white/40 flex-shrink-0 group-hover:text-cyan-300 group-focus-within:text-cyan-300 transition-colors" />
          <input
            value={searchTerm || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onFocus={() => onSearchOpen?.()}
            placeholder="Search games, studios, genres..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none min-w-0"
          />
          <button onClick={handleMic} className={`flex-shrink-0 transition-colors ${isListening ? 'text-red-400' : 'text-white/40 hover:text-white'}`}>
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
          {/* underline */}
          <span className="search-underline-line pointer-events-none absolute left-0 right-0 bottom-0 h-[1.5px] rounded-full" />
        </div>
      </div>

      {/* Right cluster — credits, cart, notifications, view-mode toggle, profile */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10">
          <Coins className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-sm font-bold text-white">5,240</span>
        </div>

        <button onClick={() => navigate(createPageUrl('Cart'))} className="relative w-9 h-9 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
          <ShoppingCart className="w-4 h-4" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-cyan-500 text-white text-[9px] font-bold flex items-center justify-center">{cartCount}</span>
          )}
        </button>

        <button onClick={() => navigate(createPageUrl('Notifications'))} className="relative w-9 h-9 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        <button
          onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=settings')}
          className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/10 transition-all">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden lg:block text-left leading-none">
            <div className="text-white text-[11px] font-bold truncate max-w-[90px]">{displayName}</div>
            <div className="text-white/40 text-[9px]">Level {level}</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-white/40 hidden lg:block" />
        </button>
      </div>
    </div>
  );
}