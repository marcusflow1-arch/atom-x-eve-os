import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DevCardCarousel from './devEdition/DevCardCarousel';
import DevCardDetailOverlay from './devEdition/DevCardDetailOverlay';
import DevGameGrid from './devEdition/DevGameGrid';
import DevSearchBar from './devEdition/DevSearchBar';

// Static dev edition games data
const DEV_GAMES = [
  {
    id: 'dg1',
    title: 'Cyberpunk 2088',
    genre: 'RPG',
    year: 2088,
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&q=80',
    limitedCards: [
      { id: 'c1', name: 'Phantom Blade', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=200&q=80', power: 98, edition: 'Dev Edition #001' },
      { id: 'c2', name: 'Neural Hacker', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1617440168937-c6497eaa8db5?w=200&q=80', power: 84, edition: 'Dev Edition #002' },
      { id: 'c3', name: 'Chrome Samurai', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1608889825271-9696283c8895?w=200&q=80', power: 72, edition: 'Dev Edition #003' },
    ],
  },
  {
    id: 'dg2',
    title: 'Void Frontier',
    genre: 'Sci-Fi',
    year: 2085,
    cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&q=80',
    limitedCards: [
      { id: 'c4', name: 'Star Warden', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=200&q=80', power: 100, edition: 'Dev Edition #001' },
      { id: 'c5', name: 'Ion Rifter', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=200&q=80', power: 93, edition: 'Dev Edition #002' },
    ],
  },
  {
    id: 'dg3',
    title: 'Iron Fortress',
    genre: 'Strategy',
    year: 2080,
    cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80',
    limitedCards: [
      { id: 'c6', name: 'War Architect', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=200&q=80', power: 87, edition: 'Dev Edition #001' },
      { id: 'c7', name: 'Shield Titan', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=200&q=80', power: 75, edition: 'Dev Edition #002' },
      { id: 'c8', name: 'Ghost Protocol', rarity: 'Common', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&q=80', power: 60, edition: 'Dev Edition #003' },
    ],
  },
];

const RARITY_COLORS = {
  Mythic:    'from-fuchsia-500 to-purple-600',
  Legendary: 'from-amber-400 to-orange-500',
  Epic:      'from-purple-400 to-blue-500',
  Rare:      'from-blue-400 to-cyan-500',
  Common:    'from-slate-400 to-slate-500',
};

export default function DevEditionContent() {
  const [selectedGame, setSelectedGame] = useState(DEV_GAMES[0]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [search, setSearch] = useState('');

  const filteredGames = DEV_GAMES.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.genre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full min-h-full text-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-widest uppercase bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
            Developer Edition
          </h2>
          <p className="text-white/40 text-sm mt-1">Exclusive limited-edition cards crafted by the development team</p>
        </div>
        <DevSearchBar value={search} onChange={setSearch} />
      </div>

      {/* Game Grid */}
      <div className="mb-8">
        <DevGameGrid
          games={filteredGames}
          selectedGameId={selectedGame?.id}
          onSelectGame={setSelectedGame}
        />
      </div>

      {/* Selected Game Cards */}
      {selectedGame && (
        <motion.div
          key={selectedGame.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-white/50 text-xs font-bold uppercase tracking-widest px-3">
              {selectedGame.title} — Limited Cards
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {selectedGame.limitedCards.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                whileHover={{ y: -8, scale: 1.04, rotateY: 5 }}
                onClick={() => setSelectedCard(card)}
                className="group cursor-pointer relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 hover:border-amber-400/40 shadow-lg hover:shadow-amber-500/20 transition-all"
                style={{ perspective: '600px' }}
              >
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Holographic sheen */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,200,0,0.08) 100%)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                {/* Rarity badge */}
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r ${RARITY_COLORS[card.rarity] || RARITY_COLORS.Common} text-white shadow-lg`}>
                  {card.rarity}
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-xs leading-tight truncate">{card.name}</p>
                  <p className="text-amber-300/70 text-[9px] mt-0.5">{card.edition}</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="text-[8px] text-white/40">PWR</span>
                    <div className="flex-1 h-[3px] bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        style={{ width: `${card.power}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-amber-300 font-bold">{card.power}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Card Detail Overlay */}
      {selectedCard && (
        <DevCardDetailOverlay card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}