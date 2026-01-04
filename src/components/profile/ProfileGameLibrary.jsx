import React from 'react';

const MOCK_GAMES = [
  { id: 'g1', title: 'Cyberpunk 2088', cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=260&fit=crop' },
  { id: 'g2', title: 'Valorant', cover: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200&h=260&fit=crop' },
  { id: 'g3', title: 'Elden Ring', cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=260&fit=crop' },
  { id: 'g4', title: 'Minecraft', cover: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200&h=260&fit=crop' },
  { id: 'g5', title: 'Apex Legends', cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=260&fit=crop' },
];

export default function ProfileGameLibrary({ games = MOCK_GAMES }) {
  return (
    <aside className="h-full w-full">
      <div
        className="h-full w-full rounded-2xl overflow-hidden border"
        style={{
          background: 'rgba(255,255,255,0.06)',
          borderColor: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 10px 30px rgba(0,0,0,0.35)'
        }}
      >
        <div className="p-3 border-b border-white/10 text-white/80 text-xs tracking-wider uppercase">Library</div>
        <div className="h-[calc(100%-40px)] overflow-y-auto p-3 space-y-3">
          {games.map(g => (
            <div key={g.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
              <img src={g.cover} alt={g.title} className="w-10 h-14 object-cover rounded-md" />
              <div className="text-xs text-white/80 leading-tight line-clamp-2">{g.title}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}