import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Star, Plus, Eye, EyeOff, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TradingWorkspaceTrade({ item, owned }) {
  const [tradeSeek, setTradeSeek] = useState('');
  const [addCurrency, setAddCurrency] = useState('');
  const [visibility, setVisibility] = useState('public'); // 'public' | 'friends' | 'clan'

  // Mock active trade listings
  const activeTradeListings = [
    { user: 'VoidHunter', wants: 'Any Epic Equipment', rating: 4.8, offers: 3 },
    { user: 'CyberNinja', wants: 'Legendary Ability Cards', rating: 4.5, offers: 1 },
    { user: 'ShadowMage', wants: 'Rare Companions', rating: 4.9, offers: 5 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 space-y-5">
      <div className="bg-blue-900/15 border border-blue-500/15 rounded-xl p-4 space-y-4">
        <h4 className="text-blue-400 font-bold text-sm flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4" /> {owned ? 'Trade This Card' : 'Offer a Trade'}
        </h4>

        {/* What you're seeking / offering */}
        <div>
          <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">
            {owned ? 'What are you looking for?' : 'What will you offer in exchange?'}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={tradeSeek}
              onChange={(e) => setTradeSeek(e.target.value)}
              placeholder="e.g. Void Walker Set, Neural Hack..."
              className="w-full bg-black/30 border border-blue-500/20 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Currency Add-on */}
        <div>
          <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Add Currency (Optional)</label>
          <div className="relative">
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="number"
              value={addCurrency}
              onChange={(e) => setAddCurrency(e.target.value)}
              placeholder="0"
              className="w-full bg-black/30 border border-blue-500/20 rounded-lg pl-9 pr-16 py-2.5 text-white text-sm outline-none focus:border-blue-500/50 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/60 text-xs font-bold">AGP</span>
          </div>
        </div>

        {/* Visibility */}
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
          <ArrowLeftRight className="w-4 h-4" />
          {owned ? 'Post Trade Listing' : 'Send Trade Request'}
        </button>
      </div>

      {/* Active Trade Listings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Active Trade Listings</p>
          <Badge className="bg-white/5 text-white/40 border-white/10 text-[9px]">{activeTradeListings.length}</Badge>
        </div>
        <div className="space-y-2">
          {activeTradeListings.map((listing, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-blue-400/20 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">{listing.user.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium">{listing.user}</p>
                <p className="text-white/30 text-[10px] truncate">Wants: {listing.wants}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 text-yellow-400 text-[10px]">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {listing.rating}
                </div>
                <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20 text-[8px]">{listing.offers} offers</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}