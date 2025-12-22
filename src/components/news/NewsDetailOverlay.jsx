import React from "react";
import { motion } from "framer-motion";
import { X, Heart, ThumbsUp, MessageSquare, Share2, TrendingUp, Clock } from "lucide-react";

export default function NewsDetailOverlay({ article, onClose }) {
  if (!article) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Container */}
      <motion.div
        initial={{ y: 20, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 20, scale: 0.98, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl rounded-2xl overflow-hidden border border-white/15"
        style={{
          background: "rgba(15,23,42,0.7)",
          backdropFilter: "blur(30px) saturate(160%)",
          WebkitBackdropFilter: "blur(30px) saturate(160%)",
          boxShadow: "0 20px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Action Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
          <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm flex items-center gap-2">
            <Heart className="w-4 h-4" /> {article.likes || "0"}
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm flex items-center gap-2">
            <ThumbsUp className="w-4 h-4" /> Rate Up
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Discuss
          </button>
          <div className="ml-auto flex items-center gap-2 text-white/70 text-sm">
            <Clock className="w-4 h-4" /> {article.timestamp}
          </div>
          <button
            onClick={onClose}
            className="ml-2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {article.image && (
            <div className="rounded-xl overflow-hidden border border-white/10 mb-5">
              <img src={article.image} alt={article.title} className="w-full h-64 object-cover" />
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            {article.trending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 text-xs border border-orange-400/30">
                <TrendingUp className="w-3 h-3" /> Trending
              </span>
            )}
            {article.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white/80 text-xs border border-white/20">
                {article.category}
              </span>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{article.title}</h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-4">{article.excerpt}</p>

          {/* Details placeholder */}
          <div className="space-y-2 text-slate-300/90 text-sm">
            <p>• Author: <span className="text-white/90 font-medium">{article.author}</span></p>
            <p>• Estimated read: {article.readTime}</p>
            <p>• Views: {article.views}</p>
          </div>

          {/* Footer share */}
          <div className="mt-6 flex justify-end">
            <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-2 border border-white/20">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}