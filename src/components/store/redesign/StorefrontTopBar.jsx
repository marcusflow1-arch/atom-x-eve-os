// StorefrontTopBar.jsx — Top header: nav pills, search, credits, cart, notifications, profile
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Bell, ShoppingCart, Coins, ChevronDown } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function StorefrontTopBar({ user, cartCount = 0, searchTerm, onSearchChange, onSearchOpen }) {
  const navigate = useNavigate();
  const displayName = user?.username || user?.full_name || 'Player';
  const level = user?.level || 12;

  return (
    <div className="flex items-center w-full gap-4">
      {/* Left brand + nav pills */}
      <div className="flex items-center gap-5 flex-shrink-0">
        <span className="text-base font-black tracking-widest text-white whitespace-nowrap">ATOM X EVE</span>
        <div className="hidden md:flex items-center gap-1">
          <button onClick={() => navigate(createPageUrl('LunaTemplate'))} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/55 hover:text-white hover:bg-white/[0.06] transition-all">Luna</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/[0.1] border border-white/15">Store</button>
          <button onClick={() => navigate(createPageUrl('GenreMastery'))} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/55 hover:text-white hover:bg-white/[0.06] transition-all">Cards</button>
          <button onClick={() => navigate(createPageUrl('Community'))} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/55 hover:text-white hover:bg-white/[0.06] transition-all">Community</button>
        </div>
      </div>

      {/* Center search */}
      <div className="flex-1 flex justify-center min-w-0">
        <div onClick={onSearchOpen}
          className="flex items-center gap-2 w-full max-w-[440px] px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] transition-all cursor-text">
          <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
          <input
            value={searchTerm || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search games, studios, genres..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none min-w-0"
          />
          <button onClick={(e) => { e.stopPropagation(); onSearchOpen?.(); }} className="flex-shrink-0 w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right cluster — credits, cart, notifications, profile */}
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