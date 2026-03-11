import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/CartContext';
import ViewModeToggle from './ViewModeToggle';

export default function MobileHeader({ onMenuOpen }) {
  const location = useLocation();
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
    if (p.includes('/aura') || p.includes('/streaming')) return 'Aura';
    if (p.includes('/friends')) return 'Friends';
    if (p.includes('/leaderboard')) return 'Leaderboard';
    if (p.includes('/seasonalpass')) return 'Season Pass';
    if (p.includes('/genremastery')) return 'Skill Tree';
    if (p.includes('/storyline')) return 'Storyline';
    if (p.includes('/discover')) return 'Discover';
    if (p.includes('/onboarding')) return 'Welcome';
    return 'Home';
  };

  const cartCount = getCartCount();

  return (
    <div
      className="flex items-center justify-between px-3 flex-shrink-0 relative"
      style={{
        height: '48px',
        background: 'rgba(100, 120, 140, 0.12)',
        backdropFilter: 'blur(30px) saturate(150%)',
        WebkitBackdropFilter: 'blur(30px) saturate(150%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Left: Menu */}
      <button
        onClick={onMenuOpen}
        className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center active:bg-white/15 transition-colors"
      >
        <Menu className="w-4 h-4 text-white/70" />
      </button>

      {/* Center: Title */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-extrabold text-cyan-400/60 tracking-[0.2em] uppercase">AXE</span>
        <span className="text-white/15 text-xs">|</span>
        <span className="text-[13px] font-semibold text-white/90 tracking-wide">{getTitle()}</span>
      </div>

      {/* Right: Toggle + Cart */}
      <div className="flex items-center gap-1.5">
        <ViewModeToggle />
        <button
          onClick={openCart}
          className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center relative active:bg-white/15 transition-colors"
        >
          <ShoppingBag className="w-4 h-4 text-white/70" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-cyan-500 rounded-full text-[8px] font-bold text-black flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}