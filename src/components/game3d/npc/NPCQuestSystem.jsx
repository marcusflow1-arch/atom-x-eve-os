// NPCQuestSystem.jsx — Full orchestrator: NPCs, dialogue, quest log, debug panel

import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { subscribeNPCQuest, openDialogue, recordKill, debugCompleteQuest, resetAllQuests, closeDialogue } from './npcQuestStore';
import { QUESTS, getQuestById, QuestState } from './questData';
import NPCEntity from './NPCEntity';
import DialogueBox from './DialogueBox';
import QuestNotifications from './QuestNotification';
import QuestLogPanel from './QuestLogPanel';
import { ScrollText, Bug, RotateCcw, Swords } from 'lucide-react';

// NPC definitions — easily extensible
const NPCS = [
  {
    id: 'npc_artemis',
    name: 'Artemis',
    icon: '🧍‍♀️',
    quests: ['quest_001', 'quest_002'],
    position: { left: '35%', top: '42%' },
  },
];

// Decide which quest to offer for an NPC given current quest states
function getActiveQuestForNPC(npc, questEntries) {
  for (const qId of npc.quests) {
    const entry = questEntries[qId] || {};
    const state = entry.state || QuestState.NONE;
    if (state !== QuestState.COMPLETED) return qId;
  }
  return npc.quests[npc.quests.length - 1]; // all done — show last
}

export default function NPCQuestSystem() {
  const [store, setStore] = useState({ quests: {}, dialogueOpen: null, notifications: [] });
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 50 }); // % of scene
  const [showLog, setShowLog] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [rewardFlash, setRewardFlash] = useState(null);

  useEffect(() => subscribeNPCQuest(setStore), []);

  // Keyboard: E = interact with nearest NPC, K = debug complete, R = reset
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'KeyE') {
        // Find nearest NPC and open dialogue
        const npc = NPCS[0];
        if (!npc) return;
        const questId = getActiveQuestForNPC(npc, store.quests);
        openDialogue(npc.id, questId);
      }
      if (e.code === 'KeyK') {
        // Debug: complete first active quest
        const active = QUESTS.find(q => {
          const e = store.quests[q.id];
          return e?.state === QuestState.ACTIVE;
        });
        if (active) debugCompleteQuest(active.id);
      }
      if (store.dialogueOpen && (e.code === 'Escape')) {
        closeDialogue();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store.quests, store.dialogueOpen]);

  // Drag player around scene
  const handleSceneClick = (e) => {
    if (store.dialogueOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPlayerPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // Check proximity: player within 18% of NPC position
  const isNearNPC = (npcLeft, npcTop) => {
    const dx = parseFloat(npcLeft) - playerPos.x;
    const dy = parseFloat(npcTop) - playerPos.y;
    return Math.sqrt(dx * dx + dy * dy) < 18;
  };

  const handleRewardClaimed = useCallback((rewards) => {
    setTotalXP(p => p + rewards.xp);
    setTotalCoins(p => p + rewards.currency);
    setRewardFlash(rewards);
    setTimeout(() => setRewardFlash(null), 2500);
  }, []);

  // Simulate a kill for all active quests
  const handleSimulateKill = () => {
    QUESTS.forEach(q => {
      const entry = store.quests[q.id];
      if (entry?.state === QuestState.ACTIVE) recordKill(q.id);
    });
  };

  // Current dialogue context
  const dialogueNPC = store.dialogueOpen
    ? NPCS.find(n => n.id === store.dialogueOpen.npcId) : null;
  const dialogueQuest = store.dialogueOpen
    ? getQuestById(store.dialogueOpen.questId) : null;
  const dialogueEntry = dialogueQuest
    ? (store.quests[dialogueQuest.id] || { state: QuestState.NONE, killProgress: 0, killTarget: dialogueQuest.killTarget })
    : null;

  const anyActiveQuest = QUESTS.some(q => {
    const e = store.quests[q.id];
    return e?.state === QuestState.ACTIVE || e?.state === QuestState.READY_TO_TURN;
  });

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none"
      style={{ fontFamily: 'monospace' }}>

      {/* Notifications */}
      <QuestNotifications notifications={store.notifications} />

      {/* Reward flash */}
      <AnimatePresence>
        {rewardFlash && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[400] text-center"
          >
            <div className="px-6 py-4 rounded-2xl"
              style={{
                background: 'rgba(8,14,24,0.92)',
                border: '1px solid rgba(251,191,36,0.5)',
                boxShadow: '0 0 40px rgba(251,191,36,0.2)',
              }}>
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-base font-bold text-white">Quest Complete!</div>
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className="text-sm" style={{ color: '#fbbf24' }}>+{rewardFlash.xp} XP</span>
                <span className="text-sm" style={{ color: '#34d399' }}>+{rewardFlash.currency} Coins</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/30">NPC Quest System</div>
        <div className="flex items-center gap-4">
          <span className="text-[11px]" style={{ color: '#fbbf24' }}>⭐ {totalXP} XP</span>
          <span className="text-[11px]" style={{ color: '#34d399' }}>💰 {totalCoins}</span>
          <button onClick={() => setShowLog(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] transition-all"
            style={{
              background: showLog ? 'rgba(110,195,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${showLog ? 'rgba(110,195,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: showLog ? '#6ec3ff' : 'rgba(255,255,255,0.4)',
            }}>
            <ScrollText className="w-3 h-3" />
            Quest Log
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Main Scene */}
        <div className="flex-1 relative cursor-crosshair overflow-hidden"
          onClick={handleSceneClick}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(20,30,50,0.8) 0%, rgba(8,12,20,0.95) 100%)',
          }}>

          {/* Scene grid */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(rgba(110,195,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(110,195,255,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />

          {/* Ground plane hint */}
          <div className="absolute bottom-16 left-0 right-0 h-px opacity-20"
            style={{ background: 'linear-gradient(90deg, transparent, #6ec3ff, transparent)' }} />

          {/* NPC Entities */}
          {NPCS.map(npc => {
            const questId = getActiveQuestForNPC(npc, store.quests);
            const questEntry = store.quests[questId] || { state: QuestState.NONE, killProgress: 0, killTarget: 1 };
            const nearby = isNearNPC(npc.position.left, npc.position.top);

            return (
              <div key={npc.id}
                className="absolute"
                style={{ left: npc.position.left, top: npc.position.top, transform: 'translate(-50%, -50%)' }}>
                <NPCEntity
                  npc={npc}
                  questEntry={questEntry}
                  questId={questId}
                  playerNearby={nearby}
                />
              </div>
            );
          })}

          {/* Player token */}
          <motion.div
            animate={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
            transition={{ type: 'spring', damping: 18, stiffness: 180 }}
            className="absolute z-10"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{
                  background: 'rgba(99,102,241,0.20)',
                  border: '2px solid rgba(99,102,241,0.6)',
                  boxShadow: '0 0 14px rgba(99,102,241,0.3)',
                }}>
                🧑‍🦯
              </div>
              <div className="text-[8px] tracking-[0.2em] uppercase text-indigo-300/60">Player</div>
            </div>
          </motion.div>

          {/* Click-to-move hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-white/15 tracking-[0.2em] uppercase pointer-events-none">
            Click to move · E to interact · K to debug-complete · Esc to close
          </div>
        </div>

        {/* Quest Log Sidebar */}
        <AnimatePresence>
          {showLog && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              className="overflow-hidden flex-shrink-0"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-[260px] h-full flex flex-col overflow-hidden"
                style={{ background: 'rgba(8,12,20,0.85)' }}>
                <div className="px-3 py-2.5 flex items-center gap-2 flex-shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <ScrollText className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-[10px] tracking-[0.3em] uppercase text-white/30">Quest Log</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <QuestLogPanel questEntries={store.quests} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Debug Panel */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Bug className="w-3 h-3 text-white/20" />
        <span className="text-[9px] tracking-[0.3em] uppercase text-white/20 mr-2">Debug</span>
        <button onClick={handleSimulateKill}
          disabled={!anyActiveQuest}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] transition-all disabled:opacity-30"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.20)', color: '#34d399' }}>
          <Swords className="w-3 h-3" /> Simulate Kill
        </button>
        <button onClick={() => {
          const active = QUESTS.find(q => store.quests[q.id]?.state === QuestState.ACTIVE);
          if (active) debugCompleteQuest(active.id);
        }}
          disabled={!anyActiveQuest}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] transition-all disabled:opacity-30"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.20)', color: '#fbbf24' }}>
          ✅ Instant Complete [K]
        </button>
        <button onClick={resetAllQuests}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] transition-all ml-auto"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }}>
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Dialogue overlay */}
      <AnimatePresence>
        {store.dialogueOpen && dialogueNPC && dialogueQuest && (
          <DialogueBox
            key={`${store.dialogueOpen.questId}-${dialogueEntry?.state}`}
            npc={dialogueNPC}
            quest={dialogueQuest}
            questEntry={dialogueEntry}
            onRewardClaimed={handleRewardClaimed}
          />
        )}
      </AnimatePresence>
    </div>
  );
}