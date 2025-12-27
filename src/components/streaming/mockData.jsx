export const MOCK_STREAMERS = [
  {
    id: '1',
    username: 'NeonRider',
    tagline: "Exploring the darkest corners of cyberpunk lore.",
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
    intro_video_url: 'https://cdn.coverr.co/videos/coverr-person-typing-on-a-computer-keyboard-4643/1080p.mp4',
    bio_short: "I explore the darkest corners of cyberpunk lore so you don't have to.",
    context_disclaimer: "I roleplay a Netrunner on stream, but I'm just a history nerd IRL.",
    stream_focus: 'Lore Focused',
    tags: ['RPG', 'Story', 'Cyberpunk'],
    followers: 12500,
    games_played: ['Cyberpunk 2088', 'Deus Ex', 'Shadowrun'],
    is_live: true,
    category: 'rpg',
    season_pass_progress: 45,
    perks: [
      { type: 'XP Boost', value: '+10%' },
      { type: 'Drop Rate', value: '+5%' }
    ]
  },
  {
    id: '2',
    username: 'CardWhiz',
    tagline: "Hunting the rarest 1% drop rate cards.",
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    intro_video_url: 'https://cdn.coverr.co/videos/coverr-playing-cards-on-a-table-5388/1080p.mp4',
    bio_short: "Hunting the rarest 1% drop rate cards in every MMO.",
    context_disclaimer: "My reaction to rare drops is 100% genuine panic.",
    stream_focus: 'Card Collector',
    tags: ['MMO', 'Economy', 'Gacha'],
    followers: 8900,
    games_played: ['Elder Scrolls Online', 'Destiny 2', 'Genshin Impact'],
    is_live: false,
    category: 'card',
    season_pass_progress: 20,
    perks: [
      { type: 'Card Luck', value: '+2%' }
    ]
  },
  {
    id: '3',
    username: 'RetroDave',
    tagline: "Preserving gaming history one pixel at a time.",
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    intro_video_url: 'https://cdn.coverr.co/videos/coverr-arcade-game-machine-4286/1080p.mp4',
    bio_short: "Preserving gaming history one pixel at a time.",
    context_disclaimer: "",
    stream_focus: 'Indie Discovery',
    tags: ['Retro', 'Classics', 'Emulator'],
    followers: 4500,
    games_played: ['Chrono Trigger', 'Earthbound', 'Final Fantasy VI'],
    is_live: true,
    category: 'retro',
    season_pass_progress: 80,
    perks: [
      { type: 'Nostalgia', value: 'Max' }
    ]
  },
  {
    id: '4',
    username: 'TacticalAce',
    tagline: "Ex-pro coach teaching you how to win.",
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
    intro_video_url: 'https://cdn.coverr.co/videos/coverr-person-playing-a-video-game-with-a-controller-5396/1080p.mp4',
    bio_short: "Ex-pro coach teaching you how to stop panicking in 1v1s.",
    context_disclaimer: "I yell calls in game, but I'm super chill in chat.",
    stream_focus: 'Competitive',
    tags: ['FPS', 'Ranked', 'Coaching'],
    followers: 22000,
    games_played: ['Valorant', 'CS2', 'Overwatch 2'],
    is_live: true,
    category: 'fps',
    season_pass_progress: 10,
    perks: [
      { type: 'Aim Boost', value: '+5%' }
    ]
  },
  {
    id: '5',
    username: 'CozyBuilder',
    tagline: "Building dream homes and relaxing vibes.",
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
    intro_video_url: 'https://cdn.coverr.co/videos/coverr-person-drawing-on-a-digital-tablet-5392/1080p.mp4',
    bio_short: "Building dream homes and relaxing vibes. Tea required.",
    context_disclaimer: "",
    stream_focus: 'Casual',
    tags: ['Creative', 'Building', 'Chill'],
    followers: 6700,
    games_played: ['Minecraft', 'Sims 4', 'Stardew Valley'],
    is_live: false,
    category: 'indie',
    season_pass_progress: 60,
    perks: [
      { type: 'Relaxation', value: '100%' }
    ]
  }
];

export const MOCK_GAMES = [
  { id: 'game1', title: 'Cyberpunk 2088', viewers: '125K', genre: 'RPG', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop' },
  { id: 'game2', title: 'Elden Ring', viewers: '98K', genre: 'RPG', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop' },
  { id: 'game3', title: 'Valorant', viewers: '250K', genre: 'FPS', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=200&fit=crop' },
  { id: 'game4', title: 'Minecraft', viewers: '85K', genre: 'Sandbox', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=200&fit=crop' },
  { id: 'game5', title: 'Apex Legends', viewers: '110K', genre: 'FPS', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop' },
];