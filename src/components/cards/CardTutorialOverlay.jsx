import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, BookOpen, Star, Gamepad2 } from "lucide-react";

// Translucent overlay that mirrors the Achievements-style theme
// Adds a left-side subpage (icon) that switches the left panel to a tutorial video
export default function CardTutorialOverlay({ card, onClose }) {
  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'tutorial'

  const rarityStyles = {
    Common: { border: "border-slate-400", text: "text-slate-300", pill: "bg-white/10 text-white/60" },
    Rare: { border: "border-blue-400", text: "text-blue-300", pill: "bg-blue-500/20 text-blue-300" },
    Epic: { border: "border-purple-400", text: "text-purple-300", pill: "bg-purple-500/20 text-purple-300" },
    Legendary: { border: "border-amber-400", text: "text-amber-300", pill: "bg-amber-500/20 text-amber-300" },
  };
  const style = rarityStyles[card?.rarity] || rarityStyles.Rare;

  const videoUrl = card?.tutorialVideoUrl || "https://www.w3schools.com/html/mov_bbb.mp4";

  const cardId = useMemo(() => {
    const base = (card?.id || card?.name || "CARD").toString();
    return `card-${btoa(base).replace(/=+/g, "").slice(0, 10)}`;
  }, [card]);

  const scenarios = useMemo(() => {
    const type = (card?.type || "Ability").toLowerCase();
    const name = card?.name || "This card";
    return [
      `${name} excels when engaging elite enemies — trigger it after a stagger or crowd-control for maximum impact.`,
      `Synergize this ${type} with high-mobility builds: dash → activate → reposition to avoid counterattacks.`,
      `Out of combat, use it to set up advantages (traps, scouting, or buffs) before major encounters.`,
    ];
  }, [card]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

        {/* Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-6xl grid grid-cols-1 md:grid-cols-[380px,1fr] gap-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-2 right-0 md:-top-4 md:-right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center"
            title="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Left Panel */}
          <div
            className={`relative rounded-2xl border ${style.border} overflow-hidden`}
            style={{
              background: "rgba(15,23,42,0.5)",
              backdropFilter: "blur(30px) saturate(180%)",
              WebkitBackdropFilter: "blur(30px) saturate(180%)",
            }}
          >
            {/* Subpage icon(s) */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
              <button
                onClick={() => setActiveTab("details")}
                className={`w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center transition-all ${
                  activeTab === "details" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
                }`}
                title="Details"
              >
                <BookOpen className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setActiveTab("tutorial")}
                className={`w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center transition-all ${
                  activeTab === "tutorial" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
                }`}
                title="Combat Tutorial"
              >
                <Swords className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 h-full">
              {activeTab === "tutorial" ? (
                <div className="w-full">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      muted
                      loop
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-white/60 text-xs mt-3">
                    Tutorial: How to use {card?.name} in combat and preparation.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  {/* Card art substitute */}
                  <div className={`w-56 h-56 rounded-2xl border ${style.border} grid place-items-center bg-gradient-to-br from-slate-800 to-slate-900 mb-5`}>
                    <span className="text-6xl select-none">{card?.icon || "✨"}</span>
                  </div>
                  <h2 className="text-white font-black text-xl md:text-2xl mb-1">
                    {card?.game ? `${card.game}: ` : ""}{card?.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${style.pill}`}>{card?.rarity || "Rare"}</span>
                    {card?.type && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white/70 border border-white/10">
                        {card.type}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div
            className="rounded-2xl border border-white/10"
            style={{
              background: "rgba(15,23,42,0.45)",
              backdropFilter: "blur(30px) saturate(180%)",
              WebkitBackdropFilter: "blur(30px) saturate(180%)",
            }}
          >
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-cyan-300" />
                  <h3 className="text-white font-bold text-lg">
                    {activeTab === "tutorial" ? "Card Tutorial" : "Card Record"}
                  </h3>
                </div>
                <span className="text-white/30 text-xs">{cardId}</span>
              </div>

              {activeTab === "tutorial" ? (
                <div className="space-y-4">
                  <p className="text-white/70 text-sm leading-relaxed">
                    Learn how to apply <span className="text-white font-semibold">{card?.name}</span> in real situations. Below are practical tips and
                    scenarios for both combat and preparation phases.
                  </p>
                  <div className="space-y-2">
                    {scenarios.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm">
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Description + Rarity Row */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr,180px] gap-4 items-start">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-white/70 text-sm leading-relaxed">
                        {card?.lore || card?.description || "Detailed information about this card."}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-white/60 text-sm">Rarity</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${style.pill}`}>
                        <Star className="w-3 h-3" />
                        {card?.rarity || "Rare"}
                      </span>
                    </div>
                  </div>

                  {/* Series */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-white/60 text-sm">Series</span>
                    <span className="text-white/90 text-sm font-medium">{card?.game || "Unknown"}</span>
                  </div>

                  {/* Stats */}
                  {card?.stats && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/60 text-sm">Stats</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(card.stats).map(([k, v]) => (
                          <div key={k} className="p-3 rounded-lg bg-black/30 border border-white/10 text-center">
                            <div className="text-white/40 text-[10px] uppercase tracking-widest">{k}</div>
                            <div className={`${style.text} text-xl font-black`}>{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Details table */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="text-white/40">Card ID</div>
                      <div className="text-white/80 col-span-1 md:col-span-3">{cardId}</div>
                      <div className="text-white/40">Type</div>
                      <div className="text-white/80 col-span-1 md:col-span-3">{card?.type || "Ability"}</div>
                      <div className="text-white/40">Collection</div>
                      <div className="text-white/80 col-span-1 md:col-span-3">{card?.game || "Unknown"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}