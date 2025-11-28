
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Coins, Swords, Rocket, Shield, Dices, Crosshair, Users, Target, Star, Trophy, Gift, Package } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const gameData = {
  "Elder Scrolls: Reborn": {
    genre: "fantasy",
    icon: <Shield className="w-4 h-4" />,
    cover: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop",
    quests: [
      { id: 'es1', title: 'Dragon Slayer', description: 'Defeat 3 dragons in Elder Scrolls: Reborn.', progress: 1, target: 3, reward: 500, type: 'combat' },
      { id: 'es2', title: 'Master Enchanter', description: 'Create 10 enchanted items at the Blacksmith.', progress: 3, target: 10, reward: 300, type: 'crafting' },
      { id: 'es3', title: 'Dungeon Master', description: 'Clear 5 dungeons without dying.', progress: 2, target: 5, reward: 400, type: 'exploration' }
    ],
    achievements: [
      { id: 'es_ach1', title: 'Dragonborn', description: 'Unlock your dragon heritage', rarity: 'Legendary', points: 250, icon: '🐉' },
      { id: 'es_ach2', title: 'Archmage', description: 'Master all schools of magic', rarity: 'Epic', points: 150, icon: '🔮' }
    ],
    rewards: [
      { name: 'Dragonscale Armor', type: 'Equipment', rarity: 'Legendary' },
      { name: 'Ancient Spellbook', type: 'Ability', rarity: 'Epic' },
      { name: 'Dragon Soul Gem', type: 'Material', rarity: 'Mythic' }
    ]
  },
  "Cyberpunk 2088": {
    genre: "sci-fi",
    icon: <Rocket className="w-4 h-4" />,
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop",
    quests: [
      { id: 'cp1', title: 'Cyber Ghost', description: 'Complete 5 stealth missions in Cyberpunk 2088.', progress: 2, target: 5, reward: 450, type: 'stealth' },
      { id: 'cp2', title: 'Data Miner', description: 'Hack 20 corporate terminals successfully.', progress: 15, target: 20, reward: 350, type: 'hacking' },
      { id: 'cp3', title: 'Neural Interface', description: 'Upgrade your cybernetic implants 3 times.', progress: 1, target: 3, reward: 600, type: 'upgrade' }
    ],
    achievements: [
      { id: 'cp_ach1', title: 'Ghost in Shell', description: 'Complete missions undetected', rarity: 'Epic', points: 175, icon: '👻' },
      { id: 'cp_ach2', title: 'Net Runner', description: 'Master the digital realm', rarity: 'Rare', points: 100, icon: '💻' }
    ],
    rewards: [
      { name: 'Stealth Implant', type: 'Augmentation', rarity: 'Epic' },
      { name: 'Hacking Suite', type: 'Software', rarity: 'Rare' },
      { name: 'Neural Processor', type: 'Hardware', rarity: 'Legendary' }
    ]
  },
  "Vanguard Ops": {
    genre: "action",
    icon: <Crosshair className="w-4 h-4" />,
    cover: "https://images.unsplash.com/photo-1581008685504-7a72d65b4338?w=100&h=100&fit=crop",
    quests: [
      { id: 'vo1', title: 'Combo Master', description: 'Execute 50 perfect combos in fighting games.', progress: 23, target: 50, reward: 200, type: 'combat' },
      { id: 'vo2', title: 'Adrenaline Rush', description: 'Win 10 matches without taking damage.', progress: 4, target: 10, reward: 500, type: 'skill' }
    ],
    achievements: [
      { id: 'vo_ach1', title: 'Headhunter', description: '100 consecutive headshots', rarity: 'Epic', points: 200, icon: '🎯' },
      { id: 'vo_ach2', title: 'Clutch King', description: 'Win impossible odds', rarity: 'Legendary', points: 300, icon: '👑' }
    ],
    rewards: [
      { name: 'Precision Scope', type: 'Weapon Mod', rarity: 'Epic' },
      { name: 'Combat Stims', type: 'Consumable', rarity: 'Rare' },
      { name: 'Tactical Gear', type: 'Equipment', rarity: 'Epic' }
    ]
  },
  "World of Eternity": {
    genre: "mmorpg",
    icon: <Users className="w-4 h-4" />,
    cover: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=100&h=100&fit=crop",
    quests: [
      { id: 'woe1', title: 'Guild Leader', description: 'Reach Officer rank in your clan.', progress: 1, target: 1, reward: 1000, type: 'social' },
      { id: 'woe2', title: 'Raid Commander', description: 'Successfully lead 5 raid groups.', progress: 2, target: 5, reward: 750, type: 'leadership' },
      { id: 'woe3', title: 'Trade Master', description: 'Complete 25 marketplace transactions.', progress: 18, target: 25, reward: 300, type: 'economic' }
    ],
    achievements: [
      { id: 'woe_ach1', title: 'World First', description: 'First to clear new content', rarity: 'Mythic', points: 500, icon: '🏆' },
      { id: 'woe_ach2', title: 'Loremaster', description: 'Discover all story secrets', rarity: 'Epic', points: 200, icon: '📚' }
    ],
    rewards: [
      { name: 'Guild Master Crown', type: 'Cosmetic', rarity: 'Legendary' },
      { name: 'Leadership Aura', type: 'Ability', rarity: 'Epic' },
      { name: 'Rare Mount', type: 'Mount', rarity: 'Epic' }
    ]
  },
  "Nexus Clash": {
    genre: "moba",
    icon: <Target className="w-4 h-4" />,
    cover: "https://images.unsplash.com/photo-1542751371-331572b78519?w=100&h=100&fit=crop",
    quests: [
      { id: 'nc1', title: 'World Explorer', description: 'Discover 15 hidden locations.', progress: 8, target: 15, reward: 400, type: 'exploration' },
      { id: 'nc2', title: 'Legendary Hero', description: 'Complete the main storyline in 2 MMORPGs.', progress: 1, target: 2, reward: 1500, type: 'story' },
      { id: 'nc3', title: 'Gear Master', description: 'Collect 5 legendary items from raids.', progress: 3, target: 5, reward: 800, type: 'collection' }
    ],
    achievements: [
      { id: 'nc_ach1', title: 'Pentakill', description: 'Eliminate 5 enemies rapidly', rarity: 'Legendary', points: 250, icon: '🖐️' },
      { id: 'nc_ach2', title: 'Support Master', description: 'Perfect team coordination', rarity: 'Epic', points: 150, icon: '❤️' }
    ],
    rewards: [
      { name: 'Champion Skin', type: 'Cosmetic', rarity: 'Legendary' },
      { name: 'Victory Emote', type: 'Emote', rarity: 'Epic' },
      { name: 'Team Buff', type: 'Ability', rarity: 'Rare' }
    ]
  }
};

const rarityColors = {
  'Common': 'text-slate-400',
  'Rare': 'text-blue-400',
  'Epic': 'text-purple-400',
  'Legendary': 'text-orange-400',
  'Mythic': 'text-red-400'
};

const typeIcons = {
  'combat': <Swords className="w-3 h-3" />,
  'stealth': <Shield className="w-3 h-3" />,
  'hacking': <Target className="w-3 h-3" />,
  'crafting': <Gift className="w-3 h-3" />,
  'exploration': <Star className="w-3 h-3" />,
  'social': <Users className="w-3 h-3" />,
  'leadership': <Trophy className="w-3 h-3" />,
  'economic': <Coins className="w-3 h-3" />,
  'story': <Shield className="w-3 h-3" />,
  'collection': <Package className="w-3 h-3" />,
  'skill': <Target className="w-3 h-3" />,
  'upgrade': <Rocket className="w-3 h-3" />
};

export default function GenreQuestBoard() {
  const [selectedGame, setSelectedGame] = useState('Elder Scrolls: Reborn');
  const [activeTab, setActiveTab] = useState('quests');

  const currentGame = gameData[selectedGame];

  const QuestItem = ({ quest }) => {
    const progressPercent = (quest.progress / quest.target) * 100;
    const isComplete = progressPercent >= 100;

    return (
      <div className="p-3 bevel-3d rounded-md hover:bg-slate-700/50 mb-2">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {typeIcons[quest.type]}
            <p className="font-bold text-white text-sm">{quest.title}</p>
          </div>
          <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
            <Coins className="w-3 h-3" />
            {quest.reward}
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-2">{quest.description}</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-900 rounded-full h-2 border border-slate-600">
            <div 
              className={`${isComplete ? 'bg-green-500' : 'bg-cyan-400'} h-full rounded-full transition-all duration-500`}
              style={{ width: `${progressPercent}%`}}
            ></div>
          </div>
          <span className="text-xs font-mono text-slate-400">{quest.progress}/{quest.target}</span>
        </div>
      </div>
    );
  };

  const AchievementItem = ({ achievement }) => (
    <div className="p-3 bevel-3d rounded-md hover:bg-slate-700/50 mb-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl">{achievement.icon}</div>
        <div className="flex-1">
          <p className="font-bold text-white text-sm">{achievement.title}</p>
          <p className={`text-xs font-semibold ${rarityColors[achievement.rarity]}`}>{achievement.rarity}</p>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 font-bold text-sm">{achievement.points} pts</div>
        </div>
      </div>
      <p className="text-xs text-slate-400">{achievement.description}</p>
    </div>
  );

  const RewardItem = ({ reward }) => (
    <div className="p-2 bevel-3d rounded-md hover:bg-slate-700/50 mb-2">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold text-white text-sm">{reward.name}</p>
          <p className="text-xs text-slate-400">{reward.type}</p>
        </div>
        <p className={`text-xs font-semibold ${rarityColors[reward.rarity]}`}>{reward.rarity}</p>
      </div>
    </div>
  );

  return (
    <div className="bevel-3d-dark p-3">
      <h3 className="text-md font-bold text-slate-300 mb-3">Quest Board</h3>
      
      <div className="grid grid-cols-12 gap-3 h-80">
        {/* Left Panel - Game Selection */}
        <div className="col-span-5 bevel-3d-dark p-3 rounded-md">
          <h4 className="text-sm font-bold text-slate-300 mb-3">Select Game</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {Object.entries(gameData).map(([gameName, gameInfo]) => (
              <motion.div
                key={gameName}
                onClick={() => setSelectedGame(gameName)}
                className={`p-2 rounded-md cursor-pointer transition-all duration-200 ${
                  selectedGame === gameName 
                    ? 'bg-blue-600/30 border border-blue-500/50' 
                    : 'hover:bg-slate-700/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <img 
                    src={gameInfo.cover} 
                    alt={gameName}
                    className="w-8 h-8 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-white text-xs font-semibold truncate">{gameName}</p>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      {gameInfo.icon}
                      <span>{gameInfo.genre}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Panel - Quest Details */}
        <div className="col-span-7 bevel-3d-dark p-3 rounded-md">
          <div className="flex gap-2 mb-3 border-b border-slate-700 pb-2">
            <Button
              onClick={() => setActiveTab('quests')}
              className={`text-xs px-2 py-1 ${
                activeTab === 'quests' ? 'bg-blue-600/30 text-blue-300' : 'bg-transparent text-slate-400'
              }`}
            >
              Quests ({currentGame.quests.length})
            </Button>
            <Button
              onClick={() => setActiveTab('achievements')}
              className={`text-xs px-2 py-1 ${
                activeTab === 'achievements' ? 'bg-blue-600/30 text-blue-300' : 'bg-transparent text-slate-400'
              }`}
            >
              Achievements ({currentGame.achievements.length})
            </Button>
            <Button
              onClick={() => setActiveTab('rewards')}
              className={`text-xs px-2 py-1 ${
                activeTab === 'rewards' ? 'bg-blue-600/30 text-blue-300' : 'bg-transparent text-slate-400'
              }`}
            >
              Rewards ({currentGame.rewards.length})
            </Button>
          </div>

          <div className="max-h-56 overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedGame}-${activeTab}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'quests' && currentGame.quests.map(quest => (
                  <QuestItem key={quest.id} quest={quest} />
                ))}
                
                {activeTab === 'achievements' && currentGame.achievements.map(achievement => (
                  <AchievementItem key={achievement.id} achievement={achievement} />
                ))}
                
                {activeTab === 'rewards' && currentGame.rewards.map((reward, index) => (
                  <RewardItem key={index} reward={reward} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
