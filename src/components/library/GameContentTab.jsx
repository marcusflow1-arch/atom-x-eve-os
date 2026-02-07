import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, Calendar, Gift, ShoppingCart, ChevronRight, Star, BookOpen } from 'lucide-react';

const PATCH_NOTES = [
  { id: 1, title: 'Patch 2.1 - Cyber Dawn', date: 'TODAY • V2.1.0', desc: 'New neon city district. 5 new weapons, and improved ray-tracing performance. Fixed minor bugs in the inventory system.', type: 'update' },
  { id: 2, title: "Event: Void Walker's Return", date: '3 DAYS AGO • EVENT', desc: 'Limited time event! 1am double XP and exclusive void skins for your character.', type: 'event' },
  { id: 3, title: 'Hotfix 2.0.3', date: '1 WEEK AGO • V2.0.3', desc: 'Fixed crash on startup for certain GPU configurations. Resolved matchmaking timeout issues.', type: 'hotfix' },
];

const EXPANSION_CONTENT = [
  { id: 1, name: 'Neural Expansion Pack', price: 14.99 },
  { id: 2, name: 'Void Walker Arsenal', price: 14.99 },
  { id: 3, name: 'Season Pass: Year One', price: 29.99 },
];

const STORY_PROGRESS = {
  main: { label: 'MAIN STORY', completed: 7, total: 13, chapters: [
    { name: 'Prologue: The Awakening', progress: 100 },
    { name: 'Ch. 1: Dark Crossing', progress: 65 },
    { name: 'Ch. 2: Cyber Breach', progress: 20 },
  ]},
  side: { label: 'SIDE QUESTS', available: 4, quests: [
    { name: 'The Glitch Hunter', progress: 30 },
    { name: 'Lost Data Archives', progress: 0 },
  ]}
};

export default function GameContentTab({ game }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-6"
    >
      {/* Left: Updates & DLC */}
      <div className="flex-1 space-y-8">
        {/* Patch Notes */}
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Newspaper className="w-5 h-5 text-cyan-400" />
            Game Updates & Patch Notes
          </h3>
          <div className="space-y-4">
            {PATCH_NOTES.map((note) => (
              <div key={note.id} className="flex gap-3 group cursor-pointer">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  note.type === 'event' ? 'bg-purple-400' : note.type === 'hotfix' ? 'bg-orange-400' : 'bg-cyan-400'
                }`} />
                <div className="flex-1">
                  <h4 className="text-white font-semibold group-hover:text-cyan-400 transition-colors">{note.title}</h4>
                  <p className="text-white/50 text-sm mt-1 leading-relaxed">{note.desc}</p>
                  <p className={`text-xs mt-2 font-bold uppercase tracking-wider ${
                    note.type === 'event' ? 'text-purple-400' : note.type === 'hotfix' ? 'text-orange-400' : 'text-cyan-400'
                  }`}>{note.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expansion Content */}
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-cyan-400" />
            Expansion Content
          </h3>
          <div className="space-y-3">
            {EXPANSION_CONTENT.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{item.name}</span>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/60 text-sm font-medium">$ {item.price.toFixed(2)}</span>
                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs h-7 px-3">
                    Buy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Game Progress */}
      <div className="w-72 flex-shrink-0 space-y-6">
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-bold">Game Progress</h4>
            <span className="text-cyan-400 font-bold text-lg">35%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" style={{ width: '35%' }} />
          </div>

          {/* Main Story */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-bold text-sm">{STORY_PROGRESS.main.label}</span>
              </div>
              <span className="text-white/40 text-xs">{STORY_PROGRESS.main.completed}/{STORY_PROGRESS.main.total} Completed</span>
            </div>
            <div className="space-y-3">
              {STORY_PROGRESS.main.chapters.map((ch, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/80 text-sm truncate">{ch.name}</span>
                      {ch.progress === 100 && <span className="text-green-400">✓</span>}
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${ch.progress}%` }} />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 ml-2 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Side Quests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-white font-bold text-sm">{STORY_PROGRESS.side.label}</span>
              </div>
              <span className="text-white/40 text-xs">{STORY_PROGRESS.side.available} Available</span>
            </div>
            <div className="space-y-3">
              {STORY_PROGRESS.side.quests.map((q, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-white/80 text-sm truncate block">{q.name}</span>
                    <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: `${q.progress}%` }} />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 ml-2 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}