import { Sword, Shield, Car, Cpu, Zap } from 'lucide-react';

/**
 * Per-game progress data — each game has its own unique stats, quests,
 * equipment, abilities, and friends. This is mock data that will eventually
 * be replaced by the Cards backend (single source of truth) once the plan
 * is upgraded. Card-derived data (equipment, abilities, achievements) only
 * applies to the user — friends show their own separate progress.
 */
export const GAME_DATA = {
  cyberpunk: {
    progress: 62,
    storyAct: 'Act 2',
    storyChapter: 'Ghost Town',
    objective: 'Meet Panam at Sunset Motel',
    level: 43,
    genreLevel: 7,
    genreLabel: 'RPG',
    combatStyle: 'Solo',
    playtime: '24.5h',
    achievements: '217 / 320',
    achievementPct: 68,
    nextAchievement: { name: 'Complete every NCPD Scanner', pct: 83 },
    equipment: [
      { label: 'Equipped Weapon', value: 'Overwatch', icon: Sword },
      { label: 'Armor Set', value: 'Nomad Jacket', icon: Shield },
      { label: 'Vehicle', value: 'Type-66 "Hoon"', icon: Car },
      { label: 'Cyberware', value: '8 Installed', icon: Cpu },
    ],
    abilities: [
      { name: 'Sandevistan', desc: 'Slow time for 6 seconds', cooldown: '30s', rank: 5 },
      { name: 'Quick Hack', desc: 'Hack an enemy device remotely', cooldown: '12s', rank: 5 },
      { name: 'Double Jump', desc: 'Jump again mid-air', cooldown: 'Passive', rank: 2 },
      { name: 'Optical Camo', desc: 'Become invisible briefly', cooldown: '45s', rank: 4 },
    ],
    quests: {
      active: [
        {
          id: 'ghost-town',
          title: 'Ghost Town',
          giver: 'Panam',
          difficulty: 3,
          status: 'tracking',
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
          description: 'Panam has agreed to help. Travel to Sunset Motel and meet her there.',
          objective: 'Meet Panam at Sunset Motel',
          rewards: [
            { type: 'xp', label: '850 XP' },
            { type: 'weapon', label: 'Overwatch' },
            { type: 'money', label: '€$2,400' },
          ],
        },
      ],
      available: [
        {
          id: 'highwayman',
          title: 'The Highwayman',
          giver: 'Rogue',
          difficulty: 2,
          image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
          description: 'A mysterious figure is causing trouble on the outskirts. Investigate and report back.',
          objective: 'Investigate the Highwayman sightings',
          rewards: [
            { type: 'xp', label: '600 XP' },
            { type: 'money', label: '€$1,200' },
          ],
        },
        {
          id: 'beat-on-the-brat',
          title: 'Beat on the Brat',
          giver: 'Coach Fred',
          difficulty: 4,
          image: null,
          description: 'Prove yourself in the underground boxing ring. Win 3 consecutive fights.',
          objective: 'Win 3 boxing matches',
          rewards: [
            { type: 'xp', label: '1,200 XP' },
            { type: 'weapon', label: 'Legendary Knuckles' },
          ],
        },
      ],
    },
    friends: [
      { name: 'Marcus', avatar: 'https://i.pravatar.cc/100?u=marcus', detail: 'Act 3', status: 'online' },
      { name: 'James', avatar: 'https://i.pravatar.cc/100?u=james', detail: 'Level 51', status: 'online' },
      { name: 'Sarah', avatar: 'https://i.pravatar.cc/100?u=sarah', detail: 'Finished Story', status: 'online' },
    ],
  },

  'neon-legends': {
    progress: 35,
    storyAct: 'Chapter 4',
    storyChapter: 'The Underground Arena',
    objective: 'Defeat the champion brawler',
    level: 28,
    genreLevel: 4,
    genreLabel: 'Action',
    combatStyle: 'Brawler',
    playtime: '12.3h',
    achievements: '89 / 150',
    achievementPct: 59,
    nextAchievement: { name: 'Win 50 ranked matches', pct: 42 },
    equipment: [
      { label: 'Equipped Weapon', value: 'Plasma Gauntlets', icon: Sword },
      { label: 'Armor Set', value: 'Street Fighter Vest', icon: Shield },
      { label: 'Vehicle', value: 'Hover Bike', icon: Car },
      { label: 'Augments', value: '5 Installed', icon: Cpu },
    ],
    abilities: [
      { name: 'Rush Combo', desc: '3-hit rapid punch combo', cooldown: '6s', rank: 4 },
      { name: 'Ground Slam', desc: 'Slam the ground, knocking back enemies', cooldown: '15s', rank: 3 },
      { name: 'Dash Strike', desc: 'Dash forward with a strike', cooldown: '8s', rank: 3 },
      { name: 'Adrenaline', desc: 'Temporarily boost attack speed', cooldown: '40s', rank: 2 },
    ],
    quests: {
      active: [
        {
          id: 'arena-champ',
          title: 'Champion of the Pit',
          giver: 'Duke',
          difficulty: 4,
          status: 'tracking',
          image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
          description: 'You have earned a shot at the champion. Train and prepare for the toughest fight of your life.',
          objective: 'Defeat the Arena Champion',
          rewards: [
            { type: 'xp', label: '2,000 XP' },
            { type: 'weapon', label: 'Champion Belt' },
          ],
        },
      ],
      available: [
        {
          id: 'street-cred',
          title: 'Street Cred Challenge',
          giver: 'Mara',
          difficulty: 2,
          image: null,
          description: 'Build your reputation by completing street fights across the district.',
          objective: 'Win 5 street fights',
          rewards: [
            { type: 'xp', label: '500 XP' },
            { type: 'money', label: '§800' },
          ],
        },
      ],
    },
    friends: [
      { name: 'Alex', avatar: 'https://i.pravatar.cc/100?u=alex', detail: 'Chapter 6', status: 'online' },
      { name: 'Riley', avatar: 'https://i.pravatar.cc/100?u=riley', detail: 'Level 40', status: 'online' },
    ],
  },

  'stellar-odyssey': {
    progress: 18,
    storyAct: 'Sector 2',
    storyChapter: 'The Lost Colony',
    objective: 'Scan the derelict station for survivors',
    level: 15,
    genreLevel: 2,
    genreLabel: 'Simulation',
    combatStyle: 'Explorer',
    playtime: '6.1h',
    achievements: '34 / 200',
    achievementPct: 17,
    nextAchievement: { name: 'Visit 10 star systems', pct: 60 },
    equipment: [
      { label: 'Equipped Weapon', value: 'Mining Laser', icon: Sword },
      { label: 'Armor Set', value: 'EVA Suit', icon: Shield },
      { label: 'Vehicle', value: 'Starship Aurora', icon: Car },
      { label: 'Modules', value: '3 Installed', icon: Cpu },
    ],
    abilities: [
      { name: 'Warp Jump', desc: 'Instant short-range teleport', cooldown: '20s', rank: 2 },
      { name: 'Scan Pulse', desc: 'Reveal nearby resources', cooldown: '10s', rank: 3 },
      { name: 'Shield Boost', desc: 'Reinforce shields temporarily', cooldown: '30s', rank: 1 },
    ],
    quests: {
      active: [
        {
          id: 'lost-colony',
          title: 'The Lost Colony',
          giver: 'Commander Vex',
          difficulty: 3,
          status: 'tracking',
          image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400',
          description: 'A distress signal from a long-lost colony. Dock with the station and find survivors.',
          objective: 'Dock with the derelict station',
          rewards: [
            { type: 'xp', label: '1,500 XP' },
            { type: 'money', label: '¢4,000' },
          ],
        },
      ],
      available: [
        {
          id: 'asteroid-field',
          title: 'Asteroid Mining Run',
          giver: 'Guild Hall',
          difficulty: 1,
          image: null,
          description: 'Mine rare minerals from a nearby asteroid field for guild credits.',
          objective: 'Collect 50 rare minerals',
          rewards: [
            { type: 'xp', label: '400 XP' },
            { type: 'money', label: '¢1,200' },
          ],
        },
      ],
    },
    friends: [
      { name: 'Nova', avatar: 'https://i.pravatar.cc/100?u=nova', detail: 'Sector 4', status: 'online' },
    ],
  },

  'shadow-realm': {
    progress: 0,
    storyAct: 'Not Started',
    storyChapter: '—',
    objective: 'Begin your journey into the Shadow Realm',
    level: 1,
    genreLevel: 1,
    genreLabel: 'RPG',
    combatStyle: 'Adventurer',
    playtime: '0h',
    achievements: '0 / 280',
    achievementPct: 0,
    nextAchievement: { name: 'Complete the tutorial', pct: 0 },
    equipment: [
      { label: 'Equipped Weapon', value: 'Rusty Dagger', icon: Sword },
      { label: 'Armor Set', value: 'Traveler Clothes', icon: Shield },
      { label: 'Mount', value: 'None', icon: Car },
      { label: 'Relics', value: '0 Found', icon: Cpu },
    ],
    abilities: [
      { name: 'Basic Attack', desc: 'A simple strike', cooldown: 'Instant', rank: 1 },
    ],
    quests: {
      active: [],
      available: [
        {
          id: 'tutorial',
          title: 'Into the Shadows',
          giver: 'Elder Malachi',
          difficulty: 1,
          image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400',
          description: 'Your first steps into the Shadow Realm. Learn the basics of combat and exploration.',
          objective: 'Follow the Elder to the training grounds',
          rewards: [
            { type: 'xp', label: '100 XP' },
            { type: 'weapon', label: 'Apprentice Sword' },
          ],
        },
      ],
    },
    friends: [],
  },

  'apex-surge': {
    progress: 78,
    storyAct: 'Season 4',
    storyChapter: 'Ranked Climb',
    objective: 'Reach Platinum rank',
    level: 67,
    genreLevel: 8,
    genreLabel: 'Shooter',
    combatStyle: 'Sniper',
    playtime: '89.2h',
    achievements: '145 / 180',
    achievementPct: 81,
    nextAchievement: { name: 'Win 100 matches', pct: 92 },
    equipment: [
      { label: 'Equipped Weapon', value: 'Kraber .50-Cal', icon: Sword },
      { label: 'Armor Set', value: 'Legendary Shield', icon: Shield },
      { label: 'Vehicle', value: 'None', icon: Car },
      { label: 'Attachments', value: '6 Installed', icon: Cpu },
    ],
    abilities: [
      { name: 'Grapple', desc: 'Pull yourself to a location', cooldown: '15s', rank: 5 },
      { name: 'Smoke Screen', desc: 'Deploy a blinding smoke cloud', cooldown: '25s', rank: 4 },
      { name: 'Zipline', desc: 'Create a traversal line', cooldown: '45s', rank: 3 },
      { name: 'Care Package', desc: 'Call in high-tier loot', cooldown: '90s', rank: 5 },
    ],
    quests: {
      active: [
        {
          id: 'ranked-climb',
          title: 'The Platinum Push',
          giver: 'Daily Challenge',
          difficulty: 4,
          status: 'tracking',
          image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
          description: 'Climb the ranked ladder. Win matches and earn RP to reach Platinum.',
          objective: 'Earn 2,400 RP this season',
          rewards: [
            { type: 'xp', label: '3,000 XP' },
            { type: 'weapon', label: 'Trail Blazer Badge' },
          ],
        },
      ],
      available: [
        {
          id: 'daily-3-kills',
          title: 'Triple Threat',
          giver: 'Daily Challenge',
          difficulty: 2,
          image: null,
          description: 'Get 3 kills in a single match.',
          objective: '3 kills in one match',
          rewards: [
            { type: 'xp', label: '500 XP' },
          ],
        },
      ],
    },
    friends: [
      { name: 'Kai', avatar: 'https://i.pravatar.cc/100?u=kai', detail: 'Diamond', status: 'online' },
      { name: 'Zoe', avatar: 'https://i.pravatar.cc/100?u=zoe', detail: 'Gold', status: 'online' },
      { name: 'Dev', avatar: 'https://i.pravatar.cc/100?u=dev', detail: 'Plat', status: 'online' },
      { name: 'Mia', avatar: 'https://i.pravatar.cc/100?u=mia', detail: 'Silver', status: 'online' },
    ],
  },

  'mythforge': {
    progress: 45,
    storyAct: 'Expansion: The Rift',
    storyChapter: 'Forge of Eternity',
    objective: 'Collect 3 Rift Shards',
    level: 55,
    genreLevel: 6,
    genreLabel: 'MMORPG',
    combatStyle: 'Tank',
    playtime: '156.8h',
    achievements: '312 / 500',
    achievementPct: 62,
    nextAchievement: { name: 'Clear Mythic Dungeon', pct: 50 },
    equipment: [
      { label: 'Equipped Weapon', value: 'Bulwark of Ages', icon: Sword },
      { label: 'Armor Set', value: 'Titanplate (4/6)', icon: Shield },
      { label: 'Mount', value: 'Drake of the Rift', icon: Car },
      { label: 'Enchants', value: '7 Active', icon: Cpu },
    ],
    abilities: [
      { name: 'Shield Wall', desc: 'Reduce all damage by 80%', cooldown: '3min', rank: 5 },
      { name: 'Taunt', desc: 'Force enemies to attack you', cooldown: '8s', rank: 5 },
      { name: 'Ground Slam', desc: 'AoE knockdown', cooldown: '15s', rank: 4 },
      { name: 'Rally', desc: 'Heal nearby party members', cooldown: '45s', rank: 3 },
    ],
    quests: {
      active: [
        {
          id: 'rift-shards',
          title: 'The Forge of Eternity',
          giver: 'Archmage Thelan',
          difficulty: 5,
          status: 'tracking',
          image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400',
          description: 'The Rift is destabilizing. Collect 3 Rift Shards from the forge bosses to seal it.',
          objective: 'Collect 3 Rift Shards',
          rewards: [
            { type: 'xp', label: '10,000 XP' },
            { type: 'weapon', label: 'Riftforged Crown' },
          ],
        },
      ],
      available: [
        {
          id: 'dungeon-run',
          title: 'Mythic: Sunken Temple',
          giver: 'Dungeon Finder',
          difficulty: 5,
          image: null,
          description: 'Queue for the Mythic Sunken Temple. Rewards titan-grade loot.',
          objective: 'Clear the Sunken Temple (Mythic)',
          rewards: [
            { type: 'xp', label: '5,000 XP' },
            { type: 'weapon', label: 'Templar Gear Cache' },
          ],
        },
        {
          id: 'weekly-gathering',
          title: 'Weekly: Material Run',
          giver: 'Guild Master',
          difficulty: 2,
          image: null,
          description: 'Gather 200 mythril ore for the guild vault.',
          objective: 'Collect 200 Mythril Ore',
          rewards: [
            { type: 'xp', label: '2,000 XP' },
            { type: 'money', label: '◆500' },
          ],
        },
      ],
    },
    friends: [
      { name: 'Elena', avatar: 'https://i.pravatar.cc/100?u=elena', detail: 'Healer Lv.60', status: 'online' },
      { name: 'Garrett', avatar: 'https://i.pravatar.cc/100?u=garrett', detail: 'DPS Lv.58', status: 'online' },
      { name: 'Lyra', avatar: 'https://i.pravatar.cc/100?u=lyra', detail: 'Tank Lv.55', status: 'online' },
    ],
  },
};

/** Fallback data for unknown game IDs */
export const DEFAULT_GAME_DATA = {
  progress: 0,
  storyAct: 'Not Started',
  storyChapter: '—',
  objective: 'Begin your adventure',
  level: 1,
  genreLevel: 1,
  genreLabel: 'Game',
  combatStyle: '—',
  playtime: '0h',
  achievements: '0 / 0',
  achievementPct: 0,
  nextAchievement: { name: 'Start playing', pct: 0 },
  equipment: [
    { label: 'Equipped Weapon', value: '—', icon: Sword },
    { label: 'Armor Set', value: '—', icon: Shield },
    { label: 'Vehicle', value: '—', icon: Car },
    { label: 'Cyberware', value: '0', icon: Cpu },
  ],
  abilities: [],
  quests: { active: [], available: [] },
  friends: [],
};

export function getGameData(gameId) {
  return GAME_DATA[gameId] || DEFAULT_GAME_DATA;
}