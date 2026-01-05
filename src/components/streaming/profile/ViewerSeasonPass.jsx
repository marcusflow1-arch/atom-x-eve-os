import React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown, Gift } from "lucide-react";

export default function ViewerSeasonPass() {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl p-8 relative overflow-hidden group mt-10">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Crown size={120} />
      </div>
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Crown className="text-yellow-400" /> Season Pass: Neon Nights</h2>
        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">SEASON 2</Badge>
      </div>
      <div className="flex items-center gap-8 relative z-10">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">Level 45</span>
            <span className="text-white font-bold">1,250 / 2,000 XP</span>
          </div>
          <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 w-[65%]" />
          </div>
          <p className="text-xs text-white/40 mt-3">Earn XP by watching, chatting, and reacting.</p>
        </div>
        <div className="w-24 h-24 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-2">
          <Gift className="text-purple-400" />
          <span className="text-[10px] text-white/60 uppercase font-bold">Next Reward</span>
        </div>
      </div>
    </div>
  );
}