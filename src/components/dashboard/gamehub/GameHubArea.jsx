import React, { useState } from 'react';
import GameCarousel from './GameCarousel';
import GameDetailPanel from './GameDetailPanel';

const GAMES = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk 2088',
    genre: 'RPG / Action',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
    status: 'Playing',
    progress: 72,
    playtime: '48.2h',
    achievements: '18/50',
    description: 'Navigate a dystopian megacity as a mercenary outlaw pursuing the key to immortality. Every choice echoes through a fractured future.',
  },
  {
    id: 'neon-legends',
    title: 'Neon Legends',
    genre: 'Action / Brawler',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    status: 'In Progress',
    progress: 45,
    playtime: '12.8h',
    achievements: '6/30',
    description: 'Battle across neon-lit arenas in fast-paced combat. Unlock legendary fighters and dominate online leaderboards.',
  },
  {
    id: 'stellar-odyssey',
    title: 'Stellar Odyssey',
    genre: 'Space Sim',
    image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800',
    status: 'Installed',
    progress: 10,
    playtime: '3.1h',
    achievements: '2/40',
    description: 'Chart unexplored galaxies, build starships, and forge alliances with alien civilizations across the cosmos.',
  },
  {
    id: 'shadow-realm',
    title: 'Shadow Realm',
    genre: 'Fantasy RPG',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800',
    status: 'New',
    progress: 0,
    playtime: '0h',
    achievements: '0/45',
    description: 'A dark fantasy epic where ancient gods clash and mortal heroes rise. Shape the fate of a world on the edge of oblivion.',
  },
  {
    id: 'apex-surge',
    title: 'Apex Surge',
    genre: 'Battle Royale',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    status: 'Installed',
    progress: 33,
    playtime: '20.5h',
    achievements: '9/25',
    description: 'Drop into high-stakes arenas where only the most skilled survive. Craft your loadout and outsmart 99 rivals.',
  },
  {
    id: 'mythforge',
    title: 'MythForge Online',
    genre: 'MMORPG',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800',
    status: 'Playing',
    progress: 88,
    playtime: '210h',
    achievements: '44/50',
    description: 'A massive living world of mythic quests, guild wars, and ever-evolving lore. Your legend is never finished.',
  },
];

export default function GameHubArea() {
  const [selectedGame, setSelectedGame] = useState(GAMES[0]);

  return (
    <div
      className="flex gap-5 h-full"
      style={{ minHeight: 0 }}
    >
      {/* LEFT — 60% — Game Carousel */}
      <div
        className="flex flex-col"
        style={{
          width: '60%',
          minWidth: 0,
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <GameCarousel
          games={GAMES}
          selectedGame={selectedGame}
          onSelectGame={setSelectedGame}
        />
      </div>

      {/* RIGHT — 40% — Game Detail Panel */}
      <div
        className="flex flex-col"
        style={{
          width: '40%',
          minWidth: 0,
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}
      >
        <GameDetailPanel game={selectedGame} />
      </div>
    </div>
  );
}