import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Shield, Zap, Target, Book, Share2, Layers, Cpu, Globe, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function InspectView({ card }) {
  return (
    <div className="h-full flex flex-col bg-slate-900/50 backdrop-blur-sm rounded-l-3xl border-l border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-blue-900/10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-400" />
            Inspect
          </h2>
          <p className="text-white/40 text-sm">Detailed analysis and metadata</p>
        </div>
        <Badge variant="outline" className="border-blue-400/30 text-blue-300">
           ID: {card.id.split('-').pop()}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Base Stats Analysis */}
        <section>
          <h3 className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Performance Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-blue-950/30 p-4 rounded-xl border border-blue-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Zap className="w-12 h-12" />
                </div>
                <div className="text-blue-300 text-xs uppercase mb-1">Base Attack</div>
                <div className="text-3xl font-mono text-white">{(card.stats?.strength || 50) + (card.level * 5)}</div>
                <div className="text-xs text-blue-400 mt-1">+12% vs. Base</div>
             </div>
             <div className="bg-blue-950/30 p-4 rounded-xl border border-blue-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Target className="w-12 h-12" />
                </div>
                <div className="text-blue-300 text-xs uppercase mb-1">Precision</div>
                <div className="text-3xl font-mono text-white">98.2%</div>
                <div className="text-xs text-blue-400 mt-1">Class S Tier</div>
             </div>
          </div>
        </section>

        {/* Lore / Metadata */}
        <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
           <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Book className="w-4 h-4 text-purple-400" /> Lore Entry
          </h3>
          <p className="text-white/70 leading-relaxed font-serif italic border-l-2 border-purple-500/50 pl-4">
            "{card.description || "A mysterious artifact from the void. Its true purpose remains unknown to most, but its power is undeniable to those who wield it."}"
          </p>
          
          <div className="mt-6 grid grid-cols-2 gap-y-2 text-sm">
             <div className="text-white/40">Origin</div>
             <div className="text-white text-right">{card.game || card.series}</div>
             <div className="text-white/40">Release Date</div>
             <div className="text-white text-right">2024-11-15</div>
             <div className="text-white/40">Artist</div>
             <div className="text-white text-right">AI-Genesis-7</div>
          </div>
        </section>

        {/* Holographic Synergy */}
        <section>
           <h3 className="text-cyan-200 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> AI Avatar Synergy
          </h3>
          <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-xl p-4 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Globe className="w-6 h-6 text-cyan-400 animate-pulse" />
             </div>
             <div>
                <div className="text-cyan-100 font-bold">Compatible with Luna</div>
                <div className="text-cyan-400/60 text-xs">Equipping this card grants "Void Sight" ability to your avatar.</div>
             </div>
          </div>
        </section>

        {/* Media */}
        <section>
           <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <PlayCircle className="w-4 h-4" /> Media & History
          </h3>
          <div className="grid grid-cols-3 gap-2">
             {[1,2,3].map(i => (
                <div key={i} className="aspect-video bg-black/40 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors">
                   <PlayCircle className="w-8 h-8 text-white/20" />
                </div>
             ))}
          </div>
        </section>

      </div>
    </div>
  );
}