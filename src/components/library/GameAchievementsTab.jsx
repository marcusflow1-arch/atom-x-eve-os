import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Trophy, ScrollText, Rocket, Newspaper, Sparkles, ChevronRight, ArrowUpCircle } from 'lucide-react';

const questUpdates = [
  {
    title: 'Main Quest: Into the Rift',
    status: 'In Progress',
    detail: 'Reach the lower district gate and scan the relay tower.',
    update: 'Objective updated 2 hours ago'
  },
  {
    title: 'Side Quest: Signal Recovery',
    status: 'New',
    detail: 'Recover three missing beacon fragments in the eastern zone.',
    update: 'New quest added in the latest patch'
  },
  {
    title: 'Weekly Task: Elite Sweep',
    status: 'Tracked',
    detail: 'Clear 5 elite enemy encounters before reset.',
    update: 'Weekly refresh in 3 days'
  }
];

const systemUpdates = [
  {
    title: 'Patch 2.4 Content Update',
    type: 'Patch Notes',
    detail: 'New missions, balance tuning, and inventory quality-of-life improvements.'
  },
  {
    title: 'Season Event Live',
    type: 'Live Event',
    detail: 'Limited-time rewards, rotating challenge board, and bonus XP weekend.'
  }
];

const achievementCards = [
  {
    id: 1,
    title: 'First Breach',
    rarity: 'Rare',
    owned: true,
    progress: 'Unlocked',
    upgrade: 'Upgrade to Tier II'
  },
  {
    id: 2,
    title: 'Vault Runner',
    rarity: 'Epic',
    owned: false,
    progress: '7 / 10 objectives',
    upgrade: 'Upgrade path available after unlock'
  },
  {
    id: 3,
    title: 'Systems Ghost',
    rarity: 'Legendary',
    owned: true,
    progress: 'Unlocked',
    upgrade: 'Upgrade to Master Frame'
  },
  {
    id: 4,
    title: 'Archive Hunter',
    rarity: 'Rare',
    owned: false,
    progress: '2 / 5 records found',
    upgrade: 'Upgrade path locked'
  }
];

const gameContent = [
  {
    title: 'Content Drop: Neon District',
    subtitle: 'News Release',
    body: 'Explore a newly opened district with added encounters, vendors, and exploration rewards.'
  },
  {
    title: 'Developer Update',
    subtitle: 'System Update',
    body: 'Combat pacing, loot tuning, and UI clarity updates were deployed for this game.'
  },
  {
    title: 'Featured Content Roadmap',
    subtitle: 'Upcoming Content',
    body: 'Preview the next release wave with event rotations, card sets, and questline expansions.'
  }
];

const rarityClasses = {
  Rare: 'bg-sky-500/10 text-sky-300 border-sky-400/30',
  Epic: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-400/30',
  Legendary: 'bg-amber-500/10 text-amber-300 border-amber-400/30'
};

export default function GameAchievementsTab({ game }) {
  const [selectedCardId, setSelectedCardId] = useState(achievementCards[0].id);

  const selectedCard = useMemo(
    () => achievementCards.find((card) => card.id === selectedCardId) || achievementCards[0],
    [selectedCardId]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="p-6 md:p-8 space-y-6"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-3xl border border-cyan-400/15 bg-white/[0.03] p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Quests & System Updates</h3>
              <p className="text-sm text-white/45">Tracked quests, quest updates, and game update notices.</p>
            </div>
          </div>

          <div className="space-y-3">
            {questUpdates.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h4 className="text-white font-semibold">{item.title}</h4>
                  <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-400/20">{item.status}</Badge>
                </div>
                <p className="text-sm text-white/65 leading-relaxed">{item.detail}</p>
                <p className="text-xs text-white/35 mt-3">{item.update}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-1">
            {systemUpdates.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="w-4 h-4 text-violet-300" />
                  <span className="text-xs uppercase tracking-[0.2em] text-white/40">{item.type}</span>
                </div>
                <h4 className="text-white font-semibold">{item.title}</h4>
                <p className="text-sm text-white/60 mt-2">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-400/15 bg-white/[0.03] p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Achievement Cards</h3>
              <p className="text-sm text-white/45">Owned, missing, and upgrade-ready achievement cards for {game?.title || 'this game'}.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievementCards.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  selectedCardId === card.id
                    ? 'border-amber-400/30 bg-amber-500/10 shadow-[0_0_18px_rgba(250,204,21,0.08)]'
                    : 'border-white/10 bg-black/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-white font-semibold">{card.title}</p>
                    <p className="text-xs text-white/40 mt-1">{card.progress}</p>
                  </div>
                  <Badge className={rarityClasses[card.rarity]}>{card.rarity}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={card.owned ? 'text-emerald-300' : 'text-white/35'}>
                    {card.owned ? 'Owned' : 'Not owned'}
                  </span>
                  <span className="text-white/35 flex items-center gap-1">
                    Select <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p className="text-white font-semibold">{selectedCard.title}</p>
                <p className="text-xs text-white/40 mt-1">Clicking a card opens its upgrade action.</p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <p className="text-sm text-white/60 mb-4">
              {selectedCard.owned
                ? 'This card can be upgraded to improve its value, tier, or presentation.'
                : 'Unlock this card first, then return here to upgrade it.'}
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/25 text-amber-200 font-medium transition-all">
              <ArrowUpCircle className="w-4 h-4" />
              {selectedCard.upgrade}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Newspaper className="w-5 h-5 text-cyan-300" />
          <div>
            <h3 className="text-xl font-bold text-white">Game Content</h3>
            <p className="text-sm text-white/45">News releases, content drops, and preferred content updates for the game.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {gameContent.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">{item.subtitle}</p>
              <h4 className="text-white font-semibold mb-2">{item.title}</h4>
              <p className="text-sm text-white/60 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}