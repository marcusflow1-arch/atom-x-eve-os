import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import './forumRefresh.css';
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
  const [submitError, setSubmitError] = useState('');
  const returnFocus = useRef(null);

  useEffect(() => { if (isOpen) setGameTitle(initialGame?.title || ''); }, [isOpen, initialGame?.title]);
  useEffect(() => {
    if (!['guide', 'achievement_guide', 'farming_guide', 'full_guide'].includes(type)) setGuideKind(type === 'tip' ? 'quick_tip' : 'none');
    else if (guideKind === 'none') setGuideKind(type === 'achievement_guide' ? 'achievement' : type === 'farming_guide' ? 'farming' : type === 'full_guide' ? 'full_game' : 'walkthrough');
  }, [type]);

  const selectedGame = games.find((game) => game.title === gameTitle);
  const canPost = useMemo(() => title.trim().length >= 3 && content.trim().length >= 2, [title, content]);

  const submit = async () => {
    if (!canPost || submitting) return;
    setSubmitting(true); setSubmitError('');
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
    } catch (error) { setSubmitError(error?.message || 'Your post could not be published. Your draft is still here; please try again.'); }
    finally { setSubmitting(false); }
  };

  return <Dialog.Root open={isOpen} onOpenChange={(value) => { if (!value && !submitting) onCancel?.(); }}><Dialog.Portal>
    <Dialog.Overlay className="forum-composer-scrim" />
    <Dialog.Content className="forum-composer-v2" onOpenAutoFocus={() => { returnFocus.current = document.activeElement; }} onCloseAutoFocus={(event) => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); }}>
      <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5"><div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">YOUR VOICE, YOUR COMMUNITY</p><Dialog.Title className="mt-2 text-xl font-semibold text-white">Start a conversation</Dialog.Title><Dialog.Description className="mt-2 text-xs leading-6 text-slate-400">Choose a game and format. A clear title helps the right players find your post.</Dialog.Description></div><Dialog.Close disabled={submitting} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Close post editor"><X className="h-5 w-5" /></Dialog.Close></header>
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5 text-xs text-white/40">Format<select value={type} onChange={(e) => setType(e.target.value)} className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white outline-none">{TYPES.map(([value, label]) => <option key={value} value={value} className="bg-slate-950">{label}</option>)}</select></label>
          <label className="space-y-1.5 text-xs text-white/40">Game<select value={gameTitle} onChange={(e) => setGameTitle(e.target.value)} className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white outline-none"><option value="" className="bg-slate-950">Platform-wide</option>{games.map((game) => <option key={game.id} value={game.title} className="bg-slate-950">{game.title}</option>)}</select></label>
        </div>
        <label className="space-y-2"><span>Post title</span><Input aria-label="Post title" value={title} maxLength={180} onChange={(e) => setTitle(e.target.value)} placeholder="Give players a clear title…" className="h-11 border-white/[0.08] bg-white/[0.035] text-white placeholder:text-white/22" /></label>
        <label className="space-y-2"><span>Your post</span><Textarea aria-label="Your post" value={content} maxLength={40000} onChange={(e) => setContent(e.target.value)} placeholder={type === 'full_guide' ? 'Write the complete route: requirements, preparation, steps, bosses, collectibles, missables, achievements, farming notes…' : 'Share the strategy, discovery, question, or route…'} className="min-h-[260px] resize-y border-white/[0.08] bg-white/[0.025] text-sm leading-6 text-white/75 placeholder:text-white/20" /></label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1.5 text-xs text-white/40"><span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />Guide focus</span><select value={guideKind} onChange={(e) => setGuideKind(e.target.value)} className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 text-xs text-white">{GUIDE_KINDS.map((kind) => <option className="bg-slate-950" key={kind} value={kind}>{kind.replaceAll('_', ' ')}</option>)}</select></label>
          <label className="space-y-1.5 text-xs text-white/40">Difficulty<select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 text-xs text-white">{['any','beginner','intermediate','advanced','expert'].map((value) => <option className="bg-slate-950" key={value}>{value}</option>)}</select></label>
          <label className="space-y-1.5 text-xs text-white/40"><span className="flex items-center gap-1"><Tag className="h-3 w-3" />Tags</span><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="boss, missable, xp" className="h-9 border-white/[0.08] bg-white/[0.04] text-xs text-white" /></label>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/[0.09] px-3 py-3 text-xs text-white/35 hover:border-cyan-200/20 hover:text-white/60"><ImagePlus className="h-4 w-4" /><input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />{imageFile ? imageFile.name : 'Optional screenshot / route image'}</label>
        <div className="rounded-lg border border-cyan-200/[0.07] bg-cyan-200/[0.025] px-4 py-3 text-xs leading-5 text-white/35"><Gamepad2 className="mr-2 inline h-3.5 w-3.5 text-cyan-200/50" />Full guides are meant to read like a modern strategy guide: preparation, route, missables, boss notes, farming efficiency and achievement-card hints can all live in one post.</div>
      </div>
      {submitError && <p role="alert" className="px-6 py-3 text-sm text-red-200">{submitError}</p>}
      <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-6 py-4"><button type="button" onClick={onCancel} disabled={submitting} className="rounded-lg px-4 py-2 text-sm text-white/40 hover:bg-white/[0.04] hover:text-white">Cancel</button><button type="button" disabled={!canPost || submitting} onClick={submit} className="rounded-lg border border-cyan-200/15 bg-cyan-300/10 px-5 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-30">{submitting ? 'Publishing…' : 'Publish'}</button></div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
