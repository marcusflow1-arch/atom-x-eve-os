import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, Bell, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/CartContext';

export default function MobileHeader({ onMenuOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { openCart, getCartCount } = useCart();

  const getTitle = () => {
    const p = location.pathname.toLowerCase();
    if (p.includes('/store')) return 'Store';
    if (p.includes('/library')) return 'Library';
    if (p.includes('/clan')) return 'Clan';
    if (p.includes('/community')) return 'Forum';
    if (p.includes('/achievements') || p.includes('/aiachievements')) return 'Achievements';
    if (p.includes('/aibattle')) return 'AI Battle';
    if (p.includes('/blacksmith')) return 'Blacksmith';
    if (p.includes('/aura') || p.includes('/streaming')) return 'Aura Stream';
    if (p.includes('/friends')) return 'Friends';
    if (p.includes('/leaderboard')) return 'Leaderboard';
    if (p.includes('/seasonalpass')) return 'Season Pass';
    if (p.includes('/genremastery')) return 'Skill Tree';
    if (p.includes('/storyline')) return 'Storyline';
    if (p.includes('/discover')) return 'Discover';
    return 'Dashboard';
  };

  const cartCount = getCartCount();

  return (
    <div
      className="h-14 flex items-center justify-between px-4 flex-shrink-0 relative z-[50]"
      style={{
        background: 'rgba(10, 14, 20, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Left: Menu */}
      <button
        onClick={onMenuOpen}
        className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
      >
        <Menu className="w-4 h-4 text-white/80" />
      </button>

      {/* Center: Title */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-white/40 tracking-widest uppercase">AXE</span>
        <span className="text-white/20">|</span>
        <span className="text-sm font-bold text-white tracking-wide">{getTitle()}</span>
      </div>

      {/* Right: Cart */}
      <button
        onClick={openCart}
        className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center relative"
      >
        <ShoppingBag className="w-4 h-4 text-white/80" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full text-[9px] font-bold text-black flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>
    </div>
  );
}