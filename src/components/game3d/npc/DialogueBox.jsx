// DialogueBox.jsx — State-driven NPC dialogue UI

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, CheckCircle2, Star } from 'lucide-react';
import { QuestState } from './questData';
import { acceptQuest, turnInQuest, closeDialogue } from './npcQuestStore';

const STATE_COLORS = {
  [QuestState.NONE]:          { accent: '#6ec3ff', icon: '💬', label: 'New Quest' },
  [QuestState.ACTIVE]:        { accent: '#fbbf24', icon: '📋', label: 'Quest Active' },
  [QuestState.READY_TO_TURN]: { accent: '#34d399', icon: '✅', label: 'Ready to Turn In' },
  [QuestState.COMPLETED]:     { accent: '#a78bfa', icon: '⭐', label: 'Completed' },
};

function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [text]);
  return <span>{displayed}</span>;
}

export default function DialogueBox({ npc, quest, questEntry, onRewardClaimed }) {
  if (!npc || !quest) return null;

  const { state, killProgress = 0, killTarget = 1 } = questEntry;
  const cfg = STATE_COLORS[state] || STATE_COLORS[QuestState.NONE];
  const dialogueText = quest.dialogue[state];

  const handleAccept = () => {
    acceptQuest(quest.id, quest.killTarget);
    closeDialogue();
  };

  const handleDecline = () => closeDialogue();

  const handleTurnIn = () => {
    const ok = turnInQuest(quest.id);
    if (ok && onRewardClaimed) onRewardClaimed(quest.rewards);
    closeDialogue();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg z-[200] px-4"
    >
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(8, 14, 24, 0.92)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${cfg.accent}44`,
          boxShadow: `0 0 40px ${cfg.accent}18`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3"
          style={{ borderBottom: `1px solid ${cfg.accent}22` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
              style={{ background: `${cfg.accent}18`, border: `1px solid ${cfg.accent}44` }}>
              {npc.icon || '🧍'}
            </div>
            <div>
              <div className="text-sm font-bold text-white/90">{npc.name}</div>
              <div className="text-[9px] tracking-[0.25em] uppercase font-medium"
                style={{ color: cfg.accent }}>
                {cfg.icon} {cfg.label}
              </div>
            </div>
          </div>
          <button onClick={closeDialogue}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialogue */}
        <div className="px-5 py-4">
          <div className="text-[13px] leading-relaxed text-white/80 min-h-[3rem]">
            <TypewriterText key={dialogueText} text={dialogueText} />
          </div>
        </div>

        {/* Quest info (NONE state) */}
        {state === QuestState.NONE && (
          <div className="mx-5 mb-3 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(110,195,255,0.06)', border: '1px solid rgba(110,195,255,0.15)' }}>
            <div className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-1">Quest</div>
            <div className="text-sm font-semibold text-white/85">{quest.name}</div>
            <div className="text-[11px] text-white/50 mt-0.5">{quest.objective}</div>
            <div className="flex items-center gap-3 mt-2 text-[10px]">
              <span style={{ color: '#fbbf24' }}>⭐ {quest.rewards.xp} XP</span>
              <span style={{ color: '#34d399' }}>💰 {quest.rewards.currency} Coins</span>
            </div>
          </div>
        )}

        {/* Progress bar (ACTIVE state) */}
        {state === QuestState.ACTIVE && (
          <div className="mx-5 mb-3 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
              <span>{quest.objective}</span>
              <span className="tabular-nums">{killProgress} / {killTarget}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (killProgress / killTarget) * 100)}%`,
                  background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                }} />
            </div>
          </div>
        )}

        {/* Rewards (READY_TO_TURN state) */}
        {state === QuestState.READY_TO_TURN && (
          <div className="mx-5 mb-3 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.20)' }}>
            <div className="text-[10px] tracking-[0.2em] uppercase text-emerald-300/60 mb-1.5">Rewards</div>
            <div className="flex items-center gap-4 text-sm font-bold">
              <span style={{ color: '#fbbf24' }}>⭐ {quest.rewards.xp} XP</span>
              <span style={{ color: '#34d399' }}>💰 {quest.rewards.currency} Coins</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 px-5 pb-5">
          {state === QuestState.NONE && (
            <>
              <button onClick={handleAccept}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold tracking-[0.15em] uppercase transition-all hover:brightness-110"
                style={{ background: `${cfg.accent}22`, border: `1px solid ${cfg.accent}55`, color: cfg.accent }}>
                {quest.acceptText}
              </button>
              <button onClick={handleDecline}
                className="px-4 py-2.5 rounded-lg text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.4)' }}>
                {quest.declineText}
              </button>
            </>
          )}
          {state === QuestState.ACTIVE && (
            <button onClick={closeDialogue}
              className="flex-1 py-2.5 rounded-lg text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.4)' }}>
              I'll get back to it.
            </button>
          )}
          {state === QuestState.READY_TO_TURN && (
            <button onClick={handleTurnIn}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold tracking-[0.15em] uppercase transition-all hover:brightness-110"
              style={{ background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.5)', color: '#34d399', boxShadow: '0 0 16px rgba(52,211,153,0.15)' }}>
              {quest.turnInText}
            </button>
          )}
          {state === QuestState.COMPLETED && (
            <button onClick={closeDialogue}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa' }}>
              Until next time.
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}