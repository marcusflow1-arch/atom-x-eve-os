import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Users, Trophy, Clock, Star, MapPin, Calendar,
  ArrowLeft, Crown, Shield, Zap, Target, Gamepad2, Send, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../components/auth/AuthContext';
import { createPageUrl } from '@/utils';

export default function PlayerProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  // Get userId from URL params
  const query = new URLSearchParams(location.search);
  const userId = query.get('userId') || currentUser?.id;
  
  // Mock profile data - in production this would come from database
  const profileData = {
    id: userId,
    username: 'ShadowStriker',
    fullName: 'Alex Chen',
    avatar_url: 'https://i.pravatar.cc/300?u=shadowstriker',
    bio: 'Competitive player | RPG enthusiast | Always down for co-op',
    level: 47,
    gamerScore: 12450,
    joinDate: 'March 2024',
    location: 'Los Angeles, CA',
    status: 'online', // online, away, offline
    currentGame: 'Cyberpunk 2088',
    stats: {
      gamesPlayed: 127,
      achievements: 342,
      hoursPlayed: 1847,
      friends: 89
    },
    recentAchievements: [
      { id: 1, name: 'Dragon Slayer', game: 'Elder Scrolls VI', icon: '🐉', rarity: 'Legendary', unlockedAt: '2 days ago' },
      { id: 2, name: 'Speed Demon', game: 'Vanguard Ops', icon: '⚡', rarity: 'Epic', unlockedAt: '5 days ago' },
      { id: 3, name: 'Master Hacker', game: 'Cyberpunk 2088', icon: '💻', rarity: 'Rare', unlockedAt: '1 week ago' },
      { id: 4, name: 'Team Player', game: 'Vanguard Ops', icon: '🤝', rarity: 'Common', unlockedAt: '1 week ago' }
    ],
    recentActivity: [
      { id: 1, type: 'achievement', content: 'Unlocked "Dragon Slayer" in Elder Scrolls VI', timestamp: '2 days ago', icon: '🏆' },
      { id: 2, type: 'game', content: 'Played Cyberpunk 2088 for 3 hours', timestamp: '3 days ago', icon: '🎮' },
      { id: 3, type: 'social', content: 'Joined a party with Marcus and 3 others', timestamp: '4 days ago', icon: '👥' },
      { id: 4, type: 'achievement', content: 'Unlocked "Speed Demon" in Vanguard Ops', timestamp: '5 days ago', icon: '🏆' },
      { id: 5, type: 'milestone', content: 'Reached Level 47', timestamp: '1 week ago', icon: '⭐' }
    ],
    favoriteGames: [
      { title: 'Cyberpunk 2088', cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150&h=200&fit=crop', hoursPlayed: 245 },
      { title: 'Elder Scrolls VI', cover: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150&h=200&fit=crop', hoursPlayed: 189 },
      { title: 'Vanguard Ops', cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&h=200&fit=crop', hoursPlayed: 156 }
    ]
  };

  const isOwnProfile = currentUser?.id === userId;

  const statusColors = {
    online: 'bg-green-500 ring-green-400/50',
    away: 'bg-yellow-500 ring-yellow-400/50',
    offline: 'bg-gray-600 ring-gray-500/50'
  };

  const statusText = {
    online: 'Online',
    away: 'Away',
    offline: 'Offline'
  };

  const rarityColors = {
    Common: 'bg-slate-500/20 text-slate-300',
    Uncommon: 'bg-green-500/20 text-green-300',
    Rare: 'bg-blue-500/20 text-blue-300',
    Epic: 'bg-purple-500/20 text-purple-300',
    Legendary: 'bg-orange-500/20 text-orange-300'
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      console.log('Sending message:', chatMessage);
      // Here you would integrate with your messaging system
      setChatMessage('');
      setShowChatModal(false);
    }
  };

  const handlePartyInvite = () => {
    console.log('Sending party invite to:', profileData.username);
    // Here you would integrate with your party system
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Back Button */}
      <div className="p-6">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-8 mb-6 overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-blue-500/50 overflow-hidden bg-slate-900">
                <img 
                  src={profileData.avatar_url} 
                  alt={profileData.username}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Status Indicator */}
              <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full ring-4 ring-slate-900 ${statusColors[profileData.status]}`} />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{profileData.username}</h1>
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/50">
                  Level {profileData.level}
                </Badge>
                <Badge variant="outline" className={`${statusColors[profileData.status]} border-0 text-white`}>
                  {statusText[profileData.status]}
                </Badge>
              </div>
              
              <p className="text-slate-400 mb-3">{profileData.bio}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {profileData.joinDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{profileData.location}</span>
                </div>
                {profileData.currentGame && (
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Playing {profileData.currentGame}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowChatModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button 
                  onClick={handlePartyInvite}
                  variant="outline"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Party Up
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Games Played', value: profileData.stats.gamesPlayed, icon: Gamepad2, color: 'text-blue-400' },
            { label: 'Achievements', value: profileData.stats.achievements, icon: Trophy, color: 'text-yellow-400' },
            { label: 'Hours Played', value: profileData.stats.hoursPlayed, icon: Clock, color: 'text-green-400' },
            { label: 'Gamer Score', value: profileData.gamerScore, icon: Star, color: 'text-purple-400' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 text-center"
            >
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
              <div className="text-2xl font-bold text-white mb-1">{stat.value.toLocaleString()}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="w-full bg-slate-800/50 mb-6">
            <TabsTrigger value="achievements" className="flex-1">
              <Trophy className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">
              <Clock className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="games" className="flex-1">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Games
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileData.recentAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 hover:border-blue-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{achievement.name}</h3>
                      <p className="text-slate-400 text-sm mb-2">{achievement.game}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={rarityColors[achievement.rarity]}>
                          {achievement.rarity}
                        </Badge>
                        <span className="text-slate-500 text-xs">{achievement.unlockedAt}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <div className="space-y-3">
              {profileData.recentActivity.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 flex items-center gap-4"
                >
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="text-white">{activity.content}</p>
                    <p className="text-slate-500 text-sm mt-1">{activity.timestamp}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {profileData.favoriteGames.map((game, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="group cursor-pointer"
                >
                  <div className="relative rounded-lg overflow-hidden mb-3 aspect-[2/3]">
                    <img 
                      src={game.cover} 
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">{game.title}</h4>
                  <p className="text-slate-400 text-sm">{game.hoursPlayed} hours played</p>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowChatModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Send Message</h3>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-900/50 rounded-lg">
                <img 
                  src={profileData.avatar_url} 
                  alt={profileData.username}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-white font-semibold">{profileData.username}</p>
                  <p className="text-slate-400 text-sm">{statusText[profileData.status]}</p>
                </div>
              </div>

              <Input
                placeholder="Type your message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="bg-slate-900 border-slate-700 mb-4"
                autoFocus
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowChatModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}