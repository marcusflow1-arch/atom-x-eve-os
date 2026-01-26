import React from 'react';
import MiniLunaNav from '../components/nav/MiniLunaNav';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe, Rocket, Crown, Swords, Crosshair, Map, Ghost, Monitor } from 'lucide-react';

const GENRES = [
  { id: 'mmorpg', name: 'MMORPG', icon: Globe, color: 'from-purple-500 to-indigo-600' },
  { id: 'scifi', name: 'Sci-Fi', icon: Rocket, color: 'from-cyan-500 to-blue-600' },
  { id: 'fantasy', name: 'Fantasy', icon: Crown, color: 'from-amber-400 to-orange-500' },
  { id: 'action', name: 'Action', icon: Swords, color: 'from-red-500 to-rose-600' },
  { id: 'shooter', name: 'Shooter', icon: Crosshair, color: 'from-emerald-500 to-green-600' },
  { id: 'adventure', name: 'Adventure', icon: Map, color: 'from-yellow-400 to-orange-400' },
  { id: 'fear', name: 'Fear', icon: Ghost, color: 'from-slate-800 to-gray-900' },
  { id: 'simulation', name: 'Simulation', icon: Monitor, color: 'from-blue-400 to-indigo-400' },
];

export default function BlankTransition() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const genreId = params.get('genre') || 'mmorpg';
  const level = Number(params.get('level') || 1);
  const currentGenre = GENRES.find(g => g.id === genreId) || GENRES[0];
  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-900" />
        <div className={`absolute inset-0 bg-gradient-to-r ${currentGenre.color} blur-[150px] opacity-20`} />
      </div>
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