export const enhancedMockGameData = {
  'sample_1': {
    id: 'sample_1',
    title: 'Elder Scrolls: Oblivion',
    tagline: 'Live Another Life, in Another World',
    price: 59.99,
    originalPrice: 79.99,
    modes: ['Single Player', 'Multiplayer', 'Co-Op'],
    banner: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop',
    cover_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
    description: 'Step into the world of Oblivion and explore the vast empire of Tamriel. Make choices that shape the destiny of kingdoms in this epic open-world fantasy RPG. Experience one of gaming\'s most immersive worlds where every decision matters.',
    developer: 'Bethesda Game Studios',
    developerKey: 'bethesda_game_studios',
    publisher: 'Bethesda Softworks',
    releaseDate: '2024-03-15',
    genre: 'Fantasy RPG',
    rating: 4.8,
    reviewCount: 15420,
    requirements: {
      os: 'Windows 10 64-bit / macOS 10.15+',
      processor: 'Intel Core i5-8400 / AMD Ryzen 5 2600',
      memory: '16 GB RAM',
      graphics: 'NVIDIA GTX 1060 6GB / AMD RX 580',
      storage: '50 GB available space'
    },
    screenshots: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1542751371-331572b78519?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=450&fit=crop'
    ],
    achievements: [
      {
        id: 'ach_1',
        name: 'Dragon Slayer',
        description: 'Defeat the Ancient Dragon in its lair, proving your worth as a true hero.',
        rarity: 'Legendary',
        points: 100,
        icon: '🐉',
        unlocked: false
      },
      {
        id: 'ach_2',
        name: 'Master Thief',
        description: 'Successfully steal 1000 gold without being caught by any guard or citizen.',
        rarity: 'Epic',
        points: 75,
        icon: '🗡️',
        unlocked: true
      },
      {
        id: 'ach_3',
        name: 'Spell Weaver',
        description: 'Learn and master 50 different spells across all schools of magic.',
        rarity: 'Rare',
        points: 50,
        icon: '✨',
        unlocked: false
      },
      {
        id: 'ach_4',
        name: 'Explorer of Nirn',
        description: 'Discover all major locations and hidden secrets across the vast continent.',
        rarity: 'Epic',
        points: 90,
        icon: '🧭',
        unlocked: false
      }
    ],
    equipment: [
      {
        id: 'eq_1',
        name: 'Dragonscale Armor',
        type: 'Armor',
        rarity: 'Legendary',
        stats: { defense: 250, magic_resist: 100 },
        description: 'Forged from the scales of an ancient dragon, offering unparalleled protection against both physical and magical threats.',
        model: 'armor_01.glb' // Placeholder model name
      },
      {
        id: 'eq_2',
        name: 'Ebony Blade',
        type: 'Weapon',
        rarity: 'Epic',
        stats: { attack: 180, speed: 85 },
        description: 'A cursed blade that grows stronger with each kill, whispering dark promises to its wielder. Known for its deadly sharpness and speed.',
        model: 'sword_01.glb' // Placeholder model name
      },
      {
        id: 'eq_3',
        name: 'Amulet of Kings',
        type: 'Accessory',
        rarity: 'Legendary',
        stats: { magic_resist: 150, health_regen: 5 },
        description: 'An ancient artifact once worn by emperors, granting immense protection and vitality.',
        model: 'amulet_01.glb'
      }
    ],
    abilities: [
      {
        id: 'ab_1',
        name: 'Dragonborn Shout',
        tier: 'Legendary',
        description: 'Unleash the ancient power of dragons with devastating shouts that can shatter mountains and turn the tide of battle.',
        cooldown: '60 seconds',
        effect: 'Massive area damage + knockdown',
        model: 'fireball.glb' // Placeholder model name for a magical effect
      },
      {
        id: 'ab_2',
        name: 'Shadow Step',
        tier: 'Epic',
        description: 'Teleport instantly to a nearby location, becoming invisible for a brief moment. Perfect for flanking enemies or making a quick escape.',
        cooldown: '15 seconds',
        effect: '+200% critical hit chance on next attack',
        model: 'teleport.glb' // Placeholder model name for a teleport effect
      },
      {
        id: 'ab_3',
        name: 'Divine Healing',
        tier: 'Rare',
        description: 'Channel divine energy to rapidly heal wounds and restore vitality to yourself or allies.',
        cooldown: '30 seconds',
        effect: 'Restores 50% max HP, removes all negative status effects',
        model: 'heal_spell.glb'
      }
    ],
    lootBoxes: [
      {
        id: 'loot_1',
        name: 'Elder Scrolls Legendary Box',
        price: 999,
        currency: 'AGP',
        contents: 'Guaranteed legendary item + 4 random items. Contains powerful artifacts and rare resources from Nirn, giving a significant advantage.',
        dropRates: {
          'Legendary': '15%',
          'Epic': '35%',
          'Rare': '40%',
          'Common': '10%'
        },
        model: 'treasure_chest.glb' // Placeholder model name
      }
    ]
  }
};