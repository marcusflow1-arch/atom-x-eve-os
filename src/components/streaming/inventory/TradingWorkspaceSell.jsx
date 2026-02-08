import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, Gavel } from 'lucide-react';

export default function TradingWorkspaceSell({ item, marketPrice }) {
  // Fixed price state
  const [sellPrice, setSellPrice] = useState('');
  const [duration, setDuration] = useState('48');

  // Auction state
  const [startingBid, setStartingBid] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('24');

  const fee = sellPrice ? Math.floor(parseInt(sellPrice) * 0.05) : 0;
  const net = sellPrice ? parseInt(sellPrice) - fee : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6">

      {/* Market Reference */}
      <div className="flex items-center gap-2 text-[10px] text-white/30 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/5 mb-5">
        <TrendingUp className="w-3 h-3 text-white/20 flex-shrink-0" />
        <span>Current market average: <span className="text-white/60 font-bold">{marketPrice.toLocaleString()} AGP</span></span>
      </div>

      {/* ═══ SIDE BY SIDE: Sell | Auction Off ═══ */}
      <div className="flex gap-0 items-stretch">

        {/* ── LEFT: Sell (Fixed Price) ── */}
        <div className="flex-1 pr-6 space-y-4">
          {/* Label */}
          <div className="pb-2 border-b border-green-500/20 mb-1">
            <h4 className="text-green-400 font-bold text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Sell
            </h4>
          </div>

          {/* Price Input */}
          <div>
            <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Sale Price (AGP)</label>
            <div className="relative">
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder={`Suggested: ${marketPrice.toLocaleString()}`}
                className="w-full bg-black/30 border border-green-500/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-green-500/50 pr-14 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400/60 text-xs font-bold">AGP</span>
            </div>
          </div>

          {/* Quick Price Buttons */}
          <div className="flex gap-1.5">
            {[0.8, 0.9, 1.0, 1.1, 1.2].map((multiplier) => {
              const price = Math.floor(marketPrice * multiplier);
              return (
                <button key={multiplier} onClick={() => setSellPrice(String(price))}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${
                    sellPrice === String(price) ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {multiplier === 1.0 ? 'Market' : `${multiplier > 1 ? '+' : ''}${Math.round((multiplier - 1) * 100)}%`}
                </button>
              );
            })}
          </div>

          {/* Duration */}
          <div>
            <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Duration</label>
            <div className="flex gap-1.5">
              {[{ val: '12', label: '12h' }, { val: '24', label: '24h' }, { val: '48', label: '48h' }, { val: '168', label: '7d' }].map((opt) => (
                <button key={opt.val} onClick={() => setDuration(opt.val)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                    duration === opt.val ? 'bg-green-500/15 border-green-500/25 text-green-300' : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06]'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />{opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/40">Listing Price</span>
              <span className="text-white font-bold">{sellPrice ? parseInt(sellPrice).toLocaleString() : '---'} AGP</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/40">Fee (5%)</span>
              <span className="text-red-400/70 font-medium">-{fee.toLocaleString()} AGP</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60 font-medium">You Receive</span>
              <span className="text-green-400 font-bold">{net > 0 ? net.toLocaleString() : '---'} <span className="text-green-400/60 text-[10px]">AGP</span></span>
            </div>
          </div>

          {/* Submit */}
          <button
            disabled={!sellPrice || parseInt(sellPrice) <= 0}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-600/30 disabled:text-white/30 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <DollarSign className="w-3.5 h-3.5" /> List for Sale
          </button>
        </div>

        {/* ── CENTER DIVIDER ── */}
        <div className="w-px bg-white/10 flex-shrink-0" />

        {/* ── RIGHT: Auction Off ── */}
        <div className="flex-1 pl-6 space-y-4">
          {/* Label */}
          <div className="pb-2 border-b border-purple-500/20 mb-1">
            <h4 className="text-purple-400 font-bold text-sm flex items-center gap-2">
              <Gavel className="w-4 h-4" /> Auction Off
            </h4>
          </div>

          {/* Starting Bid */}
          <div>
            <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Starting Bid (AGP)</label>
            <div className="relative">
              <input
                type="number"
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                placeholder={`Min: ${Math.floor(marketPrice * 0.3).toLocaleString()}`}
                className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500/50 pr-14 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/60 text-xs font-bold">AGP</span>
            </div>
          </div>

          {/* Buyout Price */}
          <div>
            <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Buyout Price (optional)</label>
            <div className="relative">
              <input
                type="number"
                value={buyoutPrice}
                onChange={(e) => setBuyoutPrice(e.target.value)}
                placeholder={`Suggested: ${marketPrice.toLocaleString()}`}
                className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500/50 pr-14 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/60 text-xs font-bold">AGP</span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Duration</label>
            <div className="flex gap-1.5">
              {[{ val: '6', label: '6h' }, { val: '12', label: '12h' }, { val: '24', label: '24h' }, { val: '48', label: '48h' }].map((opt) => (
                <button key={opt.val} onClick={() => setAuctionDuration(opt.val)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                    auctionDuration === opt.val ? 'bg-purple-500/15 border-purple-500/25 text-purple-300' : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06]'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />{opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auction Fee Info */}
          <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-white/40">Auction Fee</span>
              <span className="text-white/60">5% of final sale</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-white/40">Reserve</span>
              <span className="text-emerald-400/80">Starting bid = reserve</span>
            </div>
          </div>

          {/* Submit */}
          <button
            disabled={!startingBid}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/30 disabled:text-white/30 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Gavel className="w-3.5 h-3.5" /> Start Auction
          </button>
        </div>

      </div>
    </motion.div>
  );
}