import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, ArrowLeftRight, BadgeCheck, Check, Clock, Crown, History,
  Layers3, Shield, Sparkles, Tag, TrendingUp, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateMarketValue, calculateTradeTax, canTradeCard, ValueBreakdown } from './MarketValuation';
import { MATERIAL_INFO } from './MaterialSystem';

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
    passportId: card.passport_id || p.passport_id || card.passport?.passport_id || '',
  };
}

function CardSummary({ card }) {
  const p = progression(card);
  const tier = card.playable_tier || card.rarity || card.card_rarity || 'Rare';
  const mastered = p.mastery === 'holographic_3d' || p.ascension >= 5;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between gap-4"><span className="text-white/50">Playable Tier</span><strong className="text-white">{tier}</strong></div>
      <div className="flex justify-between gap-4"><span className="text-white/50">Enhancement</span><strong className="text-cyan-200">{p.enhancement}/120%</strong></div>
      <div className="flex justify-between gap-4"><span className="text-white/50">Ascension</span><span className="inline-flex items-center gap-1 text-amber-200"><Crown className="h-3.5 w-3.5" />A{p.ascension}/5</span></div>
      <div className="flex justify-between gap-4"><span className="text-white/50">Stack Level</span><span className="inline-flex items-center gap-1 text-violet-200"><Layers3 className="h-3.5 w-3.5" />{p.stack}/4</span></div>
      <div className="flex justify-between gap-4"><span className="text-white/50">Mastery</span><span className={mastered ? 'text-cyan-100' : 'text-white/70'}>{mastered ? 'Holographic 3D' : 'In progress'}</span></div>
      <div className="border-t border-white/[0.06] pt-2">
        <span className="block text-[9px] uppercase tracking-[.15em] text-white/30">Digital Passport</span>
        <code className="mt-1 block truncate text-[10px] text-emerald-100/70">{p.passportId || 'Assigned when the card instance is registered'}</code>
      </div>
    </div>
  );
}

function PassportHistory({ card }) {
  const events = useMemo(() => card.passport_events || card.passport?.events || [], [card]);
  if (!events.length) {
    return <div className="rounded-xl bg-black/25 p-4 text-xs leading-5 text-white/35">No passport events were supplied to this panel. The authoritative ownership and progression history remains attached to the card's Digital Passport.</div>;
  }
  return (
    <div className="space-y-1 rounded-xl bg-black/25 p-3">
      {[...events].reverse().slice(0, 8).map((entry, index) => (
        <div key={`${entry.sequence || index}-${entry.event_hash || entry.timestamp || index}`} className="grid grid-cols-[38px_1fr_auto] gap-3 border-b border-white/[0.05] py-2 last:border-0">
          <span className="font-mono text-[9px] text-white/25">#{entry.sequence || events.length - index}</span>
          <div className="min-w-0"><strong className="block truncate text-[10px] uppercase tracking-[.1em] text-white/65">{String(entry.event_type || 'card event').replaceAll('_', ' ')}</strong>{entry.event_hash && <span className="mt-1 block truncate font-mono text-[8px] text-white/20">{entry.event_hash}</span>}</div>
          <span className="text-[8px] text-white/25">{entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''}</span>
        </div>
      ))}
    </div>
  );
}

export default function TradingPanel({ card, onClose, onListCard }) {
  const [listingType, setListingType] = useState('fixed_price');
  const [askingPrice, setAskingPrice] = useState(calculateMarketValue(card));
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const tradeCheck = canTradeCard(card, card.last_trade_date);
  const marketValue = calculateMarketValue(card);
  const tax = calculateTradeTax(card, askingPrice);
  const netProceeds = Math.max(0, askingPrice - tax);
  const p = progression(card);

  const handleListCard = () => {
    if (!tradeCheck.canTrade) return;
    onListCard?.({
      card_id: card.id,
      listing_type: listingType,
      asking_price: listingType === 'fixed_price' || listingType === 'auction' ? askingPrice : null,
      asking_materials: listingType === 'trade_offer' ? selectedMaterials : null,
      market_value_score: marketValue,
      card_snapshot: {
        name: card.title || card.name || card.card_name,
        rarity: card.playable_tier || card.rarity || card.card_rarity,
        playable_tier: card.playable_tier || card.rarity || card.card_rarity,
        enhancement_percent: p.enhancement,
        ascension: p.ascension,
        stack_level: p.stack,
        mastery_visual: p.mastery,
        passport_id: p.passportId,
        origin_game: card.series || card.game_name,
        image: card.image || card.card_image,
      },
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-5 md:p-8" style={{ background: 'rgba(0,0,0,.82)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0c1119]/98 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06]"><ArrowLeftRight className="h-5 w-5 text-cyan-200" /></div>
            <div><p className="text-[8px] font-black uppercase tracking-[.22em] text-cyan-200/55">Card System v2</p><h2 className="mt-1 text-lg font-black text-white">List this exact card instance</h2></div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.04] text-white/45 hover:text-white" aria-label="Close trade panel"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[240px_minmax(0,1fr)] md:p-6">
          <aside>
            <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#080d14]">
              {(card.image || card.card_image) ? <img src={card.image || card.card_image} alt={card.title || card.name || card.card_name || 'Card'} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_30%_10%,rgba(34,211,238,.14),transparent_35%),linear-gradient(150deg,#111827,#05070c)]" />}
            </div>
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><CardSummary card={card} /></div>
            <div className={`mt-3 rounded-xl border p-3 ${tradeCheck.canTrade ? 'border-emerald-300/15 bg-emerald-300/[0.04]' : 'border-rose-300/15 bg-rose-300/[0.04]'}`}>
              {tradeCheck.canTrade ? <div className="flex items-center gap-2 text-xs text-emerald-200"><Check className="h-4 w-4" /> Tradable instance</div> : <div className="flex items-center gap-2 text-xs text-rose-200"><AlertTriangle className="h-4 w-4" /> {tradeCheck.reason}</div>}
            </div>
          </aside>

          <main className="space-y-5">
            <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.025] p-4 text-xs leading-5 text-cyan-50/55">
              <div className="mb-1 flex items-center gap-2 text-cyan-100"><BadgeCheck className="h-4 w-4" /><strong>Progression follows ownership.</strong></div>
              A sale or player trade transfers this UserCard instance with its Enhancement, Ascension, Stack Level and Digital Passport history. The buyer does not receive a reset copy.
            </div>

            <div>
              <label className="mb-3 block text-[9px] font-bold uppercase tracking-[.16em] text-white/35">Listing Type</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { id: 'fixed_price', label: 'Fixed Price', icon: Tag },
                  { id: 'auction', label: 'Auction', icon: Clock },
                  { id: 'trade_offer', label: 'Trade for Materials', icon: ArrowLeftRight },
                ].map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setListingType(id)} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs transition ${listingType === id ? 'border-cyan-300/35 bg-cyan-300/[0.07] text-cyan-100' : 'border-white/[0.07] bg-white/[0.025] text-white/45 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>)}
              </div>
            </div>

            {listingType !== 'trade_offer' ? (
              <div>
                <label className="mb-2 block text-[9px] font-bold uppercase tracking-[.16em] text-white/35">{listingType === 'auction' ? 'Starting Price' : 'Asking Price'}</label>
                <div className="flex items-center rounded-xl border border-white/[0.07] bg-black/20 px-3"><input type="number" min="0" value={askingPrice} onChange={(event) => setAskingPrice(Math.max(0, parseInt(event.target.value, 10) || 0))} className="h-12 min-w-0 flex-1 bg-transparent text-lg font-bold text-white outline-none" /><span className="text-sm text-amber-200">AGP</span></div>
                <div className="mt-2 flex items-center gap-3 text-xs"><span className="text-white/35">Estimated instance value</span><strong className="text-white/75">{marketValue.toLocaleString()} AGP</strong>{askingPrice > marketValue * 1.2 && <Badge className="border-amber-300/20 bg-amber-300/[0.06] text-amber-200"><TrendingUp className="mr-1 h-3 w-3" />Above estimate</Badge>}</div>
              </div>
            ) : (
              <div>
                <label className="mb-3 block text-[9px] font-bold uppercase tracking-[.16em] text-white/35">Materials Wanted</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{Object.entries(MATERIAL_INFO).slice(0, 6).map(([type, info]) => {
                  const selected = selectedMaterials.some((material) => material.type === type);
                  return <button key={type} type="button" onClick={() => setSelectedMaterials((previous) => selected ? previous.filter((material) => material.type !== type) : [...previous, { type, quantity: 5 }])} className={`rounded-xl border p-3 text-left transition ${selected ? 'border-cyan-300/30 bg-cyan-300/[0.06]' : 'border-white/[0.07] bg-white/[0.02]'}`}><span className="text-lg">{info.icon}</span><span className="ml-2 text-[10px] text-white/55">{info.name}</span></button>;
                })}</div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><ValueBreakdown card={card} /></div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex justify-between text-sm"><span className="text-white/45">Listing Price</span><span className="text-white">{askingPrice.toLocaleString()} AGP</span></div>
                <div className="mt-2 flex justify-between text-sm"><span className="text-white/45">Trade Tax</span><span className="text-orange-300">-{tax.toLocaleString()} AGP</span></div>
                <div className="mt-3 flex justify-between border-t border-white/[0.07] pt-3"><strong className="text-white/75">You Receive</strong><strong className="text-emerald-200">{netProceeds.toLocaleString()} AGP</strong></div>
              </div>
            </div>

            <button type="button" onClick={() => setShowHistory((value) => !value)} className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-white/55 hover:text-white"><span className="flex items-center gap-2 text-xs"><History className="h-4 w-4" /> Digital Passport history</span><span className="text-[9px] uppercase tracking-wider text-white/30">{showHistory ? 'Hide' : 'Show'}</span></button>
            <AnimatePresence>{showHistory && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><PassportHistory card={card} /></motion.div>}</AnimatePresence>

            {p.ascension >= 5 && <div className="flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-3 text-[10px] uppercase tracking-[.12em] text-cyan-100"><Sparkles className="h-4 w-4" /> Holographic mastery is part of this traded instance.</div>}

            <Button onClick={handleListCard} disabled={!tradeCheck.canTrade} className={`w-full py-6 text-base font-bold ${tradeCheck.canTrade ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600' : 'cursor-not-allowed bg-white/10 text-white/30'}`}><Shield className="mr-2 h-5 w-5" />List Card Instance</Button>
          </main>
        </div>
      </motion.div>
    </motion.div>
  );
}
