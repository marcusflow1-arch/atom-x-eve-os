import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingUp, Lock, Unlock, ArrowLeftRight, Search, Filter, Grid, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ManageView({ card }) {
  const [isLocked, setIsLocked] = useState(false);
  const [view, setView] = useState('grid');

  return (
    <div className="h-full flex flex-col bg-slate-900/50 backdrop-blur-sm rounded-l-3xl border-l border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-800/30">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-slate-300" />
            Manage
          </h2>
          <p className="text-white/40 text-sm">Inventory and economy</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="icon" className="border-white/10 text-white/60">
              <Filter className="w-4 h-4" />
           </Button>
           <Button variant="outline" size="icon" className="border-white/10 text-white/60">
              {view === 'grid' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
           </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        
        {/* Selected Card Actions */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
           <h3 className="text-white text-sm font-bold mb-4">Selected Item Actions</h3>
           <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => setIsLocked(!isLocked)}
                className={`h-12 border ${isLocked ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-white/5 border-white/10 text-white'}`}
              >
                 {isLocked ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                 {isLocked ? 'Unlock Item' : 'Lock Item'}
              </Button>
              <Button className="h-12 bg-white/5 border border-white/10 text-white hover:bg-white/10">
                 <ArrowLeftRight className="w-4 h-4 mr-2" />
                 List for Trade
              </Button>
           </div>
        </div>

        {/* Market Data */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="p-4 rounded-xl bg-black/20 border border-white/5">
              <div className="text-white/40 text-xs uppercase mb-1">Estimated Value</div>
              <div className="text-xl font-bold text-white flex items-center gap-2">
                 {(card.purchasePrice || 4500).toLocaleString()} 🪙
              </div>
           </div>
           <div className="p-4 rounded-xl bg-black/20 border border-white/5">
               <div className="text-white/40 text-xs uppercase mb-1">24h Trend</div>
               <div className="text-xl font-bold text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> +12.5%
               </div>
           </div>
        </div>

        {/* Collection Grid Placeholder */}
        <div>
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Similar Items</h3>
              <Input className="w-40 h-8 bg-black/20 border-white/10 text-xs" placeholder="Search..." />
           </div>
           
           <div className="grid grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="aspect-[2.5/3.5] bg-white/5 rounded-lg border border-white/5 hover:border-white/20 transition-all cursor-pointer relative">
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500" />
                 </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}