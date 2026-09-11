import React, { useEffect, useState } from 'react';
import { ArrowRight, BadgeDollarSign, Gem, Store, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function StoreMarketBridge() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ sellable: 0, listed: 0, rare: 0, balance: 0 });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const me = await base44.auth.me();
        const [cards, listings] = await Promise.all([
          base44.entities.UserCard.filter({ user_id: me.id }, '-created_date', 500),
          base44.entities.CardTrade.filter({ status: 'active' }, '-created_date', 500)
        ]);
        if (!active) return;
        const sellable = cards.filter(c => !c.is_equipped && c.trade_status !== 'locked_in_trade');
        setStats({
          sellable: sellable.length,
          listed: listings.length,
          rare: listings.filter(l => ['Epic','Legendary','Mythic','Mythical','Unique','Limitless'].includes(l.card_snapshot?.rarity)).length,
          balance: Number(me.avatar_gamer_points || 0)
        });
      } catch {}
    }
    load();
    const unsub = base44.entities.CardTrade?.subscribe?.(load);
    return () => { active = false; unsub?.(); };
  }, []);

  return <section className="border border-white/[0.08] bg-white/[0.018] overflow-hidden">
    <div className="grid xl:grid-cols-[1.15fr_1fr]">
      <div className="p-6 lg:p-7 border-b xl:border-b-0 xl:border-r border-white/[0.07] bg-[radial-gradient(circle_at_5%_20%,rgba(34,211,238,.08),transparent_35%)]">
        <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.22em] text-cyan-300/65"><Store className="w-3.5 h-3.5"/>Connected Economy</div>
        <h2 className="text-2xl font-black text-white mt-3">Your collection has a market life.</h2>
        <p className="text-xs text-white/40 mt-3 max-w-2xl leading-relaxed">Achievement cards are not dead inventory. See what you can sell, discover what other players forged, or walk into the Trade Post convention floor to buy and trade live cards.</p>
        <button onClick={() => navigate(`${createPageUrl('Store')}?mode=trading`)} className="mt-5 h-10 px-4 bg-cyan-300 text-slate-950 text-[9px] uppercase tracking-[.15em] font-black">Enter Trade Post <ArrowRight className="w-3.5 h-3.5 inline ml-2"/></button>
      </div>
      <div className="grid sm:grid-cols-2 gap-px bg-white/[0.06]">{[[WalletCards,'Sellable now',stats.sellable],[BadgeDollarSign,'Live booths',stats.listed],[Gem,'Epic+ finds',stats.rare],[Store,'Wallet',`${stats.balance.toLocaleString()} AGP`]].map(([Icon,label,value]) => <div key={label} className="bg-[#080d15] p-5 flex items-center gap-3"><span className="w-9 h-9 grid place-items-center border border-white/[0.08] text-cyan-200"><Icon className="w-4 h-4"/></span><div><span className="block text-[8px] uppercase tracking-[.16em] text-white/25">{label}</span><strong className="block text-base text-white mt-1">{value}</strong></div></div>)}</div>
    </div>
  </section>;
}
