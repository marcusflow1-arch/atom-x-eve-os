import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Gamepad2, ImagePlus, Tag, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const TYPES = [
  ['discussion', 'Discussion'],
  ['tip', 'Quick tip'],
  ['guide', 'Guide'],
  ['achievement_guide', 'Achievement hunt'],
  ['farming_guide', 'Farming route'],
  ['full_guide', 'Full game guide'],
];
const GUIDE_KINDS = ['none', 'quick_tip', 'achievement', 'farming', 'walkthrough', 'build', 'collectibles', 'boss', 'full_game'];

export default function PostComposer({ isOpen, onCancel, onSubmit, games = [], initialGame = null }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('discussion');
  const [gameTitle, setGameTitle] = useState(initialGame?.title || '');
  const [tags, setTags] = useState('');
  const [guideKind, setGuideKind] = useState('none');
  const [difficulty, setDifficulty] = useState('any');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (isOpen) setGameTitle(initialGame?.title || ''); }, [isOpen, initialGame?.title]);
  useEffect(() => {
    if (!['guide', 'achievement_guide', 'farming_guide', 'full_guide'].includes(type)) setGuideKind(type === 'tip' ? 'quick_tip' : 'none');
    else if (guideKind === 'none') setGuideKind(type === 'achievement_guide' ? 'achievement' : type === 'farming_guide' ? 'farming' : type === 'full_guide' ? 'full_game' : 'walkthrough');
  }, [type]);

  const selectedGame = games.find((game) => game.title === gameTitle);
  const canPost = useMemo(() => title.trim().length >= 3 && content.trim().length >= 2, [title, content]);

  const submit = async () => {
    if (!canPost || submitting) return;
    setSubmitting(true);
    try {
      let image_url = '';
      if (imageFile) {
        const uploaded = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = uploaded?.file_url || '';
      }
      const community = type === 'achievement_guide' ? 'achievements' : type === 'farming_guide' ? 'farming' : ['guide', 'full_guide'].includes(type) ? 'guide' : type === 'tip' ? 'tips' : 'discussions';
      await onSubmit?.({
        title: title.trim(), content: content.trim(), type,
        community, game_title: gameTitle, genre: selectedGame?.genre || '', image_url,
        tags: tags.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean),
        guide_kind: guideKind, difficulty,
      });
      setTitle(''); setContent(''); setTags(''); setType('discussion'); setGuideKind('none'); setDifficulty('any'); setImageFile(null);
    } finally { setSubmitting(false); }
  };

  if (!isOpen) return null;
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}>
    <motion.div initial={{ opacity: 0, y: 18, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d14]/95 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4"><div><p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/45">Community intelligence</p><h2 className="mt-1 text-lg font-semibold text-white">Create a post or game guide</h2></div><button type="button" onClick={onCancel} className="rounded-lg p-2 text-white/35 hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button></div>
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5 text-xs text-white/40">Format<select value={type} onChange={(e) => setType(e.target.value)} className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white outline-none">{TYPES.map(([value, label]) => <option key={value} value={value} className="bg-slate-950">{label}</option>)}</select></label>
          <label className="space-y-1.5 text-xs text-white/40">Game<select value={gameTitle} onChange={(e) => setGameTitle(e.target.value)} className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white outline-none"><option value="" className="bg-slate-950">Platform-wide</option>{games.map((game) => <option key={game.id} value={game.title} className="bg-slate-950">{game.title}</option>)}</select></label>
        </div>
        <Input value={title} maxLength={180} onChange={(e) => setTitle(e.target.value)} placeholder="Give players a clear title…" className="h-11 border-white/[0.08] bg-white/[0.035] text-white placeholder:text-white/22" />
        <Textarea value={content} maxLength={40000} onChange={(e) => setContent(e.target.value)} placeholder={type === 'full_guide' ? 'Write the complete route: requirements, preparation, steps, bosses, collectibles, missables, achievements, farming notes…' : 'Share the strategy, discovery, question, or route…'} className="min-h-[260px] resize-y border-white/[0.08] bg-white/[0.025] text-sm leading-6 text-white/75 placeholder:text-white/20" />
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1.5 text-xs text-white/40"><span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />Guide focus</span><select value={guideKind} onChange={(e) => setGuideKind(e.target.value)} className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 text-xs text-white">{GUIDE_KINDS.map((kind) => <option className="bg-slate-950" key={kind}>{kind.replaceAll('_', ' ')}</option>)}</select></label>
          <label className="space-y-1.5 text-xs text-white/40">Difficulty<select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 text-xs text-white">{['any','beginner','intermediate','advanced','expert'].map((value) => <option className="bg-slate-950" key={value}>{value}</option>)}</select></label>
          <label className="space-y-1.5 text-xs text-white/40"><span className="flex items-center gap-1"><Tag className="h-3 w-3" />Tags</span><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="boss, missable, xp" className="h-9 border-white/[0.08] bg-white/[0.04] text-xs text-white" /></label>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/[0.09] px-3 py-3 text-xs text-white/35 hover:border-cyan-200/20 hover:text-white/60"><ImagePlus className="h-4 w-4" /><input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />{imageFile ? imageFile.name : 'Optional screenshot / route image'}</label>
        <div className="rounded-lg border border-cyan-200/[0.07] bg-cyan-200/[0.025] px-4 py-3 text-xs leading-5 text-white/35"><Gamepad2 className="mr-2 inline h-3.5 w-3.5 text-cyan-200/50" />Full guides are meant to read like a modern strategy guide: preparation, route, missables, boss notes, farming efficiency and achievement-card hints can all live in one post.</div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-6 py-4"><button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-white/40 hover:bg-white/[0.04] hover:text-white">Cancel</button><button type="button" disabled={!canPost || submitting} onClick={submit} className="rounded-lg border border-cyan-200/15 bg-cyan-300/10 px-5 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-30">{submitting ? 'Publishing…' : 'Publish'}</button></div>
    </motion.div>
  </motion.div></AnimatePresence>;
}
