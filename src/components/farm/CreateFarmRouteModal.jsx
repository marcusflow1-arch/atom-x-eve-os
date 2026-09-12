import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Gauge, Route, Target, Video, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const unwrap = (result) => result?.data ?? result ?? {};

export default function CreateFarmRouteModal({ open, onClose, gameId, clanId, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tactics, setTactics] = useState('');
  const [routeType, setRouteType] = useState('resource');
  const [difficulty, setDifficulty] = useState('medium');
  const [yields, setYields] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (title.trim().length < 3 || saving) return;
    setSaving(true);
    try {
      const result = unwrap(await base44.functions.invoke('farmSystem', {
        action: 'create_route',
        data: { game_id: gameId || '', clan_id: clanId || '', title: title.trim(), description: description.trim(), video_url: videoUrl.trim(), tactics: tactics.trim(), route_type: routeType, difficulty, yields: yields.trim() },
      }));
      if (result?.success === false) throw new Error(result.error || 'Could not create route.');
      toast.success('Farm route published.');
      setTitle(''); setDescription(''); setVideoUrl(''); setTactics(''); setYields('');
      onCreated?.(result.route);
      onClose?.();
    } catch (error) {
      toast.error(error?.message || 'Failed to create route.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return <AnimatePresence>
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <motion.div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#06111b]/95 shadow-2xl backdrop-blur-2xl" initial={{ opacity: 0, y: 16, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}>
        <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4"><div><p className="text-[9px] font-semibold uppercase tracking-[.2em] text-emerald-200/45">Structured farming route</p><h2 className="mt-1 text-lg font-semibold text-white">Share a route</h2></div><button type="button" onClick={onClose} className="rounded-full p-2 text-white/35 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button></header>
        <div className="space-y-4 p-5">
          <label className="text-[10px] uppercase tracking-wider text-white/35"><span className="flex items-center gap-1.5"><FileText className="h-3 w-3" />Title</span><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Best crystal route after level 30" className="mt-1 h-10 border-white/[0.08] bg-white/[0.035] text-white" /></label>
          <label className="text-[10px] uppercase tracking-wider text-white/35">What this route farms<Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Drops, XP, currency, achievement progress, expected requirements…" className="mt-1 min-h-[100px] border-white/[0.08] bg-white/[0.025] text-white/75" /></label>
          <label className="text-[10px] uppercase tracking-wider text-white/35"><span className="flex items-center gap-1.5"><Target className="h-3 w-3" />Steps & tactics</span><Textarea value={tactics} onChange={(event) => setTactics(event.target.value)} placeholder="Start point, route order, enemies/bosses, reset condition, recommended loadout…" className="mt-1 min-h-[150px] border-white/[0.08] bg-white/[0.025] text-white/75" /></label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-[10px] uppercase tracking-wider text-white/35"><span className="flex items-center gap-1.5"><Route className="h-3 w-3" />Type</span><select value={routeType} onChange={(event) => setRouteType(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-white/[0.08] bg-[#08131e] px-3 text-xs text-white/70"><option value="resource">Resource</option><option value="xp">XP</option><option value="boss">Boss</option><option value="achievement">Achievement</option><option value="speedrun">Speedrun</option><option value="other">Other</option></select></label>
            <label className="text-[10px] uppercase tracking-wider text-white/35"><span className="flex items-center gap-1.5"><Gauge className="h-3 w-3" />Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-white/[0.08] bg-[#08131e] px-3 text-xs text-white/70"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="extreme">Extreme</option></select></label>
            <label className="text-[10px] uppercase tracking-wider text-white/35">Estimated yield<Input value={yields} onChange={(event) => setYields(event.target.value)} placeholder="500 iron/hr" className="mt-1 h-9 border-white/[0.08] bg-white/[0.035] text-xs text-white" /></label>
          </div>
          <label className="text-[10px] uppercase tracking-wider text-white/35"><span className="flex items-center gap-1.5"><Video className="h-3 w-3" />Optional video</span><Input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://…" className="mt-1 h-9 border-white/[0.08] bg-white/[0.035] text-xs text-white" /></label>
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-4"><button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-xs text-white/40 hover:bg-white/[0.04] hover:text-white">Cancel</button><button type="button" disabled={saving || title.trim().length < 3} onClick={handleSave} className="rounded-full bg-emerald-300/14 px-5 py-2 text-xs font-semibold text-emerald-100 disabled:opacity-30">{saving ? 'Publishing…' : 'Publish Route'}</button></footer>
      </motion.div>
    </motion.div>
  </AnimatePresence>;
}
