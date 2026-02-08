import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Star, Plus, Eye, EyeOff, Search, ChevronDown, User, Package, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TradingWorkspaceTrade({ item, owned }) {
  const [tradeSeek, setTradeSeek] = useState('');
  const [addCurrency, setAddCurrency] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [expandedListing, setExpandedListing] = useState(null);

  // Mock active trade listings — each card is listed by a player's name
  const activeTradeListings = [
    { id: 't1', user: 'VoidHunter', avatar: 'V', rating: 4.8, offers: 3, wants: 'Any Epic Equipment', notes: 'Looking for melee weapons preferably. Will add 2,000 AGP for Legendary items.', listed: '1h ago', willingToAdd: 2000 },
    { id: 't2', user: 'CyberNinja', avatar: 'C', rating: 4.5, offers: 1, wants: 'Legendary Ability Cards', notes: 'Need Neural Shock or Void Strike. No lowballs please.', listed: '3h ago', willingToAdd: 0 },
    { id: 't3', user: 'ShadowMage', avatar: 'S', rating: 4.9, offers: 5, wants: 'Rare Companions', notes: 'Any companion from Cyberpunk 2088 or Elden Ring. Open to negotiate.', listed: '6h ago', willingToAdd: 5000 },
    { id: 't4', user: 'IronFist', avatar: 'I', rating: 4.2, offers: 0, wants: 'Common Crafting Materials', notes: 'Looking for bulk materials for Blacksmith upgrades.', listed: '12h ago', willingToAdd: 1500 },
    { id: 't5', user: 'NovaStar', avatar: 'N', rating: 4.7, offers: 2, wants: 'Any Epic or Legendary card', notes: 'Will overpay in AGP if the item is good.', listed: '30m ago', willingToAdd: 10000 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 space-y-5">

      {/* Create Trade Listing (for owners) */}
      {owned && (
        <div className="bg-blue-900/15 border border-blue-500/15 rounded-xl p-4 space-y-4">
          <h4 className="text-blue-400 font-bold text-sm flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" /> Trade This Card
          </h4>

          <div>
            <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">What are you looking for?</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input type="text" value={tradeSeek} onChange={(e) => setTradeSeek(e.target.value)} placeholder="e.g. Void Walker Set, Neural Hack..." className="w-full bg-black/30 border border-blue-500/20 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm outline-none focus:border-blue-500/50 transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Add Currency (Optional)</label>
            <div className="relative">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input type="number" value={addCurrency} onChange={(e) => setAddCurrency(e.target.value)} placeholder="0" className="w-full bg-black/30 border border-blue-500/20 rounded-lg pl-9 pr-16 py-2.5 text-white text-sm outline-none focus:border-blue-500/50 transition-colors" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/60 text-xs font-bold">AGP</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Visibility</label>
            <div className="flex gap-2">
              {[
                { val: 'public', label: 'Public', icon: Eye },
                { val: 'friends', label: 'Friends Only', icon: EyeOff },
                { val: 'clan', label: 'Clan Only', icon: EyeOff },
              ].map((opt) => (
                <button key={opt.val} onClick={() => setVisibility(opt.val)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                    visibility === opt.val ? 'bg-blue-500/15 border-blue-500/25 text-blue-300' : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06]'
                  }`}
                >
                  <opt.icon className="w-3 h-3" />{opt.label}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2">
            <ArrowLeftRight className="w-4 h-4" /> Post Trade Listing
          </button>
        </div>
      )}

      {/* Active Trade Listings - Listed by Player Name */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className={`font-bold text-sm flex items-center gap-2 ${owned ? 'text-white/50' : 'text-blue-400'}`}>
            <User className="w-4 h-4" /> {owned ? 'Others Trading This Card' : 'Players Offering This Card'}
          </h4>
          <Badge className="bg-white/5 text-white/40 border-white/10 text-[9px]">{activeTradeListings.length} listings</Badge>
        </div>

        <div className="space-y-2">
          {activeTradeListings.map((listing) => {
            const isExpanded = expandedListing === listing.id;
            return (
              <div key={listing.id} className={`rounded-xl border overflow-hidden transition-all ${isExpanded ? 'border-blue-500/30 shadow-lg shadow-blue-500/10 bg-blue-900/10' : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-blue-400/20'}`}>
                {/* Summary Row */}
                <div onClick={() => setExpandedListing(isExpanded ? null : listing.id)} className="flex items-center gap-3 p-3 cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
                    {listing.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white text-xs font-medium">{listing.user}</p>
                      <div className="flex items-center gap-0.5 text-yellow-400 text-[9px]">
                        <Star className="w-2 h-2 fill-current" /> {listing.rating}
                      </div>
                    </div>
                    <p className="text-white/30 text-[10px] truncate">Wants: {listing.wants}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {listing.willingToAdd > 0 && (
                      <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[8px]">+{listing.willingToAdd.toLocaleString()} AGP</Badge>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-3 pb-3 pt-1 space-y-3 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] text-white/30">
                          <span>Listed: {listing.listed}</span>
                          <span className="text-white/10">•</span>
                          <span>{listing.offers} counter-offers</span>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Seller's Note</p>
                          <p className="text-white/70 text-xs leading-relaxed">{listing.notes}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all hover:shadow-md hover:shadow-blue-500/20 flex items-center justify-center gap-1.5">
                            <ArrowLeftRight className="w-3.5 h-3.5" /> {owned ? 'Counter Offer' : 'Send Trade Request'}
                          </button>
                          <button className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold rounded-lg border border-white/10 transition-all">
                            Message
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}