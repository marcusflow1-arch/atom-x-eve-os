import React, { useEffect, useMemo, useState } from 'react';
import { Coins, Crown, Hammer, ScrollText, Shield, ShoppingBag, Sparkles, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { QUESTS } from '../../questData';
import { acceptQuest, completeQuest, getQuestState, subscribeQuests } from '../../useQuestStore';
import { getPlayerHUD, awardXP } from '../../playerHUDStore';
import { xpForLevel } from '../../gameWorldConfig';
import { grantQuestReward } from '../../questRewards';
import { SHOP_ITEMS } from '../../shop/shopItems';
import { getShopState, purchaseItem, sellItem, subscribeShop } from '../../shop/shopStore';
import { subscribeContribution } from '../contributionStore';
import { clanAction, getSnapshot as getClanSnapshot, loadMyClans, subscribe as subscribeClan } from '../../clan/clanStore';

const MODES = [
  { id: 'field', label: 'Services' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'market', label: 'Market' },
  { id: 'guild', label: 'Guild' },
];

const Glass = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl ${className}`}>{children}</div>
);

function calculateQuestClaim(quest) {
  const questState = getQuestState();
  const progress = questState.progress?.[quest.id] || 0;
  if (!questState.acceptedIds.includes(quest.id)) return { ok: false, reason: 'Contract is not active' };
  if (progress < quest.objective.count) return { ok: false, reason: 'Objective is not complete' };

  const hud = getPlayerHUD();
  const gained = quest.reward?.xp || 0;
  let level = hud.level || 1;
  let xp = (hud.xp || 0) + gained;
  let levelsGained = 0;
  let need = xpForLevel(level);
  while (xp >= need) {
    xp -= need;
    level += 1;
    levelsGained += 1;
    need = xpForLevel(level);
  }

  awardXP({
    newLevel: level,
    newXP: xp,
    xpForNext: need,
    levelsGained,
    bonusPoints: quest.reward?.points || 0,
    xpGained: gained,
  });
  grantQuestReward(quest);
  completeQuest(quest.id);
  return { ok: true };
}

export default function SpiritServicesTab({ hud, onNavigate }) {
  const [mode, setMode] = useState('field');
  const [quests, setQuests] = useState(() => getQuestState());
  const [shop, setShop] = useState(() => getShopState());
  const [cp, setCp] = useState(0);
  const [notice, setNotice] = useState('');
  const [userId, setUserId] = useState(null);
  const [clan, setClan] = useState(() => getClanSnapshot());
  const [guildName, setGuildName] = useState('');
  const [guildTag, setGuildTag] = useState('');
  const [guildMotto, setGuildMotto] = useState('');
  const [creatingGuild, setCreatingGuild] = useState(false);

  useEffect(() => subscribeQuests((state) => setQuests({ ...state })), []);
  useEffect(() => subscribeShop((state) => setShop({ ...state })), []);
  useEffect(() => subscribeContribution((state) => setCp(state.cp)), []);
  useEffect(() => subscribeClan((state) => setClan(state)), []);
  useEffect(() => {
    let alive = true;
    base44.auth.me().then((user) => {
      if (!alive || !user) return;
      setUserId(user.id);
      loadMyClans(user.id).catch(() => {});
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const availableQuests = useMemo(() => QUESTS.filter((quest) =>
    quest.unlockLevel <= (hud?.level || 1)
    && (!quest.requires || quests.completedIds.includes(quest.requires))
    && !quests.acceptedIds.includes(quest.id)
    && !quests.completedIds.includes(quest.id)
  ).slice(0, 10), [hud?.level, quests]);

  const activeQuests = useMemo(() => quests.acceptedIds
    .map((id) => QUESTS.find((quest) => quest.id === id))
    .filter(Boolean), [quests.acceptedIds]);

  const marketItems = useMemo(() => SHOP_ITEMS.filter((item) =>
    item.category === 'consumables' || item.category === 'materials'
  ), []);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  };

  const createGuild = async () => {
    const name = guildName.trim();
    if (!name) return flash('Enter a guild name');
    setCreatingGuild(true);
    try {
      const result = await clanAction('create_clan', {
        name,
        tag: guildTag.trim().slice(0, 6).toUpperCase(),
        motto: guildMotto.trim(),
        recruitmentStatus: 'Public',
        sizeLimit: 100,
      });
      if (!result?.success) throw new Error(result?.error || 'Guild creation failed');
      if (userId) await loadMyClans(userId);
      setGuildName('');
      setGuildTag('');
      setGuildMotto('');
      flash(`Guild ${name} created`);
    } catch (error) {
      flash(error?.message || 'Guild creation failed');
    } finally {
      setCreatingGuild(false);
    }
  };

  return (
    <div className="h-full overflow-hidden px-8 py-5">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-[10px] tracking-[0.34em] uppercase text-cyan-100/40">Bound Spirit</div>
            <div className="text-xl font-semibold text-white mt-1">Player Services</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/55">
              <Coins className="inline w-3.5 h-3.5 text-amber-300 mr-1.5" />{shop.gold.toLocaleString()} Silver
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/55">
              {cp.toLocaleString()} CP
            </div>
          </div>
        </div>

        <div className="flex gap-1 rounded-full border border-white/10 bg-black/20 p-1 w-fit mb-4">
          {MODES.map((item) => (
            <button key={item.id} onClick={() => setMode(item.id)}
              className={`rounded-full px-4 py-2 text-[10px] tracking-[0.18em] uppercase transition ${mode === item.id ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/70'}`}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {mode === 'field' && (
            <div className="grid grid-cols-2 gap-3">
              <Glass className="col-span-2 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl border border-cyan-200/15 bg-cyan-200/[0.06] flex items-center justify-center"><Sparkles className="w-5 h-5 text-cyan-100" /></div>
                  <div>
                    <div className="text-white font-semibold">TwelveSky progression, without the town errands.</div>
                    <p className="text-xs text-white/40 mt-1 max-w-3xl leading-relaxed">
                      Combat, bosses, wars, exploration and objectives remain in the world. Progression services live here so upgrading, ranking, shopping, pills and guild administration never require running to a specific NPC.
                    </p>
                  </div>
                </div>
              </Glass>

              <ServiceCard icon={Hammer} title="Forge & Reinforcement" text="Upgrade combat progression from the player menu. Halo and Wings retain their own costs, caps and success rules." actions={[
                ['Halo', () => onNavigate?.('mastery', 'halo')],
                ['Wings', () => onNavigate?.('mastery', 'wings')],
              ]} />
              <ServiceCard icon={Crown} title="Palace, Titles & Contribution" text="Manage TwelveSky-style prestige, Palace progression and CP ranks from anywhere." actions={[
                ['Palace', () => onNavigate?.('mastery', 'palace')],
                ['Titles', () => onNavigate?.('mastery', 'title')],
              ]} />
              <ServiceCard icon={Sparkles} title="Pills, Elixirs & Aura" text="Permanent pill/elixir progression and aura presentation are available directly on the character." actions={[
                ['Elixirs', () => onNavigate?.('mastery', 'elixirs')],
                ['Aura', () => onNavigate?.('mastery', 'aura')],
              ]} />
              <ServiceCard icon={Users} title="Guild Command" text="Create and manage persistent guild membership without visiting a registrar NPC." actions={[
                ['Guild', () => setMode('guild')],
              ]} />
              <ServiceCard icon={ShoppingBag} title="Portable Market" text="Buy consumables/materials and sell unwanted field inventory through the spirit." actions={[
                ['Open Market', () => setMode('market')],
              ]} />
              <ServiceCard icon={ScrollText} title="Remote Contracts" text="Accept, track and claim quests here. The actual kill, boss or world objective remains in-world." actions={[
                ['Contracts', () => setMode('contracts')],
              ]} />
            </div>
          )}

          {mode === 'contracts' && (
            <div className="space-y-2">
              {[...activeQuests, ...availableQuests].map((quest) => {
                const active = quests.acceptedIds.includes(quest.id);
                const progress = quests.progress?.[quest.id] || 0;
                const ready = active && progress >= quest.objective.count;
                return (
                  <Glass key={quest.id} className="p-4 flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${ready ? 'bg-emerald-300' : active ? 'bg-cyan-300' : 'bg-white/20'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{quest.title}</div>
                      <div className="text-[11px] text-white/35 mt-1">
                        {active ? `${Math.min(progress, quest.objective.count)} / ${quest.objective.count}` : `Level ${quest.unlockLevel}`} · {quest.reward?.xp || 0} XP
                      </div>
                    </div>
                    {active ? (
                      <button disabled={!ready} onClick={() => {
                        const result = calculateQuestClaim(quest);
                        flash(result.ok ? `Claimed ${quest.title}` : result.reason);
                      }} className="rounded-lg border border-emerald-200/15 bg-emerald-200/[0.06] px-3 py-2 text-xs text-emerald-50 disabled:opacity-20">Claim</button>
                    ) : (
                      <button onClick={() => { acceptQuest(quest.id); flash(`Accepted ${quest.title}`); }} className="rounded-lg border border-cyan-200/15 bg-cyan-200/[0.06] px-3 py-2 text-xs text-cyan-50">Accept</button>
                    )}
                  </Glass>
                );
              })}
              {activeQuests.length === 0 && availableQuests.length === 0 && <div className="text-center text-xs text-white/30 py-16">No contracts available.</div>}
            </div>
          )}

          {mode === 'market' && (
            <div className="grid grid-cols-2 gap-2">
              {marketItems.map((item) => {
                const owned = shop.inventory[item.id] || 0;
                return (
                  <Glass key={item.id} className="p-4 flex items-center gap-3">
                    <div className="text-2xl w-10 text-center">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{item.name}</div>
                      <div className="text-[10px] text-white/35 mt-1">{item.price.toLocaleString()} Silver · Owned {owned}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => {
                        const result = purchaseItem(item);
                        flash(result.ok ? `Bought ${item.name}` : result.reason);
                      }} className="rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-2.5 py-1.5 text-[11px] text-amber-50">Buy</button>
                      <button disabled={!owned} onClick={() => {
                        const result = sellItem(item);
                        flash(result.ok ? `Sold for ${result.goldReceived} Silver` : result.reason);
                      }} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/55 disabled:opacity-20">Sell</button>
                    </div>
                  </Glass>
                );
              })}
            </div>
          )}

          {mode === 'guild' && (
            <div className="grid grid-cols-5 gap-3">
              <Glass className="col-span-3 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-amber-300" />
                  <div>
                    <div className="text-sm font-semibold text-white">Guild Command</div>
                    <div className="text-[11px] text-white/35">Persistent clans, shared chat, vault, missions, upgrades and guild halls.</div>
                  </div>
                </div>
                {clan.myClans?.length > 0 ? (
                  <div className="space-y-2">
                    {clan.myClans.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-300/10 border border-amber-200/15 flex items-center justify-center text-amber-200 font-bold text-xs">{(entry.tag || entry.name || 'G').slice(0, 3).toUpperCase()}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-white font-semibold truncate">{entry.name}</div>
                          <div className="text-[10px] text-white/35 truncate">{entry.motto || 'No motto set'} · Level {entry.level || 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-white/35 leading-relaxed">You are not currently in a guild. Create one here; no registrar NPC or external dashboard is required.</div>
                )}
              </Glass>

              <Glass className="col-span-2 p-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">Create Guild</div>
                <div className="space-y-2 mt-4">
                  <input value={guildName} onChange={(e) => setGuildName(e.target.value)} maxLength={36} placeholder="Guild name" className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-white outline-none focus:border-cyan-200/30" />
                  <input value={guildTag} onChange={(e) => setGuildTag(e.target.value)} maxLength={6} placeholder="Tag (max 6)" className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-white outline-none focus:border-cyan-200/30" />
                  <input value={guildMotto} onChange={(e) => setGuildMotto(e.target.value)} maxLength={80} placeholder="Motto" className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-white outline-none focus:border-cyan-200/30" />
                  <button disabled={creatingGuild || !guildName.trim()} onClick={createGuild} className="w-full rounded-lg border border-amber-200/20 bg-amber-200/[0.08] px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-amber-200/[0.12] disabled:opacity-30">
                    {creatingGuild ? 'Creating…' : 'Create Guild'}
                  </button>
                </div>
                <div className="text-[10px] text-white/25 mt-3 leading-relaxed">Guild creation uses the existing server-backed clan system. Economy fees can be attached here without changing the guild data model.</div>
              </Glass>
            </div>
          )}
        </div>
      </div>

      {notice && <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[120] rounded-full border border-white/10 bg-black/75 backdrop-blur-xl px-4 py-2 text-xs text-white shadow-2xl">{notice}</div>}
    </div>
  );
}

function ServiceCard({ icon: Icon, title, text, actions }) {
  return (
    <Glass className="p-5">
      <Icon className="w-4 h-4 text-cyan-100/70" />
      <div className="text-sm font-semibold text-white mt-3">{title}</div>
      <p className="text-[11px] leading-relaxed text-white/35 mt-1 min-h-9">{text}</p>
      <div className="flex gap-2 mt-4 flex-wrap">
        {actions.map(([label, handler]) => (
          <button key={label} onClick={handler} className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] text-white/60 hover:text-white hover:bg-white/[0.07] transition">{label}</button>
        ))}
      </div>
    </Glass>
  );
}
