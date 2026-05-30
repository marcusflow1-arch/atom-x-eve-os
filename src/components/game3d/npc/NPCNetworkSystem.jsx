// NPCNetworkSystem.jsx — Full multi-NPC quest network orchestrator

import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { subscribeNetwork, openNetworkDialogue, recordNetworkKill, debugFillProgress, resetNetwork, getQuestEntry, closeNetworkDialogue } from './npcNetworkStore';
import { subscribeWorld, resetWorldState } from './worldStateStore';
import { NPCS_NETWORK, QUEST_NETWORK, getAvailableQuestsForNPC, getNPCById, getNetworkQuest } from './npcNetworkData';
import { QS } from './npcNetworkStore';
import BranchingDialogueBox from './BranchingDialogueBox';
import TrustMeter from './TrustMeter';
import WorldStatePanel from './WorldStatePanel';
import QuestNotifications from './QuestNotification';
import { ScrollText, Globe, Bug, RotateCcw, Swords, ChevronRight, Eye, EyeOff } from 'lucide-react';

const STATE_INDICATOR = {
  [QS.NONE]:          { icon: '❕', pulse: true  },
  [QS.ACTIVE]:        { icon: '📋', pulse: false },
  [QS.READY_TO_TURN]: { icon: '❗', pulse: true  },
  [QS.COMPLETED]:     { icon: '✓',  pulse: false },
};

function NPCToken({ npc, questEntry, trust, playerNearby, onClick }) {
  const [bobY, setBobY] = useState(0);
  const state = questEntry?.state || QS.NONE;
  const ind = STATE_INDICATOR[state];
  const npcColor = npc.color;

  useEffect(() => {
    let t = Math.random() * Math.PI * 2;
    const id = setInterval(() => { t += 0.04; setBobY(Math.sin(t) * 3); }, 30);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex flex-col items-center" style={{ translateY: bobY }}>
      {/* State indicator */}
      <motion.div className="absolute -top-9 flex flex-col items-center gap-0.5"
        animate={ind.pulse ? { y: [0, -4, 0] } : {}}
        transition={ind.pulse ? { repeat: Infinity, duration: 1.2 } : {}}>
        <span className="text-sm">{ind.icon}</span>
      </motion.div>

      <div onClick={onClick}
        className="w-14 h-20 rounded-xl flex flex-col items-center justify-center text-3xl cursor-pointer transition-all"
        style={{
          background: playerNearby ? `${npcColor}14` : 'rgba(255,255,255,0.03)',
          border: playerNearby ? `1.5px solid ${npcColor}55` : '1px solid rgba(255,255,255,0.08)',
          boxShadow: playerNearby ? `0 0 18px ${npcColor}20` : 'none',
          translateY: bobY,
        }}>
        <span>{npc.icon}</span>
        <span className="text-[8px] tracking-[0.12em] uppercase mt-1" style={{ color: playerNearby ? npcColor : 'rgba(255,255,255,0.25)' }}>
          {npc.name}
        </span>
      </div>

      {/* Proximity prompt */}
      <AnimatePresence>
        {playerNearby && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute -bottom-6 whitespace-nowrap">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.7)', border: `1px solid ${npcColor}55` }}>
              <kbd className="text-[8px] font-bold px-0.5 rounded" style={{ background: `${npcColor}22`, color: npcColor }}>E</kbd>
              <span className="text-[8px] text-white/50">Talk</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NPCNetworkSystem() {
  const [netStore, setNetStore] = useState({ quests: {}, dialogueOpen: null, notifications: [], unlockedQuests: [] });
  const [worldState, setWorldState] = useState(null);
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 70 });
  const [activePanel, setActivePanel] = useState(null); // 'quests' | 'world' | null
  const [totalXP, setTotalXP] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [rewardFlash, setRewardFlash] = useState(null);
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => subscribeNetwork(setNetStore), []);
  useEffect(() => subscribeWorld(setWorldState), []);

  // Keyboard controls
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Escape') closeNetworkDialogue();
      if (e.code === 'KeyK') {
        const active = QUEST_NETWORK.find(q => netStore.quests[q.id]?.state === QS.ACTIVE && !q.isChoiceQuest);
        if (active) debugFillProgress(active.id);
      }
      if (e.code === 'KeyE') {
        const nearest = getNearestNPC();
        if (nearest) handleNPCClick(nearest);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [netStore.quests, playerPos]);

  const getNearestNPC = () => {
    let best = null, bestDist = Infinity;
    NPCS_NETWORK.forEach(npc => {
      const dx = parseFloat(npc.position.left) - playerPos.x;
      const dy = parseFloat(npc.position.top) - playerPos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) { bestDist = d; best = npc; }
    });
    return bestDist < 20 ? best : null;
  };

  const isNearNPC = (npc) => {
    const dx = parseFloat(npc.position.left) - playerPos.x;
    const dy = parseFloat(npc.position.top) - playerPos.y;
    return Math.sqrt(dx * dx + dy * dy) < 18;
  };

  const handleNPCClick = (npc) => {
    const available = getAvailableQuestsForNPC(
      npc.id,
      worldState?.flags || {},
      netStore.quests
    );
    // Also check unlocked quests for this NPC
    const unlocked = netStore.unlockedQuests || [];
    const unlockedForNPC = QUEST_NETWORK.filter(q =>
      q.npcId === npc.id && unlocked.includes(q.id) && netStore.quests[q.id]?.state !== QS.COMPLETED
    );

    const quest = available[0] || unlockedForNPC[0];
    if (!quest) return;
    openNetworkDialogue(npc.id, quest.id);
  };

  const handleSceneClick = (e) => {
    if (netStore.dialogueOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPlayerPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleReward = useCallback((reward) => {
    if (!reward) return;
    setTotalXP(p => p + (reward.xp || 0));
    setTotalCoins(p => p + (reward.currency || 0));
    setRewardFlash(reward);
    setTimeout(() => setRewardFlash(null), 2500);
  }, []);

  const handleSimulateKill = () => recordNetworkKill();

  const handleReset = () => { resetNetwork(); resetWorldState(); setTotalXP(0); setTotalCoins(0); };

  // Build dialogue context
  const dialogueNPC = netStore.dialogueOpen ? getNPCById(netStore.dialogueOpen.npcId) : null;
  const dialogueQuest = netStore.dialogueOpen ? getNetworkQuest(netStore.dialogueOpen.questId) : null;
  const dialogueEntry = dialogueQuest
    ? (netStore.quests[dialogueQuest.id] || { state: QS.NONE, killProgress: 0, killTarget: dialogueQuest.killTarget })
    : null;
  const dialogueTrust = (dialogueNPC && worldState)
    ? (worldState.trust[dialogueNPC.id] || 0) : 0;

  // Active quests
  const activeQuests = QUEST_NETWORK.filter(q => {
    const e = netStore.quests[q.id];
    if (q.isHidden && !showHidden && e?.state !== QS.ACTIVE && e?.state !== QS.READY_TO_TURN && e?.state !== QS.COMPLETED) return false;
    return e && e.state !== QS.NONE;
  });

  if (!worldState) return null;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ fontFamily: 'monospace', background: '#06080f' }}>

      <QuestNotifications notifications={netStore.notifications} />

      {/* Reward flash */}
      <AnimatePresence>
        {rewardFlash && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[400] text-center pointer-events-none">
            <div className="px-6 py-4 rounded-2xl"
              style={{ background: 'rgba(6,10,20,0.95)', border: '1px solid rgba(251,191,36,0.4)', boxShadow: '0 0 40px rgba(251,191,36,0.15)' }}>
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-base font-bold text-white">Quest Complete!</div>
              <div className="flex items-center justify-center gap-4 mt-2">
                {rewardFlash.xp && <span className="text-sm" style={{ color: '#fbbf24' }}>+{rewardFlash.xp} XP</span>}
                {rewardFlash.currency && <span className="text-sm" style={{ color: '#34d399' }}>+{rewardFlash.currency} Coins</span>}
                {rewardFlash.buff && <span className="text-sm" style={{ color: '#a78bfa' }}>✦ {rewardFlash.buff}</span>}
                {rewardFlash.specialAbility && <span className="text-sm" style={{ color: '#6ec3ff' }}>⚡ {rewardFlash.specialAbility}</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="text-[9px] tracking-[0.5em] uppercase text-white/20">NPC Quest Network</div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold" style={{ color: '#a78bfa' }}>{worldState.reputation}</span>
          <span className="text-[11px]" style={{ color: '#fbbf24' }}>⭐ {totalXP}</span>
          <span className="text-[11px]" style={{ color: '#34d399' }}>💰 {totalCoins}</span>
          <button onClick={() => setActivePanel(p => p === 'quests' ? null : 'quests')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] transition-all"
            style={{ background: activePanel === 'quests' ? 'rgba(110,195,255,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activePanel === 'quests' ? 'rgba(110,195,255,0.30)' : 'rgba(255,255,255,0.06)'}`, color: activePanel === 'quests' ? '#6ec3ff' : 'rgba(255,255,255,0.3)' }}>
            <ScrollText className="w-3 h-3" /> Quests
          </button>
          <button onClick={() => setActivePanel(p => p === 'world' ? null : 'world')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] transition-all"
            style={{ background: activePanel === 'world' ? 'rgba(167,139,250,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activePanel === 'world' ? 'rgba(167,139,250,0.30)' : 'rgba(255,255,255,0.06)'}`, color: activePanel === 'world' ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}>
            <Globe className="w-3 h-3" /> World
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Scene */}
        <div className="flex-1 relative cursor-crosshair overflow-hidden"
          onClick={handleSceneClick}
          style={{ background: 'radial-gradient(ellipse at 40% 40%, rgba(20,28,50,0.9) 0%, rgba(6,8,16,0.98) 100%)' }}>

          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(110,195,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(110,195,255,0.4) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

          {/* NPCs */}
          {NPCS_NETWORK.map(npc => {
            const available = getAvailableQuestsForNPC(npc.id, worldState.flags, netStore.quests);
            const q = available[0];
            const entry = q ? (netStore.quests[q.id] || { state: QS.NONE }) : { state: QS.COMPLETED };
            return (
              <div key={npc.id} className="absolute"
                style={{ left: npc.position.left, top: npc.position.top, transform: 'translate(-50%,-50%)' }}>
                <NPCToken npc={npc} questEntry={entry} trust={worldState.trust[npc.id] || 0}
                  playerNearby={isNearNPC(npc)} onClick={() => handleNPCClick(npc)} />
              </div>
            );
          })}

          {/* Player */}
          <motion.div animate={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
            transition={{ type: 'spring', damping: 18, stiffness: 180 }}
            className="absolute z-10" style={{ transform: 'translate(-50%,-50%)' }}>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                style={{ background: 'rgba(99,102,241,0.18)', border: '2px solid rgba(99,102,241,0.55)', boxShadow: '0 0 12px rgba(99,102,241,0.25)' }}>
                🧑
              </div>
              <div className="text-[7px] tracking-[0.2em] uppercase text-indigo-300/40">You</div>
            </div>
          </motion.div>

          {/* Hints */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] text-white/12 tracking-[0.2em] uppercase pointer-events-none">
            Click to move · E to talk · K = debug complete · Esc = close
          </div>
        </div>

        {/* Right Panel */}
        <AnimatePresence>
          {activePanel && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 270, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              className="overflow-hidden flex-shrink-0"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,8,16,0.9)' }}>
              <div className="w-[270px] h-full flex flex-col overflow-hidden">

                {/* Panel header */}
                <div className="px-3 py-2.5 flex items-center justify-between flex-shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-[9px] tracking-[0.3em] uppercase text-white/25">
                    {activePanel === 'quests' ? 'Quest Log' : 'World State'}
                  </span>
                  {activePanel === 'quests' && (
                    <button onClick={() => setShowHidden(v => !v)}
                      className="flex items-center gap-1 text-[8px] transition-all"
                      style={{ color: showHidden ? '#a78bfa' : 'rgba(255,255,255,0.2)' }}>
                      {showHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} Hidden
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {activePanel === 'world' && <WorldStatePanel worldState={worldState} />}

                  {activePanel === 'quests' && (
                    <div className="p-3 space-y-4">
                      {/* Trust meters */}
                      <div>
                        <div className="text-[9px] tracking-[0.3em] uppercase text-white/20 mb-2">NPC Trust</div>
                        <div className="space-y-2">
                          {NPCS_NETWORK.map(npc => (
                            <TrustMeter key={npc.id} npc={npc} trust={worldState.trust[npc.id] || 0} />
                          ))}
                        </div>
                      </div>

                      {/* Active quests */}
                      <div>
                        <div className="text-[9px] tracking-[0.3em] uppercase text-white/20 mb-2">Quests</div>
                        {activeQuests.length === 0 ? (
                          <div className="text-[10px] text-white/20 text-center py-4">No active quests</div>
                        ) : (
                          <div className="space-y-1.5">
                            {activeQuests.map(q => {
                              const entry = netStore.quests[q.id] || {};
                              const npc = getNPCById(q.npcId);
                              const stateColor = { ACTIVE: '#fbbf24', READY_TO_TURN: '#34d399', COMPLETED: '#a78bfa' }[entry.state] || '#6ec3ff';
                              return (
                                <div key={q.id} className="px-3 py-2 rounded-lg"
                                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-xs">{npc?.icon}</span>
                                    <span className="text-[11px] font-semibold text-white/75 flex-1 truncate">{q.name}</span>
                                    {q.isHidden && <span className="text-[8px]" style={{ color: '#a78bfa' }}>◆ Hidden</span>}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-white/30">{q.objective}</span>
                                    <span className="text-[9px] font-semibold" style={{ color: stateColor }}>{entry.state}</span>
                                  </div>
                                  {entry.state === QS.ACTIVE && q.killTarget > 0 && (
                                    <div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                      <div className="h-full rounded-full"
                                        style={{ width: `${Math.min(100, (entry.killProgress / entry.killTarget) * 100)}%`, background: '#fbbf24' }} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Debug bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <Bug className="w-3 h-3 text-white/15" />
        <span className="text-[8px] tracking-[0.3em] uppercase text-white/15 mr-1">Debug</span>
        <button onClick={handleSimulateKill}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px] transition-all"
          style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399' }}>
          <Swords className="w-3 h-3" /> Kill
        </button>
        <button onClick={() => {
          const active = QUEST_NETWORK.find(q => netStore.quests[q.id]?.state === QS.ACTIVE && !q.isChoiceQuest);
          if (active) debugFillProgress(active.id);
        }}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px] transition-all"
          style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)', color: '#fbbf24' }}>
          ✅ Complete [K]
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px] ml-auto transition-all"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.20)' }}>
          <RotateCcw className="w-3 h-3" /> Reset All
        </button>
      </div>

      {/* Dialogue */}
      <AnimatePresence>
        {netStore.dialogueOpen && dialogueNPC && dialogueQuest && (
          <BranchingDialogueBox
            key={`${netStore.dialogueOpen.questId}-${dialogueEntry?.state}`}
            npc={dialogueNPC}
            quest={dialogueQuest}
            questEntry={dialogueEntry}
            trust={dialogueTrust}
            onRewardClaimed={handleReward}
          />
        )}
      </AnimatePresence>
    </div>
  );
}