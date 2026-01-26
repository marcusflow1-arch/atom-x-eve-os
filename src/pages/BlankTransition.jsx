import React from 'react';
import MiniLunaNav from '../components/nav/MiniLunaNav';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe, Rocket, Crown, Swords, Crosshair, Map, Ghost, Monitor } from 'lucide-react';

const GENRES = [
  { id: 'mmorpg', name: 'MMORPG', icon: Globe },
  { id: 'scifi', name: 'Sci-Fi', icon: Rocket },
  { id: 'fantasy', name: 'Fantasy', icon: Crown },
  { id: 'action', name: 'Action', icon: Swords },
  { id: 'shooter', name: 'Shooter', icon: Crosshair },
  { id: 'adventure', name: 'Adventure', icon: Map },
  { id: 'fear', name: 'Fear', icon: Ghost },
  { id: 'simulation', name: 'Simulation', icon: Monitor },
];

export default function BlankTransition() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full bg-black text-white">
      <div className="relative z-10">
        <MiniLunaNav title="Skill Tree" />
      </div>

      {/* Sub-pages (genre tabs) */}
      <div className="px-6 md:px-8 mt-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 pr-2">
          {GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => navigate(createPageUrl('GenreMastery'))}
              className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap border transition-all bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
              title={`${g.name} Skill Tree`}
            >
              {g.icon && React.createElement(g.icon, { className: 'w-4 h-4' })}
              <span className="text-sm font-semibold">{g.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Blank transitional body */}
      <div className="px-6 md:px-8 py-12">
        <div className="h-[40vh] rounded-2xl border border-white/10 bg-white/5" />
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}