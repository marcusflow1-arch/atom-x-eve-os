import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, ImagePlus, Link2, BarChart3, Gamepad2, Tag, ChevronRight, Plus } from "lucide-react";

const GENRE_OPTIONS = [
  "Action","RPG","Shooter","Sci-Fi","Strategy","Adventure","Sports","Racing","Simulation","Horror"
];

export default function PostComposer({
  isOpen = true,
  onCancel,
  onSubmit,
  initialType = "general_discussion",
  initialGameTitle = "",
  initialGameGenre = "",
}) {
  const [title, setTitle] = useState("");
  const [textBody, setTextBody] = useState("");
  const [games, setGames] = useState([]);
  const [selectedGameTitle, setSelectedGameTitle] = useState(initialGameTitle || "");
  const [selectedGenre, setSelectedGenre] = useState(initialGameGenre || "");

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const [showLink, setShowLink] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await base44.entities.Game.list("-original_year", 100);
      if (mounted) setGames(list || []);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedGenre && selectedGameTitle) {
      const g = games.find(g => g.title === selectedGameTitle);
      if (g?.genre) setSelectedGenre(g.genre);
    }
  }, [selectedGameTitle, selectedGenre, games]);

  useEffect(() => {
    const urls = imageFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [imageFiles]);

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setImageFiles(prev => [...prev, ...files]);
  };

  const canPost = useMemo(() => {
    if (!title.trim()) return false;
    return textBody.trim().length > 0 || imageFiles.length > 0 || linkUrl.trim().length > 0;
  }, [title, textBody, imageFiles, linkUrl]);

  const buildContentAndSubmit = async () => {
    setSubmitting(true);
    let contentParts = [];
    let image_url = undefined;

    if (textBody.trim()) contentParts.push(textBody.trim());

    if (imageFiles.length) {
      const uploaded = await Promise.all(
        imageFiles.map(async (file) => {
          const res = await base44.integrations.Core.UploadFile({ file });
          return res?.file_url;
        })
      );
      const urls = uploaded.filter(Boolean);
      if (urls.length) {
        image_url = urls[0];
        contentParts.push(urls.map(u => `![](${u})`).join("\n"));
      }
    }

    if (linkUrl.trim()) contentParts.push(`Link: ${linkUrl.trim()}`);

    const opts = pollOptions.filter(o => o.trim());
    if (pollQuestion.trim() && opts.length >= 2) {
      contentParts.push(`[POLL]\nQuestion: ${pollQuestion.trim()}\n${opts.map(o => `- [ ] ${o.trim()}`).join("\n")}`);
    }

    await onSubmit?.({
      title: title.trim(),
      content: contentParts.join("\n\n"),
      type: initialType || "general_discussion",
      game_title: selectedGameTitle || undefined,
      genre: selectedGenre || undefined,
      image_url,
    });
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="composer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed z-[70]"
        style={{ top: '64px', bottom: '48px', left: '80px', right: 0 }}
      >
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onCancel} />

        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute inset-0 flex flex-col overflow-hidden"
          style={{ background: 'rgba(8, 12, 20, 0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Top Bar ── */}
          <div className="flex items-center justify-between px-8 shrink-0 h-[52px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">New Post</span>
            <button onClick={onCancel} className="w-7 h-7 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 flex flex-col gap-4">

            {/* Title */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title…"
              className="bg-transparent border-0 border-b border-white/10 rounded-none text-white text-base font-medium px-0 h-10 focus:border-white/25 focus:bg-transparent placeholder:text-white/25"
            />

            {/* Game + Genre tags — compact row */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded px-2 h-7">
                <Gamepad2 className="w-3 h-3 text-white/30" />
                <Select value={selectedGameTitle} onValueChange={setSelectedGameTitle}>
                  <SelectTrigger className="bg-transparent border-0 text-white/50 text-xs h-full p-0 w-auto min-w-[80px] focus:ring-0">
                    <SelectValue placeholder="Game" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 z-[80] bg-slate-900 border border-white/10">
                    {games.map(g => <SelectItem key={g.id} value={g.title}>{g.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded px-2 h-7">
                <Tag className="w-3 h-3 text-white/30" />
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="bg-transparent border-0 text-white/50 text-xs h-full p-0 w-auto min-w-[60px] focus:ring-0">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent className="z-[80] bg-slate-900 border border-white/10">
                    {GENRE_OPTIONS.map(gn => <SelectItem key={gn} value={gn}>{gn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Main textarea */}
            <Textarea
              value={textBody}
              onChange={(e) => setTextBody(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 min-h-[180px] bg-transparent border border-white/8 rounded text-white/90 text-sm resize-none focus:border-white/20 placeholder:text-white/20"
            />

            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group w-20 h-20">
                    <img src={src} alt="preview" className="w-full h-full object-cover rounded border border-white/10" />
                    <button
                      onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Link input (shown when toggled) */}
            {showLink && (
              <div className="flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                  className="flex-1 bg-white/5 border-white/10 text-white text-sm h-8 rounded"
                />
                <button onClick={() => { setShowLink(false); setLinkUrl(''); }} className="text-white/30 hover:text-white/60">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Poll inputs (shown when toggled) */}
            {showPoll && (
              <div className="space-y-2 border border-white/8 rounded p-3 bg-white/3">
                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Poll</p>
                <Input
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Poll question…"
                  className="bg-white/5 border-white/10 text-white text-sm h-8 rounded"
                />
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-white/20 text-xs w-4">{idx + 1}.</span>
                    <Input
                      value={opt}
                      onChange={(e) => setPollOptions(prev => prev.map((o, i) => i === idx ? e.target.value : o))}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 bg-white/5 border-white/10 text-white text-sm h-8 rounded"
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))} className="text-white/20 hover:text-white/50">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setPollOptions(prev => [...prev, ""])} className="flex items-center gap-1 text-[11px] text-cyan-500/60 hover:text-cyan-400 mt-1">
                  <Plus className="w-3 h-3" /> Add option
                </button>
              </div>
            )}

            {/* ── Inline action strip ── */}
            <div className="flex items-center gap-1 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Image */}
              <label
                htmlFor="img-picker"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer text-white/35 hover:text-white/70 hover:bg-white/6 transition-all text-xs"
                title="Add image"
              >
                <input id="img-picker" type="file" accept="image/*" multiple onChange={handleImagePick} className="hidden" />
                <ImagePlus className="w-3.5 h-3.5" />
                <span>Image</span>
              </label>

              {/* Link */}
              <button
                onClick={() => setShowLink(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all text-xs ${showLink ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/35 hover:text-white/70 hover:bg-white/6'}`}
                title="Add link"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Link</span>
              </button>

              {/* Poll */}
              <button
                onClick={() => setShowPoll(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all text-xs ${showPoll ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/35 hover:text-white/70 hover:bg-white/6'}`}
                title="Add poll"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Poll</span>
              </button>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-2 px-8 shrink-0 h-[52px]" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <button onClick={onCancel} className="px-4 h-8 text-xs text-white/40 hover:text-white hover:bg-white/8 rounded transition-all">
              Cancel
            </button>
            <button
              disabled={!canPost || submitting}
              onClick={buildContentAndSubmit}
              className={`flex items-center gap-1.5 px-5 h-8 text-xs font-semibold rounded transition-all ${
                canPost && !submitting
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
                  : 'bg-white/5 border border-white/8 text-white/20 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Posting…' : 'Post'}
              {!submitting && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}