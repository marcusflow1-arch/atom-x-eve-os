import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Hash, Layers, Shield, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StreamerCardDetailModal({ card, onClose }) {
  if (!card) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-[#0f1419] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Left Side: Card Visual */}
        <div className="w-full md:w-[40%] bg-gradient-to-br from-slate-900 to-black p-8 flex flex-col items-center justify-center border-r border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="relative z-10 w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                {/* Mock Image Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center text-white/10">
                    <span className="text-9xl font-black opacity-20">CARD</span>
                </div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-full group-hover:translate-x-full" />
            </div>

            <div className="mt-8 text-center relative z-10">
                <h2 className="text-2xl font-bold text-white mb-2">{card.name}</h2>
                <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white/60">Season 0</Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Common</Badge>
                </div>
            </div>
        </div>

        {/* Right Side: Details */}
        <div className="flex-1 p-8 overflow-y-auto bg-[#0f1419]">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xl font-bold text-white">Card Record</h3>
                </div>
                <p className="text-white/40 text-sm">Detailed information about this card</p>
            </div>

            <div className="space-y-6">
                {/* Description Box */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Description</h4>
                    <p className="text-white/80 italic leading-relaxed">
                        "A collectible trading card from the Streamer Collection. This item represents a unique moment in the Season 0 broadcast history."
                    </p>
                </div>

                {/* Series / Rarity Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-white/10 pb-4">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Series</h4>
                        <p className="text-white font-semibold">Streamer Collection: Season 0</p>
                    </div>
                    <div className="border-b border-white/10 pb-4">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Rarity</h4>
                        <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/15">Common</Badge>
                    </div>
                </div>

                {/* Stats */}
                <div>
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 rounded-lg p-4 border border-white/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-white/60 uppercase">Strength</span>
                            <span className="text-2xl font-black text-white">85</span>
                        </div>
                        <div className="bg-black/40 rounded-lg p-4 border border-white/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-white/60 uppercase">Magic</span>
                            <span className="text-2xl font-black text-white">99</span>
                        </div>
                    </div>
                </div>

                {/* Card Details Table */}
                <div>
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Card Details</h4>
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden text-sm">
                        <div className="flex justify-between p-3 border-b border-white/5">
                            <span className="text-white/50">Card ID</span>
                            <span className="font-mono text-white/80">card-893b3ba6092526948af/1004-0</span>
                        </div>
                        <div className="flex justify-between p-3 border-b border-white/5">
                            <span className="text-white/50">Type</span>
                            <span className="text-white">Trading Card</span>
                        </div>
                        <div className="flex justify-between p-3">
                            <span className="text-white/50">Collection</span>
                            <span className="text-white">Destiny 2: Renegades</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
}