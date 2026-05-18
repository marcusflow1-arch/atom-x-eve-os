import React from 'react';
import { Swords, Users, Target, Clock } from 'lucide-react';
import { clanAction } from './clanStore';

const MISSION_TYPES = [
  { key: 'bounty', label: 'Bounty', icon: Target, color: 'text-red-300', desc: 'Hunt down a champion enemy across the world.' },
  { key: 'rush', label: 'Rush', icon: Swords, color: 'text-amber-300', desc: 'Survive waves of enemies as a group.' },
  { key: 'trek', label: 'Trek', icon: Users, color: 'text-cyan-300', desc: 'Find hidden locations as a guild.' },
  { key: 'puzzle', label: 'Puzzle', icon: Target, color: 'text-purple-300', desc: 'Solve a multi-stage guild puzzle.' },
];

/** Guild Missions tab — start group missions, see active ones. */
export default function ClanOverlayMissions({ clan, missions, myMembership }) {
  if (!clan) return null;

  const canStart = myMembership && (myMembership.role === 'leader' || myMembership.role === 'officer');

  const joinMission = async (eventId) => {
    try { await clanAction('join_event', { eventId }); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10"
        style={{ background: 'linear-gradient(90deg, rgba(120,40,40,0.18) 0%, rgba(15,18,25,0) 100%)' }}>
        <h2 className="text-white text-lg font-bold flex items-center gap-2">
          <Swords className="w-5 h-5 text-red-300" />
          Guild Missions
        </h2>
        <p className="text-white/50 text-xs mt-0.5">Cooperative content for your guild — bounties, rushes, treks, and puzzles.</p>
      </div>

      {/* Mission type cards */}
      <div className="px-6 py-4 grid grid-cols-2 gap-3">
        {MISSION_TYPES.map((mt) => {
          const Icon = mt.icon;
          return (
            <div key={mt.key} className="p-4 rounded-lg bg-black/30 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${mt.color}`} />
                <span className="text-white font-semibold">{mt.label}</span>
              </div>
              <p className="text-white/50 text-xs mb-3">{mt.desc}</p>
              <button
                disabled={!canStart}
                className="w-full px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded hover:bg-white/10 text-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {canStart ? 'Start Mission' : 'Officers Only'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Active missions */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Active Missions</div>
        {missions.length === 0 && (
          <div className="text-center py-8 text-white/30 text-sm">No active missions.</div>
        )}
        {missions.filter((m) => m.status !== 'completed').map((m) => (
          <div key={m.id} className="p-3 rounded bg-black/20 border border-white/10 mb-2 flex items-center gap-3">
            <Clock className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">{m.title}</div>
              <div className="text-white/50 text-xs truncate">{m.description}</div>
            </div>
            <div className="text-white/40 text-xs">{(m.participants || []).length}/{m.maxParticipants || 5}</div>
            <button onClick={() => joinMission(m.id)} className="px-3 py-1 text-xs font-semibold bg-amber-500/20 border border-amber-400/40 text-amber-200 rounded hover:bg-amber-500/30">
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}