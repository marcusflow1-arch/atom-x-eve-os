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

      <AnimatePresence>
        {expandedDLC ? (
          // Expanded View: Left dropdown + Right details
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-6"
          >
            {/* LEFT: Dropdown content */}
            <div className="space-y-6">
              {/* Back to list button */}
              <button
                onClick={() => setExpandedDLC(null)}
                className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors"
              >
                <ChevronDown className="w-3 h-3 rotate-90" />
                Back to Content
              </button>

              {/* Includes Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Includes</h4>
                <div className="space-y-2">
                  {expandedDLC?.offers?.map((offer, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {offer}
                    </div>
                  ))}
                </div>
              </div>

              {/* New Achievements */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">New Achievements</h4>
                <div className="space-y-2">
                  {expandedDLC?.achievements?.map((ach, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                      <span className="text-yellow-400 font-bold">🏆</span>
                      {ach}
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Quests */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Available Quests</h4>
                <div className="space-y-2">
                  {mockQuests.map((quest, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span className="text-lg">{quest.icon}</span>
                      <span className="text-sm text-white/80">{quest.name}</span>
                      <ChevronRight className="w-3 h-3 text-white/40 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => {
                  onAddDLC(expandedDLC);
                  setExpandedDLC(null);
                }}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                ADD TO CART — ${expandedDLC?.price?.toFixed(2)}
              </button>
            </div>

            {/* RIGHT: DLC Details + Community Highlights */}
            <div className="space-y-6">
              {/* Title & Description */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{expandedDLC?.name}</h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  {expandedDLC?.description || 'Unlock new abilities, exclusive content, and expand your gameplay experience with this comprehensive expansion pack.'}
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
                    />
                  ))}
                </div>
                <span className="text-white font-bold">4.6</span>
                <span className="text-white/40 text-sm">(12.6K reviews)</span>
              </div>

              {/* Community Highlights */}
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Community Highlights
                </h3>
                <div className="space-y-3">
                  {communityHighlights.map((highlight) => (
                    <div
                      key={highlight.id}
                      className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-sm flex-shrink-0">
                        {highlight.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-bold text-white">{highlight.author}</p>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-2.5 h-2.5 ${i < highlight.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-white/60">{highlight.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Collapsed View: Vertical list
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            {nonStandardDLC.map((dlc) => (
              <motion.div
                key={dlc.id}
                onClick={() => setExpandedDLC(dlc)}
                className="group flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all"
                whileHover={{ x: 4 }}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded border border-white/10 flex-shrink-0 overflow-hidden">
                  <img
                    src={game.cover_image}
                    className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all"
                    alt=""
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{dlc.name}</h4>
                  <div className="flex gap-1.5 mt-1">
                    {dlc.offers?.slice(0, 2).map((offer, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-cyan-400 bg-cyan-900/20 px-1.5 py-0.5 rounded"
                      >
                        {offer.split(' ').slice(0, 2).join(' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <span className="text-sm font-bold text-white flex-shrink-0">${dlc.price?.toFixed(2)}</span>

                {/* Cart Icon */}
                <Download className="w-4 h-4 text-green-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}