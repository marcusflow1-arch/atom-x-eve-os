import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, ImagePlus, Link2, BarChart3, Gamepad2, Tag, FileText, ChevronRight } from "lucide-react";

const GENRE_OPTIONS = [
  "Action","RPG","Shooter","Sci-Fi","Strategy","Adventure","Sports","Racing","Simulation","Horror"
];

const TABS = [
  { id: "text", label: "Text", icon: FileText },
  { id: "images", label: "Images", icon: ImagePlus },
  { id: "link", label: "Link", icon: Link2 },
  { id: "poll", label: "Poll", icon: BarChart3 },
];

export default function PostComposer({
  isOpen = true,
  onCancel,
  onSubmit,
  initialType = "general_discussion",
  initialGameTitle = "",
  initialGameGenre = "",
}) {
  const [activeTab, setActiveTab] = useState("text");
  const [title, setTitle] = useState("");
  const [textBody, setTextBody] = useState("");
  const [games, setGames] = useState([]);
  const [selectedGameTitle, setSelectedGameTitle] = useState(initialGameTitle || "");
  const [selectedGenre, setSelectedGenre] = useState(initialGameGenre || "");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDesc, setLinkDesc] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
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

  const removeImage = (idx) => setImageFiles(prev => prev.filter((_, i) => i !== idx));

  const canPost = useMemo(() => {
    if (!title.trim()) return false;
    if (activeTab === "text") return textBody.trim().length > 0;
    if (activeTab === "images") return imageFiles.length > 0 || textBody.trim().length > 0;
    if (activeTab === "link") return !!linkUrl.trim();
    if (activeTab === "poll") return pollQuestion.trim().length > 0 && pollOptions.filter(o => o.trim()).length >= 2;
    return false;
  }, [title, textBody, activeTab, imageFiles, linkUrl, pollQuestion, pollOptions]);

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

    if (linkUrl.trim()) {
      const desc = linkDesc.trim();
      contentParts.push(`${desc ? desc + "\n\n" : ""}Link: ${linkUrl.trim()}`);
    }

    const opts = pollOptions.filter(o => o.trim());
    if (pollQuestion.trim() && opts.length >= 2) {
      contentParts.push(`[POLL]\nQuestion: ${pollQuestion.trim()}\n${opts.map(o => `- [ ] ${o.trim()}`).join("\n")}`);
    }

    const postData = {
      title: title.trim(),
      content: contentParts.join("\n\n"),
      type: initialType || "general_discussion",
      game_title: selectedGameTitle || undefined,
      genre: selectedGenre || undefined,
      image_url,
    };
    await onSubmit?.(postData);
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
        {/* Backdrop - only over content area */}
        <div
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={onCancel}
        />

        {/* Full Panel */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute inset-0 flex flex-col overflow-hidden"
          style={{
            background: 'rgba(8, 12, 20, 0.97)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Top Bar ── */}
          <div
            className="flex items-center justify-between px-8 shrink-0"
            style={{
              height: '52px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-white font-semibold text-sm tracking-wide uppercase">Create Post</span>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-0.5 bg-white/5 rounded p-0.5 border border-white/8">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-sm ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onCancel}
              className="w-8 h-8 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* Left: Form */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

              {/* Title + Tags row */}
              <div
                className="px-8 py-4 shrink-0 grid grid-cols-3 gap-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="col-span-3 md:col-span-1">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Post title…"
                    className="bg-white/5 border-white/10 text-white rounded text-sm h-9 focus:border-cyan-500/50 focus:bg-white/8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <Select value={selectedGameTitle} onValueChange={setSelectedGameTitle}>
                    <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white text-xs h-9 rounded">
                      <SelectValue placeholder="Game (optional)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-[80] bg-slate-900 border border-white/10">
                      {games.map(g => <SelectItem key={g.id} value={g.title}>{g.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white text-xs h-9 rounded">
                      <SelectValue placeholder="Genre (optional)" />
                    </SelectTrigger>
                    <SelectContent className="z-[80] bg-slate-900 border border-white/10">
                      {GENRE_OPTIONS.map(gn => <SelectItem key={gn} value={gn}>{gn}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto px-8 py-5">

                {activeTab === "text" && (
                  <Textarea
                    value={textBody}
                    onChange={(e) => setTextBody(e.target.value)}
                    placeholder="Write your post…"
                    className="w-full h-full min-h-[300px] bg-white/5 border-white/10 text-white rounded text-sm resize-none focus:border-cyan-500/40"
                    style={{ height: 'calc(100% - 8px)' }}
                  />
                )}

                {activeTab === "images" && (
                  <div className="space-y-4">
                    <div
                      className="border border-dashed border-white/10 rounded p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/20 hover:bg-white/3 transition-all"
                      onClick={() => document.getElementById('img-picker-main')?.click()}
                    >
                      <input id="img-picker-main" type="file" accept="image/*" multiple onChange={handleImagePick} className="hidden" />
                      <ImagePlus className="w-8 h-8 text-white/20 mb-2" />
                      <p className="text-white/40 text-sm">Click to add images</p>
                      <p className="text-white/20 text-xs mt-1">PNG, JPG up to ~10MB each</p>
                    </div>
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-3">
                        {imagePreviews.map((src, i) => (
                          <div key={i} className="relative group aspect-square">
                            <img src={src} alt="preview" className="w-full h-full object-cover rounded border border-white/10" />
                            <button
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 w-6 h-6 rounded bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Textarea
                      value={textBody}
                      onChange={(e) => setTextBody(e.target.value)}
                      placeholder="Add a caption…"
                      className="bg-white/5 border-white/10 text-white rounded text-sm min-h-[100px] resize-none"
                    />
                  </div>
                )}

                {activeTab === "link" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-white/30 shrink-0" />
                      <Input
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 bg-white/5 border-white/10 text-white rounded text-sm h-9"
                      />
                    </div>
                    <Textarea
                      value={linkDesc}
                      onChange={(e) => setLinkDesc(e.target.value)}
                      placeholder="Description (optional)…"
                      className="bg-white/5 border-white/10 text-white rounded text-sm min-h-[180px] resize-none"
                    />
                  </div>
                )}

                {activeTab === "poll" && (
                  <div className="space-y-3">
                    <Input
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Poll question…"
                      className="bg-white/5 border-white/10 text-white rounded text-sm h-9"
                    />
                    <div className="space-y-2">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-white/30 text-xs w-5 text-right">{idx + 1}.</span>
                          <Input
                            value={opt}
                            onChange={(e) => setPollOptions(prev => prev.map((o, i) => i === idx ? e.target.value : o))}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 bg-white/5 border-white/10 text-white rounded text-sm h-9"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                              className="w-7 h-7 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setPollOptions(prev => [...prev, ""])}
                      className="flex items-center gap-2 text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors px-1 py-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add option
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Tips Panel */}
            <div
              className="w-[220px] shrink-0 p-6 flex flex-col gap-4 overflow-y-auto"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Tips</p>
              <ul className="space-y-3">
                {[
                  "Keep titles clear and descriptive.",
                  "Add a Game tag so players can find it.",
                  "Use Polls to gather quick opinions.",
                  "For galleries, include a short caption.",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/35 text-xs leading-relaxed">
                    <ChevronRight className="w-3 h-3 text-cyan-500/40 mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>

              {/* Character count for text */}
              {activeTab === "text" && (
                <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-white/20 text-[10px]">{textBody.length} chars</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex items-center justify-between px-8 shrink-0"
            style={{
              height: '52px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <p className="text-white/25 text-xs">Your post may appear in community feeds.</p>
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="px-4 h-8 text-xs text-white/50 hover:text-white hover:bg-white/8 rounded transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!canPost || submitting}
                onClick={buildContentAndSubmit}
                className={`flex items-center gap-2 px-5 h-8 text-xs font-semibold rounded transition-all ${
                  canPost && !submitting
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
                    : 'bg-white/5 border border-white/8 text-white/25 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Posting…' : 'Post'}
                {!submitting && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}