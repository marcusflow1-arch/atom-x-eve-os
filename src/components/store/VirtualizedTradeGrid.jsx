import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Globe } from 'lucide-react';

export default function VirtualizedTradeGrid({ items, onSelectItem }) {
  const parentRef = useRef(null);

  const COLUMNS = 5; // keep 5 columns like Trading Post UI

  const rowCount = Math.ceil(items.length / COLUMNS);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 420, // Height per row (increased to prevent overlap)
    overscan: 2,
  });

  const RarityBadge = ({ rarity }) => {
    const styles = {
      Mythic: "bg-red-500/10 text-red-400 border-red-500/50",
      Legendary: "bg-orange-500/10 text-orange-400 border-orange-500/50",
      Epic: "bg-purple-500/10 text-purple-400 border-purple-500/50",
      Rare: "bg-blue-500/10 text-blue-400 border-blue-500/50",
      Common: "bg-slate-500/10 text-slate-400 border-slate-500/50"
    };

    return (
      <Badge variant="outline" className={`${styles[rarity] || styles.Common} border px-2 py-0.5 uppercase tracking-wider text-[10px] font-bold`}>
        {rarity}
      </Badge>
    );
  };

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto custom-scrollbar pr-2 pb-6"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
          paddingBottom: '8px',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIdx = virtualRow.index * COLUMNS;
          const rowItems = items.slice(startIdx, startIdx + COLUMNS);

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="grid grid-cols-5 gap-4 pb-6"
            >
              {rowItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="relative group cursor-pointer w-full aspect-[2.5/3.5] rounded-xl overflow-hidden border-[3px] bg-slate-900 shadow-xl hover:shadow-2xl transition-all duration-300"
                  style={{
                    borderColor: item.rarity === 'Legendary' ? 'rgb(249 115 22 / 0.5)' :
                                item.rarity === 'Epic' ? 'rgb(168 85 247 / 0.5)' :
                                item.rarity === 'Rare' ? 'rgb(59 130 246 / 0.5)' : 'rgb(100 116 139 / 0.5)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-30 z-20 pointer-events-none transition-opacity duration-500 mix-blend-overlay" />
                  
                  <div className="absolute top-0 left-0 right-0 h-8 bg-slate-950/90 z-10 flex items-center justify-between px-2 border-b border-white/10">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate max-w-[60%]">{item.type}</span>
                  </div>

                  <div className="absolute top-8 left-1 right-1 bottom-[35%] rounded-lg overflow-hidden border border-white/5 bg-black">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-b from-slate-900/80 to-slate-900 p-3 flex flex-col justify-between backdrop-blur-sm border-t border-white/10">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-white truncate pr-2" title={item.name}>{item.name}</h3>
                        <RarityBadge rarity={item.rarity} />
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-white font-medium truncate max-w-[80px]">{item.game}</span>
                      <span className="text-cyan-400 font-mono text-xs">{item.marketPrice} G</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}