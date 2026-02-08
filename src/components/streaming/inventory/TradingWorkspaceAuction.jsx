import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gavel, Clock, TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TradingWorkspaceAuction({ item, owned, marketPrice }) {
  const [startingBid, setStartingBid] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('24');
  const [userBid, setUserBid] = useState('');

  // Mock active auctions for this item
  const activeAuctions = [
    { seller: 'VoidHunter', currentBid: Math.floor(marketPrice * 0.6), buyout: marketPrice, timeLeft: '4h 23m', bids: 8 },
    { seller: 'MarketBot', currentBid: Math.floor(marketPrice * 0.45), buyout: Math.floor(marketPrice * 0.9), timeLeft: '11h 05m', bids: 3 },
    { seller: 'CyberNinja', currentBid: Math.floor(marketPrice * 0.75), buyout: Math.floor(marketPrice * 1.1), timeLeft: '1h 12m', bids: 14 },
  ];

  if (owned) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 space-y-5">
        <div className="bg-purple-900/15 border border-purple-500/15 rounded-xl p-4 space-y-4">
          <h4 className="text-purple-400 font-bold text-sm flex items-center gap-2">
            <Gavel className="w-4 h-4" /> Start an Auction
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Starting Bid</label>
              <input type="number" value={startingBid} onChange={(e) => setStartingBid(e.target.value)} placeholder={`Min: ${Math.floor(marketPrice * 0.3).toLocaleString()}`} className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500/50 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Buyout Price</label>
              <input type="number" value={buyoutPrice} onChange={(e) => setBuyoutPrice(e.target.value)} placeholder={`Suggested: ${marketPrice.toLocaleString()}`} className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500/50 transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Duration</label>
            <div className="flex gap-2">
              {[
                { val: '6', label: '6h' }, { val: '12', label: '12h' },
                { val: '24', label: '24h' }, { val: '48', label: '48h' },
              ].map((opt) => (
                <button key={opt.val} onClick={() => setAuctionDuration(opt.val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                    auctionDuration === opt.val ? 'bg-purple-500/15 border-purple-500/25 text-purple-300' : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06]'
                  }`}
                >
                  <Clock className="w-3 h-3" />{opt.label}
                </button>
              ))}
            </div>
          </div>

          <button disabled={!startingBid} className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 disabled:text-white/30 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Gavel className="w-4 h-4" /> Start Auction
          </button>
        </div>
      </motion.div>
    );
  }

  // Not owned: Show active auctions to bid on
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-purple-400 font-bold text-sm flex items-center gap-2">
          <Gavel className="w-4 h-4" /> Active Auctions
        </h4>
        <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[9px]">
          {activeAuctions.length} available
        </Badge>
      </div>

      <div className="space-y-3">
        {activeAuctions.map((auction, i) => (
          <div key={i} className="bg-purple-900/10 border border-purple-500/10 rounded-xl p-4 space-y-3 hover:border-purple-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-[10px] font-bold">{auction.seller.charAt(0)}</div>
                <span className="text-white text-xs font-medium">{auction.seller}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/30 text-[10px]">
                <Clock className="w-3 h-3" />
                <span>{auction.timeLeft}</span>
                <span className="text-white/20">•</span>
                <span>{auction.bids} bids</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-[9px] text-white/40 uppercase tracking-wider">Current Bid</p>
                <p className="text-white font-bold text-base">{auction.currentBid.toLocaleString()} <span className="text-white/30 text-xs">AGP</span></p>
              </div>
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-[9px] text-white/40 uppercase tracking-wider">Buyout</p>
                <p className="text-white font-bold text-base">{auction.buyout.toLocaleString()} <span className="text-white/30 text-xs">AGP</span></p>
              </div>
            </div>

            <div className="flex gap-2">
              <input type="number" placeholder={`Min: ${(auction.currentBid + 100).toLocaleString()}`} className="flex-1 bg-black/30 border border-purple-500/20 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-purple-500/40 transition-colors" />
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all hover:shadow-md hover:shadow-purple-500/20">Bid</button>
              <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold rounded-lg border border-purple-500/20 transition-all flex items-center gap-1">
                <Zap className="w-3 h-3" /> Buyout
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}