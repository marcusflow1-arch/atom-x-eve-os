import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import SectionShell, { glassCard, LoadingState } from '../SectionShell';

// Story Codex — real StoryProgress backend: begin, track and advance your AI story
export default function StorySection({ accent }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(undefined); // undefined = loading, null = none yet
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    base44.entities.StoryProgress.filter({ user_id: user.id, story_id: 'main' })
      .then((rows) => setProgress(rows[0] || null));
  }, [user?.id]);

  const begin = async () => {
    setBusy(true);
    const created = await base44.entities.StoryProgress.create({
      user_id: user.id, story_id: 'main', current_chapter_id: '1', completed_chapter_ids: [], last_updated: new Date().toISOString(),
    });
    setProgress(created);
    setBusy(false);
  };

  const advance = async () => {
    setBusy(true);
    const completed = [...(progress.completed_chapter_ids || []), progress.current_chapter_id];
    const nextId = String((parseInt(progress.current_chapter_id, 10) || completed.length) + 1);
    const patch = { completed_chapter_ids: completed, current_chapter_id: nextId, last_updated: new Date().toISOString() };
    await base44.entities.StoryProgress.update(progress.id, patch);
    setProgress((p) => ({ ...p, ...patch }));
    setBusy(false);
  };

  if (progress === undefined) return <LoadingState />;

  return (
    <SectionShell title="Story Codex" accent={accent} subtitle="Your living AI narrative — every chapter is written by how you play">
      {progress === null ? (
        <div className="h-full flex flex-col items-center justify-center gap-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={glassCard('rgba(34,211,238,0.35)')}>
            <BookOpen className="w-9 h-9 text-cyan-300" />
          </div>
          <p className="text-white/50 text-sm max-w-sm text-center">Your story has not begun. Open the codex and let the AI weave your first chapter.</p>
          <button onClick={begin} disabled={busy} className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-white bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 transition-all flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Begin Your Story
          </button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          {/* Current chapter hero */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-8 mb-6 relative overflow-hidden" style={glassCard('rgba(34,211,238,0.35)')}>
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.14) 0%, transparent 70%)' }} />
            <p className="text-cyan-300/80 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Now Playing</p>
            <h3 className="text-white font-black text-3xl">Chapter {progress.current_chapter_id}</h3>
            <p className="text-white/40 text-xs mt-2">
              {(progress.completed_chapter_ids || []).length} chapter{(progress.completed_chapter_ids || []).length === 1 ? '' : 's'} completed
              {progress.last_updated ? ` · last written ${new Date(progress.last_updated).toLocaleDateString()}` : ''}
            </p>
            <button onClick={advance} disabled={busy} className="mt-5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 transition-all flex items-center gap-2">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />} Complete Chapter & Advance
            </button>
          </motion.div>

          {/* Completed chapter trail */}
          <h4 className="text-white/40 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Chapter Trail</h4>
          <div className="flex flex-wrap gap-2">
            {(progress.completed_chapter_ids || []).map((id, i) => (
              <motion.div key={`${id}-${i}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white/60" style={glassCard('rgba(74,222,128,0.25)')}>
                Ch. {id} ✓
              </motion.div>
            ))}
            <div className="px-4 py-2 rounded-lg text-xs font-bold text-cyan-300 animate-pulse" style={glassCard('rgba(34,211,238,0.40)')}>
              Ch. {progress.current_chapter_id} — in progress
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}