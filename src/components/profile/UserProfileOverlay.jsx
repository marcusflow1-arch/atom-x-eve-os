import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Camera, Edit, Save, Sparkles, Trophy, Zap, Heart, MessageSquare,
  Radio, Users, Crown, Flame, Target, TrendingUp, Clock, Star, Share2,
  Instagram, Youtube, Twitch, Twitter, Upload, Image as ImageIcon, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';

// Liquid Glass Card Component
const LiquidGlassCard = ({ children, className = "" }) => (
  <div 
    className={`relative overflow-hidden rounded-2xl ${className}`}
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    {children}
  </div>
);

export default function UserProfileOverlay({ isOpen, onClose, profileUser, readOnly = false }) {
  const { user: authUser, avatar: authAvatar, updateUserData, refreshUserData } = useAuth();
  
  // Use passed profileUser or fall back to authenticated user
  const displayUser = profileUser || authUser;
  // If viewing another user, use their avatar data if available, or fall back to authAvatar if it's the same user, or mock/empty
  const displayAvatar = profileUser ? (profileUser.avatar_data || {}) : authAvatar; 

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar_url: '',
    streaming_profile: {
      twitch_username: '',
      youtube_channel: '',
      twitter_handle: '',
      stream_bio: ''
    },
    social_profile: {
      tagline: '',
      favorite_games: [],
      playstyle: ''
    }
  });

  useEffect(() => {
    if (displayUser) {
      setFormData({
        username: displayUser.username || displayUser.full_name || '',
        bio: displayUser.bio || '',
        avatar_url: displayUser.avatar_url || '',
        streaming_profile: displayUser.streaming_profile || {
          twitch_username: '',
          youtube_channel: '',
          twitter_handle: '',
          stream_bio: ''
        },
        social_profile: displayUser.social_profile || {
          tagline: '',
          favorite_games: [],
          playstyle: ''
        }
      });
    }
  }, [displayUser]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserData(formData);
      await refreshUserData();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, avatar_url: file_url }));
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

  if (!isOpen) return null;

  const stats = {
    gamerScore: displayUser?.gamer_score || displayUser?.score || 0,
    achievements: displayUser?.unlocked_achievements?.length || displayUser?.achievements || 0,
    hoursPlayed: displayUser?.total_playtime || 0,
    level: displayUser?.level || displayAvatar?.level || 1,
    followers: displayUser?.follower_count || 0,
    following: displayUser?.following_count || 0
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Profile Overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-8 z-[101] overflow-hidden"
          >
            <LiquidGlassCard className="w-full h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-white tracking-tight">{readOnly ? (displayUser?.username || 'Player Profile') : 'Your Profile'}</h1>
                      <p className="text-white/40 text-sm">{readOnly ? 'View player stats and details' : 'Manage your ATOM×EVE identity'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {!readOnly && (
                      isEditing ? (
                        <>
                          <Button
                            onClick={() => setIsEditing(false)}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      )
                    )}
                    <button
                      onClick={onClose}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex">
                {/* Sidebar Tabs */}
                <div className="w-64 border-r border-white/10 p-4">
                  <div className="space-y-2">
                    {[
                      { id: 'profile', label: 'General Profile', icon: User },
                      { id: 'streaming', label: 'Streaming', icon: Radio },
                      { id: 'social', label: 'Social Hub', icon: Users },
                      { id: 'stats', label: 'Stats & Achievements', icon: Trophy },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          activeTab === tab.id
                            ? 'bg-white/15 text-white border border-white/20'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <tab.icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8">
                  <AnimatePresence mode="wait">
                    {activeTab === 'profile' && (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        {/* Avatar Section */}
                        <LiquidGlassCard className="p-6">
                          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <Camera className="w-5 h-5 text-cyan-400" />
                            Avatar & Display
                          </h3>
                          
                          <div className="flex items-start gap-6">
                            <div className="relative group">
                              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 bg-slate-800">
                                {formData.avatar_url ? (
                                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                    <User className="w-16 h-16 text-white" />
                                  </div>
                                )}
                              </div>
                              {isEditing && !readOnly && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                                  <Upload className="w-8 h-8 text-white" />
                                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                </label>
                              )}
                            </div>

                            <div className="flex-1 space-y-4">
                              <div>
                                <label className="text-sm font-medium text-white/60 mb-2 block">Username</label>
                                {isEditing ? (
                                  <Input
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                    className="bg-white/5 border-white/20 text-white"
                                    placeholder="Enter username"
                                  />
                                ) : (
                                  <p className="text-white text-lg font-bold">{formData.username || 'Not set'}</p>
                                )}
                              </div>

                              <div>
                                <label className="text-sm font-medium text-white/60 mb-2 block">Bio</label>
                                {isEditing ? (
                                  <Textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                    className="bg-white/5 border-white/20 text-white min-h-[80px]"
                                    placeholder="Tell us about yourself..."
                                  />
                                ) : (
                                  <p className="text-white/80">{formData.bio || 'No bio yet'}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </LiquidGlassCard>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { label: 'Gamer Score', value: stats.gamerScore.toLocaleString(), icon: Trophy, color: 'text-yellow-400' },
                            { label: 'Achievements', value: stats.achievements, icon: Star, color: 'text-purple-400' },
                            { label: 'Hours Played', value: stats.hoursPlayed, icon: Clock, color: 'text-blue-400' },
                          ].map((stat, i) => (
                            <LiquidGlassCard key={i} className="p-4 text-center">
                              <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                              <p className="text-2xl font-black text-white">{stat.value}</p>
                              <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                            </LiquidGlassCard>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'streaming' && (
                      <motion.div
                        key="streaming"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <LiquidGlassCard className="p-6">
                          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <Radio className="w-5 h-5 text-purple-400" />
                            Streaming Profile
                          </h3>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-white/60 mb-2 block flex items-center gap-2">
                                <Twitch className="w-4 h-4 text-purple-400" /> Twitch Username
                              </label>
                              {isEditing ? (
                                <Input
                                  value={formData.streaming_profile.twitch_username}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    streaming_profile: { ...prev.streaming_profile, twitch_username: e.target.value }
                                  }))}
                                  className="bg-white/5 border-white/20 text-white"
                                  placeholder="your_twitch_username"
                                />
                              ) : (
                                <p className="text-white">{formData.streaming_profile.twitch_username || 'Not connected'}</p>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium text-white/60 mb-2 block flex items-center gap-2">
                                <Youtube className="w-4 h-4 text-red-400" /> YouTube Channel
                              </label>
                              {isEditing ? (
                                <Input
                                  value={formData.streaming_profile.youtube_channel}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    streaming_profile: { ...prev.streaming_profile, youtube_channel: e.target.value }
                                  }))}
                                  className="bg-white/5 border-white/20 text-white"
                                  placeholder="@YourChannel"
                                />
                              ) : (
                                <p className="text-white">{formData.streaming_profile.youtube_channel || 'Not connected'}</p>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium text-white/60 mb-2 block flex items-center gap-2">
                                <Twitter className="w-4 h-4 text-blue-400" /> Twitter/X Handle
                              </label>
                              {isEditing ? (
                                <Input
                                  value={formData.streaming_profile.twitter_handle}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    streaming_profile: { ...prev.streaming_profile, twitter_handle: e.target.value }
                                  }))}
                                  className="bg-white/5 border-white/20 text-white"
                                  placeholder="@yourhandle"
                                />
                              ) : (
                                <p className="text-white">{formData.streaming_profile.twitter_handle || 'Not connected'}</p>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium text-white/60 mb-2 block">Stream Bio</label>
                              {isEditing ? (
                                <Textarea
                                  value={formData.streaming_profile.stream_bio}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    streaming_profile: { ...prev.streaming_profile, stream_bio: e.target.value }
                                  }))}
                                  className="bg-white/5 border-white/20 text-white min-h-[100px]"
                                  placeholder="Describe your streaming content..."
                                />
                              ) : (
                                <p className="text-white/80">{formData.streaming_profile.stream_bio || 'No stream bio yet'}</p>
                              )}
                            </div>
                          </div>
                        </LiquidGlassCard>

                        {/* Streaming Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <LiquidGlassCard className="p-4">
                            <Radio className="w-5 h-5 text-purple-400 mb-2" />
                            <p className="text-xl font-bold text-white">0</p>
                            <p className="text-xs text-white/40">Total Streams</p>
                          </LiquidGlassCard>
                          <LiquidGlassCard className="p-4">
                            <Users className="w-5 h-5 text-cyan-400 mb-2" />
                            <p className="text-xl font-bold text-white">{stats.followers}</p>
                            <p className="text-xs text-white/40">Followers</p>
                          </LiquidGlassCard>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'social' && (
                      <motion.div
                        key="social"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <LiquidGlassCard className="p-6">
                          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-400" />
                            Social Hub Profile
                          </h3>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-white/60 mb-2 block">Tagline</label>
                              {isEditing ? (
                                <Input
                                  value={formData.social_profile.tagline}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    social_profile: { ...prev.social_profile, tagline: e.target.value }
                                  }))}
                                  className="bg-white/5 border-white/20 text-white"
                                  placeholder="Your gaming motto..."
                                />
                              ) : (
                                <p className="text-white">{formData.social_profile.tagline || 'No tagline set'}</p>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium text-white/60 mb-2 block">Playstyle</label>
                              {isEditing ? (
                                <select
                                  value={formData.social_profile.playstyle}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    social_profile: { ...prev.social_profile, playstyle: e.target.value }
                                  }))}
                                  className="w-full bg-white/5 border border-white/20 text-white rounded-lg px-3 py-2"
                                >
                                  <option value="">Select playstyle</option>
                                  <option value="casual">Casual Gamer</option>
                                  <option value="competitive">Competitive</option>
                                  <option value="speedrunner">Speedrunner</option>
                                  <option value="completionist">Completionist</option>
                                  <option value="collector">Collector</option>
                                </select>
                              ) : (
                                <p className="text-white capitalize">{formData.social_profile.playstyle || 'Not set'}</p>
                              )}
                            </div>
                          </div>
                        </LiquidGlassCard>

                        {/* Social Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <LiquidGlassCard className="p-4">
                            <Heart className="w-5 h-5 text-pink-400 mb-2" />
                            <p className="text-xl font-bold text-white">{stats.followers}</p>
                            <p className="text-xs text-white/40">Followers</p>
                          </LiquidGlassCard>
                          <LiquidGlassCard className="p-4">
                            <Users className="w-5 h-5 text-blue-400 mb-2" />
                            <p className="text-xl font-bold text-white">{stats.following}</p>
                            <p className="text-xs text-white/40">Following</p>
                          </LiquidGlassCard>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'stats' && (
                      <motion.div
                        key="stats"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        {/* Level Progress */}
                        <LiquidGlassCard className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                              <Crown className="w-5 h-5 text-yellow-400" />
                              Level {stats.level}
                            </h3>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              {displayAvatar?.social_influence || 0} Influence
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Progress to Level {stats.level + 1}</span>
                              <span className="text-white font-mono">{displayAvatar?.experience || 0} / {(stats.level * 1000)}</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                style={{ width: `${((displayAvatar?.experience || 0) / (stats.level * 1000)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </LiquidGlassCard>

                        {/* Achievement Showcase */}
                        <LiquidGlassCard className="p-6">
                          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            Recent Achievements
                          </h3>
                          <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                                  <Star className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-semibold text-sm">Achievement #{i}</p>
                                  <p className="text-white/40 text-xs">Unlocked recently</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </LiquidGlassCard>

                        {/* Overall Stats Grid */}
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: 'Total Score', value: stats.gamerScore, icon: Flame },
                            { label: 'Level', value: stats.level, icon: TrendingUp },
                            { label: 'Achievements', value: stats.achievements, icon: Target },
                            { label: 'Games Owned', value: displayUser?.purchased_items?.length || 0, icon: Zap },
                          ].map((stat, i) => (
                            <LiquidGlassCard key={i} className="p-3 text-center group">
                              <stat.icon className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                              <p className="text-lg font-bold text-white">{stat.value}</p>
                              <p className="text-[10px] text-white/40 uppercase">{stat.label}</p>
                            </LiquidGlassCard>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </LiquidGlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}