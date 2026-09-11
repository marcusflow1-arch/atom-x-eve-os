import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { QUESTS, QUEST_NPCS } from '../../questData';
import {
  getQuestState,
  subscribeQuests,
  acceptQuest,
  setTrackedQuest,
} from '../../useQuestStore';
import { subscribePlayerHUD } from '../../playerHUDStore';
import { canClaimQuest, claimQuestRemotely } from '../../questRewards';

const npcNames = Object.fromEntries(QUEST_NPCS.map((npc) => [npc.id, npc.name]));

export default function QuestRelaySubTab() {
  const [quests, setQuests] = useState(() => getQuestState());
  const [hud, setHud] = useState({ level: 1 });
  const [filter, setFilter] = useState('active');

  useEffect(() => subscribeQuests((s) => setQuests({ ...s, progress: { ...s.progress } })), []);
  useEffect(() => subscribePlayerHUD(setHud), []);

  const available = useMemo(() => QUESTS.filter((q) => {
    if ((q.unlockLevel || 1) > (hud.level || 1)) return false;
    if (q.requires && !quests.completedIds.includes(q.requires)) return false;
    return !quests.acceptedIds.includes(q.id) && !quests.completedIds.includes(q.id);
  }), [hud.level, quests]);

  const active = useMemo(() => QUESTS.filter((q) => quests.acceptedIds.includes(q.id)), [quests]);
  const completed = useMemo(() => QUESTS.filter((q) => quests.completedIds.includes(q.id)), [quests]);

  const list = filter === 'available' ? available : filter === 'completed' ? completed : active;

  const acceptRemote = (quest) => {
    acceptQuest(quest.id);
    setTrackedQuest(quest.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('questAcceptedRemotely', { detail: { questId: quest.id } }));
    }
    toast.success(`Quest accepted: ${quest.title}`, { icon: '📜' });
  };

  const claimRemote = (quest) => {
    const result = claimQuestRemotely(quest);
    if (!result.ok) return toast.error(result.reason);
    toast.success(`${quest.title} complete · +${result.xp} XP`, { icon: '✨' });
  };

  return (
    <div className="h-full overflow-hidden px-8 py-7 flex flex-col">
      <div className="flex items-start justify-between gap-8 shrink-0">
        <div className="max-w-3xl">
          <div className="text-[10px] tracking-[0.35em] uppercase text-sky-200/70">Remote Questing</div>
          <h2 className="text-2xl text-white font-semibold mt-1">Spirit Quest Relay</h2>
          <p className="text-xs text-white/55 mt-2 leading-relaxed">
            Your bound spirit relays NPC requests, progress and rewards directly to you. The NPCs can still exist in the world for story and atmosphere, but accepting and reporting routine objectives no longer interrupts the combat loop.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 min-w-[330px]">
          <Count label="Available" value={available.length} />
          <Count label="Active" value={active.length} accent />
          <Count label="Done" value={completed.length} />
        </div>
      </div>

      <div className="flex gap-2 mt-6 shrink-0">
        {[
          ['active', `Active ${active.length}`],
          ['available', `Available ${available.length}`],
          ['completed', `Completed ${completed.length}`],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-md border text-[10px] tracking-[0.18em] uppercase transition-all ${
              filter === id
                ? 'border-sky-300/40 bg-sky-300/[0.09] text-sky-100'
                : 'border-white/10 bg-white/[0.025] text-white/45 hover:text-white/75'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto mt-4 pr-1">
        {list.length === 0 ? (
          <div className="h-full min-h-[220px] rounded-xl border border-white/8 bg-black/15 flex items-center justify-center text-white/35 text-xs">
            No quests in this section.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-6">
            {list.map((quest) => {
              const progress = Number(quests.progress?.[quest.id]) || 0;
              const target = Number(quest.objective?.count) || 0;
              const pct = target > 0 ? Math.min(100, (progress / target) * 100) : 100;
              const claimable = filter === 'active' && canClaimQuest(quest);
              const tracked = quests.lastAcceptedId === quest.id;
              return (
                <div key={quest.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm truncate">{quest.title}</span>
                        {tracked && <span className="text-[8px] uppercase tracking-widest text-sky-200 border border-sky-300/25 rounded px-1.5 py-0.5">Tracked</span>}
                      </div>
                      <div className="text-[9px] uppercase tracking-[0.18em] text-white/35 mt-1">
                        Relay: {npcNames[quest.npcId] || 'Unknown'} · Lv {quest.unlockLevel || 1}+
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[9px] uppercase tracking-widest text-white/35">Reward</div>
                      <div className="text-[11px] text-amber-200">{quest.reward?.xp || 0} XP · +{quest.reward?.points || 0} pts</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-white/55 leading-relaxed mt-3 line-clamp-3">{quest.description}</div>

                  {filter === 'active' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[9px] uppercase tracking-widest text-white/40 mb-1.5">
                        <span>{objectiveLabel(quest)}</span>
                        <span className="tabular-nums">{Math.min(progress, target)} / {target}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className={`h-full ${claimable ? 'bg-emerald-300/80' : 'bg-sky-300/70'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {filter === 'available' && (
                      <Action onClick={() => acceptRemote(quest)}>Accept Remotely</Action>
                    )}
                    {filter === 'active' && !tracked && (
                      <Action secondary onClick={() => setTrackedQuest(quest.id)}>Track</Action>
                    )}
                    {filter === 'active' && (
                      <Action disabled={!claimable} onClick={() => claimRemote(quest)}>
                        {claimable ? 'Turn In Remotely' : 'Objective Incomplete'}
                      </Action>
                    )}
                    {filter === 'completed' && (
                      <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/70 py-2">✓ Completed</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function objectiveLabel(quest) {
  const obj = quest.objective || {};
  if (obj.type === 'kill_tier') return `Defeat ${obj.tier || 'target'} enemies`;
  if (obj.type === 'kill') return 'Defeat enemies';
  return 'Complete objective';
}

function Count({ label, value, accent }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${accent ? 'border-sky-300/25 bg-sky-300/[0.06]' : 'border-white/10 bg-black/20'}`}>
      <div className="text-xl text-white tabular-nums">{value}</div>
      <div className="text-[8px] tracking-[0.16em] uppercase text-white/35 mt-0.5">{label}</div>
    </div>
  );
}

function Action({ children, onClick, disabled, secondary }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-md border text-[9px] font-bold tracking-[0.16em] uppercase transition-all disabled:opacity-25 disabled:cursor-not-allowed ${
        secondary
          ? 'border-white/10 bg-white/[0.035] text-white/60 hover:text-white'
          : 'border-sky-300/30 bg-sky-300/[0.08] text-sky-100 hover:bg-sky-300/[0.13]'
      }`}
    >
      {children}
    </button>
  );
}
