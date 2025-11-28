import { enhancedMockGameData } from './mockGameDetailData';

export const aiGames = [
  {
    id: 'ai_dungeon_master',
    title: 'AI Dungeon Master',
    description: 'Infinite adventures powered by advanced AI storytelling. Every playthrough is unique.',
    price: 39.99,
    cover_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
    genre: 'RPG',
    rating: 4.9,
    aiEnhanced: true,
    modes: ['Single Player', 'Co-Op'],
    developer: 'DeepMind Studios',
    releaseDate: '2024',
    tags: ['Story Rich', 'Choices Matter', 'Fantasy']
  },
  {
    id: 'neural_racing',
    title: 'Neural Racing Championship',
    description: 'AI opponents that learn and adapt to your driving style in real-time.',
    price: 49.99,
    cover_image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=600&h=800&fit=crop',
    genre: 'Racing',
    rating: 4.7,
    aiEnhanced: true,
    modes: ['Multiplayer', 'Single Player'],
    developer: 'Velocity Labs',
    releaseDate: '2024',
    tags: ['Simulation', 'Sports', 'Competitive']
  },
  {
    id: 'cyber_detective',
    title: 'Neon Noir: AI Detective',
    description: 'Solve generated crimes in a procedurally generated cyberpunk city.',
    price: 29.99,
    cover_image: 'https://images.unsplash.com/photo-1535378437327-b71494669e91?w=600&h=800&fit=crop',
    genre: 'Mystery',
    rating: 4.5,
    aiEnhanced: true,
    modes: ['Single Player'],
    developer: 'Synth Logic',
    releaseDate: '2023',
    tags: ['Cyberpunk', 'Investigation', 'Noir']
  },
  {
    id: 'stellar_conquest_ai',
    title: 'Stellar Conquest AI',
    description: 'Command fleets against a strategic AI that evolves with every battle.',
    price: 59.99,
    cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=800&fit=crop',
    genre: 'Strategy',
    rating: 4.8,
    aiEnhanced: true,
    modes: ['Single Player', 'Multiplayer'],
    developer: 'Galactic Core',
    releaseDate: '2025',
    tags: ['Space', 'RTS', 'Sci-Fi']
  }
];

export const otherSampleGames = [
  {
    id: 'sample_3',
    title: 'Half-Life: Reconstructed',
    description: 'The legendary FPS returns with AI-enhanced graphics and physics.',
    price: 39.99,
    genre: 'FPS',
    cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop',
    rating: 4.8,
    multiplayer: true,
    aiEnhanced: true,
    modes: ['Single Player', 'Multiplayer'],
    developer: 'Crowbar Collective',
    releaseDate: '2023',
    tags: ['Shooter', 'Classic', 'Action']
  },
  {
    id: 'sample_4',
    title: 'Medieval Legends',
    description: 'Epic medieval adventure with dynamic quests and kingdom building.',
    price: 29.99,
    genre: 'RPG',
    cover_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
    rating: 4.6,
    multiplayer: false,
    modes: ['Single Player'],
    developer: 'Iron Helm Games',
    releaseDate: '2022',
    tags: ['Open World', 'Fantasy', 'Adventure']
  },
  {
    id: 'pixel_platformer',
    title: 'Super Pixel Jump',
    description: 'A challenging retro platformer with tight controls and 100+ levels.',
    price: 14.99,
    genre: 'Platformer',
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=800&fit=crop',
    rating: 4.4,
    multiplayer: false,
    modes: ['Single Player'],
    developer: 'Retro Bits',
    releaseDate: '2021',
    tags: ['Indie', '2D', 'Difficult']
  },
  {
    id: 'horror_mansion',
    title: 'Whispers in the Dark',
    description: 'Psychological horror game that uses your microphone to track your fear.',
    price: 24.99,
    genre: 'Horror',
    cover_image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&h=800&fit=crop',
    rating: 4.7,
    multiplayer: true,
    modes: ['Single Player', 'Co-Op'],
    developer: 'Nightmare Fuel',
    releaseDate: '2023',
    tags: ['Scary', 'First Person', 'Atmospheric']
  }
];

const testGameAlphaData = {
  id: 'test_game_alpha',
  title: 'Test Game Alpha',
  description: 'A sample game to demonstrate library features, including achievements, equipment, and loot boxes.',
  genre: 'Testing',
  cover_image: 'https://images.unsplash.com/photo-1580234811497-9df7fd2f337e?w=600&h=800&fit=crop',
  price: 0,
  // Inherit rich details from a detailed game for demonstration purposes
  ...(enhancedMockGameData['sample_1'] || {})
};


// This combines all mock data into one object for easy lookup
export const allMockGames = {
  ...enhancedMockGameData,
  'test_game_alpha': testGameAlphaData, // Add the test game to the global mock object
  ...[...aiGames, ...otherSampleGames].reduce((acc, game) => {
    // Merge with detailed data if it exists, otherwise use the basic data
    acc[game.id] = { ...game, ...(enhancedMockGameData[game.id] || {}) };
    return acc;
  }, {})
};