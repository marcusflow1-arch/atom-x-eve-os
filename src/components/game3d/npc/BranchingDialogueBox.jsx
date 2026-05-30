// BranchingDialogueBox.jsx — State-aware dialogue with branching choices

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ChevronRight } from 'lucide-react';
import { QuestState } from './questNetwork';
import { acceptQuest, turnInQuest, closeDialogue } from './questNetworkStore';
import { getWorldState } from './worldStateStore';

const PHASE_STYLE = {
  [QuestState.NONE]:           { accent: '#6ec3ff', label: 'New Quest' },
  [QuestState.ACTIVE]:         { accent: '#fbbf24', label: 'In Progress' },
  [QuestState.READY_TO_TURN]:  { accent: '#34d399', label: 'Ready' },
  [QuestState.COMPLETED]:      { accent: '#a78bfa', label: 'Complete' },
};

function useTypewriter(text, speed = 28) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    setDisplay('');
    if (!text) return;
    let i = 0;
    const iv = setInterval(() => {
      setDisplay(text.slice(0, ++i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return display;
}

export default function BranchingDialogueBox({ npc, quest, questEntry, onRewardClaimed }) {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showBranches, setShowBranches] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const state  = questEntry?.state || QuestState.NONE;
  const style  = PHASE_STYLE[state] || PHASE_STYLE[QuestState.NONE];
  const world  = getWorldState();
  const trust  = world.trust[npc.id] ?? 0;

  // Resolve dialogue line — memory-aware
  function resolveDialogue() {
    const raw = quest.dialogue?.[state] || '';
    const flags = world.flags || {};
    // Memory reactions on completed shared quest revisit
    if (state === QuestState.COMPLETED && quest.memoryDialogue) {
      if (flags.killed_first_target && quest.memoryDialogue.killed) return quest.memoryDialogue.killed;
      if (flags.spared_target       && quest.memoryDialogue.spared) return quest.memoryDialogue.spared;
      if (flags.interrogated_target && quest.memoryDialogue.interrogated) return quest.memoryDialogue.interrogated;
    }
    // Trust-based tone modifier
    const base = raw.replace('{killTarget}', questEntry?.killTarget || quest.killTarget || 1);
    if (trust > 50)  return base + (state === QuestState.NONE ? " I trust you with this." : "");
    if (trust < -20) return base + (state === QuestState.NONE ? " Don't make me regret this." : "");
    return base;
  }

  const dialogueText = useTypewriter(resolveDialogue(), 22);

  function handleAccept() {
    if (quest.hasBranching && state === QuestState.READY_TO_TURN) {
      setShowBranches(true);
      return;
    }
    if (state === QuestState.NONE)          { acceptQuest(quest.id); return; }
    if (state === QuestState.READY_TO_TURN) { handleTurnIn(null); return; }
    if (state === QuestState.COMPLETED)     { closeDialogue(); return; }
    closeDialogue();
  }

  function handleTurnIn(branch) {
    setConfirmed(true);
    const rewards = turnInQuest(quest.id, branch);
    if (rewards && onRewardClaimed) {
      setTimeout(() => onRewardClaimed(rewards), 300);
    }
    setTimeout(() => { setConfirmed(false); closeDialogue(); }, 1600);
  }

  function getActionLabel() {
    if (state === QuestState.NONE)           return 'Accept Quest';
    if (state === QuestState.ACTIVE)         return 'Understood';
    if (state === QuestState.READY_TO_TURN)  return quest.hasBranching ? 'Make Your Choice' : 'Turn In Quest';
    if (state === QuestState.COMPLETED)      return 'Close';
    return 'Close';
  }

  const pct = questEntry
    ? Math.min(1, (questEntry.killProgress || 0) / (questEntry.killTarget || 1))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end justify-center pb-8 px-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 200 }}
        className="w-full max-w-xl rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(8,12,20,0.97)',
          border: `1px solid ${npc.color}40`,
          boxShadow: `0 0 40px ${npc.color}20`,
        }}
      >
        {/* NPC Header */}
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: npc.accent, borderBottom: `1px solid ${npc.color}30` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
              style={{ background: `${npc.color}20`, border: `1px solid ${npc.color}40` }}>
              {npc.icon}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: npc.color }}>{npc.name}</div>
              <div className="text-[9px] tracking-[0.3em] uppercase text-white/30 capitalize">{npc.alignment}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
              style={{ background: `${style.accent}20`, border: `1px solid ${style.accent}40`, color: style.accent }}>
              {style.label}
            </div>
            <button onClick={closeDialogue}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quest Title */}
        <div className="px-5 pt-4">
          <div className="text-[9px] tracking-[0.4em] uppercase text-white/25 mb-1">Quest</div>
          <div className="text-base font-bold text-white/90">{quest.title}</div>
        </div>

        {/* Dialogue text */}
        <div className="px-5 pt-3 pb-2 min-h-[72px]">
          <p className="text-sm leading-relaxed text-white/70">{dialogueText}</p>
        </div>

        {/* Progress bar (active state) */}
        {state === QuestState.ACTIVE && (
          <div className="px-5 pb-3">
            <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
              <span>Progress</span>
              <span>{questEntry?.killProgress || 0} / {questEntry?.killTarget || 1}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <motion.div className="h-full rounded-full"
                animate={{ width: `${pct * 100}%` }}
                transition={{ type: 'spring', damping: 18 }}
                style={{ background: `linear-gradient(90deg, ${npc.color}, ${style.accent})` }} />
            </div>
          </div>
        )}

        {/* Rewards preview */}
        {state === QuestState.NONE && !quest.hasBranching && quest.rewards && (
          <div className="px-5 pb-3 flex items-center gap-3">
            <div className="text-[10px] text-white/25">Rewards:</div>
            <span className="text-[11px]" style={{ color: '#fbbf24' }}>+{quest.rewards.xp} XP</span>
            <span className="text-[11px]" style={{ color: '#34d399' }}>+{quest.rewards.currency} Coins</span>
          </div>
        )}

        {/* Branching choices */}
        <AnimatePresence>
          {showBranches && quest.hasBranching && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-2">
                <div className="text-[9px] tracking-[0.4em] uppercase text-white/25 mb-3">Your Decision</div>
                <div className="space-y-2">
                  {Object.entries(quest.branches).map(([key, branch]) => {
                    const r = quest.rewards[key];
                    return (
                      <motion.button
                        key={key}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedBranch(key)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left"
                        style={{
                          background: selectedBranch === key ? `${npc.color}15` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${selectedBranch === key ? npc.color + '50' : 'rgba(255,255,255,0.07)'}`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{branch.icon}</span>
                          <span className="text-sm text-white/80 font-medium">{branch.label}</span>
                        </div>
                        {r && (
                          <div className="flex items-center gap-2 text-[10px]">
                            <span style={{ color: '#fbbf24' }}>+{r.xp}</span>
                            <span style={{ color: '#34d399' }}>+{r.currency}</span>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                {selectedBranch && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => handleTurnIn(selectedBranch)}
                    className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold tracking-[0.15em] uppercase transition-all"
                    style={{
                      background: `${npc.color}20`,
                      border: `1px solid ${npc.color}50`,
                      color: npc.color,
                    }}
                  >
                    Confirm Choice
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion flash */}
        <AnimatePresence>
          {confirmed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-3 gap-2"
            >
              <CheckCircle2 className="w-4 h-4" style={{ color: style.accent }} />
              <span className="text-sm font-semibold" style={{ color: style.accent }}>Quest Complete</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action button */}
        {!showBranches && !confirmed && (
          <div className="px-5 pb-5 pt-2">
            <button
              onClick={handleAccept}
              disabled={state === QuestState.ACTIVE}
              className="w-full py-2.5 rounded-xl text-sm font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-30"
              style={{
                background: state === QuestState.ACTIVE ? 'rgba(255,255,255,0.04)' : `${npc.color}20`,
                border: `1px solid ${state === QuestState.ACTIVE ? 'rgba(255,255,255,0.08)' : npc.color + '50'}`,
                color: state === QuestState.ACTIVE ? 'rgba(255,255,255,0.3)' : npc.color,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                {getActionLabel()} <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}