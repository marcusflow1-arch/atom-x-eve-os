import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Gamepad2, Users, MessageSquare, Settings, Play, Radio, LayoutGrid, Compass } from 'lucide-react';
import StreamingGamesLive from '@/components/streaming/StreamingGamesLive';
import LibrarySidebar from '@/components/streaming/LibrarySidebar';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

function AuraBottomNav() {
  const navigate = useNavigate();
  const path = (typeof window !== 'undefined' ? window.location.pathname : '').toLowerCase();
  const isDiscover = path.includes('/discover');
  const isHome = path.includes('/streaminghome');
  const isAura = path.includes('/aura');

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
      <Item icon={Home} label="Home" to={createPageUrl('Aura')} active={isHome} />
      <Item icon={Radio} label="Aura" to={createPageUrl('Aura')} active={isAura} />
    </div>
  );
}

export default function Aura() {
  const navigate = useNavigate();

  return (
    <GlassPageFrame bottomContent={<AuraBottomNav />}>
    <div className="w-full min-h-screen bg-[#0f1419] relative">
      {/* Main Content */}
      <div className="pt-20 pb-24">
        <StreamingGamesLive />
      </div>

      {/* Sidebars & Overlays */}
      <LibrarySidebar />
    </div>
    </GlassPageFrame>
  );
}