import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Star, Plus, Eye, EyeOff, Search, ChevronDown, User, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TradeNegotiationPanel from './TradeNegotiationPanel';

export default function TradingWorkspaceTrade({ item, owned }) {
  const [tradeSeek, setTradeSeek] = useState('');
  const [addCurrency, setAddCurrency] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [expandedListing, setExpandedListing] = useState(null);
  const [showNegotiation, setShowNegotiation] = useState(false);

  const activeTradeListings = [
    { id: 't1', user: 'VoidHunter', avatar: 'V', rating: 4.8, offers: 3, wants: 'Any Epic Equipment', notes: 'Looking for melee weapons preferably. Will add 2,000 AGP for Legendary items.', listed: '1h ago', willingToAdd: 2000 },
    { id: 't2', user: 'CyberNinja', avatar: 'C', rating: 4.5, offers: 1, wants: 'Legendary Ability Cards', notes: 'Need Neural Shock or Void Strike. No lowballs please.', listed: '3h ago', willingToAdd: 0 },
    { id: 't3', user: 'ShadowMage', avatar: 'S', rating: 4.9, offers: 5, wants: 'Rare Companions', notes: 'Any companion from Cyberpunk 2088 or Elden Ring. Open to negotiate.', listed: '6h ago', willingToAdd: 5000 },
    { id: 't4', user: 'IronFist', avatar: 'I', rating: 4.2, offers: 0, wants: 'Common Crafting Materials', notes: 'Looking for bulk materials for Blacksmith upgrades.', listed: '12h ago', willingToAdd: 1500 },
    { id: 't5', user: 'NovaStar', avatar: 'N', rating: 4.7, offers: 2, wants: 'Any Epic or Legendary card', notes: 'Will overpay in AGP if the item is good.', listed: '30m ago', willingToAdd: 10000 },
  ];

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6 h-full">
        <div className="flex gap-0 h-full items-stretch">

          {/* LEFT 30%: Trade This Card */}
          <div className="w-[30%] flex-shrink-0 pr-5 space-y-4">
            <div className="pb-2 border-b border-blue-500/20 mb-1">
              <h4 className="text-blue-400 font-bold text-sm flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4" /> {owned ? 'Trade This Card' : 'Offer a Trade'}
              </h4>
            </div>

            <button
              onClick={() => setShowNegotiation(true)}
              className="w-full py-2.5 bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-bold rounded-xl border border-blue-400/20 transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" /> Trade with a Friend
            </button>

            {owned ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">What are you looking for?</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input type="text" value={tradeSeek} onChange={(e) => setTradeSeek(e.target.value)} placeholder="e.g. Void Walker Set..." className="w-full bg-black/30 border border-blue-500/20 rounded-lg pl-8 pr-3 py-2.5 text-white text-xs outline-none focus:border-blue-500/50 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Add Currency</label>
                  <div className="relative">
                    <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input type="number" value={addCurrency} onChange={(e) => setAddCurrency(e.target.value)} placeholder="0" className="w-full bg-black/30 border border-blue-500/20 rounded-lg pl-8 pr-14 py-2.5 text-white text-xs outline-none focus:border-blue-500/50 transition-colors" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/60 text-[10px] font-bold">AGP</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Visibility</label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { val: 'public', label: 'Public', icon: Eye },
                      { val: 'friends', label: 'Friends', icon: EyeOff },
                      { val: 'clan', label: 'Clan', icon: EyeOff },
                    ].map((opt) => (
                      <button key={opt.val} onClick={() => setVisibility(opt.val)}
                        className={`w-full py-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                          visibility === opt.val ? 'bg-blue-500/15 border-blue-500/25 text-blue-300' : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06]'
                        }`}
                      >
                        <opt.icon className="w-3 h-3" />{opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2">
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Post Listing
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-white/30 text-[11px] leading-relaxed">You don't own this card. Browse trade offers on the right and send a request to a player who has it.</p>
                <div>
                  <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Your Offer (items to trade)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input type="text" value={tradeSeek} onChange={(e) => setTradeSeek(e.target.value)} placeholder="Search your inventory..." className="w-full bg-black/30 border border-blue-500/20 rounded-lg pl-8 pr-3 py-2.5 text-white text-xs outline-none focus:border-blue-500/50 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Add Currency</label>
                  <div className="relative">
                    <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input type="number" value={addCurrency} onChange={(e) => setAddCurrency(e.target.value)} placeholder="0" className="w-full bg-black/30 border border-blue-500/20 rounded-lg pl-8 pr-14 py-2.5 text-white text-xs outline-none focus:border-blue-500/50 transition-colors" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/60 text-[10px] font-bold">AGP</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CENTER DIVIDER */}
          <div className="w-px bg-white/10 flex-shrink-0" />

          {/* RIGHT 70%: Other Trades */}
          <div className="flex-1 pl-5 flex flex-col min-h-0">
            <div className="pb-2 border-b border-white/10 mb-3 flex items-center justify-between">
              <h4 className="text-white/50 font-bold text-sm flex items-center gap-2">
                <User className="w-4 h-4" /> {owned ? 'Others Trading This Card' : 'Players Offering This Card'}
              </h4>
              <Badge className="bg-white/5 text-white/40 border-white/10 text-[9px]">{activeTradeListings.length} listings</Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {activeTradeListings.map((listing) => {
                const isExpanded = expandedListing === listing.id;
                return (
                  <div key={listing.id} className={`rounded-xl border overflow-hidden transition-all ${isExpanded ? 'border-blue-500/30 shadow-lg shadow-blue-500/10 bg-blue-900/10' : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-blue-400/20'}`}>
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
                              <button
                                onClick={() => setShowNegotiation(true)}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all hover:shadow-md hover:shadow-blue-500/20 flex items-center justify-center gap-1.5"
                              >
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
        </div>
      </motion.div>

      <AnimatePresence>
        {showNegotiation && (
          <TradeNegotiationPanel
            initialItem={owned ? item : null}
            onClose={() => setShowNegotiation(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}