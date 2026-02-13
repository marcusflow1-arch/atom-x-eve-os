// Shared developer spotlight mock data
export const DEV_SPOTLIGHT_DATA = [
  {
    id: 'dev-1',
    name: 'Neon Dreams Studio',
    logo: 'https://i.pravatar.cc/80?u=neon-dreams',
    description: 'Innovative cyberpunk action games with cutting-edge visuals.',
    games: [
      {
        id: 'game-1',
        title: 'Cyber Protocol 2.0',
        genre: 'Action RPG',
        cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop',
        year: 2025,
        cards: [
          { id: 'c1', name: 'Neon Viper Blade', rarity: 'Legendary', type: 'Equipment', icon: '⚔️', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200', tag: 'Season 3', price: '19.99 AGP', description: 'A plasma-edged katana forged in the underbelly of Neo Tokyo.', stats: { Attack: 95, Speed: '+40%', Crit: '18%' } },
          { id: 'c2', name: 'Quantum Shield Mk.IV', rarity: 'Epic', type: 'Equipment', icon: '🛡️', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200', tag: 'New Release', price: '12.99 AGP', description: 'Nano-tech barrier that absorbs incoming projectiles.', stats: { Defense: 78, Duration: '8s', Absorb: '40%' } },
          { id: 'c3', name: 'Overclock Surge', rarity: 'Rare', type: 'Ability', icon: '⚡', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200', tag: 'Limited', price: '7.99 AGP', description: 'Boost processing speed to superhuman levels.', stats: { Speed: '+300%', Duration: '3s', Cooldown: '20s' } },
        ]
      },
      {
        id: 'game-2',
        title: 'Neon Legends Online',
        genre: 'MMO',
        cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop',
        year: 2024,
        cards: [
          { id: 'c4', name: 'Street Samurai Armor', rarity: 'Epic', type: 'Equipment', icon: '🥷', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200', tag: 'Event Drop', price: '14.99 AGP', description: 'Stealth-enhanced combat armor for the urban warrior.', stats: { Defense: 65, Stealth: '+50%', Speed: '+15%' } },
          { id: 'c5', name: 'Hologram Decoy', rarity: 'Rare', type: 'Ability', icon: '👤', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200', tag: 'New', price: '6.99 AGP', description: 'Deploy a convincing holographic copy to distract enemies.', stats: { Duration: '5s', Cooldown: '15s', Range: 'Medium' } },
        ]
      }
    ]
  },
  {
    id: 'dev-2',
    name: 'Ancient Lore Studios',
    logo: 'https://i.pravatar.cc/80?u=ancient-lore',
    description: 'Renowned for deep RPGs with rich storytelling and vast worlds.',
    games: [
      {
        id: 'game-3',
        title: 'Elden Ring: Nightreign',
        genre: 'Action RPG',
        cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=400&fit=crop',
        year: 2026,
        cards: [
          { id: 'c6', name: 'Voidtech Slayer', rarity: 'Legendary', type: 'Ability', icon: '⚔️', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200', tag: 'Season 3', price: '24.99 AGP', description: 'A devastating attack that rips through dimensional barriers.', stats: { Power: 95, Cooldown: '12s', Range: 'Medium' } },
          { id: 'c7', name: 'Dragon\'s Breath', rarity: 'Legendary', type: 'Ability', icon: '🔥', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200', tag: 'Season 4', price: '29.99 AGP', description: 'Unleash the fury of an ancient dragon.', stats: { Power: 120, Area: 'Large', Burn: '6s' } },
          { id: 'c8', name: 'Arcane Surge', rarity: 'Rare', type: 'Passive', icon: '✨', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200', tag: 'Available', price: '8.99 AGP', description: 'Channel the Weave to amplify magical abilities.', stats: { Bonus: '+25%', Stack: '5x', Duration: '10s' } },
        ]
      }
    ]
  },
  {
    id: 'dev-3',
    name: 'Starfield Interactive',
    logo: 'https://i.pravatar.cc/80?u=starfield-int',
    description: 'Space simulation pioneers crafting immersive galactic experiences.',
    games: [
      {
        id: 'game-4',
        title: 'Stellar Odyssey',
        genre: 'Space Sim',
        cover: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=400&fit=crop',
        year: 2025,
        cards: [
          { id: 'c9', name: 'Warp Drive Module', rarity: 'Epic', type: 'Equipment', icon: '🚀', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200', tag: 'Update 2.1', price: '15.99 AGP', description: 'Experimental FTL drive for rapid system traversal.', stats: { Speed: '+500%', Range: 'Galactic', Fuel: 'High' } },
          { id: 'c10', name: 'Nebula Shield', rarity: 'Rare', type: 'Equipment', icon: '🌌', image: 'https://images.unsplash.com/photo-1505356829705-eb8b8f2d57c7?w=200', tag: 'Free Update', price: 'Free', description: 'Energy barrier infused with nebula particles.', stats: { Defense: 55, Regen: '3%/s', Duration: '12s' } },
        ]
      }
    ]
  },
  {
    id: 'dev-4',
    name: 'Quantum Forge',
    logo: 'https://i.pravatar.cc/80?u=quantum-forge',
    description: 'Indie studio specializing in unique co-op and procedural experiences.',
    games: [
      {
        id: 'game-5',
        title: 'Void Runners',
        genre: 'Roguelike',
        cover: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=400&fit=crop',
        year: 2025,
        cards: [
          { id: 'c11', name: 'Void-Forged Mech', rarity: 'Legendary', type: 'Companion', icon: '🤖', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200', tag: 'Limited', price: '22.99 AGP', description: 'A sentient mech forged in the void between dimensions.', stats: { Power: 88, HP: 500, Ability: 'Void Slam' } },
          { id: 'c12', name: 'Phase Dagger', rarity: 'Epic', type: 'Equipment', icon: '🗡️', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200', tag: 'New', price: '11.99 AGP', description: 'Phases through shields to strike the target directly.', stats: { Attack: 72, Penetration: '100%', Speed: 'Fast' } },
        ]
      }
    ]
  }
];