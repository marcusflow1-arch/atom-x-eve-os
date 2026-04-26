import { enhancedMockGameData } from './mockGameDetailData';
import { googlePlayGames } from './androidGamesData';

// Developer to Studio Mapping
export const developerStudioMap = {
  // AAA Publishers & Studios
  'capcom': { name: 'Capcom', type: 'Publisher/Developer', parent: null },
  'fromsoftware': { name: 'FromSoftware', type: 'Developer', parent: 'Bandai Namco' },
  'game_science': { name: 'Game Science', type: 'Developer', parent: null },
  'arrowhead': { name: 'Arrowhead Game Studios', type: 'Developer', parent: 'Sony Interactive' },
  'firaxis': { name: 'Firaxis Games', type: 'Developer', parent: '2K Games' },
  'warhorse_studios': { name: 'Warhorse Studios', type: 'Developer', parent: null },
  'pocketpair': { name: 'Pocketpair', type: 'Developer', parent: null },
  'dice': { name: 'DICE', type: 'Developer', parent: 'Electronic Arts' },
  'rockstar_games': { name: 'Rockstar Games', type: 'Publisher/Developer', parent: null },
  'cd_projekt_red': { name: 'CD Projekt Red', type: 'Developer', parent: 'CD Projekt' },
  'larian_studios': { name: 'Larian Studios', type: 'Developer', parent: null },
  'ubisoft_quebec': { name: 'Ubisoft Quebec', type: 'Developer', parent: 'Ubisoft' },
  'bungie': { name: 'Bungie', type: 'Developer', parent: 'Sony/Bungie' },
  'bethesda_game_studios': { name: 'Bethesda Game Studios', type: 'Developer', parent: 'Microsoft/ZeniMax' },
  'obsidian': { name: 'Obsidian Entertainment', type: 'Developer', parent: 'Microsoft' },
  'retro_studios': { name: 'Retro Studios', type: 'Developer', parent: 'Nintendo' },
  'mojang_studios': { name: 'Mojang Studios', type: 'Developer', parent: 'Microsoft' },
  'avalanche_software': { name: 'Avalanche Software', type: 'Developer', parent: 'Hogwarts Legacy' },
  'naughty_dog': { name: 'Naughty Dog', type: 'Developer', parent: 'Sony Interactive' },
  'insomniac_games': { name: 'Insomniac Games', type: 'Developer', parent: 'Sony Interactive' },
  'guerrilla_games': { name: 'Guerrilla Games', type: 'Developer', parent: 'Sony Interactive' },
  'sucker_punch': { name: 'Sucker Punch Productions', type: 'Developer', parent: 'Sony Interactive' },
  
  // Mobile & Indie
  'plarium': { name: 'Plarium Global Ltd', type: 'Developer', parent: null },
  'netease': { name: 'NetEase Games', type: 'Developer', parent: 'NetEase' },
  'roblox_corp': { name: 'Roblox Corporation', type: 'Developer', parent: null },
  'activision': { name: 'Activision Publishing', type: 'Developer', parent: 'Microsoft' },
  'niantic': { name: 'Niantic', type: 'Developer', parent: null },
  'supercell': { name: 'Supercell', type: 'Developer', parent: null },
  'tencent_games': { name: 'Tencent Games', type: 'Developer', parent: 'Tencent' },
  'garena': { name: 'Garena International', type: 'Developer', parent: 'Garena/Tencent' },
  'king': { name: 'King', type: 'Developer', parent: 'Activision Blizzard' },
  'dream_games': { name: 'Dream Games', type: 'Developer', parent: null },
  'miniclip': { name: 'Miniclip.com', type: 'Developer', parent: null },
  'igg': { name: 'IGG.COM', type: 'Developer', parent: 'IGG' },
  'playrix': { name: 'Playrix', type: 'Developer', parent: null },
  'peak_games': { name: 'Peak Games', type: 'Developer', parent: null },
  'hungry_studio': { name: 'Hungry Studio', type: 'Developer', parent: null },
  'everstone_studio': { name: 'Everstone Studio', type: 'Developer', parent: null },
  'hoyoverse': { name: 'HoYoverse', type: 'Developer', parent: null },
  'deepmind_studios': { name: 'DeepMind Studios', type: 'Developer', parent: 'Google/DeepMind' },
  'velocity_labs': { name: 'Velocity Labs', type: 'Developer', parent: null },
  'synth_logic': { name: 'Synth Logic', type: 'Developer', parent: null },
  'galactic_core': { name: 'Galactic Core', type: 'Developer', parent: null },
  'marvel_games': { name: 'Marvel Games', type: 'Developer', parent: 'Marvel/Disney' },
};

// Trending & Best Sellers 2024-2025
export const trendingGames = [
  {
    id: 'monster_hunter_wilds',
    title: 'Monster Hunter Wilds',
    description: 'The next evolution of hunting action. Track massive monsters across dynamic open environments.',
    price: 69.99,
    cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=800&fit=crop',
    genre: 'Action RPG',
    rating: 4.9,
    developer: 'Capcom',
    developerKey: 'capcom',
    releaseDate: '2025',
    tags: ['Co-Op', 'Open World', 'Monster Hunting']
  },
  {
    id: 'elden_ring_nightreign',
    title: 'Elden Ring: Nightreign',
    description: 'A new standalone experience in the Lands Between with roguelike elements and co-op action.',
    price: 49.99,
    cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=800&fit=crop',
    genre: 'Action RPG',
    rating: 4.8,
    developer: 'FromSoftware',
    developerKey: 'fromsoftware',
    releaseDate: '2025',
    tags: ['Souls-like', 'Co-Op', 'Fantasy']
  },
  {
    id: 'black_myth_wukong',
    title: 'Black Myth: Wukong',
    description: 'An action RPG rooted in Chinese mythology. Become the Destined One.',
    price: 59.99,
    cover_image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&h=800&fit=crop',
    genre: 'Action RPG',
    rating: 4.9,
    developer: 'Game Science',
    developerKey: 'game_science',
    releaseDate: '2024',
    tags: ['Mythology', 'Action', 'Single Player']
  },
  {
    id: 'helldivers_2',
    title: 'Helldivers 2',
    description: 'Spread managed democracy across the galaxy in this intense co-op shooter.',
    price: 39.99,
    cover_image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=600&h=800&fit=crop',
    genre: 'Shooter',
    rating: 4.7,
    developer: 'Arrowhead Game Studios',
    developerKey: 'arrowhead',
    releaseDate: '2024',
    tags: ['Co-Op', 'Third Person', 'Sci-Fi']
  },
  {
    id: 'civilization_7',
    title: 'Civilization VII',
    description: 'Build an empire to stand the test of time in this legendary strategy series.',
    price: 69.99,
    cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=800&fit=crop',
    genre: 'Strategy',
    rating: 4.8,
    developer: 'Firaxis Games',
    developerKey: 'firaxis',
    releaseDate: '2025',
    tags: ['4X', 'Turn-Based', 'Historical']
  },
  {
    id: 'kingdom_come_2',
    title: 'Kingdom Come: Deliverance II',
    description: 'Continue Henry\'s epic journey through medieval Bohemia in this realistic RPG.',
    price: 59.99,
    cover_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
    genre: 'RPG',
    rating: 4.6,
    developer: 'Warhorse Studios',
    developerKey: 'warhorse_studios',
    releaseDate: '2025',
    tags: ['Medieval', 'Realistic', 'Open World']
  },
  {
    id: 'palworld',
    title: 'Palworld',
    description: 'Catch, battle, and work alongside mysterious creatures called Pals.',
    price: 29.99,
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=800&fit=crop',
    genre: 'Survival',
    rating: 4.5,
    developer: 'Pocketpair',
    developerKey: 'pocketpair',
    releaseDate: '2024',
    tags: ['Survival', 'Crafting', 'Creatures']
  },
  {
    id: 'battlefield_6',
    title: 'Battlefield 6',
    description: 'Return to all-out warfare with massive battles and next-gen destruction.',
    price: 69.99,
    cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop',
    genre: 'FPS',
    rating: 4.4,
    developer: 'DICE',
    developerKey: 'dice',
    releaseDate: '2025',
    tags: ['Multiplayer', 'Warfare', 'Destruction']
  }
];

// New Releases December 2024 / 2025
export const newReleases = [
  {
    id: 'marvel_cosmic_invasion',
    title: 'Marvel Cosmic Invasion',
    description: 'Defend Earth from cosmic threats in this action-packed Marvel adventure.',
    price: 59.99,
    cover_image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&h=800&fit=crop',
    genre: 'Action',
    rating: 4.6,
    developer: 'Marvel Games',
    developerKey: 'marvel_games',
    releaseDate: '2025',
    tags: ['Superhero', 'Action', 'Co-Op']
  },
  {
    id: 'metroid_prime_4',
    title: 'Metroid Prime 4: Beyond',
    description: 'Samus returns in an epic new first-person adventure across alien worlds.',
    price: 59.99,
    cover_image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=800&fit=crop',
    genre: 'Action Adventure',
    rating: 4.9,
    developer: 'Retro Studios',
    developerKey: 'retro_studios',
    releaseDate: '2025',
    tags: ['Sci-Fi', 'Exploration', 'First Person']
  },
  {
    id: 'assassins_creed_shadows',
    title: 'Assassin\'s Creed Shadows',
    description: 'Experience feudal Japan as both a shinobi and a legendary samurai.',
    price: 69.99,
    cover_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
    genre: 'Action RPG',
    rating: 4.7,
    developer: 'Ubisoft Quebec',
    developerKey: 'ubisoft_quebec',
    releaseDate: '2025',
    tags: ['Japan', 'Stealth', 'Open World']
  },
  {
    id: 'avowed',
    title: 'Avowed',
    description: 'A first-person fantasy RPG set in the world of Pillars of Eternity.',
    price: 69.99,
    cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=800&fit=crop',
    genre: 'RPG',
    rating: 4.5,
    developer: 'Obsidian Entertainment',
    developerKey: 'obsidian',
    releaseDate: '2025',
    tags: ['Fantasy', 'First Person', 'Choices Matter']
  },
  {
    id: 'destiny_2_renegades',
    title: 'Destiny 2: Renegades',
    description: 'The latest expansion brings new raids, weapons, and storylines.',
    price: 49.99,
    cover_image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=600&h=800&fit=crop',
    genre: 'Looter Shooter',
    rating: 4.4,
    developer: 'Bungie',
    developerKey: 'bungie',
    releaseDate: '2025',
    tags: ['MMO', 'Shooter', 'Sci-Fi']
  },
  {
    id: 'gta_6',
    title: 'Grand Theft Auto VI',
    description: 'Return to Vice City in the most ambitious open world game ever made.',
    price: 69.99,
    cover_image: 'https://images.unsplash.com/photo-1535378437327-b71494669e91?w=600&h=800&fit=crop',
    genre: 'Action Adventure',
    rating: 4.9,
    developer: 'Rockstar Games',
    developerKey: 'rockstar_games',
    releaseDate: '2025',
    tags: ['Open World', 'Crime', 'Multiplayer']
  }
];

// Classic Best Sellers
export const classicBestSellers = [
  {
    id: 'minecraft',
    title: 'Minecraft',
    description: 'The best-selling game of all time. Build, explore, and survive in infinite worlds.',
    price: 29.99,
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=800&fit=crop',
    genre: 'Sandbox',
    rating: 4.9,
    developer: 'Mojang Studios',
    developerKey: 'mojang_studios',
    releaseDate: '2011',
    tags: ['Creative', 'Survival', 'Multiplayer']
  },
  {
    id: 'hogwarts_legacy',
    title: 'Hogwarts Legacy',
    description: 'Live the unwritten. Experience Hogwarts in the 1800s.',
    price: 59.99,
    cover_image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&h=800&fit=crop',
    genre: 'Action RPG',
    rating: 4.7,
    developer: 'Avalanche Software',
    developerKey: 'avalanche_software',
    releaseDate: '2023',
    tags: ['Harry Potter', 'Magic', 'Open World']
  },
  {
    id: 'cyberpunk_2077',
    title: 'Cyberpunk 2077',
    description: 'An open-world action-adventure set in Night City, a megalopolis of power and glamour.',
    price: 59.99,
    cover_image: 'https://images.unsplash.com/photo-1535378437327-b71494669e91?w=600&h=800&fit=crop',
    genre: 'Action RPG',
    rating: 4.6,
    developer: 'CD Projekt Red',
    developerKey: 'cd_projekt_red',
    releaseDate: '2020',
    tags: ['Cyberpunk', 'Open World', 'Story Rich']
  },
  {
    id: 'baldurs_gate_3',
    title: 'Baldur\'s Gate 3',
    description: 'Gather your party and return to the Forgotten Realms in this epic RPG.',
    price: 59.99,
    cover_image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&h=800&fit=crop',
    genre: 'RPG',
    rating: 4.9,
    developer: 'Larian Studios',
    developerKey: 'larian_studios',
    releaseDate: '2023',
    tags: ['D&D', 'Turn-Based', 'Co-Op']
  }
];

// AI Enhanced Games
export const aiGamesList = [
  {
    id: 'ai_dungeon_master',
    title: 'AI Dungeon Master',
    description: 'Infinite adventures powered by advanced AI storytelling. Every playthrough is unique.',
    price: 39.99,
    cover_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
    genre: 'RPG',
    rating: 4.9,
    aiEnhanced: true,
    developer: 'DeepMind Studios',
    developerKey: 'deepmind_studios',
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
    developer: 'Velocity Labs',
    developerKey: 'velocity_labs',
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
    developer: 'Synth Logic',
    developerKey: 'synth_logic',
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
    developer: 'Galactic Core',
    developerKey: 'galactic_core',
    releaseDate: '2025',
    tags: ['Space', 'RTS', 'Sci-Fi']
  }
];

export const androidGames = [
  {
    id: 'genshin_impact',
    title: 'Genshin Impact',
    description: 'An open-world action RPG with stunning visuals and engaging combat. Explore the magical world of Teyvat.',
    genre: 'RPG',
    price: 0,
    rating: 4.7,
    reviews: 2500000,
    cover_image: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'PC', 'PlayStation', 'iOS'],
    developer: 'HoYoverse',
    developerKey: 'hoyoverse',
    isMobile: true,
    aiEnhanced: true,
    original_year: 2020
  },
  {
    id: 'pubg_mobile',
    title: 'PUBG Mobile',
    description: 'Battle royale shooter where 100 players fight to be the last one standing on a massive island.',
    genre: 'Shooter',
    price: 0,
    rating: 4.3,
    reviews: 5000000,
    cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'iOS'],
    developer: 'Tencent Games',
    developerKey: 'tencent_games',
    isMobile: true,
    original_year: 2018
  },
  {
    id: 'cod_mobile',
    title: 'Call of Duty: Mobile',
    description: 'The iconic FPS franchise comes to mobile with intense multiplayer action and battle royale modes.',
    genre: 'Shooter',
    price: 0,
    rating: 4.5,
    reviews: 3200000,
    cover_image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'iOS'],
    developer: 'Activision Publishing',
    developerKey: 'activision',
    isMobile: true,
    original_year: 2019
  },
  {
    id: 'minecraft_mobile',
    title: 'Minecraft',
    description: 'Build, explore, and survive in infinite blocky worlds. Cross-platform play with PC and console.',
    genre: 'Survival',
    price: 6.99,
    rating: 4.6,
    reviews: 4500000,
    cover_image: 'https://images.unsplash.com/photo-1627850604058-52e40de1b847?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1627850604058-52e40de1b847?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'PC', 'Xbox', 'PlayStation', 'iOS'],
    developer: 'Mojang Studios',
    developerKey: 'mojang_studios',
    isMobile: true,
    original_year: 2011
  },
  {
    id: 'stardew_valley_mobile',
    title: 'Stardew Valley',
    description: 'Relax and build your dream farm in this beloved indie farming simulator RPG.',
    genre: 'Simulation',
    price: 4.99,
    rating: 4.8,
    reviews: 850000,
    cover_image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'PC', 'Switch', 'iOS'],
    developer: 'ConcernedApe',
    developerKey: null,
    isMobile: true,
    original_year: 2016
  },
  {
    id: 'among_us_mobile',
    title: 'Among Us',
    description: 'Social deduction game where crewmates must identify impostors before it\'s too late.',
    genre: 'Puzzle',
    price: 0,
    rating: 4.2,
    reviews: 1800000,
    cover_image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'PC', 'Switch', 'iOS'],
    developer: 'Innersloth',
    developerKey: null,
    isMobile: true,
    original_year: 2018
  },
  {
    id: 'brawlhalla_mobile',
    title: 'Brawlhalla',
    description: 'Free-to-play platform fighting game with cross-play. Battle with friends across all platforms.',
    genre: 'Fighting',
    price: 0,
    rating: 4.4,
    reviews: 950000,
    cover_image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'PC', 'Xbox', 'PlayStation', 'Switch', 'iOS'],
    developer: 'Blue Mammoth Games',
    developerKey: null,
    isMobile: true,
    original_year: 2017
  },
  {
    id: 'terraria_mobile',
    title: 'Terraria',
    description: 'Dig, fight, explore, build! The classic 2D sandbox adventure on mobile.',
    genre: 'Adventure',
    price: 4.99,
    rating: 4.6,
    reviews: 720000,
    cover_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'PC', 'Xbox', 'PlayStation', 'Switch', 'iOS'],
    developer: 'Re-Logic',
    developerKey: null,
    isMobile: true,
    original_year: 2011
  },
  {
    id: 'dead_cells_mobile',
    title: 'Dead Cells',
    description: 'Rogue-lite action platformer with brutal combat and stunning pixel art.',
    genre: 'Action',
    price: 8.99,
    rating: 4.7,
    reviews: 420000,
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'PC', 'Switch', 'iOS'],
    developer: 'Motion Twin',
    developerKey: null,
    isMobile: true,
    original_year: 2018
  },
  {
    id: 'asphalt_9',
    title: 'Asphalt 9: Legends',
    description: 'Arcade racing at its finest with stunning graphics and hypercars.',
    genre: 'Racing',
    price: 0,
    rating: 4.5,
    reviews: 3800000,
    cover_image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'iOS', 'PC'],
    developer: 'Gameloft',
    developerKey: null,
    isMobile: true,
    original_year: 2018
  },
  {
    id: 'honkai_star_rail',
    title: 'Honkai: Star Rail',
    description: 'Space fantasy RPG with turn-based combat and epic storylines.',
    genre: 'RPG',
    price: 0,
    rating: 4.6,
    reviews: 1200000,
    cover_image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'iOS', 'PC'],
    developer: 'HoYoverse',
    developerKey: 'hoyoverse',
    isMobile: true,
    aiEnhanced: true,
    original_year: 2023
  },
  {
    id: 'mobile_legends',
    title: 'Mobile Legends: Bang Bang',
    description: '5v5 MOBA with fast-paced action and strategic team battles.',
    genre: 'Strategy',
    price: 0,
    rating: 4.3,
    reviews: 6000000,
    cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=1200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&h=1080&fit=crop',
    platforms: ['Android', 'iOS'],
    developer: 'Moonton Games',
    developerKey: null,
    isMobile: true,
    original_year: 2016
  }
];

export const otherSampleGames = [...trendingGames, ...newReleases, ...classicBestSellers];

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
  ...[...aiGamesList, ...otherSampleGames, ...googlePlayGames].reduce((acc, game) => {
    // Merge with detailed data if it exists, otherwise use the basic data
    acc[game.id] = { ...game, ...(enhancedMockGameData[game.id] || {}) };
    return acc;
  }, {})
};