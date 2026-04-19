import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, ChevronRight, Star, Users } from 'lucide-react';

export default function ContentForGamePanel({ game, dlcList, onAddDLC }) {
  const [selectedDLC, setSelectedDLC] = useState(dlcList[1] || dlcList[0]); // Select first non-standard DLC

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

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Content For This Game</h3>
        <button className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors">
          Browse All DLC
        </button>
      </div>

      {/* Main Layout: List Left, Details Right */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: DLC List (1 col width) */}
        <div className="col-span-1 space-y-1 max-h-[600px] overflow-y-auto scrollbar-hide pr-2">
          {dlcList.filter(dlc => dlc.id !== 'standard').map((dlc) => (
            <motion.div
              key={dlc.id}
              onClick={() => setSelectedDLC(dlc)}
              className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                selectedDLC?.id === dlc.id
                  ? 'bg-white/20 border border-cyan-400/40'
                  : 'bg-transparent hover:bg-white/5 border border-transparent'
              }`}
              whileHover={{ scale: 1.02 }}
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 bg-gray-800 rounded border border-white/10 flex-shrink-0 overflow-hidden">
                <img src={game.cover_image} className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all" alt="" />
              </div>

              {/* Title + Price */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{dlc.name}</h4>
                <p className="text-xs text-cyan-400 font-semibold">${dlc.price}</p>
              </div>

              {/* Add Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddDLC(dlc);
                }}
                className="p-2 bg-green-600/20 hover:bg-green-600 hover:text-white text-green-400 rounded-md transition-colors flex-shrink-0"
              >
                <Download className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Right Column: Details + Community (2 cols width) */}
        <div className="col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {selectedDLC && (
              <motion.div
                key={selectedDLC.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header: Title + Rating */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedDLC.name}</h2>
                      <p className="text-white/40 text-sm mt-1">{selectedDLC.offers?.length || 0} Items Included</p>
                    </div>
                    <span className="text-white font-bold text-2xl">${selectedDLC.price}</span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < 5 ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
                        />
                      ))}
                    </div>
                    <span className="text-white font-bold">4.8</span>
                    <span className="text-white/40 text-sm">(2.1K reviews)</span>
                  </div>
                </div>

                {/* What's Included */}
                {selectedDLC.offers?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">What's Included</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDLC.offers.map((offer, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                          <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                          {offer}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-white/10" />

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
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-lg flex-shrink-0">
                          {highlight.avatar}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-white">{highlight.author}</p>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < highlight.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}