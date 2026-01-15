import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  X, User, Camera, Edit, Save, Sparkles, Trophy, Zap, Heart, MessageSquare,
  Radio, Users, Crown, Flame, Target, TrendingUp, Clock, Star, Share2,
  Instagram, Youtube, Twitch, Twitter, Upload, Gamepad2, Layers, Hexagon, Shield, Sword
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';

// --- VISUAL COMPONENTS ---

// 2026 Liquid Glass Panel
const GlassPanel = ({ children, className = "", intensity = "medium", hoverEffect = false }) => {
  const intensities = {
    low: "bg-white/[0.02] border-white/5 backdrop-blur-md",
    medium: "bg-white/[0.04] border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
    high: "bg-white/[0.08] border-white/20 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
  };

  return (
    <div 
      className={`
        relative rounded-3xl overflow-hidden border ${intensities[intensity]}
        ${hoverEffect ? 'hover:bg-white/[0.08] hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-500' : ''}
        ${className}
      `}
    >
      {/* Iridescent Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Subtle Gradient Glow */}
      <div className="absolute -inset-full bg-gradient-to-br from-transparent via-white/[0.02] to-transparent rotate-45 pointer-events-none" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Stat Pill
const StatPill = ({ icon: Icon, label, value, color = "text-white" }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/20 border border-white/5">
    <div className={`p-2 rounded-xl bg-white/5 ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</div>
      <div className="text-sm font-bold text-white font-mono">{value}</div>
    </div>
  </div>
);

// Navigation Tab
const NavTab = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`
      relative group flex flex-col items-center gap-1 p-4 rounded-2xl transition-all duration-300
      ${active ? 'text-white' : 'text-white/40 hover:text-white/80'}
    `}
  >
    <div className={`
      p-3 rounded-2xl transition-all duration-500
      ${active ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 group-hover:bg-white/10'}
    `}>
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    
    {active && (
      <motion.div 
        layoutId="activeTabIndicator"
        className="absolute -bottom-2 w-1 h-1 rounded-full bg-white shadow-[0_0_10px_white]"
      />
    )}
  </button>
);

// --- MAIN COMPONENT ---

export default function UserProfileOverlay({ isOpen, onClose, profileUser, readOnly = false }) {
  const { user: authUser, avatar: authAvatar, updateUserData, refreshUserData } = useAuth();
  
  // Resolve User Data
  const displayUser = profileUser || authUser;
  const displayAvatar = profileUser ? (profileUser.avatar_data || {}) : authAvatar;
  const isSelf = !readOnly && (!profileUser || profileUser.id === authUser?.id);

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const headerOpacity = useTransform(scrollY, [0, 200], [0, 1]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.1]);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar_url: '',
    streaming_profile: { twitch_username: '', youtube_channel: '', twitter_handle: '', stream_bio: '' },
    social_profile: { tagline: '', favorite_games: [], playstyle: '' }
  });

  useEffect(() => {
    if (displayUser) {
      setFormData({
        username: displayUser.username || displayUser.full_name || '',
        bio: displayUser.bio || '',
        avatar_url: displayUser.avatar_url || '',
        streaming_profile: displayUser.streaming_profile || { twitch_username: '', youtube_channel: '', twitter_handle: '', stream_bio: '' },
        social_profile: displayUser.social_profile || { tagline: '', favorite_games: [], playstyle: '' }
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
      console.error('Failed to save:', error);
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
    } catch (error) { console.error('Upload failed:', error); }
  };

  if (!isOpen) return null;

  // Stats Calculation
  const stats = {
    score: displayUser?.gamer_score || displayUser?.score || 0,
    achievements: displayUser?.unlocked_achievements?.length || displayUser?.achievements || 0,
    playtime: displayUser?.total_playtime || 0,
    level: displayUser?.level || displayAvatar?.level || 1,
    followers: displayUser?.follower_count || 0,
    following: displayUser?.following_count || 0,
    games: displayUser?.purchased_items?.length || 0,
    influence: displayAvatar?.social_influence || 0
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="w-full h-full md:w-[95vw] md:h-[95vh] relative bg-[#050505] md:rounded-[40px] overflow-hidden shadow-2xl border border-white/5 flex flex-col md:flex-row"
          >
            
            {/* BACKGROUND AMBIENCE */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px]" />
              <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[150px]" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
            </div>

            {/* --- LEFT SIDEBAR: NAVIGATION --- */}
            <div className="hidden md:flex w-24 h-full flex-col items-center py-8 border-r border-white/5 bg-white/[0.01] backdrop-blur-xl z-20">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-12 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <Crown className="w-6 h-6 text-black" />
              </div>

              <div className="flex flex-col gap-4 flex-1">
                <NavTab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={User} label="Bio" />
                <NavTab active={activeTab === 'games'} onClick={() => setActiveTab('games')} icon={Gamepad2} label="Games" />
                <NavTab active={activeTab === 'social'} onClick={() => setActiveTab('social')} icon={Users} label="Social" />
                <NavTab active={activeTab === 'stream'} onClick={() => setActiveTab('stream')} icon={Radio} label="Live" />
              </div>

              <button onClick={onClose} className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 h-full relative overflow-hidden" ref={scrollRef}>
              <div className="absolute inset-0 overflow-y-auto no-scrollbar pb-32">
                
                {/* HERO SECTION */}
                <div className="relative h-[400px] w-full">
                  <motion.div style={{ scale: heroScale }} className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
                    <img 
                      src={displayUser?.banner_url || "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&q=80"} 
                      className="w-full h-full object-cover opacity-60" 
                      alt="Banner" 
                    />
                  </motion.div>

                  {/* Header Actions (Mobile Close & Edit) */}
                  <div className="absolute top-8 right-8 z-30 flex gap-3">
                    {isSelf && (
                      <GlassPanel intensity="low" className="backdrop-blur-md">
                        <Button 
                          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                          className="bg-transparent hover:bg-white/10 text-white border-none"
                        >
                          {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                          {isEditing ? (isSaving ? 'Saving...' : 'Save Profile') : 'Edit Profile'}
                        </Button>
                      </GlassPanel>
                    )}
                    <div className="md:hidden">
                      <Button variant="ghost" size="icon" onClick={onClose} className="bg-black/50 text-white rounded-full">
                        <X className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>

                  {/* Profile Info Overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col md:flex-row items-end gap-8">
                    
                    {/* Avatar Container */}
                    <div className="relative group">
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] p-1 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="w-full h-full rounded-[1.75rem] overflow-hidden bg-black relative">
                          {formData.avatar_url ? (
                            <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                              <User className="w-16 h-16 text-white" />
                            </div>
                          )}
                          
                          {/* Edit Overlay */}
                          {isEditing && (
                            <label className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="w-8 h-8 text-white" />
                              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                            </label>
                          )}
                        </div>
                      </div>
                      
                      {/* Level Badge */}
                      <div className="absolute -bottom-3 -right-3 px-4 py-1.5 bg-black rounded-full border border-white/20 flex items-center gap-2 shadow-xl">
                        <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-white">LVL {stats.level}</span>
                      </div>
                    </div>

                    {/* Name & Bio */}
                    <div className="flex-1 mb-2">
                      <div className="flex items-center gap-3 mb-2">
                        {isEditing ? (
                          <Input 
                            value={formData.username} 
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            className="bg-white/10 border-white/20 text-3xl font-black text-white h-auto py-2"
                          />
                        ) : (
                          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                            {formData.username || 'Anonymous User'}
                          </h1>
                        )}
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-md px-3 py-1">PRO</Badge>
                      </div>

                      {isEditing ? (
                        <Textarea 
                          value={formData.bio}
                          onChange={e => setFormData({...formData, bio: e.target.value})}
                          className="bg-white/10 border-white/20 text-white/80 max-w-lg"
                          placeholder="Write a bio..."
                        />
                      ) : (
                        <p className="text-lg text-white/60 font-medium max-w-xl leading-relaxed">
                          {formData.bio || formData.social_profile.tagline || "No bio yet."}
                        </p>
                      )}
                    </div>

                    {/* Quick Stats Row */}
                    <div className="flex gap-3">
                      <GlassPanel intensity="low" className="px-5 py-3 flex flex-col items-center min-w-[100px]">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Score</span>
                        <span className="text-2xl font-black text-white">{stats.score.toLocaleString()}</span>
                      </GlassPanel>
                      <GlassPanel intensity="low" className="px-5 py-3 flex flex-col items-center min-w-[100px]">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Rank</span>
                        <span className="text-2xl font-black text-white">#{(displayUser.rank || 42).toLocaleString()}</span>
                      </GlassPanel>
                    </div>
                  </div>
                </div>

                {/* CONTENT TABS */}
                <div className="px-8 md:px-12 py-8 max-w-7xl mx-auto space-y-12">
                  
                  {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      
                      {/* Left Column: Stats & Attributes */}
                      <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <ActivityIcon className="w-5 h-5 text-blue-400" /> Performance
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          <StatPill icon={Flame} label="Gamer Score" value={stats.score} color="text-orange-400" />
                          <StatPill icon={Trophy} label="Achievements" value={stats.achievements} color="text-yellow-400" />
                          <StatPill icon={Clock} label="Playtime" value={`${stats.playtime}h`} color="text-cyan-400" />
                          <StatPill icon={Users} label="Followers" value={stats.followers} color="text-purple-400" />
                        </div>

                        <GlassPanel className="p-6">
                          <h4 className="text-sm font-bold text-white/60 mb-4 uppercase">Playstyle Analysis</h4>
                          <div className="flex flex-wrap gap-2">
                            {['Aggressive', 'Tactical', 'Team Player', 'Explorer'].map(tag => (
                              <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/70">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </GlassPanel>
                      </div>

                      {/* Middle Column: Recent Activity / Featured */}
                      <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-400" /> Featured Showcase
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <GlassPanel intensity="medium" hoverEffect className="aspect-video relative group cursor-pointer">
                            <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            <div className="absolute bottom-6 left-6">
                              <Badge className="bg-red-500 hover:bg-red-600 border-none mb-2">Last Played</Badge>
                              <h4 className="text-2xl font-bold text-white">Cyberpunk 2088</h4>
                              <p className="text-white/60 text-sm">Session ended 2h ago</p>
                            </div>
                          </GlassPanel>

                          <GlassPanel intensity="medium" hoverEffect className="aspect-video relative group cursor-pointer p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                              <Badge variant="outline" className="border-yellow-500/30 text-yellow-200">Rarest Trophy</Badge>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-white mb-1">God of War</h4>
                              <p className="text-white/50 text-xs">Unlocked "Apex Predator" (0.1% of players)</p>
                            </div>
                          </GlassPanel>
                        </div>

                        {/* Recent Achievements List */}
                        <div className="space-y-3 pt-4">
                          <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Recent Unlocks</h4>
                          {[1, 2, 3].map((i) => (
                            <GlassPanel key={i} intensity="low" hoverEffect className="p-4 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                                <Shield className="w-6 h-6 text-white/80" />
                              </div>
                              <div className="flex-1">
                                <h5 className="text-white font-bold">Master of the Arena</h5>
                                <p className="text-white/40 text-xs">Won 50 ranked matches in a row</p>
                              </div>
                              <div className="text-right">
                                <span className="text-yellow-400 font-bold text-sm">+50 G</span>
                                <div className="text-white/20 text-[10px]">2h ago</div>
                              </div>
                            </GlassPanel>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'games' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <GlassPanel key={i} intensity="medium" hoverEffect className="aspect-[3/4] relative group cursor-pointer">
                          <img 
                            src={`https://images.unsplash.com/photo-${1550000000000 + i}?w=500&auto=format&fit=crop`} 
                            className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h4 className="text-white font-bold truncate">Game Title {i+1}</h4>
                            <div className="flex items-center justify-between text-xs text-white/60 mt-1">
                              <span>Lvl 42</span>
                              <span>85%</span>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-white w-[85%]" />
                            </div>
                          </div>
                        </GlassPanel>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'stream' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                      <div className="w-24 h-24 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_50px_rgba(147,51,234,0.3)]">
                        <Twitch className="w-10 h-10 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-white mb-2">Offline</h3>
                        <p className="text-white/40 max-w-md mx-auto">
                          {formData.streaming_profile.twitch_username 
                            ? `${formData.streaming_profile.twitch_username} is currently offline. Check back later!`
                            : "This user hasn't linked a streaming account yet."}
                        </p>
                      </div>
                      {formData.streaming_profile.twitch_username && (
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8">
                          Visit Channel
                        </Button>
                      )}
                    </motion.div>
                  )}

                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Icon helper
const ActivityIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
);