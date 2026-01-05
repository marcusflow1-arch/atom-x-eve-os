import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, Check, Sparkles } from "lucide-react";
import ShinyCard from "@/components/shared/ShinyCard";

const DEFAULT_ITEMS = [
  { id: "a1", name: "Arcane Burst", type: "Ability", rarity: "Epic", image: "https://source.unsplash.com/random/400x300?sig=11&magic" },
  { id: "c1", name: "Golden Cloak", type: "Cosmetic", rarity: "Legendary", image: "https://source.unsplash.com/random/400x300?sig=12&cloak" },
  { id: "e1", name: "Dragon Hunt", type: "Event", rarity: "Rare", image: "https://source.unsplash.com/random/400x300?sig=13&dragon" },
  { id: "a2", name: "Frost Nova", type: "Ability", rarity: "Rare", image: "https://source.unsplash.com/random/400x300?sig=14&ice" },
  { id: "c2", name: "Runic Tattoos", type: "Cosmetic", rarity: "Epic", image: "https://source.unsplash.com/random/400x300?sig=15&rune" },
];

export default function AbilityRewardCarousel({ items = DEFAULT_ITEMS, onSelect }) {
  const [index, setIndex] = useState(0);
  const [activeId, setActiveId] = useState(items[0]?.id);
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const pageItems = useMemo(() => {
    const start = index * pageSize;
    return items.slice(start, start + pageSize);
  }, [index, items]);

  const handlePrev = () => setIndex((i) => (i - 1 + totalPages) % totalPages);
  const handleNext = () => setIndex((i) => (i + 1) % totalPages);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 md:p-6 mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white/80">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="text-sm">Abilities & Rewards</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrev} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={handleNext} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pageItems.map((it) => {
            const locked = it.rarity === "Legendary" ? false : false; // hook up later
            const isActive = activeId === it.id;
            return (
              <ShinyCard key={it.id} className={`rounded-2xl overflow-hidden border ${isActive ? 'border-cyan-400/50' : 'border-white/10'} bg-white/5`} onClick={() => { setActiveId(it.id); onSelect?.(it); }}>
                <div className="relative h-32">
                  <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {locked ? (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 border border-white/10 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-white/70" />
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500/80 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-white font-semibold text-sm mb-0.5 line-clamp-1">{it.name}</div>
                  <div className="text-white/60 text-xs">{it.type} • {it.rarity}</div>
                </div>
              </ShinyCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}