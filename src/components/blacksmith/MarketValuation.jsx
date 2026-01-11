import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Market value calculation based on card attributes
export function calculateMarketValue(card) {
  if (!card) return 0;

  // Base values by rarity
  const rarityBase = {
    'Common': 100,
    'Uncommon': 250,
    'Rare': 500,
    'Epic': 1200,
    'Legendary': 3000,
    'Mythic': 7500
  };

  let value = rarityBase[card.rarity] || 100;

  // Level multiplier (exponential scaling)
  const level = card.level || 1;
  value *= Math.pow(1.15, level - 1);

  // Enhancement depth bonus
  const enhancedStats = card.enhanced_stats || {};
  const enhancementTotal = Object.values(enhancedStats).reduce((a, b) => a + b, 0);
  value *= (1 + enhancementTotal * 0.02);

  // Ascension multiplier (exponential)
  const ascension = card.ascension || 0;
  value *= Math.pow(1.5, ascension);

  // Star rating bonus
  const stars = card.stars || 1;
  value *= (1 + (stars - 1) * 0.25);

  // Origin achievement difficulty bonus
  const achievementDifficulty = {
    'Common': 1,
    'Uncommon': 1.1,
    'Rare': 1.25,
    'Epic': 1.5,
    'Legendary': 2,
    'Mythic': 3
  };
  value *= achievementDifficulty[card.origin_achievement_rarity] || 1;

  // Seasonal/Event exclusivity
  if (card.is_seasonal) value *= 1.5;
  if (card.is_event_exclusive) value *= 2;

  return Math.floor(value);
}

// Trade tax calculation based on rarity
export function calculateTradeTax(card, salePrice) {
  const taxRates = {
    'Common': 0.02,
    'Uncommon': 0.03,
    'Rare': 0.05,
    'Epic': 0.07,
    'Legendary': 0.10,
    'Mythic': 0.12
  };
  return Math.floor(salePrice * (taxRates[card.rarity] || 0.05));
}

// Check if card can be traded (cooldown, bound status)
export function canTradeCard(card, lastTradeDate) {
  if (card.is_bound) return { canTrade: false, reason: 'Card is account-bound' };
  if (card.is_starter) return { canTrade: false, reason: 'Starter cards cannot be traded' };
  if (card.is_story_locked) return { canTrade: false, reason: 'Story cards cannot be traded' };

  // 24-hour flip cooldown
  if (lastTradeDate) {
    const cooldownEnd = new Date(lastTradeDate);
    cooldownEnd.setHours(cooldownEnd.getHours() + 24);
    if (new Date() < cooldownEnd) {
      const hoursLeft = Math.ceil((cooldownEnd - new Date()) / (1000 * 60 * 60));
      return { canTrade: false, reason: `Trade cooldown: ${hoursLeft}h remaining` };
    }
  }

  return { canTrade: true };
}

// Market Value Display Component
export function MarketValueDisplay({ card, showTrend = true, size = 'normal' }) {
  const value = calculateMarketValue(card);
  const tax = calculateTradeTax(card, value);
  
  // Mock trend data (would come from market history in real app)
  const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';
  const trendPercent = Math.floor(Math.random() * 15) + 1;

  const isSmall = size === 'small';

  return (
    <div className={`rounded-xl ${isSmall ? 'p-3' : 'p-4'}`} style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-white/60 ${isSmall ? 'text-xs' : 'text-sm'}`}>Market Value</span>
        {showTrend && (
          <div className={`flex items-center gap-1 ${
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-white/40'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
             trend === 'down' ? <TrendingDown className="w-3 h-3" /> : 
             <Minus className="w-3 h-3" />}
            <span className="text-xs">{trendPercent}%</span>
          </div>
        )}
      </div>
      
      <div className={`text-white font-bold ${isSmall ? 'text-xl' : 'text-2xl'}`}>
        {value.toLocaleString()} 🪙
      </div>
      
      {!isSmall && (
        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-xs">
          <span className="text-white/40">Trade Tax</span>
          <span className="text-orange-400">{tax.toLocaleString()} 🪙</span>
        </div>
      )}
    </div>
  );
}

// Value breakdown for detailed view
export function ValueBreakdown({ card }) {
  const factors = [
    { label: 'Base Rarity', value: card.rarity, contribution: '+' + (calculateMarketValue({ rarity: card.rarity }) || 0) },
    { label: 'Level', value: card.level || 1, contribution: `×${Math.pow(1.15, (card.level || 1) - 1).toFixed(2)}` },
    { label: 'Ascension', value: card.ascension || 0, contribution: `×${Math.pow(1.5, card.ascension || 0).toFixed(2)}` },
    { label: 'Stars', value: `${card.stars || 1}/5`, contribution: `×${(1 + ((card.stars || 1) - 1) * 0.25).toFixed(2)}` },
  ];

  const enhancedStats = card.enhanced_stats || {};
  const enhancementTotal = Object.values(enhancedStats).reduce((a, b) => a + b, 0);
  if (enhancementTotal > 0) {
    factors.push({ label: 'Enhancements', value: `+${enhancementTotal}`, contribution: `×${(1 + enhancementTotal * 0.02).toFixed(2)}` });
  }

  return (
    <div className="space-y-2">
      <h4 className="text-white/60 text-xs uppercase tracking-wider mb-3">Value Breakdown</h4>
      {factors.map((factor, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className="text-white/60">{factor.label}</span>
          <div className="flex items-center gap-3">
            <span className="text-white">{factor.value}</span>
            <span className="text-green-400 text-xs">{factor.contribution}</span>
          </div>
        </div>
      ))}
      <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
        <span className="text-white font-semibold">Total Value</span>
        <span className="text-yellow-400 font-bold">{calculateMarketValue(card).toLocaleString()} 🪙</span>
      </div>
    </div>
  );
}