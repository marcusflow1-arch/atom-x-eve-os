import React from 'react';

const RARITY_BASE = {
  Rare: 500,
  Epic: 1200,
  Legendary: 3000,
  Demigod: 5200,
  Mythic: 7500,
  Mythical: 7500,
  Deity: 12000,
  Chosen: 20000,
  // Legacy fallbacks while older definitions are migrated.
  Common: 100,
  Uncommon: 250,
  Unique: 9000,
  Limitless: 20000,
};

const TAX_RATE = {
  Rare: 0.05,
  Epic: 0.07,
  Legendary: 0.10,
  Demigod: 0.11,
  Mythic: 0.12,
  Mythical: 0.12,
  Deity: 0.13,
  Chosen: 0.15,
  Common: 0.02,
  Uncommon: 0.03,
  Unique: 0.12,
  Limitless: 0.15,
};

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function progression(card = {}) {
  const p = card.progression || {};
  return {
    enhancement: Math.max(0, Math.min(120, number(card.enhancement_percent ?? p.enhancement_percent))),
    ascension: Math.max(0, Math.min(5, number(card.ascension ?? p.ascension))),
    stack: Math.max(1, Math.min(4, number(card.stack_level ?? p.stack_level, 1))),
    mastery: card.mastery_visual || p.mastery_visual || '',
  };
}

// Market value is an estimate, not an authoritative price. It intentionally
// reflects the visible work invested in the exact collectible instance.
export function calculateMarketValue(card) {
  if (!card) return 0;
  const rarity = card.playable_tier || card.rarity || card.card_rarity || 'Rare';
  let value = RARITY_BASE[rarity] || RARITY_BASE.Rare;
  const p = progression(card);

  // Current 0-120% enhancement work.
  value *= 1 + (p.enhancement / 120) * 0.30;
  // Each completed Ascension represents a full 120% cycle whose stats were
  // permanently retained, so it has strong collectible/labor value.
  value *= Math.pow(1.35, p.ascension);
  // Duplicate copies were consumed to build Stack Level.
  value *= 1 + (p.stack - 1) * 0.25;
  if (p.mastery === 'holographic_3d' || p.ascension >= 5) value *= 1.25;

  if (card.is_seasonal) value *= 1.5;
  if (card.is_event_exclusive) value *= 2;
  return Math.floor(value);
}

export function calculateTradeTax(card, salePrice) {
  const rarity = card?.playable_tier || card?.rarity || card?.card_rarity || 'Rare';
  return Math.floor(number(salePrice) * (TAX_RATE[rarity] || 0.05));
}

export function canTradeCard(card, lastTradeDate) {
  if (card.is_bound) return { canTrade: false, reason: 'Card is account-bound' };
  if (card.is_starter || card.starter_grant_user_id) return { canTrade: false, reason: 'Starter cards cannot be traded' };
  if (card.is_story_locked) return { canTrade: false, reason: 'Story cards cannot be traded' };
  if (card.is_equipped || (card.equipped_to && card.equipped_to !== 'none')) return { canTrade: false, reason: 'Unequip the card before trading it' };
  if (card.trade_status === 'locked_in_trade') return { canTrade: false, reason: 'Card is already reserved in another trade' };

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

export function MarketValueDisplay({ card, showTrend = true, size = 'normal' }) {
  const value = calculateMarketValue(card);
  const tax = calculateTradeTax(card, value);
  const isSmall = size === 'small';
  return (
    <div className={`rounded-xl ${isSmall ? 'p-3' : 'p-4'}`} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-white/60 ${isSmall ? 'text-xs' : 'text-sm'}`}>Estimated Market Value</span>
        {showTrend && <span className="text-[10px] uppercase tracking-wider text-white/25">Instance value</span>}
      </div>
      <div className={`font-bold text-white ${isSmall ? 'text-xl' : 'text-2xl'}`}>{value.toLocaleString()} 🪙</div>
      {!isSmall && <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-xs"><span className="text-white/40">Trade Tax</span><span className="text-orange-400">{tax.toLocaleString()} 🪙</span></div>}
    </div>
  );
}

export function ValueBreakdown({ card }) {
  const rarity = card?.playable_tier || card?.rarity || card?.card_rarity || 'Rare';
  const p = progression(card);
  const factors = [
    { label: 'Playable Tier', value: rarity, contribution: `+${(RARITY_BASE[rarity] || RARITY_BASE.Rare).toLocaleString()}` },
    { label: 'Enhancement', value: `${p.enhancement}/120%`, contribution: `×${(1 + (p.enhancement / 120) * 0.30).toFixed(2)}` },
    { label: 'Ascension', value: `${p.ascension}/5`, contribution: `×${Math.pow(1.35, p.ascension).toFixed(2)}` },
    { label: 'Stack Level', value: `${p.stack}/4`, contribution: `×${(1 + (p.stack - 1) * 0.25).toFixed(2)}` },
  ];
  if (p.mastery === 'holographic_3d' || p.ascension >= 5) factors.push({ label: 'Mastery', value: 'Holographic 3D', contribution: '×1.25' });

  return (
    <div className="space-y-2">
      <h4 className="mb-3 text-xs uppercase tracking-wider text-white/60">Value Breakdown</h4>
      {factors.map((factor) => <div key={factor.label} className="flex items-center justify-between text-sm"><span className="text-white/60">{factor.label}</span><div className="flex items-center gap-3"><span className="text-white">{factor.value}</span><span className="text-xs text-green-400">{factor.contribution}</span></div></div>)}
      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2"><span className="font-semibold text-white">Total Estimate</span><span className="font-bold text-yellow-400">{calculateMarketValue(card).toLocaleString()} 🪙</span></div>
    </div>
  );
}
