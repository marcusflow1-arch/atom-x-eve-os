import React, { useState } from 'react';
import { Castle, MapPin, Crown } from 'lucide-react';
import { clanAction } from './clanStore';

const HALLS = [
  { key: 'gilded_hollow', name: 'Gilded Hollow', desc: 'Sunlit underground caverns laced with golden veins.', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600' },
  { key: 'lost_precipice', name: 'Lost Precipice', desc: 'Floating ruins above a stormy sea.', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600' },
  { key: 'windswept_haven', name: 'Windswept Haven', desc: 'Highland fortress on a windy plateau.', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600' },
  { key: 'isle_of_reflection', name: 'Isle of Reflection', desc: 'Mystical floating isle ringed by mirror lakes.', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600' },
];

/** Guild Hall tab — claim a hall, view current hall. */
export default function ClanOverlayHall({ clan, hall, myMembership }) {
  const [claiming, setClaiming] = useState(false);
  if (!clan) return null;

  const isLeader = myMembership?.role === 'leader';

  const claim = async (hallType) => {
    if (!isLeader) return;
    setClaiming(true);
    try { await clanAction('claim_hall', { divisionId: clan.id, hallType, hallName: `${clan.name} Hall` }); }
    catch (e) { console.error(e); } finally { setClaiming(false); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-4"
        style={{ background: 'linear-gradient(90deg, rgba(60,40,90,0.18) 0%, rgba(15,18,25,0) 100%)' }}>
        <Castle className="w-6 h-6 text-purple-300" />
        <div>
          <h2 className="text-white text-lg font-bold">Guild Hall</h2>
          <p className="text-white/50 text-xs">Your guild's private home instance.</p>
        </div>
      </div>

      {hall ? (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rounded-xl overflow-hidden border border-white/10">
            <div className="h-48 bg-cover bg-center relative"
              style={{ backgroundImage: `url(${HALLS.find((h) => h.key === hall.hall_type)?.img || ''})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-white text-xl font-bold">{hall.hall_name}</h3>
                  <span className="text-white/60 text-xs uppercase tracking-wider">{HALLS.find((h) => h.key === hall.hall_type)?.name}</span>
                </div>
                <p className="text-white/60 text-xs mt-0.5">Claimed by guild leader</p>
              </div>
            </div>
            <div className="p-4 bg-black/30 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-amber-300 text-xl font-bold">{hall.favor || 0}</div>
                <div className="text-white/40 text-xs uppercase">Favor</div>
              </div>
              <div>
                <div className="text-cyan-300 text-xl font-bold">{hall.aetherium || 0}</div>
                <div className="text-white/40 text-xs uppercase">Aetherium</div>
              </div>
              <div>
                <div className="text-white text-xl font-bold">{(hall.decorations || []).length}</div>
                <div className="text-white/40 text-xs uppercase">Decorations</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-white/70 text-sm mb-4">
            {isLeader ? 'Choose a hall to claim for your guild:' : 'Only the guild leader can claim a hall.'}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {HALLS.map((h) => (
              <div key={h.key} className="rounded-lg overflow-hidden border border-white/10 bg-black/30">
                <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${h.img})` }} />
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-300" />
                    <span className="text-white text-sm font-semibold">{h.name}</span>
                  </div>
                  <p className="text-white/50 text-xs mb-2 min-h-[2.5rem]">{h.desc}</p>
                  <button
                    onClick={() => claim(h.key)}
                    disabled={!isLeader || claiming}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-purple-500/20 border border-purple-400/40 text-purple-200 rounded hover:bg-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {!isLeader && <Crown className="w-3 h-3" />}
                    {isLeader ? 'Claim Hall' : 'Leader Only'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}