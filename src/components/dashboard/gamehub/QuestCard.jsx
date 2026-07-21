import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Star, Clock, Coins, Sword, MapPin, Check, X, Crosshair } from 'lucide-react';

const DIFFICULTY_STARS = { 1: '★', 2: '★★', 3: '★★★', 4: '★★★★', 5: '★★★★★' };

/**
 * Expandable quest card — shows summary collapsed, full details expanded.
 * Used for both active tracked quests and available quest offers.
 */
export default function QuestCard({ quest, variant = 'active' }) {
  const [expanded, setExpanded] = useState(variant === 'active');
  const [status, setStatus] = useState(quest.status || (variant === 'active' ? 'tracking' : 'available'));

  const isTracking = status === 'tracking';
  const isAccepted = status === 'accepted' || status === 'tracking';

  return (
    <div
      className="rounded-xl border transition-all overflow-hidden"
      style={{
        background: isTracking ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.03)',
        borderColor: isTracking ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isTracking ? 'bg-cyan-400' : 'bg-white/30'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${isTracking ? 'text-white' : 'text-white/80'}`}>
            {quest.title}
          </p>
          {quest.giver && (
            <p className="text-[10px] text-white/40 truncate">From: {quest.giver}</p>
          )}
        </div>
        {quest.difficulty && (
          <span className="text-[10px] text-amber-400/80 flex-shrink-0">{DIFFICULTY_STARS[quest.difficulty]}</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Picture */}
              {quest.image && (
                <div className="relative h-32 rounded-lg overflow-hidden">
                  <img src={quest.image} alt={quest.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
              )}

              {/* Description */}
              {quest.description && (
                <p className="text-xs text-white/60 leading-relaxed">{quest.description}</p>
              )}

              {/* Objective */}
              {quest.objective && (
                <div className="flex items-start gap-2 text-xs text-white/50">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-cyan-400/70" />
                  <span>{quest.objective}</span>
                </div>
              )}

              {/* Rewards */}
              {quest.rewards && quest.rewards.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {quest.rewards.map((rw, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/8 text-[10px] text-white/60"
                    >
                      {rw.type === 'xp' && <Star className="w-3 h-3 text-yellow-400" />}
                      {rw.type === 'money' && <Coins className="w-3 h-3 text-green-400" />}
                      {rw.type === 'weapon' && <Sword className="w-3 h-3 text-purple-400" />}
                      {rw.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {variant === 'available' && !isAccepted && (
                  <>
                    <button
                      onClick={() => setStatus('accepted')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
                    >
                      <Check className="w-3 h-3" /> Accept
                    </button>
                    <button
                      onClick={() => setStatus('declined')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-semibold hover:bg-white/10 transition-all"
                    >
                      <X className="w-3 h-3" /> Decline
                    </button>
                  </>
                )}
                {variant === 'active' && (
                  <>
                    <button
                      onClick={() => setStatus(isTracking ? 'accepted' : 'tracking')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isTracking
                          ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <Crosshair className="w-3 h-3" /> {isTracking ? 'Tracking' : 'Track'}
                    </button>
                    <button
                      onClick={() => setStatus('abandoned')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-semibold hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                      <X className="w-3 h-3" /> Abandon
                    </button>
                  </>
                )}
                {status === 'accepted' && variant === 'available' && (
                  <span className="text-[10px] text-cyan-400 font-semibold px-2">✓ Accepted — Track in Active Quests</span>
                )}
                {status === 'declined' && (
                  <span className="text-[10px] text-white/30 px-2">Declined</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}