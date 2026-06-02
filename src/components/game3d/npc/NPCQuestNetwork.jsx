// NPCQuestNetwork.jsx — Main orchestrator for the Multi-NPC Quest Network

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LivingQuestNPC from './LivingQuestNPC';
import {
  subscribeQuestNetwork, openDialogue, closeDialogue,
  recordNetworkKill, debugCompleteQuest, resetNetwork,
  dismissNotification
} from './questNetworkStore';
import { subscribeWorld, resetWorldState, getWorldState } from './worldStateStore';
import { NPC_DEFS, getAvailableQuestsForNPC, QuestState, QUEST_LIST } from './questNetwork';
import NPCNode from './NPCNode';
import BranchingDialogueBox from './BranchingDialogueBox';
import TrustPanel from './TrustPanel';
import NetworkQuestLog from './NetworkQuestLog';
import CharacterSprite from './CharacterSprite';
import { QUEST_DEFS } from './questNetwork';
import { ScrollText, BarChart2, Bug, RotateCcw, Swords, Zap } from 'lucide-react';

// ── Notification toast ────────────────────────────────────────────────────────
const NOTIF_STYLE = {
  accepted:  { color: '#6ec3ff', icon: '📜' },
  ready:     { color: '#34d399', icon: '✅' },
  completed: { color: '#fbbf24', icon: '🏆' },
};

function NotifToast({ notif, onDismiss }) {
  const s = NOTIF_STYLE[notif.type] || NOTIF_STYLE.accepted;
  useEffect(() => {
    const t = setTimeout(() => onDismiss(notif.id), 3500);
    return () => clearTimeout(t);
  }, [notif.id, onDismiss]);
  return (
    <motion.div
      initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer"
      onClick={() => onDismiss(notif.id)}
      style={{
        background: 'rgba(8,12,20,0.95)',
        border: `1px solid ${s.color}40`,
        boxShadow: `0 4px 20px ${s.color}15`,
        minWidth: 220,
      }}
    >
      <span className="text-base">{s.icon}</span>
      <div>
        <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: s.color }}>
          {notif.type === 'accepted' ? 'Quest Accepted' : notif.type === 'ready' ? 'Ready to Turn In' : 'Quest Complete'}
        </div>
        <div className="text-[11px] text-white/60 font-medium">{notif.questTitle}</div>
      </div>
    </motion.div>
  );
}

// ── Reward flash ──────────────────────────────────────────────────────────────
function RewardFlash({ rewards, npcColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
      className="fixed inset-0 flex items-center justify-center z-[500] pointer-events-none"
    >
      <div className="px-8 py-5 rounded-2xl text-center"
        style={{
          background: 'rgba(8,12,20,0.97)',
          border: `1px solid ${npcColor || '#fbbf24'}50`,
          boxShadow: `0 0 60px ${npcColor || '#fbbf24'}20`,
        }}>
        <div className="text-3xl mb-2">🏆</div>
        <div className="text-lg font-bold text-white mb-3">Quest Complete!</div>
        <div className="flex items-center justify-center gap-6">
          {rewards.xp && <div><div className="text-xs text-white/30">XP</div><div className="text-xl font-bold text-yellow-400">+{rewards.xp}</div></div>}
          {rewards.currency && <div><div className="text-xs text-white/30">Coins</div><div className="text-xl font-bold text-green-400">+{rewards.currency}</div></div>}
        </div>
        {rewards.flag && <div className="mt-2 text-[9px] tracking-[0.3em] uppercase text-white/20">Flag: {rewards.flag}</div>}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NPCQuestNetwork() {
  const navigate = useNavigate();
  const [store, setStore]       = useState({ quests: {}, notifications: [], dialogueOpen: null });
  const [world, setWorld]       = useState(getWorldState());
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 55 });
  const [sidePanel, setSidePanel] = useState('trust'); // 'trust' | 'log' | null
  const [totalXP, setTotalXP]   = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [rewardFlash, setRewardFlash] = useState(null);
  const [activeNpcColor, setActiveNpcColor] = useState('#fbbf24');

  useEffect(() => subscribeQuestNetwork(setStore), []);
  useEffect(() => subscribeWorld(setWorld), []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Escape') { closeDialogue(); return; }
      if (store.dialogueOpen) return;
      if (e.code === 'KeyE') {
        // Interact with nearest NPC
        const nearest = getNearestNPC();
        if (nearest) handleInteract(nearest.npc, nearest.questId);
      }
      if (e.code === 'KeyK') {
        // Debug complete first active quest
        const active = QUEST_LIST.find(q => store.quests[q.id]?.state === QuestState.ACTIVE);
        if (active) debugCompleteQuest(active.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);

  function getNearestNPC() {
    let best = null, bestDist = 999;
    NPC_DEFS.forEach(npc => {
      if (isNPCHidden(npc)) return;
      const dx = parseFloat(npc.position.left) - playerPos.x;
      const dy = parseFloat(npc.position.top) - playerPos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) { bestDist = d; best = npc; }
    });
    if (!best || bestDist > 20) return null;
    const questId = getFirstAvailableQuest(best);
    return questId ? { npc: best, questId } : null;
  }

  function isNPCHidden(npc) {
    if (!npc.appearsAfterFlag) return false;
    return !world.flags[npc.appearsAfterFlag];
  }

  function isNearNPC(npc) {
    const dx = parseFloat(npc.position.left) - playerPos.x;
    const dy = parseFloat(npc.position.top) - playerPos.y;
    return Math.sqrt(dx * dx + dy * dy) < 18;
  }

  function getFirstAvailableQuest(npc) {
    const available = getAvailableQuestsForNPC(npc.id, store.quests, world.flags);
    if (available.length > 0) return available[0];
    // Fall back to active quest
    return npc.quests.find(qId => {
      const e = store.quests[qId];
      return e?.state === QuestState.ACTIVE || e?.state === QuestState.READY_TO_TURN;
    }) || npc.quests[0];
  }

  function handleInteract(npc, questId) {
    if (!questId) return;
    setActiveNpcColor(npc.color);
    openDialogue(npc.id, questId);
  }

  const handleRewardClaimed = useCallback((rewards) => {
    setTotalXP(p => p + (rewards?.xp || 0));
    setTotalCoins(p => p + (rewards?.currency || 0));
    setRewardFlash(rewards);
    setTimeout(() => setRewardFlash(null), 2000);
  }, []);

  const handleSceneClick = (e) => {
    if (store.dialogueOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPlayerPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const anyActive = QUEST_LIST.some(q => {
    const e = store.quests[q.id];
    return e?.state === QuestState.ACTIVE;
  });

  // Find dialogue context
  const dialogueNPC   = store.dialogueOpen ? NPC_DEFS.find(n => n.id === store.dialogueOpen.npcId) : null;
  const dialogueQuestDef = store.dialogueOpen
    ? (QUEST_DEFS[store.dialogueOpen.questId] || null) : null;
  const dialogueEntry = dialogueQuestDef
    ? (store.quests[dialogueQuestDef.id] || { state: QuestState.NONE, killProgress: 0, killTarget: dialogueQuestDef.killTarget || 1 })
    : null;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ fontFamily: 'monospace', background: '#080c14' }}>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-[350] flex flex-col gap-2 items-end">
        <AnimatePresence>
          {store.notifications.map(n => (
            <NotifToast key={n.id} notif={n} onDismiss={dismissNotification} />
          ))}
        </AnimatePresence>
      </div>

      {/* Reward flash */}
      <AnimatePresence>
        {rewardFlash && <RewardFlash rewards={rewardFlash} npcColor={activeNpcColor} />}
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0 z-10"
        style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[10px] tracking-[0.5em] uppercase text-white/20 mr-2">Quest Network</div>
        <div className="h-4 w-px bg-white/10" />
        <span className="text-[11px] text-yellow-400">⭐ {totalXP} XP</span>
        <span className="text-[11px] text-green-400">💰 {totalCoins}</span>
        <span className="text-[11px] text-purple-400">🏷️ {world.reputation}</span>
        <div className="ml-auto flex items-center gap-2">
          {['trust','log'].map(panel => (
            <button key={panel}
              onClick={() => setSidePanel(v => v === panel ? null : panel)}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] transition-all"
              style={{
                background: sidePanel === panel ? 'rgba(110,195,255,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${sidePanel === panel ? 'rgba(110,195,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: sidePanel === panel ? '#6ec3ff' : 'rgba(255,255,255,0.3)',
              }}>
              {panel === 'trust' ? <BarChart2 className="w-3 h-3" /> : <ScrollText className="w-3 h-3" />}
              {panel === 'trust' ? 'Trust' : 'Log'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Scene */}
        <div className="flex-1 relative cursor-crosshair overflow-hidden"
          onClick={handleSceneClick}
          style={{
            background: 'radial-gradient(ellipse at 50% 60%, rgba(20,30,50,0.7) 0%, rgba(8,12,20,1) 100%)',
          }}>

          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(110,195,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(110,195,255,0.4) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }} />

          {/* World state effects */}
          {world.world?.newEnemiesSpawned && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(248,113,113,0.04) 0%, transparent 60%)' }} />
          )}
          {world.world?.safeZoneActive && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(52,211,153,0.04) 0%, transparent 60%)' }} />
          )}

          {/* Ground line */}
          <div className="absolute bottom-14 left-0 right-0 h-px opacity-15"
            style={{ background: 'linear-gradient(90deg, transparent, #6ec3ff, transparent)' }} />

          {/* NPCs */}
          {NPC_DEFS.map(npc => {
            const questId  = getFirstAvailableQuest(npc);
            const entry    = questId ? (store.quests[questId] || { state: QuestState.NONE }) : { state: QuestState.NONE };
            const trust    = world.trust?.[npc.id] ?? 0;
            const nearby   = isNearNPC(npc);
            const hidden   = isNPCHidden(npc);

            return (
              <div key={npc.id} className="absolute"
                style={{ left: npc.position.left, top: npc.position.top, transform: 'translate(-50%,-50%)' }}>
                <NPCNode
                  npc={npc}
                  questEntry={entry}
                  questId={questId}
                  trust={trust}
                  playerNearby={nearby}
                  hidden={hidden}
                  onInteract={handleInteract}
                />
              </div>
            );
          })}

          {/* Living Quest NPC — placed away from other quest-givers, larger, on-map */}
          {(() => {
            const lqPos = { left: 14, top: 24 };
            const dx = lqPos.left - playerPos.x;
            const dy = lqPos.top - playerPos.y;
            const near = Math.sqrt(dx * dx + dy * dy) < 18;
            return (
              <div className="absolute z-20"
                style={{ left: `${lqPos.left}%`, top: `${lqPos.top}%`, transform: 'translate(-50%,-50%)' }}>
                <LivingQuestNPC playerNearby={near} onLaunch={() => navigate('/LivingQuest')} />
              </div>
            );
          })()}

          {/* Player token */}
          <motion.div
            animate={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="absolute z-20"
            style={{ translateX: '-50%', translateY: '-50%' }}
          >
            <CharacterSprite color="#6366f1" label="Player" isNPC={false} glow={true} />
          </motion.div>

          {/* Hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.2em] uppercase text-white/10 pointer-events-none text-center">
            Click scene to move · [E] interact · [K] debug-complete · [Esc] close
          </div>
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {sidePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 270, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              className="flex-shrink-0 overflow-hidden"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,10,18,0.92)' }}
            >
              <div className="w-[270px] h-full overflow-y-auto">
                {sidePanel === 'trust' && (
                  <TrustPanel
                    trust={world.trust || {}}
                    pathScores={world.pathScores || {}}
                    world={world.world || {}}
                    reputation={world.reputation || 'Unknown'}
                    modifiers={world.modifiers || {}}
                  />
                )}
                {sidePanel === 'log' && (
                  <NetworkQuestLog questEntries={store.quests} flags={world.flags || {}} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Debug bar */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 flex-wrap"
        style={{ background: 'rgba(0,0,0,0.6)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Bug className="w-3 h-3 text-white/15" />
        <span className="text-[9px] tracking-[0.3em] uppercase text-white/15 mr-1">Debug</span>
        <button onClick={() => {
          QUEST_LIST.forEach(q => {
            if (store.quests[q.id]?.state === QuestState.ACTIVE) recordNetworkKill(q.id);
          });
        }}
          disabled={!anyActive}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] transition-all disabled:opacity-25"
          style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399' }}>
          <Swords className="w-3 h-3" /> Kill
        </button>
        <button onClick={() => {
          const active = QUEST_LIST.find(q => store.quests[q.id]?.state === QuestState.ACTIVE);
          if (active) debugCompleteQuest(active.id);
        }}
          disabled={!anyActive}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] transition-all disabled:opacity-25"
          style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)', color: '#fbbf24' }}>
          <Zap className="w-3 h-3" /> Complete [K]
        </button>
        <button onClick={() => { resetNetwork(); resetWorldState(); }}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] transition-all ml-auto"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)' }}>
          <RotateCcw className="w-3 h-3" /> Reset All
        </button>
      </div>

      {/* Dialogue overlay */}
      <AnimatePresence>
        {store.dialogueOpen && dialogueNPC && dialogueQuestDef && (
          <BranchingDialogueBox
            key={`${store.dialogueOpen.questId}-${dialogueEntry?.state}`}
            npc={dialogueNPC}
            quest={dialogueQuestDef}
            questEntry={dialogueEntry}
            onRewardClaimed={handleRewardClaimed}
          />
        )}
      </AnimatePresence>
    </div>
  );
}