import React from "react";

export default function ProductsGrid({ items = [], title = "Available Products & Events" }) {
  const list = items.length ? items.slice(0, 20) : Array.from({ length: 10 }).map((_, i) => ({
    id: `demo-${i}`,
    name: i % 3 === 0 ? "Free Community Event" : `Merch Item ${i + 1}`,
    price: i % 3 === 0 ? 0 : 29 + i,
    image: `https://source.unsplash.com/random/600x400?sig=${40 + i}&merch`,
  }));

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 mb-10">
      <h3 className="text-white font-bold text-xl mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[420px] overflow-y-auto pr-1">
        {list.map((it) => (
          <div key={it.id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <div className="aspect-[5/4] w-full">
              <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-3">
              <div className="text-white text-sm font-semibold line-clamp-1">{it.name}</div>
              <div className="text-white/60 text-xs mt-1">{it.price === 0 ? 'Free' : `$${it.price}`}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}