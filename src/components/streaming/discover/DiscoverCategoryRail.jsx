import React, { useEffect, useRef } from 'react';

/** PlayStation-style vertical crossbar: the active category stays centered. */
export default function DiscoverCategoryRail({ categories = [], activeCategory, onSelect }) {
  const railRef = useRef(null);
  const activeIndex = Math.max(0, categories.findIndex((c) => c.title === activeCategory));

  useEffect(() => {
    const node = railRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeIndex, categories.length]);

  return (
    <aside className="w-[250px] shrink-0 h-[calc(100vh-190px)] min-h-[520px] border-r border-white/15 relative overflow-hidden">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-24 pointer-events-none border-y border-white/20 bg-white/[0.025]" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-20 bg-cyan-300/80 shadow-[0_0_14px_rgba(34,211,238,.45)]" />
      <div ref={railRef} className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide py-[calc(50vh-220px)]">
        <button
          data-index="-1"
          onClick={() => onSelect?.(null)}
          className={`w-full h-20 snap-center px-6 text-left uppercase tracking-widest text-xs font-bold transition-all ${!activeCategory ? 'text-cyan-200 scale-105' : 'text-white/35 hover:text-white/70'}`}
        >
          All Streams
        </button>
        {categories.map((category, index) => {
          const active = activeCategory === category.title;
          return (
            <button
              key={category.title}
              data-index={index}
              onClick={() => onSelect?.(category.title)}
              className={`w-full h-20 snap-center px-6 text-left uppercase tracking-widest transition-all duration-200 ${active ? 'text-white scale-105' : 'text-white/30 hover:text-white/65'}`}
            >
              <span className="block text-sm font-black truncate">{category.title}</span>
              <span className="block mt-1 text-[10px] tracking-normal text-white/30">{category.streamerCount} LIVE CREATORS</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
