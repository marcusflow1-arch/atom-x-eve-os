import React, { useEffect, useMemo, useState } from 'react';
import { Play, Radio, Info, Clock, AlertCircle, ShoppingCart, Award, ThumbsUp, ThumbsDown, MessageSquare, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const glassStyle = {
  background: 'rgba(15, 20, 26, 0.65)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: '0 4px 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
  border: '1px solid rgba(165, 243, 252, 0.15)',
};

export default function LibraryGameDetailModal({ game, onClose }) {
  const [activeTab, setActiveTab] = useState('content');
  const [selectedUpdateId, setSelectedUpdateId] = useState('patch-2-1');
  const [expandedExpansionId, setExpandedExpansionId] = useState('neural-expansion-pack');

  const updates = useMemo(() => ([
    {
      id: 'patch-2-1',
      type: 'patch',
      title: 'Patch 2.1 - Cyber Dawn',
      summary: 'New roam city district, 5 new weapons, and improved ray tracing performance. Fixed minor bugs in the inventory system.',
      time: '3 days ago',
      likes: 78,
      dislikes: 22,
      details: [
        'Added a new explorable district with dynamic encounters.',
        'Introduced 5 new weapons and balancing updates for existing loadouts.',
        'Improved ray tracing performance and reduced inventory-related bugs.'
      ],
      opinions: [
        { name: 'RoguePixel', stance: 'recommended', liked: true, text: 'This update finally made the city feel alive. The new district is worth jumping back in for.' },
        { name: 'NovaTrace', stance: 'mixed', liked: true, text: 'I like the performance gains, but some of the weapon tuning still needs another pass.' },
        { name: 'ByteHunter', stance: 'not_recommended', liked: false, text: 'The visuals are better, but I hit a couple of UI hiccups after the patch.' }
      ]
    },
    {
      id: 'event-void-walker',
      type: 'event',
      title: "Event: Void Walker's Return",
      summary: 'Limited time event! Farm double XP and exclusive void skins for your character.',
      time: '2 days ago • Ends soon',
      likes: 66,
      dislikes: 34,
      details: [
        'Double XP is active in all event playlists.',
        'Exclusive void-themed cosmetics can be unlocked during the event window.',
        'Event missions rotate daily with bonus reward caches.'
      ],
      opinions: [
        { name: 'AshenFox', stance: 'recommended', liked: true, text: 'The rewards are solid and the double XP makes the grind feel much better.' },
        { name: 'LunaGrid', stance: 'mixed', liked: true, text: 'Good event overall, but the daily rotations feel a little repetitive.' },
        { name: 'DriftCore', stance: 'not_recommended', liked: false, text: 'I wanted more exclusive missions instead of a mostly XP-focused event.' }
      ]
    }
  ]), []);

  const expansions = useMemo(() => ([
    {
      id: 'neural-expansion-pack',
      title: 'Neural Expansion Pack',
      subtitle: 'Advanced AI storylines & weapons',
      price: '$ 14.99',
      includes: ['4 new branching missions', '2 advanced companion AI story arcs', '6 prototype weapons with upgrade trees'],
      details: 'Adds a full late-game narrative track focused on rogue neural agents, hidden labs, and adaptive enemy encounters.'
    },
    {
      id: 'void-walker-arsenal',
      title: 'Void Walker Arsenal',
      subtitle: '10 legendary weapons & skins',
      price: '$ 14.99',
      includes: ['10 void-tuned weapon variants', 'Exclusive weapon skins and finishing effects', 'Bonus crafting materials cache'],
      details: 'Built for players who want stronger visual flair and a faster loadout refresh with premium legendary gear.'
    },
    {
      id: 'season-pass-year-one',
      title: 'Season Pass: Year One',
      subtitle: 'All seasonal content & rewards',
      price: '$ 29.99',
      includes: ['Access to all year one seasonal drops', 'Premium reward track cosmetics', 'XP boosts and event bonus bundles'],
      details: 'Unlocks the full seasonal roadmap with premium drops, rotating challenges, and bonus progression rewards.'
    }
  ]), []);

  const selectedUpdate = updates.find((update) => update.id === selectedUpdateId) || updates[0];
  const totalVotes = selectedUpdate.likes + selectedUpdate.dislikes;
  const likeRatio = Math.round((selectedUpdate.likes / totalVotes) * 100);
  const dislikeRatio = 100 - likeRatio;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!game) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed left-[320px] right-0 z-[69] shadow-2xl flex flex-col overflow-hidden"
      style={{
        ...glassStyle,
        top: '64px',
        bottom: '52px',
      }}
    >
      {/* Header with Game Title */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white">{game.title || game.name}</h2>
          <p className="text-sm text-white/50 mt-1">Ready to play</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 px-6 py-4 border-b border-white/10">
        <button className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-black font-bold transition-colors">
          <Play className="w-4 h-4 fill-current" /> Play
        </button>
        <button className="flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium transition-colors">
          <Radio className="w-4 h-4" /> Stream
        </button>
        <button className="flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium transition-colors">
          <Info className="w-4 h-4" /> Info
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 px-6 py-4 border-b border-white/10 text-sm font-medium">
        {['content', 'community', 'achievements'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'text-white border-cyan-400'
                : 'text-white/50 border-transparent hover:text-white/70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'content' && (
          <div className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-6 items-start">
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">Updates & Patch Notes</h3>
                </div>

                <div className="space-y-3">
                  {updates.map((update) => {
                    const isSelected = selectedUpdate.id === update.id;
                    const UpdateIcon = update.type === 'event' ? AlertCircle : Clock;
                    return (
                      <button
                        key={update.id}
                        onClick={() => setSelectedUpdateId(update.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-colors ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-400/40'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <UpdateIcon className={`w-4 h-4 flex-shrink-0 ${update.type === 'event' ? 'text-yellow-500' : 'text-cyan-400'}`} />
                            <h4 className="font-bold text-white truncate">{update.title}</h4>
                          </div>
                          <span className="text-[11px] text-white/35 whitespace-nowrap">{update.time}</span>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed">{update.summary}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-xs text-emerald-300">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{update.likes}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-400/20 text-xs text-red-300">
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>{update.dislikes}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/70 mb-2">Selected Update</p>
                      <h4 className="text-xl font-bold text-white">{selectedUpdate.title}</h4>
                      <p className="text-sm text-white/45 mt-1">{selectedUpdate.time}</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                      <ThumbsUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-white">{likeRatio}%</span>
                      <span className="text-xs text-white/40">positive</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-white">Patch details</h5>
                    <div className="space-y-2">
                      {selectedUpdate.details.map((detail) => (
                        <div key={detail} className="flex gap-3 text-sm text-white/65 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                          <p>{detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <ShoppingCart className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">Expansion Content</h3>
                  </div>
                  <div className="space-y-3">
                    {expansions.map((expansion) => {
                      const isExpanded = expandedExpansionId === expansion.id;
                      return (
                        <div key={expansion.id} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                          <button
                            onClick={() => setExpandedExpansionId(isExpanded ? '' : expansion.id)}
                            className="w-full p-4 text-left hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div>
                                <h4 className="font-bold text-white mb-1">{expansion.title}</h4>
                                <p className="text-sm text-white/50">{expansion.subtitle}</p>
                              </div>
                              <div className="flex items-center gap-3 ml-auto">
                                <span className="text-white font-bold">{expansion.price}</span>
                                <button className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
                                  Buy
                                </button>
                                <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                  <ChevronDown className="w-4 h-4 text-white/70" />
                                </div>
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-white/10 bg-white/[0.02]">
                              <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-4">
                                <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70 mb-3">Content details</p>
                                  <p className="text-sm text-white/65 leading-relaxed">{expansion.details}</p>
                                </div>
                                <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70 mb-3">Includes</p>
                                  <div className="space-y-2">
                                    {expansion.includes.map((item) => (
                                      <div key={item} className="flex gap-3 text-sm text-white/65 leading-relaxed">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                                        <p>{item}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-bold text-white">Quests & Experience</h3>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-white/60 text-sm">Complete quests and missions to earn XP, rewards, and unlock exclusive items.</p>
                    <button className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
                      View Quest Log
                    </button>
                  </div>
                </section>
              </section>

              <aside className="space-y-4 xl:sticky xl:top-0">
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-300" />
                    <h3 className="text-base font-bold text-white">Player Opinions</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
                      <div className="flex items-center gap-2 mb-1">
                        <ThumbsUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-white/60">Like</span>
                      </div>
                      <p className="text-lg font-bold text-white">{likeRatio}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-400/20">
                      <div className="flex items-center gap-2 mb-1">
                        <ThumbsDown className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-white/60">Dislike</span>
                      </div>
                      <p className="text-lg font-bold text-white">{dislikeRatio}%</p>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${likeRatio}%` }} />
                  </div>
                  <p className="text-xs text-white/45">Snapshot of how players feel about {selectedUpdate.title}.</p>
                </div>

                <div className="space-y-3">
                  {selectedUpdate.opinions.map((opinion) => (
                    <div key={opinion.name} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-sm font-semibold text-white">{opinion.name}</p>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${
                          opinion.stance === 'recommended'
                            ? 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10'
                            : opinion.stance === 'not_recommended'
                              ? 'text-red-300 border-red-400/30 bg-red-500/10'
                              : 'text-yellow-300 border-yellow-400/30 bg-yellow-500/10'
                        }`}>
                          {opinion.stance === 'recommended' ? 'Recommended' : opinion.stance === 'not_recommended' ? 'Not Recommended' : 'Mixed'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2 text-xs text-white/45">
                        {opinion.liked ? <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> : <ThumbsDown className="w-3.5 h-3.5 text-red-400" />}
                        <span>{opinion.liked ? 'Liked this update' : 'Disliked this update'}</span>
                      </div>
                      <p className="text-sm text-white/65 leading-relaxed">{opinion.text}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="p-6">
            <div className="text-center text-white/60">
              <p>Community discussions and reviews coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="p-6">
            <div className="text-center text-white/60">
              <p>Achievement tracking and progress coming soon</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}