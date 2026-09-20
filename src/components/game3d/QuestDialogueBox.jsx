import React, { useEffect, useRef, useState } from 'react';
import { ScrollText, Check, X, Volume2, VolumeX } from 'lucide-react';
import { getQuestAudio } from './questAudioStore';
import { getQuestDialogue } from './questDialogueStore';

/**
 * QuestDialogueBox — liquid-glass dialogue panel for quest offers,
 * in-progress check-ins, and turn-ins.
 *
 * mode: 'offer' (Accept/Decline), 'in_progress' (Close), 'turn_in' (Claim)
 */
export default function QuestDialogueBox({
  npcName,
  quest,
  mode = 'offer',
  progress = 0,
  objectiveProgress = {},
  onAccept,
  onDecline,
  onClose,
  onClaim,
  onPlayVoice, // optional: hook up TTS later
}) {
  // Hooks must run unconditionally — call them before any early return.
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioUrl = quest ? getQuestAudio(quest.id) : null;

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    audio.play().catch(() => {}); // user-gesture should already have happened (E key / click)
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl, quest?.id]);

  if (!quest) return null;

  const toggleVoice = () => {
    const audio = audioRef.current;
    if (!audio) {
      if (onPlayVoice) onPlayVoice();
      return;
    }
    if (audio.paused) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const hasVoice = !!audioUrl || !!onPlayVoice;

  const objectives = Array.isArray(quest.objectives) && quest.objectives.length
    ? quest.objectives
    : (quest.objective ? [quest.objective] : []);

  const objectiveLabel = (o = {}) => {
    if (o.type === 'kill') return `Defeat ${o.count || 1} enemies`;
    if (o.type === 'kill_tier') return `Defeat ${o.count || 1} ${o.tier || 'target'}${Number(o.count || 1) > 1 ? 's' : ''}`;
    if (o.type === 'defeat_boss') return 'Defeat the target boss';
    if (o.type === 'discover_location') return 'Discover the marked location';
    if (o.type === 'collect_item') return `Collect ${o.count || 1} required item${Number(o.count || 1) > 1 ? 's' : ''}`;
    if (o.type === 'interact') return 'Interact with the marked object';
    if (o.type === 'talk') return 'Speak with the marked character';
    if (o.type === 'escort') return 'Complete the escort';
    if (o.type === 'defend') return 'Complete the defense objective';
    if (o.type === 'capture') return 'Capture the objective';
    if (o.type === 'craft') return 'Craft the required item';
    if (o.type === 'enter_cave') return 'Enter the marked cave';
    if (o.type === 'faction_war') return 'Participate in the faction war';
    if (o.type === 'explore') return 'Explore the marked area';
    return 'Complete the objective';
  };

  const getObjectiveProgress = (objective, index) => {
    const id = objective?.id || `objective_${index}`;
    if (objectiveProgress && Number.isFinite(Number(objectiveProgress[id]))) {
      return Number(objectiveProgress[id]);
    }
    return index === 0 ? Number(progress || 0) : 0;
  };

  return (
    <div
      className="fixed left-6 top-24 w-[480px] max-w-[44vw] rounded-2xl p-6 z-[9999]"
      style={{
        background: 'rgba(10, 14, 22, 0.78)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid rgba(250, 204, 21, 0.35)',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.55), 0 0 40px rgba(250, 204, 21, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(250, 204, 21, 0.15)',
              border: '1px solid rgba(250, 204, 21, 0.4)',
            }}
          >
            <ScrollText className="w-4 h-4 text-yellow-300" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-yellow-300/80">{npcName}</div>
            <div className="text-lg font-bold text-white tracking-wide">{quest.title}</div>
          </div>
        </div>
        {hasVoice && (
          <button
            onClick={toggleVoice}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all"
            title={isPlaying ? 'Pause voice' : 'Play voice'}
          >
            {isPlaying ? (
              <VolumeX className="w-3.5 h-3.5 text-yellow-300" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-white/70" />
            )}
          </button>
        )}
      </div>

      {/* Body / dialogue text (uses admin override if set) */}
      <div className="text-sm text-white/85 leading-relaxed mb-4 italic">
        "{getQuestDialogue(quest.id, quest.description)}"
      </div>

      {/* Objectives + reward */}
      <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-[1fr_auto]">
        <div
          className="px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/40 mb-1.5">
            {objectives.length > 1 ? 'Objectives' : 'Objective'}
          </div>
          <div className="space-y-1.5">
            {objectives.map((objective, index) => {
              const current = getObjectiveProgress(objective, index);
              const required = Math.max(1, Number(objective.count) || 1);
              const done = current >= required;
              return (
                <div key={objective.id || index} className="flex items-center justify-between gap-3 text-sm">
                  <span className={done ? 'text-emerald-200' : 'text-white/90'}>
                    {objective.optional ? 'Optional: ' : ''}{objectiveLabel(objective)}
                  </span>
                  {(mode === 'in_progress' || mode === 'turn_in') && (
                    <span className={`font-mono text-xs ${done ? 'text-emerald-300' : 'text-yellow-300'}`}>
                      {Math.min(current, required)} / {required}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div
          className="px-3 py-2 rounded-lg min-w-[170px]"
          style={{
            background: 'rgba(250, 204, 21, 0.08)',
            border: '1px solid rgba(250, 204, 21, 0.25)',
          }}
        >
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-yellow-300/60 mb-0.5">Reward</div>
          <div className="text-sm text-yellow-200 font-semibold">
            +{Number(quest.reward?.xp || 0)} XP · +{Number(quest.reward?.points || 0)} pt
          </div>
          {Number(quest.reward?.contribution || 0) > 0 && (
            <div className="text-xs text-cyan-200/80 mt-0.5">
              +{quest.reward.contribution} Contribution
            </div>
          )}
          {Number(quest.reward?.reputation || 0) > 0 && (
            <div className="text-xs text-emerald-200/80 mt-0.5">
              +{quest.reward.reputation} Faction Reputation
            </div>
          )}
          {quest.reward?.unlock && (
            <div className="text-xs text-amber-300 font-semibold mt-0.5">
              {quest.reward.unlock.icon} {quest.reward.unlock.type === 'class' ? 'Class Change' : 'Ability'}: {quest.reward.unlock.name}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {mode === 'offer' && (
          <>
            <button
              onClick={onDecline}
              className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/70 text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Decline
            </button>
            <button
              onClick={onAccept}
              className="px-5 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/50 text-yellow-200 text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5"
              style={{ boxShadow: '0 0 16px rgba(250, 204, 21, 0.2)' }}
            >
              <Check className="w-3.5 h-3.5" /> Accept Quest
            </button>
          </>
        )}
        {mode === 'in_progress' && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold tracking-wider uppercase transition-all"
          >
            Keep Going
          </button>
        )}
        {mode === 'turn_in' && (
          <button
            onClick={onClaim}
            className="px-5 py-2 rounded-lg bg-green-500/25 hover:bg-green-500/40 border border-green-400/50 text-green-200 text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5"
            style={{ boxShadow: '0 0 18px rgba(74, 222, 128, 0.25)' }}
          >
            <Check className="w-3.5 h-3.5" /> Claim Reward
          </button>
        )}
      </div>
    </div>
  );
}