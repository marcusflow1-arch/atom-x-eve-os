import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Compass, Home, Radio } from 'lucide-react';

export default function BottomQuickBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.toLowerCase();

  const Item = ({ active, icon: Icon, label, to }) => (
    <button
      onClick={() => navigate(to)}
      className={`px-4 h-10 rounded-full inline-flex items-center gap-2 text-sm font-semibold transition-all border backdrop-blur-md ${
        active
          ? 'bg-white/20 border-white/30 text-white shadow-[0_2px_12px_rgba(0,0,0,0.25)]'
          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const isStreaming = path.includes('/streaming');
  const isDiscover = path.includes('/discover');
  const isHome = path.includes('/streaminghome');

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 bottom-6 z-40"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex items-center gap-2 px-2 py-2 rounded-full border bg-black/30 backdrop-blur-xl"
        style={{ borderColor: 'rgba(255,255,255,0.12)', pointerEvents: 'auto' }}
      >
        <Item
          icon={Compass}
          label="Discover"
          to={createPageUrl('Discover')}
          active={isDiscover}
        />
        <Item
          icon={Home}
          label="Home"
          to={createPageUrl('Aura')}
          active={isHome}
        />
        <Item
          icon={Radio}
          label="Aura"
          to={createPageUrl('Aura')}
          active={isStreaming}
        />
      </div>
    </div>
  );
}