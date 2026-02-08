import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function TradingWorkspaceSell({ item, marketPrice }) {
  const [sellPrice, setSellPrice] = useState('');
  const [duration, setDuration] = useState('48');

  const fee = sellPrice ? Math.floor(parseInt(sellPrice) * 0.05) : 0;
  const net = sellPrice ? parseInt(sellPrice) - fee : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 space-y-5">
      {/* Price Section */}
      <div className="bg-green-900/15 border border-green-500/15 rounded-xl p-4 space-y-4">
        <h4 className="text-green-400 font-bold text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Set Your Price
        </h4>

        <div>
          <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Sale Price (AGP)</label>
          <div className="relative">
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder={`Suggested: ${marketPrice.toLocaleString()}`}
              className="w-full bg-black/30 border border-green-500/20 rounded-lg px-3 py-3 text-white text-sm outline-none focus:border-green-500/50 pr-16 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400/60 text-xs font-bold">AGP</span>
          </div>
        </div>

        {/* Quick Price Buttons */}
        <div className="flex gap-2">
          {[0.8, 0.9, 1.0, 1.1, 1.2].map((multiplier) => {
            const price = Math.floor(marketPrice * multiplier);
            return (
              <button
                key={multiplier}
                onClick={() => setSellPrice(String(price))}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                  sellPrice === String(price)
                    ? 'bg-green-500/20 border-green-500/30 text-green-300'
                    : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {multiplier === 1.0 ? 'Market' : `${multiplier > 1 ? '+' : ''}${Math.round((multiplier - 1) * 100)}%`}
              </button>
            );
          })}
        </div>

        {/* Duration */}
        <div>
          <label className="text-[10px] text-white/40 uppercase mb-1.5 block tracking-wider">Listing Duration</label>
          <div className="flex gap-2">
            {[
              { val: '12', label: '12h' },
              { val: '24', label: '24h' },
              { val: '48', label: '48h' },
              { val: '168', label: '7d' },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setDuration(opt.val)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                  duration === opt.val
                    ? 'bg-green-500/15 border-green-500/25 text-green-300'
                    : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06]'
                }`}
              >
                <Clock className="w-3 h-3" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Listing Price</span>
          <span className="text-white font-bold">{sellPrice ? parseInt(sellPrice).toLocaleString() : '---'} AGP</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Platform Fee (5%)</span>
          <span className="text-red-400/70 font-medium">-{fee.toLocaleString()} AGP</span>
        </div>
        <div className="h-px bg-white/5" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60 font-medium">You Receive</span>
          <span className="text-green-400 font-bold text-lg">{net > 0 ? net.toLocaleString() : '---'} <span className="text-green-400/60 text-xs">AGP</span></span>
        </div>
      </div>

      {/* Market Comparison */}
      <div className="flex items-center gap-2 text-[10px] text-white/30 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/5">
        <TrendingUp className="w-3 h-3 text-white/20 flex-shrink-0" />
        <span>Current market average: <span className="text-white/60 font-bold">{marketPrice.toLocaleString()} AGP</span></span>
      </div>

      {/* Submit */}
      <button 
        disabled={!sellPrice || parseInt(sellPrice) <= 0}
        className="w-full py-3.5 bg-green-600 hover:bg-green-500 disabled:bg-green-600/30 disabled:text-white/30 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <DollarSign className="w-4 h-4" />
        List for Sale
      </button>
    </motion.div>
  );
}