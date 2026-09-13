import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, X, Sparkles, Eye, Square } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { trackAvatarExperience, trackPlayerDecision } from '@/lib/atomTelemetry';
import { getAvatarScreenObserverState, stopAvatarScreenObserver, subscribeAvatarScreenObserver } from '@/lib/avatarScreenObserver';

const INTERNAL_EVENTS = {
  gamePlayerAction: (d = {}) => ({ event_type: 'social_action', title: 'Player interaction', action: d.action || 'interacted', context: d.playerName ? `Interaction with ${d.playerName}` : 'Player interaction', significance: 35, telemetry: d }),
  combatXPReward: (d = {}) => ({ event_type: 'combat_victory', title: 'Combat reward', action: 'Defeated an enemy', outcome: `Earned ${d.xp || d.amount || ''} XP`.trim(), significance: 38, telemetry: d }),
  playerDeathAnimation: () => ({ event_type: 'failure_death', title: 'Player defeated', action: 'The run ended in defeat', outcome: 'Player death', significance: 52, emotional_valence: -30 }),
  playerRespawn: (d = {}) => ({ event_type: 'recovery', title: 'Respawned', action: 'Returned after defeat', significance: 28, telemetry: d }),
  lootPickup: (d = {}) => ({ event_type: 'resource_decision', title: 'Loot collected', action: `Picked up ${d.name || d.item?.name || 'loot'}`, significance: 18, telemetry: d }),
  bossDefeated: (d = {}) => ({ event_type: 'major_victory', title: 'Boss defeated', action: `Defeated ${d.name || d.bossName || 'a boss'}`, significance: 82, emotional_valence: 65, is_key_memory: true, telemetry: d }),
  rogueBossDefeated: (d = {}) => ({ event_type: 'major_victory', title: 'Rogue boss defeated', action: `Defeated ${d.name || d.bossName || 'a rogue boss'}`, significance: 85, emotional_valence: 70, is_key_memory: true, telemetry: d }),
  livingQuestAccepted: (d = {}) => ({ event_type: 'quest_choice', title: 'Quest accepted', action: `Accepted ${d.title || d.questName || 'a quest'}`, significance: 48, telemetry: d }),
  questRewardUnlock: (d = {}) => ({ event_type: 'achievement', title: 'Quest reward unlocked', action: d.name || d.reward_name || 'Unlocked a quest reward', significance: 50, emotional_valence: 30, telemetry: d }),
  weaponMasteryEvent: (d = {}) => ({ event_type: 'progression', title: 'Weapon mastery changed', action: d.action || d.type || 'Weapon mastery progressed', significance: 26, telemetry: d }),
};

function ScreenObserverBadge({ observer }) {
  if (!observer?.active) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="fixed right-5 top-[74px] z-[100003] flex items-center gap-2 border border-cyan-100/[0.1] bg-[#071018]/90 px-3 py-2 text-[9px] text-white/55 shadow-xl backdrop-blur-2xl">
      <Eye className={`h-3.5 w-3.5 ${observer.analyzing ? 'animate-pulse text-cyan-200/80' : 'text-cyan-200/50'}`} />
      <span>{observer.analyzing ? 'AI reading sampled frame' : 'AI observing shared screen'}</span>
      <button type="button" onClick={() => stopAvatarScreenObserver()} className="ml-1 inline-flex items-center gap-1 border-l border-white/[0.07] pl-2 text-rose-200/55 hover:text-rose-100"><Square className="h-2.5 w-2.5 fill-current" /> Stop</button>
    </motion.div>
  );
}

function ReflectionPrompt({ prompt, onDone }) {
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!answer.trim() || busy) return;
    setBusy(true);
    try {
      const response = await base44.functions.invoke('avatarMindCore', { action: 'answerReflection', payload: { prompt_id: prompt.id, answer: answer.trim() } });
      const data = response?.data || response;
      if (data?.error) throw new Error(data.error);
      window.dispatchEvent(new CustomEvent('atom:mind-updated', { detail: data }));
      onDone();
    } catch (error) {
      console.warn('Could not answer avatar reflection:', error);
    } finally {
      setBusy(false);
    }
  };
  const skip = async () => {
    setBusy(true);
    try { await base44.functions.invoke('avatarMindCore', { action: 'skipReflection', payload: { prompt_id: prompt.id } }); } catch {}
    setBusy(false);
    onDone();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} className="fixed bottom-20 right-6 z-[100002] w-[min(420px,calc(100vw-28px))] overflow-hidden border border-cyan-100/[0.11] bg-[#081018]/92 shadow-[0_28px_90px_rgba(0,0,0,.55)] backdrop-blur-3xl">
      <div className="flex items-start gap-3 border-b border-white/[0.055] px-4 py-3">
        <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-cyan-200/[0.08]"><Sparkles className="h-3.5 w-3.5 text-cyan-100/70" /></div>
        <div className="min-w-0 flex-1"><div className="text-[8px] font-black uppercase tracking-[.24em] text-cyan-100/45">Your AI is curious</div><p className="mt-1 text-[11px] leading-5 text-white/42">{prompt.reason || 'It noticed something worth understanding instead of guessing.'}</p></div>
        <button type="button" onClick={skip} disabled={busy} className="p-1 text-white/25 hover:text-white/65"><X className="h-4 w-4" /></button>
      </div>
      <div className="px-4 py-4">
        <p className="text-sm font-medium leading-6 text-white/88">{prompt.question}</p>
        <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={5000} rows={3} placeholder="Tell it in your own words…" className="mt-3 w-full resize-none border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs leading-5 text-white/75 outline-none placeholder:text-white/18 focus:border-cyan-100/[0.18]" />
        <div className="mt-3 flex items-center justify-between gap-3"><button type="button" onClick={skip} disabled={busy} className="text-[9px] uppercase tracking-[.16em] text-white/28 hover:text-white/55">Skip this question</button><button type="button" onClick={submit} disabled={busy || !answer.trim()} className="inline-flex h-8 items-center gap-2 bg-cyan-100/90 px-3 text-[9px] font-black uppercase tracking-[.14em] text-slate-950 disabled:opacity-30"><Send className="h-3 w-3" />{busy ? 'Learning…' : 'Answer'}</button></div>
      </div>
    </motion.div>
  );
}

// Global runtime bridge between games, the long-term avatar mind and the UI.
// Native Atom × Eve games can emit structured events. External games can be
// observed through the opt-in screen observer in AvatarMindPanel.
export default function AIReflectionBridge() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(null);
  const [observer, setObserver] = useState(() => getAvatarScreenObserverState());
  const throttle = useRef(new Map());

  const refreshPrompt = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await base44.functions.invoke('avatarMindCore', { action: 'getMind', payload: {} });
      const data = response?.data || response;
      setPrompt(data?.pending_reflection || null);
    } catch {}
  }, [user?.id]);

  useEffect(() => subscribeAvatarScreenObserver(setObserver), []);

  useEffect(() => {
    if (!user?.id) return undefined;
    refreshPrompt();
    const timer = window.setInterval(refreshPrompt, 45000);
    const mindUpdate = () => refreshPrompt();
    window.addEventListener('atom:mind-updated', mindUpdate);
    return () => { window.clearInterval(timer); window.removeEventListener('atom:mind-updated', mindUpdate); };
  }, [user?.id, refreshPrompt]);

  useEffect(() => {
    const onDecision = (event) => {
      const detail = event?.detail;
      if (!detail?.decision_type || !detail?.choice_made) return;
      trackPlayerDecision(detail);
    };
    const onExperience = (event) => {
      if (!event?.detail?.event_type) return;
      trackAvatarExperience(event.detail);
    };
    window.addEventListener('atom:player-decision', onDecision);
    window.addEventListener('atom:game-experience', onExperience);

    const cleanups = Object.entries(INTERNAL_EVENTS).map(([name, mapper]) => {
      const listener = (event) => {
        const current = Date.now();
        const previous = throttle.current.get(name) || 0;
        const minGap = name === 'lootPickup' || name === 'combatXPReward' ? 12000 : 3500;
        if (current - previous < minGap) return;
        throttle.current.set(name, current);
        const mapped = mapper(event?.detail || {});
        trackAvatarExperience({ source: 'game_event', game_name: document?.title || '', ...mapped });
      };
      window.addEventListener(name, listener);
      return () => window.removeEventListener(name, listener);
    });

    return () => {
      window.removeEventListener('atom:player-decision', onDecision);
      window.removeEventListener('atom:game-experience', onExperience);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return <><ScreenObserverBadge observer={observer} /><AnimatePresence>{prompt && <ReflectionPrompt prompt={prompt} onDone={() => { setPrompt(null); window.setTimeout(refreshPrompt, 1200); }} />}</AnimatePresence></>;
}
