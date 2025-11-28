import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Gem, Sparkles, Star, Shield, Swords, Skull, Check, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const rarityColors = {
  Common: { text: 'text-slate-300', border: 'border-slate-500', bg: 'bg-slate-800/50' },
  Uncommon: { text: 'text-green-400', border: 'border-green-500', bg: 'bg-green-900/30' },
  Rare: { text: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-900/30' },
  Epic: { text: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-900/30' },
  Legendary: { text: 'text-orange-400', border: 'border-orange-500', bg: 'bg-orange-900/30' },
  Mythic: { text: 'text-red-400', border: 'border-red-500', bg: 'bg-red-900/30' }
};

export default function BountyBoardModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('quests');
  const [acceptedQuests, setAcceptedQuests] = useState(new Set());
  const [questProgress, setQuestProgress] = useState({});

  const bountyData = {
    quests: [
      {
        id: 'leviathan_hunt',
        title: 'Hunt the Leviathan',
        description: 'Deal 50,000 damage to the Abyssal Leviathan in a single encounter',
        rarity: 'Mythic',
        reward: '2,500 AGP + Mythic Trident',
        experience: 5000,
        difficulty: 'Extreme',
        timeLimit: '7 days',
        requirements: ['Level 80+', 'Guild Member'],
        progress: { current: 0, max: 50000, type: 'damage' }
      },
      {
        id: 'cache_hunter',
        title: 'Cache Hunter',
        description: 'Discover and loot 5 hidden Leviathan Caches across different zones',
        rarity: 'Legendary',
        reward: '1,200 AGP + Legendary Gear Set',
        experience: 3000,
        difficulty: 'Hard',
        timeLimit: '5 days',
        requirements: ['Exploration Rank 5'],
        progress: { current: 0, max: 5, type: 'collection' }
      },
      {
        id: 'cultist_cleansing',
        title: 'Cultist Cleansing',
        description: 'Eliminate 100 Leviathan Cultists in PvP combat',
        rarity: 'Epic',
        reward: '800 AGP + Epic Weapon',
        experience: 2000,
        difficulty: 'Medium',
        timeLimit: '3 days',
        requirements: ['PvP Enabled'],
        progress: { current: 0, max: 100, type: 'kills' }
      },
      {
        id: 'deep_sea_explorer',
        title: 'Deep Sea Explorer',
        description: 'Explore 10 underwater locations during the event',
        rarity: 'Rare',
        reward: '400 AGP + Rare Mount',
        experience: 1000,
        difficulty: 'Easy',
        timeLimit: '7 days',
        requirements: ['Swimming Ability'],
        progress: { current: 0, max: 10, type: 'exploration' }
      },
      {
        id: 'tide_turner',
        title: 'Tide Turner',
        description: 'Complete 25 mini-events during the Leviathan Rise',
        rarity: 'Uncommon',
        reward: '200 AGP + Uncommon Armor',
        experience: 500,
        difficulty: 'Easy',
        timeLimit: '7 days',
        requirements: ['Event Participation'],
        progress: { current: 0, max: 25, type: 'events' }
      }
    ],
    treasures: [
      {
        id: 'abyssal_chest',
        title: 'Abyssal Treasure Chest',
        description: 'Contains legendary artifacts from the deep ocean',
        rarity: 'Mythic',
        contents: ['Kraken Scale Armor', 'Poseidon\'s Blessing', '5,000 AGP'],
        location: 'Leviathan\'s Lair',
        difficulty: 'Raid Required'
      },
      {
        id: 'sunken_vault',
        title: 'Sunken Vault',
        description: 'Ancient treasure vault lost beneath the waves',
        rarity: 'Legendary',
        contents: ['Epic Weapons x3', 'Rare Gems x10', '2,000 AGP'],
        location: 'Mariana Depths',
        difficulty: 'Group Challenge'
      },
      {
        id: 'pearl_cache',
        title: 'Pearl Cache',
        description: 'Gleaming pearls with mysterious properties',
        rarity: 'Epic',
        contents: ['Mystic Pearls x5', 'Enchantment Stones', '1,000 AGP'],
        location: 'Coral Gardens',
        difficulty: 'Solo Possible'
      }
    ],
    abilities: [
      {
        id: 'tidal_wave',
        title: 'Tidal Wave',
        description: 'Summon a massive wave that damages all enemies in a large area',
        rarity: 'Mythic',
        type: 'Ultimate Ability',
        cooldown: '300 seconds',
        damage: '5000-8000',
        requirements: ['Complete Leviathan Hunt Quest']
      },
      {
        id: 'water_breathing',
        title: 'Aquatic Adaptation',
        description: 'Breathe underwater indefinitely and move 50% faster in water',
        rarity: 'Legendary',
        type: 'Passive Ability',
        duration: 'Permanent',
        bonus: '+50% Water Speed, Unlimited Underwater Time',
        requirements: ['Discover 3 Underwater Locations']
      },
      {
        id: 'sea_sight',
        title: 'Ocean\'s Sight',
        description: 'Detect hidden underwater treasures and enemies within 100m',
        rarity: 'Epic',
        type: 'Detection Ability',
        range: '100 meters',
        duration: '60 seconds',
        requirements: ['Complete Cache Hunter Quest']
      }
    ]
  };

  const handleAcceptQuest = (questId) => {
    setAcceptedQuests(prev => new Set([...prev, questId]));
    // Initialize progress tracking
    const quest = bountyData.quests.find(q => q.id === questId);
    if (quest) {
      setQuestProgress(prev => ({
        ...prev,
        [questId]: { ...quest.progress }
      }));
    }
  };

  const handleAbandonQuest = (questId) => {
    setAcceptedQuests(prev => {
      const newSet = new Set(prev);
      newSet.delete(questId);
      return newSet;
    });
    // Remove progress tracking
    setQuestProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[questId];
      return newProgress;
    });
  };

  const getProgressPercentage = (questId) => {
    const progress = questProgress[questId];
    if (!progress) return 0;
    return Math.min((progress.current / progress.max) * 100, 100);
  };

  const renderQuestItem = (quest) => {
    const isAccepted = acceptedQuests.has(quest.id);
    const progressPercent = getProgressPercentage(quest.id);
    const rarity = rarityColors[quest.rarity];

    return (
      <motion.div
        key={quest.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${rarity.bg} ${rarity.border} border-2 rounded-lg p-4 hover:bg-opacity-80 transition-all duration-200`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-bold text-lg ${rarity.text}`}>{quest.title}</h4>
              <span className={`text-xs px-2 py-1 rounded-full border ${rarity.text} ${rarity.border}`}>
                {quest.rarity}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-2">{quest.description}</p>
          </div>
        </div>

        {isAccepted && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span>
              <span>{questProgress[quest.id]?.current || 0} / {quest.progress.max}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-3">
          <div>
            <span className="text-yellow-400">Reward:</span> {quest.reward}
          </div>
          <div>
            <span className="text-green-400">XP:</span> {quest.experience.toLocaleString()}
          </div>
          <div>
            <span className="text-orange-400">Difficulty:</span> {quest.difficulty}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{quest.timeLimit}</span>
          </div>
        </div>

        {quest.requirements.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-slate-400 mb-1">Requirements:</div>
            <div className="flex flex-wrap gap-1">
              {quest.requirements.map((req, index) => (
                <span key={index} className="text-xs bg-slate-700 px-2 py-1 rounded">
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!isAccepted ? (
            <Button 
              onClick={() => handleAcceptQuest(quest.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Accept Quest
            </Button>
          ) : (
            <>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white cursor-default"
                disabled
              >
                <Check className="w-4 h-4 mr-1" />
                Quest Active
              </Button>
              <Button 
                onClick={() => handleAbandonQuest(quest.id)}
                variant="outline"
                className="text-red-400 border-red-400 hover:bg-red-400/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  const renderTreasureItem = (treasure) => {
    const rarity = rarityColors[treasure.rarity];
    return (
      <motion.div
        key={treasure.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${rarity.bg} ${rarity.border} border-2 rounded-lg p-4 hover:bg-opacity-80 transition-all duration-200`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Gem className={`w-5 h-5 ${rarity.text}`} />
          <h4 className={`font-bold ${rarity.text}`}>{treasure.title}</h4>
          <span className={`text-xs px-2 py-1 rounded-full border ${rarity.text} ${rarity.border}`}>
            {treasure.rarity}
          </span>
        </div>
        <p className="text-slate-300 text-sm mb-3">{treasure.description}</p>
        
        <div className="mb-3">
          <div className="text-xs text-slate-400 mb-1">Contains:</div>
          <div className="space-y-1">
            {treasure.contents.map((item, index) => (
              <div key={index} className="text-xs text-slate-300">• {item}</div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-blue-400">Location:</span>
            <div className="text-slate-300">{treasure.location}</div>
          </div>
          <div>
            <span className="text-orange-400">Difficulty:</span>
            <div className="text-slate-300">{treasure.difficulty}</div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderAbilityItem = (ability) => {
    const rarity = rarityColors[ability.rarity];
    return (
      <motion.div
        key={ability.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${rarity.bg} ${rarity.border} border-2 rounded-lg p-4 hover:bg-opacity-80 transition-all duration-200`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className={`w-5 h-5 ${rarity.text}`} />
          <h4 className={`font-bold ${rarity.text}`}>{ability.title}</h4>
          <span className={`text-xs px-2 py-1 rounded-full border ${rarity.text} ${rarity.border}`}>
            {ability.rarity}
          </span>
        </div>
        <p className="text-slate-300 text-sm mb-3">{ability.description}</p>
        
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div>
            <span className="text-purple-400">Type:</span>
            <div className="text-slate-300">{ability.type}</div>
          </div>
          {ability.cooldown && (
            <div>
              <span className="text-blue-400">Cooldown:</span>
              <div className="text-slate-300">{ability.cooldown}</div>
            </div>
          )}
          {ability.damage && (
            <div>
              <span className="text-red-400">Damage:</span>
              <div className="text-slate-300">{ability.damage}</div>
            </div>
          )}
          {ability.bonus && (
            <div>
              <span className="text-green-400">Bonus:</span>
              <div className="text-slate-300">{ability.bonus}</div>
            </div>
          )}
        </div>

        {ability.requirements && (
          <div>
            <div className="text-xs text-slate-400 mb-1">Requirements:</div>
            <div className="flex flex-wrap gap-1">
              {ability.requirements.map((req, index) => (
                <span key={index} className="text-xs bg-slate-700 px-2 py-1 rounded">
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 border-2 border-slate-600 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-600 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
          <div>
            <h2 className="text-2xl font-bold text-white">Bounty Board</h2>
            <p className="text-slate-300 text-sm">Leviathan's Rise - Special Event</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-600 bg-slate-900/50">
          {[
            { id: 'quests', label: 'Quests', icon: Trophy },
            { id: 'treasures', label: 'Treasures', icon: Gem },
            { id: 'abilities', label: 'Abilities', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600/30 text-blue-300 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'quests' && acceptedQuests.size > 0 && (
                  <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {acceptedQuests.size}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {activeTab === 'quests' && bountyData.quests.map(renderQuestItem)}
              {activeTab === 'treasures' && bountyData.treasures.map(renderTreasureItem)}
              {activeTab === 'abilities' && bountyData.abilities.map(renderAbilityItem)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-slate-600 bg-slate-900/50 text-sm text-slate-400">
          <div>
            Active Quests: {acceptedQuests.size} / 10
          </div>
          <div>
            Event ends in: 4 days, 12 hours
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}