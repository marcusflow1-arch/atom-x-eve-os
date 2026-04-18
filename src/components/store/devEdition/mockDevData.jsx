// Mock developer data for the Dev Studio section

export const MOCK_DEVELOPERS = [
  {
    id: 'dev_001',
    studio_name: 'NeonForge Studios',
    tagline: 'Crafting worlds one pixel at a time',
    bio: 'A solo indie developer with a passion for cyberpunk aesthetics and deep RPG systems. Building atmospheric experiences since 2018.',
    avatar_url: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=400&fit=crop',
    location: 'Tokyo, Japan',
    founded_year: 2018,
    team_size: 'Solo',
    verified: true,
    is_live: true,
    stream_title: 'Building the new AI boss fight system - come hang!',
    genres: ['Cyberpunk', 'RPG', 'Action'],
    tools: ['Unreal Engine 5', 'Blender', 'Substance Painter'],
    total_games: 4,
    total_cards: 28,
    followers: 14200,
    current_project: {
      title: 'Project SIGMA',
      description: 'A neon-soaked open-world RPG set in a dystopian megacity. Features a fully dynamic AI companion system and procedural mission generator.',
      status: 'Alpha',
      progress: 62,
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=300&fit=crop',
      expected_release: 'Q3 2026'
    },
    social_links: {
      twitter: 'https://twitter.com',
      youtube: 'https://youtube.com',
      twitch: 'https://twitch.tv',
      discord: 'https://discord.gg'
    },
    games: [
      {
        id: 'g1',
        title: 'Cyber Rift',
        genre: 'Action RPG',
        year: 2021,
        cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop',
        cards: [
          { id: 'c1', name: 'Ghost Protocol', rarity: 'Legendary', type: 'Ability', image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=200&h=280&fit=crop', tag: 'Dev Edition' },
          { id: 'c2', name: 'Neural Spike', rarity: 'Epic', type: 'Equipment', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=280&fit=crop', tag: 'Limited' },
          { id: 'c3', name: 'Chrome Runner', rarity: 'Rare', type: 'Companion', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=280&fit=crop', tag: 'Series 1' },
        ]
      },
      {
        id: 'g2',
        title: 'Void Protocol',
        genre: 'Sci-Fi Shooter',
        year: 2022,
        cover: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=400&fit=crop',
        cards: [
          { id: 'c4', name: 'Dark Matter', rarity: 'Mythic', type: 'Weapon', image: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=200&h=280&fit=crop', tag: 'Dev Edition' },
          { id: 'c5', name: 'Void Walker', rarity: 'Legendary', type: 'Ability', image: 'https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=200&h=280&fit=crop', tag: 'Series 1' },
        ]
      },
      {
        id: 'g3',
        title: 'Neon Drift',
        genre: 'Racing',
        year: 2023,
        cover: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=300&h=400&fit=crop',
        cards: [
          { id: 'c6', name: 'Speed Phantom', rarity: 'Epic', type: 'Equipment', image: 'https://images.unsplash.com/photo-1580654843061-8c90a9a2f9b2?w=200&h=280&fit=crop', tag: 'Limited' },
        ]
      },
      {
        id: 'g4',
        title: 'Echo Protocol',
        genre: 'Stealth',
        year: 2024,
        cover: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=300&h=400&fit=crop',
        cards: [
          { id: 'c7', name: 'Silent Blade', rarity: 'Rare', type: 'Weapon', image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=200&h=280&fit=crop', tag: 'Series 2' },
          { id: 'c8', name: 'Ghost Shroud', rarity: 'Epic', type: 'Ability', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=200&h=280&fit=crop', tag: 'Dev Edition' },
        ]
      },
    ],
    devlog: [
      { id: 'dl1', date: '2 days ago', title: 'New AI combat system demo', preview: 'Just finished the first pass on the adaptive enemy AI. Watch them flank, communicate, and retreat based on player behavior...', type: 'update' },
      { id: 'dl2', date: '1 week ago', title: 'World building stream recap', preview: 'We spent 4 hours live building the night market district. Community gave amazing feedback on the neon signage density...', type: 'stream' },
      { id: 'dl3', date: '2 weeks ago', title: 'Card design process - Mythic tier', preview: 'Showing my process for designing the Mythic tier cards. Each one takes about 3 days of iteration...', type: 'design' },
    ]
  },
  {
    id: 'dev_002',
    studio_name: 'PixelForge Collective',
    tagline: 'Where retro meets the future',
    bio: 'A small indie collective making big-hearted games. We believe in pixel art, killer soundtracks, and mechanics that respect your time.',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&fit=crop',
    location: 'Berlin, Germany',
    founded_year: 2020,
    team_size: 'Indie (2-5)',
    verified: true,
    is_live: false,
    genres: ['Platformer', 'Puzzle', 'Retro'],
    tools: ['Unity', 'Aseprite', 'FMOD'],
    total_games: 3,
    total_cards: 19,
    followers: 8900,
    current_project: {
      title: 'Crystalia Chronicles',
      description: 'A hand-crafted metroidvania with deep lore, pixel-perfect platforming, and a fully orchestrated score.',
      status: 'Beta',
      progress: 81,
      image_url: 'https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=600&h=300&fit=crop',
      expected_release: 'Q2 2026'
    },
    social_links: {
      twitter: 'https://twitter.com',
      youtube: 'https://youtube.com',
      discord: 'https://discord.gg'
    },
    games: [
      {
        id: 'g5',
        title: 'Glitch Kingdom',
        genre: 'Platformer',
        year: 2021,
        cover: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=300&h=400&fit=crop',
        cards: [
          { id: 'c9', name: 'Pixel Knight', rarity: 'Legendary', type: 'Hero', image: 'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=200&h=280&fit=crop', tag: 'Dev Edition' },
          { id: 'c10', name: 'Glitch Sprite', rarity: 'Rare', type: 'Companion', image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=200&h=280&fit=crop', tag: 'Limited' },
        ]
      },
      {
        id: 'g6',
        title: 'Pixel Quest II',
        genre: 'RPG',
        year: 2022,
        cover: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=300&h=400&fit=crop',
        cards: [
          { id: 'c11', name: 'Crystal Mage', rarity: 'Epic', type: 'Ability', image: 'https://images.unsplash.com/photo-1518715308788-3005759c61d4?w=200&h=280&fit=crop', tag: 'Series 1' },
        ]
      },
      {
        id: 'g7',
        title: 'Neon Labyrinth',
        genre: 'Puzzle',
        year: 2023,
        cover: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=300&h=400&fit=crop',
        cards: [
          { id: 'c12', name: 'Maze Runner', rarity: 'Rare', type: 'Equipment', image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=200&h=280&fit=crop', tag: 'Limited' },
        ]
      }
    ],
    devlog: [
      { id: 'dl4', date: '3 days ago', title: 'Beta feedback session', preview: 'Thank you to everyone who played the beta! Here\'s what we\'re changing based on your feedback...', type: 'update' },
      { id: 'dl5', date: '1 week ago', title: 'Music composition timelapse', preview: 'Watch me compose the final boss theme from scratch in this 20-minute timelapse...', type: 'stream' },
    ]
  },
  {
    id: 'dev_003',
    studio_name: 'Axiom Games',
    tagline: 'Hardcore games for hardcore players',
    bio: 'Mid-size studio specializing in competitive multiplayer and deep strategy games. We\'ve shipped 8 titles and aren\'t slowing down.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop',
    location: 'Los Angeles, CA',
    founded_year: 2016,
    team_size: 'Small Studio (6-20)',
    verified: true,
    is_live: false,
    genres: ['Strategy', 'MMO', 'Competitive'],
    tools: ['Unreal Engine 5', 'Houdini', 'Perforce'],
    total_games: 8,
    total_cards: 45,
    followers: 31500,
    current_project: {
      title: 'AXIOM: Dominion',
      description: 'A 100-player competitive strategy MMO with real-time card-based combat. Your card collection directly impacts your in-game power.',
      status: 'In Development',
      progress: 44,
      image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=300&fit=crop',
      expected_release: 'Q1 2027'
    },
    social_links: {
      twitter: 'https://twitter.com',
      youtube: 'https://youtube.com',
      twitch: 'https://twitch.tv',
      discord: 'https://discord.gg',
      website: 'https://example.com'
    },
    games: [
      {
        id: 'g8',
        title: 'Warlords II',
        genre: 'Strategy',
        year: 2019,
        cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=400&fit=crop',
        cards: [
          { id: 'c13', name: 'Iron General', rarity: 'Mythic', type: 'Hero', image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=200&h=280&fit=crop', tag: 'Dev Edition' },
          { id: 'c14', name: 'Siege Titan', rarity: 'Legendary', type: 'Equipment', image: 'https://images.unsplash.com/photo-1601288496920-b6154fe3626a?w=200&h=280&fit=crop', tag: 'Series 1' },
          { id: 'c15', name: 'War Council', rarity: 'Epic', type: 'Ability', image: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=200&h=280&fit=crop', tag: 'Limited' },
        ]
      },
      {
        id: 'g9',
        title: 'Frontline Zero',
        genre: 'Tactical Shooter',
        year: 2021,
        cover: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=400&fit=crop',
        cards: [
          { id: 'c16', name: 'Shadow Ops', rarity: 'Legendary', type: 'Hero', image: 'https://images.unsplash.com/photo-1558618047-f7d98e4b0d23?w=200&h=280&fit=crop', tag: 'Dev Edition' },
        ]
      },
    ],
    devlog: [
      { id: 'dl6', date: '1 day ago', title: 'AXIOM: Dominion reveal trailer breakdown', preview: 'We go frame by frame through the reveal trailer and explain every mechanic you spotted...', type: 'update' },
      { id: 'dl7', date: '5 days ago', title: 'Q&A: How we design balanced card systems', preview: 'Our lead designer answers the top community questions about how card power is balanced against gameplay...', type: 'design' },
      { id: 'dl8', date: '2 weeks ago', title: 'Studio tour livestream', preview: 'Full 2-hour studio tour. See the dev floor, motion capture stage, and we answer questions live...', type: 'stream' },
    ]
  }
];