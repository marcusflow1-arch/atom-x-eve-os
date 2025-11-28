import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Trophy, Play, Volume2, Eye, MapPin, Users, ThumbsUp, MessageSquare, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Rarity styles
const RARITY_STYLES = {
  Common: { color: 'text-gray-400', bg: 'bg-gray-900/50', border: 'border-gray-500' },
  Uncommon: { color: 'text-green-400', bg: 'bg-green-900/50', border: 'border-green-500' },
  Rare: { color: 'text-blue-400', bg: 'bg-blue-900/50', border: 'border-blue-500' },
  Epic: { color: 'text-purple-400', bg: 'bg-purple-900/50', border: 'border-purple-500' },
  Legendary: { color: 'text-orange-400', bg: 'bg-orange-900/50', border: 'border-orange-500' },
  Mythical: { color: 'text-red-400', bg: 'bg-red-900/50', border: 'border-red-500' }
};

// Mock achievements data
const MOCK_ACHIEVEMENTS = [
  {
    id: 'ach1',
    name: 'Dragon Slayer',
    description: 'Defeat the Ancient Dragon',
    icon: '🐉',
    rarity: 'Legendary',
    unlocked: true,
    progress: 100,
    points: 100,
    guides: [
      {
        id: 'guide1',
        author: 'Shadow_Hunter',
        upvotes: 234,
        description: 'To defeat the Ancient Dragon, first travel to the Frozen Peak in the Northern Mountains. You\'ll find the dragon\'s lair at the summit. Make sure you have fire resistance potions and a weapon with at least 500 attack power.',
        images: [
          'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop'
        ],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        voiceUrl: null,
        location: 'Frozen Peak Summit, Northern Mountains',
        timestamp: '2 days ago'
      },
      {
        id: 'guide2',
        author: 'DragonMaster99',
        upvotes: 189,
        description: 'Alternative strategy: Use the hidden ice cavern entrance on the east side. This lets you sneak up on the dragon and get a critical first strike. Bring healing potions!',
        images: [
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
        ],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        voiceUrl: null,
        location: 'Ice Cavern, East Entrance',
        timestamp: '5 days ago'
      }
    ]
  },
  {
    id: 'ach2',
    name: 'Master Thief',
    description: 'Steal 1000 gold undetected',
    icon: '💰',
    rarity: 'Epic',
    unlocked: false,
    progress: 65,
    points: 75,
    guides: [
      {
        id: 'guide3',
        author: 'StealthyNinja',
        upvotes: 456,
        description: 'Best place to farm this is the Royal Treasury in the Capital City. Wait until 2 AM in-game time when guards change shifts. Use invisibility potions and move quickly.',
        images: [
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=300&fit=crop'
        ],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        voiceUrl: null,
        location: 'Royal Treasury, Capital City',
        timestamp: '1 week ago'
      }
    ]
  },
  {
    id: 'ach3',
    name: 'Legendary Hero',
    description: 'Complete all main story quests',
    icon: '⚔️',
    rarity: 'Rare',
    unlocked: false,
    progress: 80,
    points: 150,
    guides: [
      {
        id: 'guide4',
        author: 'QuestMaster',
        upvotes: 678,
        description: 'Follow the main storyline in this order: Castle Quest → Forest Temple → Desert Ruins → Final Boss. Don\'t forget the hidden side quest in the Forest Temple - it gives you a legendary sword needed for the final battle.',
        images: [
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
        ],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        voiceUrl: null,
        location: 'Multiple Locations',
        timestamp: '3 days ago'
      }
    ]
  },
  {
    id: 'ach4',
    name: 'Treasure Hunter',
    description: 'Find all 50 hidden treasure chests',
    icon: '📦',
    rarity: 'Uncommon',
    unlocked: true,
    progress: 100,
    points: 50,
    guides: []
  },
  {
    id: 'ach5',
    name: 'Arena Champion',
    description: 'Win 100 arena battles',
    icon: '🏆',
    rarity: 'Epic',
    unlocked: false,
    progress: 45,
    points: 80,
    guides: []
  },
  {
    id: 'ach6',
    name: 'Master Craftsman',
    description: 'Craft 500 items',
    icon: '🔨',
    rarity: 'Rare',
    unlocked: false,
    progress: 30,
    points: 60,
    guides: []
  }
];

const AchievementCard = ({ achievement, onClick, isSelected }) => {
  const rarity = RARITY_STYLES[achievement.rarity] || RARITY_STYLES.Common;
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(achievement)}
      className={`flex-shrink-0 w-40 cursor-pointer`}
    >
      <Card className={`${rarity.bg} border-2 ${isSelected ? rarity.border : 'border-slate-700'} ${isSelected ? 'shadow-lg' : ''} transition-all duration-200`}>
        <CardContent className="p-4">
          <div className="text-center">
            <div className={`text-5xl mb-2 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
              {achievement.icon}
            </div>
            <h3 className={`font-bold text-xs mb-1 ${rarity.color} line-clamp-2`}>
              {achievement.name}
            </h3>
            <Badge className={`${rarity.bg} ${rarity.color} border ${rarity.border} text-[10px] px-1 py-0`}>
              {achievement.rarity}
            </Badge>
            {!achievement.unlocked && (
              <div className="mt-2">
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{achievement.progress}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const GuideCard = ({ guide }) => {
  const [playingVideo, setPlayingVideo] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const videoRef = useRef(null);

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (playingVideo) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlayingVideo(!playingVideo);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-4"
    >
      {/* Author Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white">{guide.author}</p>
            <p className="text-xs text-slate-400">{guide.timestamp}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-green-400">
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-semibold">{guide.upvotes}</span>
          </div>
          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Location Badge */}
      {guide.location && (
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-red-400" />
          <Badge variant="outline" className="text-red-400 border-red-500/50">
            {guide.location}
          </Badge>
        </div>
      )}

      {/* Description */}
      <p className="text-slate-300 leading-relaxed mb-4">
        {guide.description}
      </p>

      {/* Media Tabs */}
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-900/50">
          <TabsTrigger value="text">
            <Eye className="w-4 h-4 mr-2" />
            Text
          </TabsTrigger>
          <TabsTrigger value="media">
            <Play className="w-4 h-4 mr-2" />
            Video/Images
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Volume2 className="w-4 h-4 mr-2" />
            Voice Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Step-by-Step Guide:</h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-300">
              <li>Travel to the specified location</li>
              <li>Prepare required items and equipment</li>
              <li>Follow the strategy described above</li>
              <li>Complete the achievement objective</li>
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-4">
          <div className="space-y-4">
            {/* Video */}
            {guide.videoUrl && (
              <div className="relative rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover bg-black"
                  src={guide.videoUrl}
                  controls
                />
              </div>
            )}

            {/* Images */}
            {guide.images && guide.images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {guide.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Guide screenshot ${idx + 1}`}
                    className="w-full h-40 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="voice" className="mt-4">
          <div className="bg-slate-900/50 rounded-lg p-6 text-center">
            {guide.voiceUrl ? (
              <div className="space-y-4">
                <Button
                  onClick={() => setPlayingAudio(!playingAudio)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Volume2 className="w-5 h-5 mr-2" />
                  {playingAudio ? 'Stop Voice Guide' : 'Play Voice Guide'}
                </Button>
                <p className="text-sm text-slate-400">
                  Listen to player-recorded voice instructions
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Bot className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-400">No voice guide available yet</p>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <Bot className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                    <div className="text-left">
                      <h5 className="font-semibold text-blue-400 mb-2">Future: AI Companion Guide</h5>
                      <p className="text-sm text-slate-300">
                        Soon, your AI companion will be able to read these guides aloud in real-time while you play. 
                        Just say "Read achievement guide" and get voice-guided navigation to the exact location!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default function GameAchievementsOverlay({ gameTitle, onClose }) {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef(null);
  const SCROLL_AMOUNT = 300;

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - SCROLL_AMOUNT)
        : scrollPosition + SCROLL_AMOUNT;
      
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  const stats = {
    total: MOCK_ACHIEVEMENTS.length,
    unlocked: MOCK_ACHIEVEMENTS.filter(a => a.unlocked).length,
    points: MOCK_ACHIEVEMENTS.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0),
    totalPoints: MOCK_ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0)
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-7xl max-h-[90vh] bg-slate-900 rounded-2xl border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <h2 className="text-2xl font-black text-white">{gameTitle} - Achievements</h2>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span className="text-green-400 font-semibold">
                    {stats.unlocked}/{stats.total} Unlocked
                  </span>
                  <span className="text-yellow-400 font-semibold">
                    {stats.points}/{stats.totalPoints} Points
                  </span>
                  <span className="text-blue-400 font-semibold">
                    {Math.round((stats.unlocked / stats.total) * 100)}% Complete
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Horizontal Achievement Carousel */}
          <div className="relative border-b border-slate-700/50 bg-slate-800/30 p-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-slate-900/80 hover:bg-slate-800"
              disabled={scrollPosition === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide px-12"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {MOCK_ACHIEVEMENTS.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClick={setSelectedAchievement}
                  isSelected={selectedAchievement?.id === achievement.id}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleScroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-slate-900/80 hover:bg-slate-800"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Achievement Details */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {selectedAchievement ? (
                <motion.div
                  key={selectedAchievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* Achievement Header */}
                  <div className="flex items-start gap-6 mb-6 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="text-7xl">
                      {selectedAchievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-3xl font-black text-white">
                          {selectedAchievement.name}
                        </h3>
                        <Badge className={`${RARITY_STYLES[selectedAchievement.rarity]?.bg} ${RARITY_STYLES[selectedAchievement.rarity]?.color} border-2 ${RARITY_STYLES[selectedAchievement.rarity]?.border}`}>
                          {selectedAchievement.rarity}
                        </Badge>
                        {selectedAchievement.unlocked && (
                          <Badge className="bg-green-900/50 text-green-300 border-green-500">
                            ✓ Unlocked
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg text-slate-300 mb-3">
                        {selectedAchievement.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-yellow-400 font-semibold">
                          {selectedAchievement.points} Points
                        </span>
                        {!selectedAchievement.unlocked && (
                          <div className="flex items-center gap-2 flex-1 max-w-xs">
                            <div className="flex-1 bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${selectedAchievement.progress}%` }}
                              />
                            </div>
                            <span className="text-slate-400">{selectedAchievement.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Player Guides */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-white">Community Guides</h4>
                      <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-400">
                        + Add Your Guide
                      </Button>
                    </div>

                    {selectedAchievement.guides && selectedAchievement.guides.length > 0 ? (
                      <div className="space-y-4">
                        {selectedAchievement.guides.map(guide => (
                          <GuideCard key={guide.id} guide={guide} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                        <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 mb-4">No guides available yet</p>
                        <Button variant="outline" className="border-blue-500/50 text-blue-400">
                          Be the first to create a guide!
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <Trophy className="w-24 h-24 text-slate-600 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">Select an Achievement</h3>
                  <p className="text-slate-400 max-w-md">
                    Click on any achievement above to view detailed unlock guides, videos, and community tips
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}