import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Users, Globe, User, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionShell, { glassCard, EmptyState, LoadingState } from '../SectionShell';

const TYPE_ICON = { solo: User, team: Users, global: Globe };

// Battle Arena — real Challenge backend: browse active/upcoming challenges and enlist
export default function BattleSection({ accent }) {
  const [challenges, setChallenges] = useState(null);
  const [joined, setJoined] = useState({});

  useEffect(() => {
    base44.entities.Challenge.list('-created_date', 40).then(setChallenges);
  }, []);

  const enlist = async (c) => {
    if (joined[c.id]) return;
    setJoined((p) => ({ ...p, [c.id]: true }));
    const updated = await base44.entities.Challenge.update(c.id, { participants_count: (c.participants_count || 0) + 1 });
    setChallenges((prev) => prev.map((x) => (x.id === c.id ? { ...x, participants_count: updated?.participants_count ?? (c.participants_count || 0) + 1 } : x)));
  };

  if (challenges === null) return <LoadingState />;
  const visible = challenges.filter((c) => c.status !== 'completed');

  return (
    <SectionShell title="Battle Arena" accent={accent} subtitle="Live combat challenges — enlist and fight for rewards">
      {visible.length === 0 ? (
        <EmptyState icon={Swords} message="No active battles right now. The arena is quiet... for now." />
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((c, i) => {
            const TypeIcon = TYPE_ICON[c.type] || Swords;
            const isActive = c.status === 'active';
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="p-5 flex flex-col" style={glassCard(isActive ? 'rgba(248,113,113,0.30)' : 'rgba(255,255,255,0.12)')}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                    isActive ? 'text-red-300 border-red-400/40 bg-red-500/10' : 'text-white/50 border-white/15 bg-white/5'
                  }`}>
                    {isActive ? 'Live Now' : 'Upcoming'}
                  </span>
                  <span className="flex items-center gap-1 text-white/40 text-[10px] uppercase tracking-wider">
                    <TypeIcon className="w-3 h-3" /> {c.type || 'solo'}
                  </span>
                </div>
                <h3 className="text-white font-bold text-base leading-tight">{c.title}</h3>
                {c.description && <p className="text-white/45 text-xs mt-1.5 line-clamp-2">{c.description}</p>}
                {c.reward_description && (
                  <p className="text-amber-300/80 text-[11px] mt-2 font-semibold">Reward: {c.reward_description}</p>
                )}
                <div className="flex-1" />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-white/40 text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> {(c.participants_count || 0).toLocaleString()} enlisted
                  </span>
                  <button
                    onClick={() => enlist(c)}
                    disabled={joined[c.id]}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                      joined[c.id]
                        ? 'text-green-300 border-green-400/40 bg-green-500/10'
                        : 'text-white border-red-400/40 bg-red-500/20 hover:bg-red-500/35'
                    }`}
                  >
                    {joined[c.id] ? <><Check className="w-3 h-3" /> Enlisted</> : <><Swords className="w-3 h-3" /> Enlist</>}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}