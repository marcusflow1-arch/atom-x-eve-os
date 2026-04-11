import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, ImagePlus, Link2, BarChart3, Gamepad2, Tag } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("text");
  const [title, setTitle] = useState("");
  const [textBody, setTextBody] = useState("");

  const [games, setGames] = useState([]);
  const [selectedGameTitle, setSelectedGameTitle] = useState(initialGameTitle || "");
  const [selectedGenre, setSelectedGenre] = useState(initialGameGenre || "");

  // Images tab
  const [imageFiles, setImageFiles] = useState([]); // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // data URLs

  // Link tab
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDesc, setLinkDesc] = useState("");

  // Poll tab
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // Load games for tags selector
  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await base44.entities.Game.list("-original_year", 100);
      if (mounted) setGames(list || []);
    })();
    return () => { mounted = false; };
  }, []);

  // If a game is chosen and no genre selected, default genre to the game's genre
  useEffect(() => {
    if (!selectedGenre && selectedGameTitle) {
      const g = games.find(g => g.title === selectedGameTitle);
      if (g?.genre) setSelectedGenre(g.genre);
    }
  }, [selectedGameTitle, selectedGenre, games]);

  // Image previews
  useEffect(() => {
    const urls = imageFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [imageFiles]);

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const canPost = useMemo(() => {
    if (!title.trim()) return false;
    if (activeTab === "text") return textBody.trim().length > 0;
    if (activeTab === "images") return imageFiles.length > 0 || textBody.trim().length > 0;
    if (activeTab === "link") return !!linkUrl.trim();
    if (activeTab === "poll") return pollQuestion.trim().length > 0 && pollOptions.filter(o => o.trim()).length >= 2;
    return false;
  }, [title, textBody, activeTab, imageFiles, linkUrl, pollQuestion, pollOptions]);

  const buildContentAndSubmit = async () => {
    let contentParts = [];
    let image_url = undefined;

    // Text
    if (textBody.trim()) contentParts.push(textBody.trim());

    // Images (always process if present)
    if (imageFiles.length) {
      const uploaded = await Promise.all(
        imageFiles.map(async (file) => {
          const res = await base44.integrations.Core.UploadFile({ file });
          return res?.file_url;
        })
      );
      const urls = uploaded.filter(Boolean);
      if (urls.length) {
        image_url = image_url || urls[0];
        contentParts.push(urls.map(u => `![](${u})`).join("\n"));
      }
    }

    // Link
    if (linkUrl.trim()) {
      const desc = linkDesc.trim();
      contentParts.push(`${desc ? desc + "\n\n" : ""}Link: ${linkUrl.trim()}`);
    }

    // Poll
    const opts = pollOptions.filter(o => o.trim());
    if (pollQuestion.trim() && opts.length >= 2) {
      const lines = opts.map(o => `- [ ] ${o.trim()}`).join("\n");
      contentParts.push(`[POLL]\nQuestion: ${pollQuestion.trim()}\n${lines}`);
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
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="composer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70]"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onCancel} />

        {/* Panel */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          className="absolute top-[72px] bottom-[60px] left-4 right-4 bg-[#0f1419]/95 border border-white/10 rounded-3xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-cyan-400" />
              </div>
              <h2 className="text-white font-bold tracking-wide">Create Post</h2>
            </div>
            <button onClick={onCancel} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Fields */}
            <div className="flex-1 min-w-0 p-6 overflow-y-auto space-y-4">
              {/* Title */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                className="bg-white/5 border-white/10 text-white"
              />

              {/* Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-white/50 mb-1 flex items-center gap-2"><Gamepad2 className="w-3.5 h-3.5" /> Game</div>
                  <Select value={selectedGameTitle} onValueChange={setSelectedGameTitle}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choose a game" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-auto z-[80] bg-slate-900 border border-white/10">
                      {games.map(g => (
                        <SelectItem key={g.id} value={g.title}>{g.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-xs text-white/50 mb-1 flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Genre</div>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choose a genre" />
                    </SelectTrigger>
                    <SelectContent className="z-[80] bg-slate-900 border border-white/10">
                      {GENRE_OPTIONS.map(gn => (
                        <SelectItem key={gn} value={gn}>{gn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                <TabsList className="bg-white/5 border border-white/10">
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="images" className="flex items-center gap-1"><ImagePlus className="w-3.5 h-3.5" /> Images</TabsTrigger>
                  <TabsTrigger value="link" className="flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> Link</TabsTrigger>
                  <TabsTrigger value="poll" className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> Poll</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="mt-3">
                  <Textarea
                    value={textBody}
                    onChange={(e) => setTextBody(e.target.value)}
                    placeholder="Write your post..."
                    className="min-h-[220px] bg-white/5 border-white/10 text-white"
                  />
                </TabsContent>

                <TabsContent value="images" className="mt-3 space-y-3">
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center">
                    <input id="img-picker" type="file" accept="image/*" multiple onChange={handleImagePick} className="hidden" />
                    <label htmlFor="img-picker" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer text-white text-sm">
                      <Plus className="w-4 h-4" /> Add Images
                    </label>
                    <p className="text-xs text-white/40 mt-2">PNG, JPG up to ~10MB each</p>
                  </div>
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative group">
                          <img src={src} alt="preview" className="w-full h-28 object-cover rounded-lg border border-white/10" />
                          <button onClick={() => removeImage(i)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center">
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Textarea
                    value={textBody}
                    onChange={(e) => setTextBody(e.target.value)}
                    placeholder="Optional caption..."
                    className="min-h-[120px] bg-white/5 border-white/10 text-white"
                  />
                </TabsContent>

                <TabsContent value="link" className="mt-3 space-y-3">
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com/article-or-video"
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Textarea
                    value={linkDesc}
                    onChange={(e) => setLinkDesc(e.target.value)}
                    placeholder="Add a short description (optional)"
                    className="min-h-[140px] bg-white/5 border-white/10 text-white"
                  />
                </TabsContent>

                <TabsContent value="poll" className="mt-3 space-y-3">
                  <Input
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Poll question"
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <div className="space-y-2">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => setPollOptions(prev => prev.map((o, i) => i === idx ? e.target.value : o))}
                          placeholder={`Option ${idx + 1}`}
                          className="bg-white/5 border-white/10 text-white"
                        />
                        {pollOptions.length > 2 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setPollOptions(prev => [...prev, ""])} className="mt-1">
                      <Plus className="w-4 h-4 mr-1" /> Add option
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Inline quick tools (visible beneath text box) */}
              <div className="mt-4 space-y-3">
                {/* Images */}
                <div className="border-2 border-dashed border-white/10 rounded-xl p-4">
                  <input id="inline-img-picker" type="file" accept="image/*" multiple onChange={handleImagePick} className="hidden" />
                  <label htmlFor="inline-img-picker" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer text-white text-xs">
                    <ImagePlus className="w-4 h-4" /> Add Images
                  </label>
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative group">
                          <img src={src} alt="preview" className="w-full h-24 object-cover rounded-lg border border-white/10" />
                          <button onClick={() => removeImage(i)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center">
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Link */}
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-white/60" />
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Add a link (optional)"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                {/* Poll */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <BarChart3 className="w-4 h-4" /> Poll (optional)
                  </div>
                  <Input
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Poll question"
                    className="bg-white/5 border-white/10 text-white"
                  />
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => setPollOptions(prev => prev.map((o, i) => i === idx ? e.target.value : o))}
                        placeholder={`Option ${idx + 1}`}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      {pollOptions.length > 2 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => setPollOptions(prev => [...prev, ""])} className="mt-1">
                    <Plus className="w-4 h-4 mr-1" /> Add option
                  </Button>
                </div>
              </div>
              </div>

              {/* Right: Tips / Summary */}
            <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-white/10 p-6 space-y-4 overflow-y-auto">
              <h3 className="text-white/80 font-semibold">Posting tips</h3>
              <ul className="text-white/50 text-sm list-disc pl-5 space-y-1">
                <li>Keep titles clear and descriptive.</li>
                <li>Add a Game tag so players can find it.</li>
                <li>Use Polls to gather quick opinions.</li>
                <li>For galleries, include a short caption.</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <div className="text-white/40 text-xs">Your post may appear in community feeds.</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button disabled={!canPost} onClick={buildContentAndSubmit} className="bg-cyan-600 hover:bg-cyan-500">
                Post
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}