import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionShell, { glassCard, EmptyState, LoadingState } from '../SectionShell';
import PlayerProfilePanel from '../PlayerProfilePanel';

const PODIUM = [
  { ring: 'ring-yellow-400/70', text: 'text-yellow-300', label: '1st' },
  { ring: 'ring-slate-300/60', text: 'text-slate-200', label: '2nd' },
  { ring: 'ring-amber-600/60', text: 'text-amber-500', label: '3rd' },
];

// Ranks — real leaderboard from AvatarProgression + User; click a player for the full drill-down
export default function RanksSection({ accent }) {
  const [rows, setRows] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [progs, users] = await Promise.all([
        base44.entities.AvatarProgression.list('-global_xp', 50),
        base44.entities.User.list(),
      ]);
      const byId = Object.fromEntries(users.map((u) => [u.id, u]));
      setRows(
        progs
          .map((p) => ({ prog: p, user: byId[p.user_id] }))
          .filter((r) => r.user)
      );
    };
    load();
  }, []);

  const openPlayer = ({ prog, user }, rank) => setSelectedPlayer({
    id: user.id,
    name: user.username || user.full_name || 'Player',
    avatar: user.avatar_url || '',
    subtitle: `Rank #${rank} · Atom X Eve Ladder`,
    level: prog.global_level ?? 1,
    xp: prog.global_xp ?? 0,
    genres: prog.genres,
  });

  if (rows === null) return <LoadingState />;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <SectionShell title="Ranks" accent={accent} subtitle="The Atom X Eve ladder — select any player for their full profile">
      <div className="relative h-full">
        {rows.length === 0 ? (
          <EmptyState icon={Crown} message="No ranked players yet." />
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Podium */}
            <div className="flex items-end justify-center gap-4 mb-8">
              {[1, 0, 2].map((pi) => {
                const r = podium[pi];
                if (!r) return null;
                const style = PODIUM[pi];
                return (
                  <motion.button
                    key={r.user.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.08 }}
                    onClick={() => openPlayer(r, pi + 1)}
                    className={`flex flex-col items-center gap-2 p-5 hover:scale-[1.03] transition-transform ${pi === 0 ? 'pb-9' : ''}`}
                    style={glassCard(pi === 0 ? 'rgba(250,204,21,0.40)' : 'rgba(255,255,255,0.14)')}
                  >
                    {pi === 0 && <Crown className="w-5 h-5 text-yellow-300" />}
                    <div className={`w-16 h-16 rounded-full overflow-hidden ring-2 ${style.ring} bg-slate-800 flex items-center justify-center`}>
                      {r.user.avatar_url
                        ? <img src={r.user.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xl font-black text-white/60">{(r.user.username || r.user.full_name || '?').charAt(0).toUpperCase()}</span>}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>{style.label}</span>
                    <span className="text-white font-bold text-sm max-w-[120px] truncate">{r.user.username || r.user.full_name}</span>
                    <span className="text-white/40 text-[11px]">Lv. {r.prog.global_level ?? 1} · {(r.prog.global_xp ?? 0).toLocaleString()} XP</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Ladder */}
            <div className="space-y-2">
              {rest.map((r, i) => (
                <motion.button
                  key={r.user.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.02 }}
                  onClick={() => openPlayer(r, i + 4)}
                  className="w-full flex items-center gap-4 px-5 py-3 hover:bg-white/[0.06] transition-colors text-left"
                  style={glassCard()}
                >
                  <span className="text-white/30 font-black text-sm w-8">#{i + 4}</span>
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {r.user.avatar_url
                      ? <img src={r.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sm font-black text-white/50">{(r.user.username || r.user.full_name || '?').charAt(0).toUpperCase()}</span>}
                  </div>
                  <span className="text-white font-semibold text-sm flex-1 truncate">{r.user.username || r.user.full_name}</span>
                  <span className="text-purple-300 text-xs font-bold">Lv. {r.prog.global_level ?? 1}</span>
                  <span className="text-white/40 text-xs w-24 text-right">{(r.prog.global_xp ?? 0).toLocaleString()} XP</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence>
          {selectedPlayer && <PlayerProfilePanel player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
        </AnimatePresence>
      </div>
    </SectionShell>
  );
}