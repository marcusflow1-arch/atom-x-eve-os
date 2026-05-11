import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Upload, Trash2, Play, Pause, Loader2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import { QUESTS, QUEST_NPCS } from '../game3d/questData';
import {
  getAllQuestAudio,
  setQuestAudio,
  clearQuestAudio,
  subscribeQuestAudio,
} from '../game3d/questAudioStore';

/**
 * QuestAudioManager — admin tool to upload a voice-over audio file per quest.
 * Stored URLs are kept in localStorage via questAudioStore and consumed by
 * QuestDialogueBox at runtime.
 */
export default function QuestAudioManager() {
  const [audioMap, setAudioMap] = useState(getAllQuestAudio());
  const [uploadingId, setUploadingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return subscribeQuestAudio((m) => setAudioMap({ ...m }));
  }, []);

  const handleUpload = async (questId, file) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      showError('Please upload an audio file (mp3, wav, m4a, ogg)');
      return;
    }
    setUploadingId(questId);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setQuestAudio(questId, file_url);
      showSuccess('Voice audio uploaded!');
    } catch (err) {
      showError(err, 'Upload');
    } finally {
      setUploadingId(null);
    }
  };

  const togglePlay = (questId, url) => {
    if (playingId === questId) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
    audioRef.current = audio;
    setPlayingId(questId);
  };

  const handleRemove = (questId) => {
    if (playingId === questId) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
    clearQuestAudio(questId);
    showSuccess('Audio removed');
  };

  const npcName = (npcId) =>
    QUEST_NPCS.find((n) => n.id === npcId)?.name || npcId;

  const totalWithAudio = Object.keys(audioMap).filter((k) => audioMap[k]).length;

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="w-6 h-6 text-pink-400" />
            Quest Voice Audio
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload a voice recording for each quest. NPCs will play the audio when the player opens the quest dialogue.
          </p>
        </div>
        <Badge variant="outline" className="text-slate-400">
          {totalWithAudio} / {QUESTS.length} recorded
        </Badge>
      </div>

      <div className="space-y-3">
        {QUESTS.map((quest) => {
          const url = audioMap[quest.id];
          const isUploading = uploadingId === quest.id;
          const isPlaying = playingId === quest.id;

          return (
            <div
              key={quest.id}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4"
            >
              {/* Quest info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-yellow-600/30 text-yellow-200 border border-yellow-500/40 text-[10px]">
                    LVL {quest.unlockLevel}
                  </Badge>
                  <span className="font-semibold text-white truncate">{quest.title}</span>
                  {url ? (
                    <Badge className="bg-green-600/30 text-green-200 border border-green-500/40 text-[10px]">
                      Recorded
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-600/30 text-slate-300 border border-slate-500/40 text-[10px]">
                      No audio
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  <span className="text-pink-300/80">{npcName(quest.npcId)}</span>
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="italic">"{quest.description.slice(0, 100)}{quest.description.length > 100 ? '…' : ''}"</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePlay(quest.id, url)}
                    className="bg-slate-900 border-slate-700"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                )}

                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleUpload(quest.id, e.target.files?.[0])}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Button
                    size="sm"
                    disabled={isUploading}
                    className="bg-pink-600 hover:bg-pink-700"
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-1" />
                          {url ? 'Replace' : 'Upload'}
                        </>
                      )}
                    </span>
                  </Button>
                </label>

                {url && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(quest.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}