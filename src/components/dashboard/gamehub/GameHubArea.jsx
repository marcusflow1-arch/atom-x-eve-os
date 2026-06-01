import React, { useState } from 'react';
import GameList from './GameList';
import GameLandingPage from './GameLandingPage';

const GAMES = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk 2088',
    genre: 'RPG / Action',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200',
    thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120',
    status: 'Playing',
    progress: 72,
    playtime: '48.2h',
    achievements: '18/50',
    rating: 9.4,
    players: '2.1M',
    description: 'Navigate a dystopian megacity as a mercenary outlaw pursuing the key to immortality. Every choice echoes through a fractured future.',
    tags: ['Open World', 'Story Rich', 'Cyberpunk', 'Dark'],
  },
  {
    id: 'neon-legends',
    title: 'Neon Legends',
    genre: 'Action / Brawler',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200',
    thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=120',
    status: 'In Progress',
    progress: 45,
    playtime: '12.8h',
    achievements: '6/30',
    rating: 8.7,
    players: '880K',
    description: 'Battle across neon-lit arenas in fast-paced combat. Unlock legendary fighters and dominate online leaderboards.',
    tags: ['Fighting', 'Multiplayer', 'Competitive'],
  },
  {
    id: 'stellar-odyssey',
    title: 'Stellar Odyssey',
    genre: 'Space Sim',
    image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1200',
    thumb: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=120',
    status: 'Installed',
    progress: 10,
    playtime: '3.1h',
    achievements: '2/40',
    rating: 8.1,
    players: '320K',
    description: 'Chart unexplored galaxies, build starships, and forge alliances with alien civilizations across the cosmos.',
    tags: ['Space', 'Exploration', 'Sci-Fi', 'Sandbox'],
  },
  {
    id: 'shadow-realm',
    title: 'Shadow Realm',
    genre: 'Fantasy RPG',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200',
    thumb: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=120',
    status: 'New',
    progress: 0,
    playtime: '0h',
    achievements: '0/45',
    rating: 9.1,
    players: '1.4M',
    description: 'A dark fantasy epic where ancient gods clash and mortal heroes rise. Shape the fate of a world on the edge of oblivion.',
    tags: ['Dark Fantasy', 'RPG', 'Souls-like'],
  },
  {
    id: 'apex-surge',
    title: 'Apex Surge',
    genre: 'Battle Royale',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
    thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120',
    status: 'Installed',
    progress: 33,
    playtime: '20.5h',
    achievements: '9/25',
    rating: 8.5,
    players: '3.8M',
    description: 'Drop into high-stakes arenas where only the most skilled survive. Craft your loadout and outsmart 99 rivals.',
    tags: ['Battle Royale', 'FPS', 'Competitive'],
  },
  {
    id: 'mythforge',
    title: 'MythForge Online',
    genre: 'MMORPG',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200',
    thumb: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=120',
    status: 'Playing',
    progress: 88,
    playtime: '210h',
    achievements: '44/50',
    rating: 9.6,
    players: '5.2M',
    description: 'A massive living world of mythic quests, guild wars, and ever-evolving lore. Your legend is never finished.',
    tags: ['MMORPG', 'PvP', 'Crafting', 'Guild'],
  },
];

const stopWheelPropagation = (e) => e.stopPropagation();

export default function GameHubArea() {
  const [selectedGame, setSelectedGame] = useState(null);

  return (
    <div className="flex gap-3 h-full" style={{ minHeight: 0 }}>
      {/* LEFT — compact game list, isolated scroll */}
      <div
        className="flex flex-col flex-shrink-0"
        onWheel={stopWheelPropagation}
        style={{
          width: selectedGame ? '220px' : '100%',
          transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
          borderRadius: '14px',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}
      >
        <GameList
          games={GAMES}
          selectedGame={selectedGame}
          onSelectGame={setSelectedGame}
        />
      </div>

      {/* RIGHT — game landing page, isolated scroll */}
      {selectedGame && (
        <div
          className="flex-1 min-w-0 flex flex-col"
          onWheel={stopWheelPropagation}
          style={{
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}
        >
          <GameLandingPage game={selectedGame} onClose={() => setSelectedGame(null)} />
        </div>
      )}
    </div>
  );
}