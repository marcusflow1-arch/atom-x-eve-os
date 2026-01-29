import React from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gavel, DollarSign, Star, Info } from "lucide-react";

const rarityStyles = {
  Common: { text: 'text-slate-400', bg: 'bg-slate-500/20' },
  Uncommon: { text: 'text-green-400', bg: 'bg-green-500/20' },
  Rare: { text: 'text-blue-400', bg: 'bg-blue-500/20' },
  Epic: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
  Legendary: { text: 'text-orange-400', bg: 'bg-orange-500/20' },
  Mythic: { text: 'text-red-400', bg: 'bg-red-500/20' }
};

export default function HorizontalInfoCard({ item, mode = 'buy', onClick }) {
  const [infoView, setInfoView] = React.useState('price'); // 'price' | 'currentBid' | 'stats'
  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;

  const currentBid = item.currentBid ?? Math.round((item.price || 0) * 0.6);
  const buyout = item.price || 0;
  const oneStatLabel = item.stats ? Object.keys(item.stats)[0] : 'Rating';
  const oneStatValue = item.stats ? item.stats[oneStatLabel] : (item.seller?.rating || 5);

  return (
    <div
      onClick={() => onClick?.(item)}
      className="min-w-[300px] md:min-w-[360px] flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl p-3 cursor-pointer"
    >
      <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={`${rarity.bg} ${rarity.text} border-none text-[10px]`}>{item.rarity}</Badge>
          <span className="text-white/40 text-[10px] truncate">{item.game}</span>
        </div>
        <h4 className="text-white font-semibold text-sm truncate mb-1">{item.name}</h4>

        <div className="flex items-center gap-2 text-xs text-white/60">
          {mode === 'auction' ? (
            <>
              <Select value={infoView} onValueChange={setInfoView}>
                <SelectTrigger className="h-7 w-[140px] bg-white/5 border-white/10 text-white/80 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Buyout</SelectItem>
                  <SelectItem value="currentBid">Current Bid</SelectItem>
                  <SelectItem value="stats">Legendary Stats</SelectItem>
                </SelectContent>
              </Select>

              {infoView === 'price' && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-cyan-400" />
                  <span className="text-white font-bold">{buyout.toLocaleString()}</span>
                  <span className="text-cyan-400">AGP</span>
                </div>
              )}

              {infoView === 'currentBid' && (
                <div className="flex items-center gap-1">
                  <Gavel className="w-3 h-3 text-purple-400" />
                  <span className="text-white font-bold">{currentBid.toLocaleString()}</span>
                  <span className="text-purple-300">AGP</span>
                </div>
              )}

              {infoView === 'stats' && (
                <div className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-amber-400" />
                  <span className="text-white/80">{oneStatLabel}:</span>
                  <span className="text-white font-bold">{oneStatValue}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-cyan-400" />
              <span className="text-white font-bold">{buyout.toLocaleString()}</span>
              <span className="text-cyan-400">AGP</span>
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1 text-[10px] text-white/50">
          <Star className="w-3 h-3 text-orange-400 fill-current" />
          <span>{item.seller?.rating || 5}/5</span>
          <span>•</span>
          <span>{(item.reviews || 0).toLocaleString()} reviews</span>
        </div>
      </div>
    </div>
  );
}