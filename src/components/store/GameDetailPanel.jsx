import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star, Download, Heart, Share2, ShoppingCart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GameDetailPanel({ game, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'media', label: 'Media' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'requirements', label: 'Requirements' }
  ];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{game.title}</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/60">{game.genre}</span>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-white">{game.rating || 4.5}</span>
            </div>
            {game.price && <span className="text-green-400 font-bold">${game.price}</span>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 flex-shrink-0 bg-black/30">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-6 space-y-6">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {game.banner_image && (
                <img
                  src={game.banner_image}
                  alt={game.title}
                  className="w-full h-64 rounded-lg object-cover mb-6 border border-white/10"
                />
              )}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Description</h3>
                  <p className="text-white/70 leading-relaxed">
                    {game.description || 'No description available.'}
                  </p>
                </div>
                {game.original_year && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Release Year</h3>
                    <p className="text-white/70">{game.original_year}</p>
                  </div>
                )}
                {game.tags && game.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {game.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs border border-white/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'media' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {game.screenshots && game.screenshots.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Screenshots</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {game.screenshots.map((screenshot, idx) => (
                      <img
                        key={idx}
                        src={screenshot}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-48 rounded-lg object-cover border border-white/10"
                      />
                    ))}
                  </div>
                </div>
              )}
              {game.video_urls && game.video_urls.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Videos</h3>
                  <div className="space-y-2">
                    {game.video_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-cyan-400 text-sm transition-all truncate"
                      >
                        Video {idx + 1}: {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-white font-bold">{game.rating || 4.5}/5</span>
                  </div>
                  <p className="text-white/60 text-sm">Based on community feedback</p>
                </div>
                <p className="text-white/70">
                  This game has been praised for its {game.genre} gameplay and immersive experience.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'requirements' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {game.system_requirements ? (
                <div className="space-y-4">
                  {Object.entries(game.system_requirements).map(([key, value]) => (
                    <div key={key}>
                      <h4 className="text-white font-semibold capitalize mb-1">{key}</h4>
                      <p className="text-white/70">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60">System requirements not available</p>
              )}
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t border-white/10 p-6 flex items-center gap-3 flex-shrink-0 bg-black/30">
        <button className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
        <button className="w-12 h-12 rounded-lg border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all">
          <Heart className="w-5 h-5" />
        </button>
        <button className="w-12 h-12 rounded-lg border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}