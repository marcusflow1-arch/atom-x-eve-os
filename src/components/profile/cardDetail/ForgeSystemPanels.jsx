import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Merge, Crown, Lock, Check, ChevronRight, ArrowLeftRight, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassPanel from './GlassPanel';
import { ValueBreakdown } from '@/components/blacksmith/MarketValuation';

const FALLBACK = 'https://images.unsplash.com/photo-1627856014759-2a5713c54d65?q=80&w=1000&auto=format&fit=crop';
const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

export const LevelPanel = ({ cardLevel, maxLevel, baseStats, canLevelUp, isUpgrading, levelCost, onLevelUp }) => (
  <motion.div key="level" {...fade} className="h-full flex flex-col">
    <div className="flex items-end justify-between mb-5">
      <div>
        <h4 className="text-white font-black text-xl tracking-tight">Level Up</h4>
        <p className="text-white/45 text-sm">Raise the card's base stat floor.</p>
      </div>
      <div className="text-right">
        <span className="text-white/35 text-[10px] font-bold uppercase tracking-[0.2em] block">Current</span>
        <span className="text-white font-black text-2xl tabular-nums">{cardLevel}<span className="text-white/35 text-base"> / {maxLevel}</span></span>
      </div>
    </div>

    <div className="h-2.5 rounded-full overflow-hidden bg-black/40 border border-white/10 mb-7">
      <motion.div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" initial={{ width: 0 }} animate={{ width: `${(cardLevel / maxLevel) * 100}%` }} />
    </div>

    <div className="grid grid-cols-3 gap-4 mb-7">
      {Object.entries(baseStats).filter(([k]) => k !== 'power').map(([stat, value]) => (
        <GlassPanel key={stat} padded={false}>
          <div className="p-4">
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.18em]">{stat}</span>
            <div className="text-white font-black text-2xl mt-1 tabular-nums">{value}</div>
            {canLevelUp && (
              <div className="text-emerald-400 text-[11px] font-bold mt-1 flex items-center">
                <ArrowUp className="w-3 h-3 mr-1" /> +{stat === 'attack' ? 15 : 10}
              </div>
            )}
          </div>
        </GlassPanel>
      ))}
    </div>

    <div className="mt-auto">
      <Button onClick={onLevelUp} disabled={!canLevelUp || isUpgrading}
        className={`w-full h-14 text-base font-black tracking-wide rounded-xl ${canLevelUp ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-90 text-black' : 'bg-white/10 text-white/30'}`}>
        {isUpgrading ? <Sparkles className="w-5 h-5 animate-spin" /> : cardLevel >= maxLevel ? 'Ascend to Continue' : `Level Up · ${levelCost.toLocaleString()} 🪙`}
      </Button>
    </div>
  </motion.div>
);

export const EnhancePanel = ({ enhancedStats, isUpgrading, onEnhance }) => (
  <motion.div key="enhance" {...fade} className="h-full flex flex-col">
    <h4 className="text-white font-black text-xl tracking-tight">Enhancement</h4>
    <p className="text-white/45 text-sm mb-6">Amplify a single stat using refined materials.</p>
    <div className="space-y-3">
      {['attack', 'defense', 'magic'].map((stat) => (
        <GlassPanel key={stat} padded={false} hover>
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-white font-bold capitalize">{stat}</p>
              <p className="text-white/45 text-xs">+{enhancedStats[stat]} enhanced so far</p>
            </div>
            <Button onClick={() => onEnhance(stat)} disabled={isUpgrading}
              className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90 text-white font-bold">
              <Sparkles className="w-4 h-4 mr-2" /> +10 · 500 🪙
            </Button>
          </div>
        </GlassPanel>
      ))}
    </div>
  </motion.div>
);

export const CombinePanel = ({ cardStars, duplicates, card, selectedDuplicates, setSelectedDuplicates, isUpgrading, onCombine, StarIcon }) => (
  <motion.div key="combine" {...fade} className="h-full flex flex-col">
    <h4 className="text-white font-black text-xl tracking-tight">Combine Duplicates</h4>
    <p className="text-white/45 text-sm mb-5">Merge copies to raise the star rating.</p>

    <div className="flex justify-center gap-2 mb-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={i} className={`w-8 h-8 ${i < cardStars ? 'text-amber-300 fill-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.5)]' : 'text-white/15'}`} />
      ))}
    </div>

    <div className="grid grid-cols-4 gap-3 mb-6">
      {duplicates.map((dup) => {
        const on = selectedDuplicates.includes(dup.id);
        return (
          <motion.button key={dup.id} whileHover={{ y: -4 }} onClick={() => setSelectedDuplicates((prev) => prev.includes(dup.id) ? prev.filter((id) => id !== dup.id) : [...prev, dup.id])}
            className={`aspect-[2.5/3.5] rounded-xl overflow-hidden relative transition-all ${on ? 'ring-2 ring-amber-300 shadow-[0_0_20px_rgba(252,211,77,0.35)]' : 'ring-1 ring-white/10'}`}>
            <img src={card?.image || FALLBACK} className={`w-full h-full object-cover ${on ? 'opacity-90' : 'opacity-50'}`} alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <span className="absolute bottom-1.5 left-2 text-white/80 text-[10px] font-bold">Lv. {dup.level}</span>
            {on && <div className="absolute inset-0 bg-amber-400/15 flex items-center justify-center"><Check className="w-8 h-8 text-amber-300" /></div>}
          </motion.button>
        );
      })}
    </div>

    <Button onClick={onCombine} disabled={selectedDuplicates.length < 1 || cardStars >= 5 || isUpgrading}
      className="mt-auto w-full h-14 text-base font-black rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:opacity-90 text-black disabled:bg-white/10 disabled:text-white/30">
      <Merge className="w-5 h-5 mr-2" /> Combine Selected
    </Button>
  </motion.div>
);

export const AscendPanel = ({ cardAscension, canAscend, isUpgrading, ascensionCost, onAscend }) => (
  <motion.div key="ascend" {...fade} className="h-full flex flex-col">
    <h4 className="text-white font-black text-xl tracking-tight">Ascension</h4>
    <p className="text-white/45 text-sm mb-6">Break the level cap and unlock new potential.</p>

    <div className="flex justify-center gap-3 mb-7">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${i < cardAscension ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600 border-purple-300/40 shadow-[0_0_20px_rgba(192,132,252,0.4)]' : 'bg-white/[0.04] border-white/10'}`}>
          {i < cardAscension ? <Crown className="w-6 h-6 text-white" /> : <Lock className="w-5 h-5 text-white/25" />}
        </div>
      ))}
    </div>

    <GlassPanel className="mb-6">
      <h5 className="text-fuchsia-300 font-bold text-sm mb-3">Next Ascension Benefits</h5>
      <ul className="space-y-2 text-sm text-white/70">
        <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-fuchsia-400 flex-shrink-0" /> Level cap +10</li>
        <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-fuchsia-400 flex-shrink-0" /> All stats +20%</li>
      </ul>
    </GlassPanel>

    <Button onClick={onAscend} disabled={!canAscend || isUpgrading}
      className="mt-auto w-full h-14 text-base font-black rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90 text-white disabled:bg-white/10 disabled:text-white/30">
      <Crown className="w-5 h-5 mr-2" /> Ascend · {ascensionCost.toLocaleString()} 🪙
    </Button>
  </motion.div>
);

export const TradePanelView = ({ liveCard, onOpenTrade }) => (
  <motion.div key="trade" {...fade} className="h-full flex flex-col">
    <h4 className="text-white font-black text-xl tracking-tight">Trade Card</h4>
    <p className="text-white/45 text-sm mb-6">Review valuation, then list it on the marketplace.</p>
    <div className="mb-6"><ValueBreakdown card={liveCard} /></div>
    <Button onClick={onOpenTrade} className="mt-auto w-full h-14 text-base font-black rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-black">
      <ArrowLeftRight className="w-5 h-5 mr-2" /> Open Trade Panel
    </Button>
  </motion.div>
);