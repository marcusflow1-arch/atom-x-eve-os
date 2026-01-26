import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe, Rocket, Crown, Swords, Crosshair, Map, Ghost, Monitor, ArrowLeft } from 'lucide-react';

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

  React.useEffect(() => { window.scrollTo(0, 0); }, [genreId, level]);

  const getRarity = (lvl) => {
    if (lvl >= 50) return 'Godlike';
    if (lvl >= 40) return 'Mythical';
    if (lvl >= 30) return 'Legendary';
    if (lvl % 5 === 0) return 'Epic';
    return lvl % 2 === 0 ? 'Rare' : 'Common';
  };
  const rarity = getRarity(level);
  const reward = {
    name: `${currentGenre.name} Mastery Reward ${level}`,
    type: 'Ability Reward',
    rarity,
    image: `https://source.unsplash.com/random/800x600?${currentGenre.id},reward,transparent&sig=${level}`,
    description: `Exclusive reward for reaching level ${level} in ${currentGenre.name}.`,
    equipment: {
      name: `Elite Gear Tier ${level}`,
      rarity: rarity === 'Godlike' ? 'Mythical' : rarity,
      image: `https://source.unsplash.com/random/400x400?armor,tech&sig=${level}`,
    }
  };
  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-900" />
        <div className={`absolute inset-0 bg-gradient-to-r ${currentGenre.color} blur-[150px] opacity-20`} />
      </div>
      {/* Left Rail: Vertical line and level markers */}
      <div className="fixed left-0 top-0 h-screen w-px bg-white/20 z-[25]" />
      <div className="fixed left-0 top-20 bottom-0 w-[10%] z-[26] overflow-y-auto relative">
        <div className="py-2 flex flex-col items-center gap-0 select-none">
          <div
            className="h-[5vh] w-full flex items-center justify-center text-white/80 text-xl cursor-pointer hover:text-white"
            onClick={() => navigate(createPageUrl('GenreMastery'))}
            title="Back to Skill Tree"
          >
            <ArrowLeft className="w-6 h-6" />
          </div>
          {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className="h-[5vh] w-full flex items-center justify-center text-white/90 text-2xl cursor-pointer hover:text-white"
              onClick={() => navigate(createPageUrl(`BlankTransition?genre=${genreId}&level=${n}`))}
            >
              {n}
            </div>
          ))}
        </div>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-white/50 text-xs tracking-widest">LVL</div>
      </div>

      {/* Page header */}
      <div className="relative z-10 pl-[10%] px-6 pt-6">
        <h1 className="text-2xl font-bold">Skill Tree</h1>
      </div>



      {/* Reward preview for selected level */}
      <div className="fixed top-1/2 left-[12%] right-6 -translate-y-1/2 px-6 z-10">
        <div
          className="rounded-3xl p-8 md:p-10 relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
          }}
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${currentGenre.color} opacity-5`} />
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-1 rounded-md bg-white/10 border border-white/20">LVL {level}</span>
                <span className="text-xs px-2 py-1 rounded-md bg-white/10 border border-white/20">{reward.rarity}</span>
                <span className="text-xs px-2 py-1 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-300">{reward.type}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{reward.name}</h2>
              <p className="text-white/80 mb-6">{reward.description}</p>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10">
                  <img src={reward.equipment.image} alt={reward.equipment.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-sm text-white/60 uppercase">Bonus Equipment</div>
                  <div className="text-lg font-bold">{reward.equipment.name}</div>
                  <div className="text-xs text-white/50">{reward.equipment.rarity}</div>
                </div>
              </div>
            </div>
            <div className="relative h-64 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl" />
              <img src={reward.image} alt="Reward" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}