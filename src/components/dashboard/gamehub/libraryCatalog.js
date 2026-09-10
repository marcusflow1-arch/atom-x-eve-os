const rows = [
  ['cyberpunk', 'Cyberpunk 2088', 'RPG / Action', '1550745165-9bc0b252726f', 'Playing', 72, '48.2h', '18/50', 'Navigate a dystopian megacity as a mercenary outlaw pursuing the key to immortality.'],
  ['neon-legends', 'Neon Legends', 'Action / Brawler', '1511512578047-dfb367046420', 'In Progress', 45, '12.8h', '6/30', 'Battle across neon-lit arenas in fast-paced combat and dominate the online leaderboard.'],
  ['stellar-odyssey', 'Stellar Odyssey', 'Space Sim', '1614732414444-096e5f1122d5', 'Installed', 10, '3.1h', '2/40', 'Chart unexplored galaxies, build starships, and forge alliances across the cosmos.'],
  ['shadow-realm', 'Shadow Realm', 'Fantasy RPG', '1552820728-8b83bb6b773f', 'New', 0, '0h', '0/45', 'A dark fantasy epic where ancient gods clash and mortal heroes rise.'],
  ['apex-surge', 'Apex Surge', 'Battle Royale', '1542751371-adc38448a05e', 'Installed', 33, '20.5h', '9/25', 'Drop into high-stakes arenas where movement, teamwork, and smart loadouts win.'],
  ['mythforge', 'MythForge Online', 'MMORPG', '1493711662062-fa541adb3fc8', 'Playing', 88, '210h', '44/50', 'A living world of mythic quests, guild wars, crafting, raids, and evolving lore.'],
  ['dragon-siege', 'Dragon Siege', 'Strategy', '1484101403633-562f891dc89a', 'New', 5, '1.2h', '1/20', 'Command armies, manage resources, and build an empire across a war-torn continent.'],
  ['void-runner', 'Void Runner', 'Platformer', '1461988320302-91bde64fc8e4', 'Installed', 60, '8.4h', '12/30', 'Race through procedurally generated voids with fluid movement and precision platforming.'],
  ['iron-alliance', 'Iron Alliance', 'FPS / Tactical', '1608501078713-8e445a709b39', 'Installed', 20, '5.7h', '3/35', 'A team-based tactical shooter where communication and strategy win battles.'],
  ['nova-drift', 'Nova Drift', 'Arcade', '1506905925346-21bda4d32df4', 'New', 0, '0h', '0/15', 'A hyper-kinetic space shooter with a deep upgrade tree and endless survival.'],
  ['chrono-breach', 'Chrono Breach', 'Puzzle / Adventure', '1517077304055-6e89abbf09b0', 'Playing', 55, '14h', '10/28', 'Time-manipulation puzzles meet narrative adventure across fractured timelines.'],
  ['storm-knights', 'Storm Knights', 'Action RPG', '1518709268805-4e9042af2176', 'Installed', 40, '18.3h', '14/40', 'Hack-and-slash action RPG combat with deep loot and relentless boss encounters.'],
];
export const libraryCatalog = rows.map(([id, title, genre, photo, status, progress, playtime, achievements, description]) => ({ id, title, genre, status, progress, playtime, achievements, description, demo: true, thumb: `https://images.unsplash.com/photo-${photo}?w=160`, image: `https://images.unsplash.com/photo-${photo}?w=1200` }));