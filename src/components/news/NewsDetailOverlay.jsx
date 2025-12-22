import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays, Share2, Bookmark, ExternalLink } from "lucide-react";

export default function NewsDetailOverlay({ item, onClose }) {
  if (!item) return null;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl rounded-2xl overflow-hidden border border-white/15 bg-slate-900/80"
            style={{ backdropFilter: "blur(22px) saturate(140%)", WebkitBackdropFilter: "blur(22px) saturate(140%)" }}
          >
            {/* Banner */}
            {item.image && (
              <div className="relative h-48 md:h-60 overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/70" />
              </div>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 md:top-4 md:right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Content */}
            <div className="p-5 md:p-7">
              <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 font-semibold tracking-wide">
                  {item.category || "REGULAR UPDATE"}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h2 className="text-white font-extrabold text-2xl md:text-3xl leading-tight mb-2">
                {item.title}
              </h2>
              {item.subtitle && (
                <p className="text-slate-300 text-sm md:text-base mb-4">{item.subtitle}</p>
              )}

              {item.details && item.details.length > 0 ? (
                <ul className="space-y-2 text-slate-200 text-sm md:text-base list-disc pl-5">
                  {item.details.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-300 text-sm md:text-base">{item.summary}</p>
              )}

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-2">
                <button className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90">
                  View in Store
                </button>
                <button className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white/90 text-sm hover:bg-white/15 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white/90 text-sm hover:bg-white/15 flex items-center gap-2">
                  <Bookmark className="w-4 h-4" /> Save
                </button>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white/90 text-sm hover:bg-white/15 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" /> External
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}