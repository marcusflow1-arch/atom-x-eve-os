import React from 'react';
import { motion } from 'framer-motion';
import { Info, Sparkles, Fingerprint, CalendarDays, Layers3, Flame } from 'lucide-react';
import GlassPanel from './GlassPanel';
import StatBar from './StatBar';
import TiltCard from './TiltCard';
import { getRarity } from './rarityTheme';

const PERKS = [
  { name: 'Momentum', desc: '+8% power after each victory' },
  { name: 'Resonance', desc: 'Boosts allied cards of the same series' },
  { name: 'Afterglow', desc: 'Retains 15% of enhancement on trade' },
];

export default function CardRecordView({ card }) {
  const r = getRarity(card?.rarity);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6 p-6 pb-10">
      {/* LEFT — hero card */}
      <div className="flex flex-col gap-5 xl:sticky xl:top-0 self-start">
        <TiltCard card={card} level={card?.level || 1} stars={card?.stars || 1} ascension={card?.ascension || 0} />

        <GlassPanel className="text-center" padded={false}>
          <div className="px-5 py-4">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">Total Power</p>
            <div className="flex items-center justify-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              <span className="text-4xl font-black text-white tabular-nums">337</span>
            </div>
          </div>
        </GlassPanel>

        <div>
          <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-2.5 px-1">Active Perks</h4>
          <div className="space-y-2">
            {PERKS.map((p) => (
              <motion.div key={p.name} whileHover={{ x: 3 }} className="group">
                <GlassPanel padded={false} hover>
                  <div className="flex items-center gap-3 px-3.5 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white/50 group-hover:text-amber-300 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-bold leading-tight">{p.name}</p>
                      <p className="text-white/40 text-[10px] leading-tight truncate">{p.desc}</p>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — record */}
      <div className="space-y-5 min-w-0">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-cyan-300" />
              <span className="text-cyan-300/80 text-[10px] font-black uppercase tracking-[0.25em]">Card Record</span>
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight leading-none">
              {card?.title || 'Unknown Card'}
            </h3>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-gradient-to-r ${r.grad} text-black/80`}>
            {card?.rarity || 'Common'}
          </span>
        </div>

        <GlassPanel>
          <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Lore</h4>
          <p className="text-white/80 text-sm italic leading-relaxed">
            “{card?.description || 'A collectible trading card with unique attributes.'}”
          </p>
        </GlassPanel>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GlassPanel>
            <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Attributes</h4>
            <div className="space-y-4">
              <StatBar label="Strength" value={85} max={100} color="from-orange-400 to-red-500" />
              <StatBar label="Magic" value={62} max={100} color="from-fuchsia-400 to-purple-500" />
              <StatBar label="Defense" value={90} max={100} color="from-sky-400 to-blue-500" />
            </div>
          </GlassPanel>

          <GlassPanel>
            <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Provenance</h4>
            <div className="space-y-3.5">
              {[
                { icon: Layers3, label: 'Series', value: card?.series || 'Unknown Series' },
                { icon: Fingerprint, label: 'Card ID', value: card?.id || 'card-preview', mono: true },
                { icon: Layers3, label: 'Type', value: 'Trading Card' },
                { icon: CalendarDays, label: 'Mint Date', value: 'Jan 12, 2026' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <row.icon className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    <span className="text-white/45 text-xs">{row.label}</span>
                  </div>
                  <span className={`text-white/90 text-xs font-semibold truncate ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}