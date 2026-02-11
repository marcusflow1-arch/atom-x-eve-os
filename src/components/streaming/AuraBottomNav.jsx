import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Radio, Compass } from 'lucide-react';

export default function AuraBottomNav() {
  const navigate = useNavigate();
  const path = (typeof window !== 'undefined' ? window.location.pathname : '').toLowerCase();
  const isDiscover = path.includes('/discover');
  const isHome = path.includes('/streaminghome');
  const isAura = path.includes('/aura') && !isHome;

  const Item = ({ active, icon: Icon, label, to }) => (
    <button
      onClick={() => navigate(to)}
      className={`px-4 h-9 rounded-full inline-flex items-center gap-2 text-sm font-semibold transition-all border backdrop-blur-md ${
        active
          ? 'bg-white/20 border-white/30 text-white shadow-[0_2px_12px_rgba(0,0,0,0.25)]'
          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex items-center justify-center gap-2 w-full">
      <Item icon={Compass} label="Discover" to={createPageUrl('Discover')} active={isDiscover} />
      <Item icon={Home} label="Home" to={createPageUrl('StreamingHome')} active={isHome} />
      <Item icon={Radio} label="Aura" to={createPageUrl('Aura')} active={isAura} />
    </div>
  );
}