import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleHelp, FileText, Lightbulb, Route, Trophy, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TYPES = [
  { id: 'help', label: 'Request Help', community: 'question', icon: CircleHelp },
  { id: 'farming_guide', label: 'Farming Method', community: 'farming', icon: Route },
  { id: 'achievement_guide', label: 'Achievement Farm', community: 'achievements', icon: Trophy },
  { id: 'tip', label: 'Quick Tip', community: 'tips', icon: Lightbulb },
  { id: 'discussion', label: 'Discussion', community: 'discussions', icon: FileText },
];

const unwrap = (result) => result?.data ?? result ?? {};

export default function CreatePostModal({ open, onClose, topic, gameTitle, defaultType = 'discussion', onCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState(defaultType);
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState('any');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const topicType = topic === 'achievements' ? 'achievement_guide' : topic === 'farming' ? 'farming_guide' : topic === 'help' || topic === 'question' ? 'help' : defaultType;
    setType(TYPES.some((item) => item.id === topicType) ? topicType : 'discussion');
  }, [open, topic, defaultType]);

  const selected = TYPES.find((item) => item.id === type) || TYPES[4];
  const canSubmit = useMemo(() => title.trim().length >= 3 && content.trim().length >= 2 && !saving, [title, content, saving]);

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const result = unwrap(await base44.functions.invoke('farmSystem', {
        action: 'create_post',
        data: {
          title: title.trim(),
          content: content.trim(),
          type,
          community: selected.community,
          game_title: gameTitle || '',
          tags: tags.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean),
          difficulty,
        },
      }));
      if (result?.success === false) throw new Error(result.error || 'Could not publish post.');
      toast.success(type === 'help' ? 'Help request posted.' : 'Farm Hub post published.');
      setTitle(''); setContent(''); setTags(''); setDifficulty('any');
      onCreated?.(result.post);
      onClose?.();
    } catch (error) {
      toast.error(error?.message || 'Failed to publish post.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return <AnimatePresence>
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <motion.div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#06111b]/95 shadow-2xl backdrop-blur-2xl" initial={{ opacity: 0, y: 16, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}>
        <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div><p className="text-[9px] font-semibold uppercase tracking-[.2em] text-emerald-200/45">Farm community</p><h2 className="mt-1 text-lg font-semibold text-white">{type === 'help' ? 'Request help' : 'Share farming knowledge'}</h2></div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/35 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-4 p-5">
          {gameTitle && <div className="text-xs text-white/35">Posting in <span className="text-emerald-100/70">{gameTitle}</span></div>}
          <div className="flex flex-wrap gap-2">{TYPES.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => setType(id)} className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] transition ${type === id ? 'bg-emerald-300/12 text-emerald-100' : 'bg-white/[0.035] text-white/40 hover:bg-white/[0.06] hover:text-white/70'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div>
          <Input value={title} maxLength={180} onChange={(event) => setTitle(event.target.value)} placeholder={type === 'help' ? 'What are you stuck on?' : 'Give players a clear title…'} className="h-11 border-white/[0.08] bg-white/[0.035] text-white placeholder:text-white/22" />
          <Textarea value={content} maxLength={40000} onChange={(event) => setContent(event.target.value)} placeholder={type === 'help' ? 'Explain what you are trying to farm, where you are stuck, your build/level, and what you already tried…' : 'Share the route, requirements, timing, yield, boss notes, achievement conditions, or efficiency tips…'} className="min-h-[220px] resize-y border-white/[0.08] bg-white/[0.025] text-sm leading-6 text-white/75 placeholder:text-white/20" />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] uppercase tracking-wider text-white/35">Tags<Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="xp, boss, material, missable" className="mt-1 h-9 border-white/[0.08] bg-white/[0.035] text-xs text-white" /></label>
            <label className="text-[10px] uppercase tracking-wider text-white/35">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-white/[0.08] bg-[#08131e] px-3 text-xs text-white/70"><option value="any">Any</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></label>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-4"><button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-xs text-white/40 hover:bg-white/[0.04] hover:text-white">Cancel</button><button type="button" disabled={!canSubmit} onClick={submit} className="rounded-full bg-emerald-300/14 px-5 py-2 text-xs font-semibold text-emerald-100 disabled:opacity-30">{saving ? 'Publishing…' : type === 'help' ? 'Post Request' : 'Publish'}</button></footer>
      </motion.div>
    </motion.div>
  </AnimatePresence>;
}
