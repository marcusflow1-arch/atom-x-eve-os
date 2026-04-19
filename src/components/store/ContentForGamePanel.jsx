import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, Star, Users, ChevronDown, ChevronRight } from 'lucide-react';

export default function ContentForGamePanel({ game, dlcList, onAddDLC }) {
  const [expandedDLC, setExpandedDLC] = useState(null);

  // Mock community highlights
  const communityHighlights = [
    {
      id: 1,
      author: 'ShadowRunner',
      avatar: '🎮',
      rating: 5,
      comment: 'Best value in gaming. Every item drop has been worth it.'
    },
    {
      id: 2,
      author: 'CrypticSoulS',
      avatar: '⚔️',
      rating: 5,
      comment: 'The exclusive avatar skin alone makes this worth buying & Plus its SP boost is huge!'
    }
  ];

  // Mock quests for any DLC
  const mockQuests = [
    { name: 'Neural Awakening', icon: '⚡' },
    { name: 'Cyber Heist', icon: '🎯' },
    { name: 'The Architect', icon: '🏛️' }
  ];

  const nonStandardDLC = dlcList.filter(dlc => dlc.id !== 'standard');

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Content For This Game</h3>
        <button className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors">
          Browse All DLC
        </button>
      </div>

      <div className="space-y-2">
        {nonStandardDLC.map((dlc) => (
          <div key={dlc.id} className="space-y-2">
            {/* DLC Item Header */}
            <motion.div
              onClick={() => setExpandedDLC(expandedDLC?.id === dlc.id ? null : dlc)}
              className="group flex items-center gap-3 p-2 rounded-lg bg-cyan-100/40 border border-cyan-200/50 hover:bg-cyan-100/50 hover:border-cyan-300/60 cursor-pointer transition-all"
              whileHover={{ x: 4 }}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded border border-cyan-200/30 flex-shrink-0 overflow-hidden">
                <img
                  src={game.cover_image}
                  className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all"
                  alt=""
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">{dlc.name}</h4>
                <div className="flex gap-1 mt-0.5">
                  {dlc.offers?.slice(0, 2).map((offer, i) => (
                    <span
                      key={i}
                      className="text-[9px] text-cyan-700 bg-cyan-200/60 px-1 py-0.5 rounded"
                    >
                      {offer.split(' ').slice(0, 2).join(' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price */}
              <span className="text-xs font-bold text-slate-900 flex-shrink-0">${dlc.price?.toFixed(2)}</span>

              {/* Chevron Icon */}
              <ChevronDown
                className={`w-3 h-3 text-slate-600 flex-shrink-0 transition-transform ${
                  expandedDLC?.id === dlc.id ? 'rotate-180' : ''
                }`}
              />
            </motion.div>

            {/* Expanded Dropdown */}
            <AnimatePresence>
              {expandedDLC?.id === dlc.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-lg border border-cyan-200/30 bg-cyan-50/60"
                >
                  <div className="grid gap-0 p-4" style={{ gridTemplateColumns: '1fr 1px 1fr' }}>
                    {/* LEFT: Dropdown content */}
                    <div className="space-y-4 pr-4">
                      {/* Includes Section */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Includes</h4>
                        <div className="space-y-1">
                           {dlc.offers?.map((offer, i) => (
                             <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                              {offer}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* New Achievements */}
                       <div className="space-y-2">
                         <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">New Achievements</h4>
                        <div className="space-y-1">
                           {dlc.achievements?.map((ach, i) => (
                             <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                              <span className="text-yellow-400 font-bold">🏆</span>
                              {ach}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Available Quests */}
                       <div className="space-y-2">
                         <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Available Quests</h4>
                        <div className="space-y-1">
                           {mockQuests.map((quest, i) => (
                             <div
                               key={i}
                               className="flex items-center gap-2 px-2 py-1.5 bg-cyan-100/30 rounded-lg border border-cyan-200/30 hover:bg-cyan-100/40 transition-colors cursor-pointer"
                             >
                               <span className="text-sm">{quest.icon}</span>
                               <span className="text-xs text-slate-700">{quest.name}</span>
                               <ChevronRight className="w-3 h-3 text-slate-500 ml-auto" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                       <button
                         onClick={() => {
                           onAddDLC(dlc);
                           setExpandedDLC(null);
                         }}
                         className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                       >
                        <Download className="w-4 h-4" />
                        ADD TO CART — ${dlc.price?.toFixed(2)}
                      </button>
                    </div>

                    {/* Vertical Divider */}
                     <div className="w-px bg-gradient-to-b from-cyan-300/30 via-cyan-200/20 to-cyan-300/30" />

                     {/* RIGHT: Description + Rating + Community Highlights */}
                     <div className="space-y-4 pl-4">
                       {/* Title & Description */}
                       <div>
                         <h2 className="text-sm font-bold text-slate-900 mb-1">{dlc.name}</h2>
                         <p className="text-slate-600 text-xs leading-relaxed">
                          {dlc.description || 'Unlock new abilities, exclusive content, and expand your gameplay experience with this comprehensive expansion pack.'}
                        </p>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < 4 ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-slate-900 text-xs font-bold">4.6</span>
                        <span className="text-slate-500 text-[10px]">(12.6K)</span>
                      </div>

                      {/* Community Highlights */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          Community Highlights
                        </h3>
                        <div className="space-y-1.5">
                          {communityHighlights.map((highlight) => (
                            <div
                              key={highlight.id}
                              className="flex gap-2 p-1.5 rounded border border-cyan-200/40 bg-cyan-100/20"
                            >
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs flex-shrink-0">
                                {highlight.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <p className="text-[9px] font-bold text-slate-900">{highlight.author}</p>
                                  <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-1.5 h-1.5 ${i < highlight.rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300'}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-[9px] text-slate-600">{highlight.comment}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}