import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trophy, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function FarmCardBrowser({ gameTitle, selectedCard, onSelectCard }) {
  const [search, setSearch] = useState('');

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['farm-achievements', gameTitle],
    queryFn: () => base44.entities.Achievement.filter({ game: gameTitle }),
    enabled: !!gameTitle,
  });

  const filtered = useMemo(() => {
    if (!search) return achievements;
    const q = search.toLowerCase();
    return achievements.filter(a => 
      a.title.toLowerCase().includes(q) || 
      (a.category || '').toLowerCase().includes(q) ||
      (a.rarity || '').toLowerCase().includes(q)
    );
  }, [achievements, search]);

  const RARITY_COLORS = {
    Common: 'border-white/10 text-white/50',
    Uncommon: 'border-green-500/30 text-green-400',
    Rare: 'border-blue-500/30 text-blue-400',
    Epic: 'border-purple-500/30 text-purple-400',
    Legendary: 'border-yellow-500/30 text-yellow-400',
    Mythical: 'border-red-500/30 text-red-400',
    Unique: 'border-cyan-500/30 text-cyan-400',
    Limitless: 'border-pink-500/30 text-pink-400',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pb-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <Input
            className="w-full h-8 pl-8 pr-8 text-xs rounded-lg bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20 focus:border-cyan-500/30"
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="text-[10px] text-white/25 mt-2 px-0.5">
          {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Card List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-white/20 text-xs">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
            {search ? 'No matches' : 'No achievements found'}
          </div>
        ) : (
          filtered.map((card, i) => {
            const isSelected = selectedCard?.id === card.id;
            const rarityClass = RARITY_COLORS[card.rarity] || RARITY_COLORS.Common;
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                onClick={() => onSelectCard(card)}
                className={`w-full text-left p-2.5 rounded-lg transition-all duration-150 flex items-center gap-3 group ${
                  isSelected
                    ? 'bg-white/[0.08] border border-cyan-500/20'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 border ${rarityClass}`}
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  {card.icon || '🏆'}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate transition-colors ${isSelected ? 'text-white' : 'text-white/70 group-hover:text-white/90'}`}>
                    {card.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold ${rarityClass}`}>{card.rarity}</span>
                    {card.points && <span className="text-[10px] text-white/25">{card.points} pts</span>}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}