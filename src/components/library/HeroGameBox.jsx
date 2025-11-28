
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Bot, Video, Trophy, Eye, X, Star, Crown, Sword, Shield, Users, ChevronLeft, ChevronRight, PlayCircle, PauseCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import RecentlyAchievedOverlay from './RecentlyAchievedOverlay';

// Mock data for achievements, abilities, companions, equipment
const mockGameData = {
  achievements: [
    {
      id: 'ach1',
      name: 'Dragon Slayer',
      description: 'Defeat the Ancient Dragon',
      rarity: 'Legendary',
      reward: 'Dragonscale Armor',
      unlocked: true,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      icon: '🐉'
    },
    {
      id: 'ach2',
      name: 'Master Thief',
      description: 'Steal 1000 gold undetected',
      rarity: 'Epic',
      reward: 'Shadow Cloak',
      unlocked: false,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      icon: '🗡️'
    }
  ],
  abilities: [
    {
      id: 'ab1',
      name: 'Dragonborn Shout',
      description: 'Unleash devastating dragon shouts',
      rarity: 'Legendary',
      unlocked: true,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      icon: '🔥'
    }
  ],
  companions: [
    {
      id: 'comp1',
      name: 'Shadow Wolf',
      description: 'A mystical wolf companion',
      rarity: 'Epic',
      unlocked: true,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      icon: '🐺'
    }
  ],
  equipment: [
    {
      id: 'eq1',
      name: 'Dragonscale Armor',
      description: 'Legendary armor forged from dragon scales',
      rarity: 'Legendary',
      unlocked: true,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      icon: '🛡️'
    }
  ]
};

const rarityColors = {
  Common: 'text-gray-300 bg-gray-900/20 border-gray-500',
  Uncommon: 'text-green-300 bg-green-900/20 border-green-500',
  Rare: 'text-blue-300 bg-blue-900/20 border-blue-500',
  Epic: 'text-purple-300 bg-purple-900/20 border-purple-500',
  Legendary: 'text-orange-300 bg-orange-900/20 border-orange-500'
};

const ItemDetailPanel = ({ item, onClose }) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = React.useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVideoPlaying, item]);

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        Select an item to view details
      </div>
    );
  }

  const rarity = rarityColors[item.rarity] || rarityColors.Common;

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-6 bg-slate-800/30 rounded-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
          <Badge className={`${rarity} border`}>
            {item.rarity}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {item.unlocked ? (
            <Badge className="bg-green-900/20 text-green-300 border-green-500">
              Unlocked
            </Badge>
          ) : (
            <Badge className="bg-red-900/20 text-red-300 border-red-500">
              Locked
            </Badge>
          )}
          <span className="text-4xl">{item.icon}</span>
        </div>
      </div>

      <p className="text-slate-300 mb-6">{item.description}</p>

      {/* Video Player */}
      <div className="relative mb-6 rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="w-full h-48 object-cover"
          autoPlay
          loop
          muted
          onLoadStart={() => setIsVideoPlaying(true)}
        >
          <source src={item.videoUrl} type="video/mp4" />
        </video>
        
        <button
          onClick={() => setIsVideoPlaying(!isVideoPlaying)}
          className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          {isVideoPlaying ? (
            <PauseCircle className="w-5 h-5 text-white" />
          ) : (
            <PlayCircle className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {item.reward && (
        <div className="bg-slate-900/50 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-300 mb-2">Reward:</h4>
          <p className="text-slate-300">{item.reward}</p>
        </div>
      )}
    </motion.div>
  );
};

const ItemList = ({ items, selectedItem, onSelectItem, type }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'achievements': return Trophy;
      case 'abilities': return Star;
      case 'companions': return Users;
      case 'equipment': return Shield;
      default: return Trophy;
    }
  };

  const Icon = getTypeIcon(type);

  return (
    <div className="h-full p-4 bg-slate-900/30 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold text-white capitalize">{type}</h3>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map(item => {
          const rarity = rarityColors[item.rarity] || rarityColors.Common;
          const isSelected = selectedItem?.id === item.id;
          
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectItem(item)}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                isSelected 
                  ? 'bg-blue-900/30 border-blue-500' 
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-sm">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${rarity} border text-xs`}>
                      {item.rarity}
                    </Badge>
                    {item.unlocked ? (
                      <Badge className="bg-green-900/20 text-green-300 border-green-500 text-xs">
                        ✓
                      </Badge>
                    ) : (
                      <Badge className="bg-red-900/20 text-red-300 border-red-500 text-xs">
                        🔒
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default function HeroGameBox({ game }) {
  const [showAchievements, setShowAchievements] = useState(false);
  const [activeTab, setActiveTab] = useState('achievements');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRecentlyAchieved, setShowRecentlyAchieved] = useState(false);

  // Auto-select first item when tab changes
  useEffect(() => {
    if (showAchievements && mockGameData[activeTab]?.length > 0) {
      setSelectedItem(mockGameData[activeTab][0]);
    } else if (!showAchievements) {
      setSelectedItem(null); // Clear selected item when closing achievements view
    }
  }, [activeTab, showAchievements]);

  if (!game) {
    return (
      <div className="h-96 bg-slate-800/30 rounded-2xl flex items-center justify-center text-slate-500 border border-dashed border-slate-700">
        Select a game from your library to see details
      </div>
    );
  }

  if (showAchievements) {
    return (
      <motion.div
        initial={{ height: 400 }}
        animate={{ height: 600 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="rounded-2xl overflow-hidden relative bg-slate-900 border border-slate-700"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white">{game.title} - Collection</h2>
            <p className="text-slate-400">Achievements, Abilities, Companions & Equipment</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowAchievements(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Two Panel Layout */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 mb-6">
              <TabsTrigger value="achievements" className="data-[state=active]:bg-blue-600">
                Achievements
              </TabsTrigger>
              <TabsTrigger value="abilities" className="data-[state=active]:bg-blue-600">
                Abilities
              </TabsTrigger>
              <TabsTrigger value="companions" className="data-[state=active]:bg-blue-600">
                Companions
              </TabsTrigger>
              <TabsTrigger value="equipment" className="data-[state=active]:bg-blue-600">
                Equipment
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
              {/* Left Panel - Item List */}
              <ItemList
                items={mockGameData[activeTab] || []}
                selectedItem={selectedItem}
                onSelectItem={setSelectedItem}
                type={activeTab}
              />

              {/* Right Panel - Item Details */}
              <AnimatePresence mode="wait">
                <ItemDetailPanel
                  item={selectedItem}
                  onClose={() => setSelectedItem(null)}
                />
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        key={game.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-96 rounded-2xl overflow-hidden relative bg-slate-900 border border-slate-700"
      >
        <img
          src={game.banner || game.cover_image}
          alt={game.title}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 p-8 flex flex-col justify-center">
          <h2 className="text-5xl font-black text-white mb-3">{game.title}</h2>
          <div className="flex gap-2 mb-4">
            {game.modes?.map(mode => (
              <Badge key={mode} variant="outline" className="border-blue-500/50 text-blue-300">
                {mode}
              </Badge>
            ))}
          </div>
          <p className="text-slate-300 max-w-2xl mb-6 line-clamp-3">{game.description}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-5 h-5 mr-2" />
              Jump In
            </Button>
            <Button size="lg" variant="outline">
              <Bot className="w-5 h-5 mr-2" />
              AI Play
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowRecentlyAchieved(true)}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Recently Achieved
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowAchievements(true)}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Achievements
            </Button>
            <Link to={`${createPageUrl('GameDetail')}?id=${game.id}&from=library`}>
              <Button size="lg" variant="outline">
                <Eye className="w-5 h-5 mr-2" />
                View Detail
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Recently Achieved Overlay */}
      <RecentlyAchievedOverlay
        isVisible={showRecentlyAchieved}
        onClose={() => setShowRecentlyAchieved(false)}
        gameTitle={game.title}
      />
    </>
  );
}
