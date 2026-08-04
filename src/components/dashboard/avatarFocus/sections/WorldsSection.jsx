import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Skull, Gift, Crown, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionShell, { glassCard, EmptyState, LoadingState } from '../SectionShell';

const TYPE_META = {
  Monster: { icon: Skull, accent: 'rgba(248,113,113,0.30)', text: 'text-red-300' },
  Boss: { icon: Crown, accent: 'rgba(250,204,21,0.30)', text: 'text-yellow-300' },
  Chest: { icon: Gift, accent: 'rgba(74,222,128,0.30)', text: 'text-green-300' },
  Player: { icon: User, accent: 'rgba(96,165,250,0.30)', text: 'text-blue-300' },
};

const DIFF_COLOR = { Easy: 'text-green-300', Medium: 'text-yellow-300', Hard: 'text-orange-300', Boss: 'text-red-300', None: 'text-white/40' };

// Worlds — real WorldEvent backend: live encounters, bosses and treasures across the world map
export default function WorldsSection({ accent }) {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    base44.entities.WorldEvent.list('-created_date', 60).then(setEvents);
  }, []);

  if (events === null) return <LoadingState />;
  const active = events.filter((e) => e.status === 'Active');
  const cleared = events.length - active.length;

  return (
    <SectionShell
      title="Worlds" accent={accent}
      subtitle={`Live world activity — ${active.length} active encounter${active.length === 1 ? '' : 's'}, ${cleared} cleared`}
    >
      {events.length === 0 ? (
        <EmptyState icon={Globe} message="The world is quiet. Events appear here as they spawn across the map." />
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((ev, i) => {
            const meta = TYPE_META[ev.type] || TYPE_META.Monster;
            const Icon = meta.icon;
            const isActive = ev.status === 'Active';
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}
                className={`p-5 ${isActive ? '' : 'opacity-50'}`} style={glassCard(isActive ? meta.accent : 'rgba(255,255,255,0.10)')}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={glassCard(meta.accent)}>
                    <Icon className={`w-5 h-5 ${meta.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-white font-bold text-sm truncate">{ev.name}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${isActive ? 'text-green-300' : 'text-white/40'}`}>
                        {ev.status}
                      </span>
                    </div>
                    <p className="text-white/40 text-[11px] mt-0.5">
                      {ev.type}{ev.level ? ` · Lv. ${ev.level}` : ''} · <span className={DIFF_COLOR[ev.difficulty] || 'text-white/40'}>{ev.difficulty || 'Medium'}</span>
                    </p>
                  </div>
                </div>
                {ev.description && <p className="text-white/45 text-xs mt-3 line-clamp-2">{ev.description}</p>}
                {ev.rewards?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {ev.rewards.slice(0, 3).map((r, ri) => (
                      <span key={ri} className="px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-300/90 bg-amber-500/10 border border-amber-400/25">{r}</span>
                    ))}
                  </div>
                )}
                <p className="text-white/25 text-[10px] mt-3 font-mono">◈ {Number(ev.latitude).toFixed(2)}, {Number(ev.longitude).toFixed(2)}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}