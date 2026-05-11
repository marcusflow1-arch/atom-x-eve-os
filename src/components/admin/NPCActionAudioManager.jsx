import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Upload, Trash2, Play, Pause, Loader2, Mic, ChevronDown, ChevronRight, Save, Sword, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import { QUESTS, QUEST_NPCS } from '../game3d/questData';
import { getAllQuestAudio, setQuestAudio, clearQuestAudio, subscribeQuestAudio } from '../game3d/questAudioStore';
import { ACTION_SOUNDS, getAllActionSounds, setActionSound, clearActionSound, subscribeActionSounds } from '../game3d/combatAudioStore';
import { getQuestDialogue, setQuestDialogue, subscribeQuestDialogue } from '../game3d/questDialogueStore';

const CATEGORY_META = {
  player: { label: 'Player Controls', icon: User,      color: 'text-cyan-300',   border: 'border-cyan-500/30' },
  enemy:  { label: 'Enemy AI',        icon: Sword,     color: 'text-red-300',    border: 'border-red-500/30' },
  system: { label: 'System / UI',     icon: Sparkles,  color: 'text-yellow-300', border: 'border-yellow-500/30' },
};

/**
 * Unified NPC + Combat audio manager.
 *
 *  - Section 1: Action sound effects (player walk / attack / enemy attack / etc).
 *  - Section 2: Quest NPCs — each NPC is a collapsible dropdown listing all
 *    quests they offer, with editable dialogue text + per-quest voice upload.
 */
export default function NPCActionAudioManager() {
  const [actionMap, setActionMap]   = useState(getAllActionSounds());
  const [questAudio, setQuestAudioMap] = useState(getAllQuestAudio());
  const [, setDialogueTick] = useState(0); // bump on dialogue changes
  const [uploadingId, setUploadingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [openNPC, setOpenNPC] = useState(null);
  const [dialogueDrafts, setDialogueDrafts] = useState({}); // questId → draft text
  const audioRef = useRef(null);

  useEffect(() => {
    const off1 = subscribeActionSounds((m) => setActionMap({ ...m }));
    const off2 = subscribeQuestAudio((m) => setQuestAudioMap({ ...m }));
    const off3 = subscribeQuestDialogue(() => setDialogueTick((t) => t + 1));
    return () => { off1(); off2(); off3(); };
  }, []);

  const upload = async (file, onUrl, id) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      showError('Please upload an audio file');
      return;
    }
    setUploadingId(id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUrl(file_url);
      showSuccess('Audio uploaded!');
    } catch (err) {
      showError(err, 'Upload');
    } finally {
      setUploadingId(null);
    }
  };

  const togglePlay = (id, url) => {
    if (!url) return;
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
    audioRef.current = audio;
    setPlayingId(id);
  };

  // Group action sounds by category
  const grouped = ACTION_SOUNDS.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  const questsByNPC = (npcId) => QUESTS.filter((q) => q.npcId === npcId);

  const getDraft = (questId, fallback) =>
    dialogueDrafts[questId] !== undefined ? dialogueDrafts[questId] : getQuestDialogue(questId, fallback);

  const saveDialogue = (questId) => {
    const text = dialogueDrafts[questId];
    if (text === undefined) return;
    setQuestDialogue(questId, text);
    showSuccess('Dialogue saved');
    setDialogueDrafts((d) => { const n = { ...d }; delete n[questId]; return n; });
  };

  const npcAudioCount = (npcId) =>
    questsByNPC(npcId).filter((q) => questAudio[q.id]).length;

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-8">
      <header>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="w-6 h-6 text-pink-400" />
          NPC, Enemy & Action Audio
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Upload sound effects for in-game actions, and record voice lines per quest. Audio plays live in-game when the action fires.
        </p>
      </header>

      {/* ─────────────────── ACTION SFX ─────────────────── */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, sounds]) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.icon;
          return (
            <div key={category} className={`bg-slate-800/40 border ${meta.border} rounded-xl p-4`}>
              <div className={`flex items-center gap-2 mb-3 ${meta.color}`}>
                <Icon className="w-4 h-4" />
                <h3 className="font-bold text-sm tracking-wider uppercase">{meta.label}</h3>
              </div>
              <div className="space-y-2">
                {sounds.map((s) => {
                  const url = actionMap[s.key];
                  const id = `action:${s.key}`;
                  return (
                    <div key={s.key} className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{s.label}</span>
                          {url ? (
                            <Badge className="bg-green-600/30 text-green-200 border border-green-500/40 text-[10px]">SET</Badge>
                          ) : (
                            <Badge className="bg-slate-600/30 text-slate-300 border border-slate-500/40 text-[10px]">EMPTY</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{s.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {url && (
                          <Button size="sm" variant="outline" onClick={() => togglePlay(id, url)} className="bg-slate-900 border-slate-700">
                            {playingId === id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => upload(e.target.files?.[0], (u) => setActionSound(s.key, u), id)}
                            className="hidden"
                            disabled={uploadingId === id}
                          />
                          <Button size="sm" disabled={uploadingId === id} className="bg-pink-600 hover:bg-pink-700" asChild>
                            <span>
                              {uploadingId === id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            </span>
                          </Button>
                        </label>
                        {url && (
                          <Button size="icon" variant="ghost" onClick={() => clearActionSound(s.key)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─────────────────── QUEST NPCs ─────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-yellow-300">
          <ScrollIcon />
          <h3 className="font-bold text-sm tracking-wider uppercase">Quest NPCs & Dialogue</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Click an NPC to expand their quests. Edit the spoken text or upload a voice recording per quest.</p>

        <div className="space-y-2">
          {QUEST_NPCS.map((npc) => {
            const npcQuests = questsByNPC(npc.id);
            const isOpen = openNPC === npc.id;
            const recorded = npcAudioCount(npc.id);
            return (
              <div key={npc.id} className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenNPC(isOpen ? null : npc.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-slate-800/70 transition-colors text-left"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <div className="flex-1">
                    <div className="font-semibold text-white">{npc.name}</div>
                    <div className="text-xs text-slate-400">{npcQuests.length} quest{npcQuests.length !== 1 ? 's' : ''}</div>
                  </div>
                  <Badge className="bg-pink-600/30 text-pink-200 border border-pink-500/40 text-[10px]">
                    {recorded} / {npcQuests.length} voiced
                  </Badge>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-700"
                    >
                      <div className="p-4 space-y-4 bg-slate-900/40">
                        {npcQuests.map((quest) => {
                          const audioId = `quest:${quest.id}`;
                          const url = questAudio[quest.id];
                          const draft = getDraft(quest.id, quest.description);
                          const isDirty = dialogueDrafts[quest.id] !== undefined && dialogueDrafts[quest.id] !== getQuestDialogue(quest.id, quest.description);
                          return (
                            <div key={quest.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge className="bg-yellow-600/30 text-yellow-200 border border-yellow-500/40 text-[10px]">
                                  LVL {quest.unlockLevel}
                                </Badge>
                                <span className="font-semibold text-white text-sm">{quest.title}</span>
                                {url && <Badge className="bg-green-600/30 text-green-200 border border-green-500/40 text-[10px]">VOICED</Badge>}
                              </div>

                              {/* Editable dialogue */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NPC says (editable)</label>
                                  {isDirty && (
                                    <Button size="sm" onClick={() => saveDialogue(quest.id)} className="bg-green-600 hover:bg-green-700 h-7 px-2 text-xs">
                                      <Save className="w-3 h-3 mr-1" /> Save
                                    </Button>
                                  )}
                                </div>
                                <Textarea
                                  value={draft}
                                  onChange={(e) => setDialogueDrafts((d) => ({ ...d, [quest.id]: e.target.value }))}
                                  className="bg-slate-950 border-slate-700 text-sm min-h-[70px] italic"
                                  placeholder="What this NPC says when offering the quest..."
                                />
                              </div>

                              {/* Voice upload */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex-1">Voice recording</span>
                                {url && (
                                  <Button size="sm" variant="outline" onClick={() => togglePlay(audioId, url)} className="bg-slate-900 border-slate-700 h-8">
                                    {playingId === audioId ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                  </Button>
                                )}
                                <label className="relative cursor-pointer">
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => upload(e.target.files?.[0], (u) => setQuestAudio(quest.id, u), audioId)}
                                    className="hidden"
                                    disabled={uploadingId === audioId}
                                  />
                                  <Button size="sm" disabled={uploadingId === audioId} className="bg-pink-600 hover:bg-pink-700 h-8" asChild>
                                    <span>
                                      {uploadingId === audioId ? (
                                        <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Uploading</>
                                      ) : (
                                        <><Upload className="w-3.5 h-3.5 mr-1" /> {url ? 'Replace' : 'Upload Voice'}</>
                                      )}
                                    </span>
                                  </Button>
                                </label>
                                {url && (
                                  <Button size="icon" variant="ghost" onClick={() => clearQuestAudio(quest.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Inline scroll icon (keep imports tidy)
function ScrollIcon() {
  return <Volume2 className="w-4 h-4" />;
}