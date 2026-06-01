import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Download, ShoppingCart, Sparkles } from 'lucide-react';

const DLC_DATA = [
  {
    id: 'dlc_1',
    name: 'Neural Expansion Pack',
    description: 'Advanced neural abilities & new storyline chapters in the cybernetic underworld.',
    price: '$14.99',
    tag: 'New',
    offers: ['5 New Abilities', '+20% XP Boost', '3 Legendary Cards', '10 Story Missions'],
  },
  {
    id: 'dlc_2',
    name: 'Void Walker Arsenal',
    description: 'Stealth-focused equipment and void manipulation powers.',
    price: '$9.99',
    tag: null,
    offers: ['7 New Equipment Sets', '+15% Stealth Rating', '2 Epic Traits', '5 New Weapons'],
  },
  {
    id: 'dlc_3',
    name: 'Season Pass: Year One',
    description: 'All future DLC releases for the first year, plus exclusive seasonal rewards.',
    price: '$29.99',
    tag: 'Best Value',
    offers: ['All DLC Access', '+50% Genre XP', 'Exclusive Avatar Skin', 'Priority Updates'],
  },
];

export default function GameLandingDLC() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Download className="w-3.5 h-3.5 text-purple-400" />
        <p className="text-white/20 text-[9px] uppercase tracking-widest">DLC & Add-ons</p>
      </div>

      {DLC_DATA.map((dlc) => {
        const isExpanded = expanded === dlc.id;
        return (
          <div
            key={dlc.id}
            className="overflow-hidden rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              onClick={() => setExpanded(isExpanded ? null : dlc.id)}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.03] transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-[11px] font-bold truncate">{dlc.name}</p>
                  {dlc.tag && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-purple-300 bg-purple-500/20 flex-shrink-0">{dlc.tag}</span>
                  )}
                </div>
                <p className="text-white/35 text-[9px] truncate mt-0.5">{dlc.description}</p>
              </div>
              <span className="text-cyan-300 text-[11px] font-bold flex-shrink-0">{dlc.price}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/30 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3 pb-3"
                >
                  <div className="space-y-1.5 mb-3 pt-1">
                    {dlc.offers.map((offer, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/55 text-[10px]">
                        <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        <span>{offer}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(99,102,241,0.18))',
                      border: '1px solid rgba(34,211,238,0.35)',
                      color: '#fff',
                    }}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Buy {dlc.price}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}