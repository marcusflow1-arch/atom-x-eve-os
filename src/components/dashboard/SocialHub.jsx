import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Video, MessageSquare, Share2, ThumbsUp, Clock, Star, Coins,
  ShoppingBag, Sparkles, Radio, Phone, Monitor, Gamepad2, Trophy,
  Send, Image, Film, Plus, Search, Filter, TrendingUp, Target, Zap,
  Shield, Sword, Package, ArrowLeftRight, CheckCircle, AlertCircle,
  Eye, Award, PlayCircle, User, Bot, Calendar, DollarSign, HandshakeIcon,
  ChevronRight, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SmartContract from './SmartContract';

// Mock Data
const mockPosts = [
  {
    id: 1,
    user: { name: 'Shadow_Striker', avatar: 'https://i.pravatar.cc/150?u=1', level: 45 },
    aiCommentary: { 
      message: 'I learned the boss attack pattern at 32% health. New "Evasion Algorithm" acquired.', 
      ability: 'Evasion Algorithm',
      skill_upgrades: ['Combat Prowess +3', 'Pattern Recognition +5'],
      summary: 'Epic takedown of the raid boss using advanced evasion tactics.',
      narrative_elements: ['The Hero\'s Journey', 'Overcoming Impossible Odds']
    },
    playerPost: { text: 'Finally beat the raid boss!', video: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop' },
    likes: 127,
    comments: 23,
    timestamp: '2 hours ago'
  },
  {
    id: 2,
    user: { name: 'CyberVixen', avatar: 'https://i.pravatar.cc/150?u=2', level: 38 },
    aiCommentary: { 
      message: 'Auto-inventory management upgraded. Resource efficiency +25%.', 
      ability: 'Smart Inventory',
      skill_upgrades: ['Resource Management +4', 'Efficiency +2'],
      summary: 'Streamlined inventory system for maximum looting potential.',
      narrative_elements: ['Technological Advancement', 'Preparation for War']
    },
    playerPost: { text: 'My Eve just evolved to Level 50 Intelligence. She can now auto-manage my inventory in RPGs!', video: null },
    likes: 89,
    comments: 15,
    timestamp: '4 hours ago'
  }
];

const mockContracts = [
  { id: 1, user: 'GhostReaper', role: 'Healer', game: 'World of Warcraft', duration: '2 hours', tokens: 2, rating: 4.8, status: 'active' },
  { id: 2, user: 'IronFist', role: 'Tank', game: 'Overwatch', duration: '1 hour', tokens: 1, rating: 4.5, status: 'pending' },
  { id: 3, user: 'NovaStar', role: 'DPS', game: 'Final Fantasy XIV', duration: '3 hours', tokens: 3, rating: 5.0, status: 'completed' }
];

const mockAbilities = [
  { id: 1, name: 'Sniper Precision', game: 'Call of Duty', rarity: 'Epic', icon: '🎯', tradeable: true, value: 5 },
  { id: 2, name: 'Resource Management', game: 'Starcraft', rarity: 'Rare', icon: '📊', tradeable: true, value: 3 },
  { id: 3, name: 'Auto-Looting Script', game: 'Diablo', rarity: 'Legendary', icon: '💎', tradeable: true, value: 8 },
  { id: 4, name: 'Stealth Pathfinding', game: 'Assassins Creed', rarity: 'Epic', icon: '🥷', tradeable: true, value: 6 }
];

// Components
const DualPost = ({ post, onLike, onFollow, onUnfollow, currentUser, isFollowing }) => {
  const [showComments, setShowComments] = useState(false);
  
  // Fetch comments when expanded
  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => base44.entities.Comment.filter({ target_id: post.id }),
    enabled: showComments,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Comment.create({
        target_id: post.id,
        target_type: 'memory',
        content: data.content,
        user_id: currentUser.id
      });
      // Update memory comment count
      await base44.entities.Memory.update(post.id, {
        comments_count: (post.comments_count || 0) + 1
      });
    },
    onSuccess: () => {
      refetchComments();
    }
  });

  // Safe accessors
  const user = post.author || post.user || { name: 'Unknown', avatar_url: null, level: 1 };
  const username = user.username || user.name || 'Unknown';
  const avatarUrl = user.avatar_url || user.avatar || 'https://i.pravatar.cc/150?u=default';
  const level = user.level || 1;
  
  const aiAnalysis = post.ai_analysis || post.aiCommentary || {};
  const message = aiAnalysis.message;
  const summary = aiAnalysis.summary;
  const skillUpgrades = aiAnalysis.skill_upgrades;
  const narrativeElements = aiAnalysis.narrative_elements;
  const ability = aiAnalysis.ability;

  const isSelf = currentUser?.id === post.user_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden mb-4"
    >
      {/* User Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={avatarUrl} alt={username} className="w-10 h-10 rounded-full object-cover" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
              {level}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold">{username}</p>
              {!isSelf && (
                isFollowing ? (
                  <button onClick={() => onUnfollow(post.user_id)} className="text-xs text-slate-400 hover:text-red-400">Unfollow</button>
                ) : (
                  <button onClick={() => onFollow(post.user_id)} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">+ Follow</button>
                )
              )}
            </div>
            <p className="text-slate-400 text-xs">{new Date(post.created_date || Date.now()).toLocaleString()}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Player View */}
      <div className="px-4 pb-3">
        <p className="text-white mb-3">{post.description || post.playerPost?.text}</p>
        {(post.media_url || post.playerPost?.video) && (
          <img src={post.media_url || post.playerPost?.video} alt="Post" className="w-full rounded-lg" />
        )}
      </div>

      {/* AI Commentary Section */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-y border-blue-500/30 p-3">
        <div className="flex items-start gap-3">
          <Bot className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-3">
            
            {/* Original Message & Summary */}
            <div>
               <p className="text-blue-400 font-semibold text-sm mb-1">AI Analysis</p>
               <p className="text-white font-medium text-sm mb-1">"{summary || message}"</p>
               {message && summary && (
                  <p className="text-slate-400 text-xs italic">"{message}"</p>
               )}
            </div>

            {/* Skill Upgrades */}
            {skillUpgrades && (
              <div>
                <p className="text-green-400 font-semibold text-xs mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Suggested Upgrades
                </p>
                <div className="flex flex-wrap gap-2">
                  {skillUpgrades.map((upgrade, i) => (
                    <Badge key={i} className="bg-green-500/20 text-green-300 border-green-500/50 text-[10px]">
                      {upgrade}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Narrative Elements */}
            {narrativeElements && (
              <div>
                <p className="text-purple-400 font-semibold text-xs mb-1 flex items-center gap-1">
                  <Film className="w-3 h-3" /> Narrative Arcs
                </p>
                <div className="flex flex-wrap gap-2">
                  {narrativeElements.map((element, i) => (
                    <Badge key={i} className="bg-purple-500/20 text-purple-300 border-purple-500/50 text-[10px]">
                      {element}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
             
            {/* Legacy Ability Badge */}
            {ability && !skillUpgrades && (
              <Badge className="mt-2 bg-purple-600/30 text-purple-400 border-purple-500/50">
                <Sparkles className="w-3 h-3 mr-1" />
                {ability}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 flex items-center gap-4 border-b border-slate-700/50">
        <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center gap-2 ${post.is_liked ? 'text-blue-400' : 'text-slate-400'}`}
            onClick={() => onLike(post)}
        >
          <ThumbsUp className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
          {post.likes_count || post.likes || 0}
        </Button>
        <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 text-slate-400"
            onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="w-4 h-4" />
          {post.comments_count || post.comments || 0}
        </Button>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="p-4 bg-slate-900/30">
             <CommentSection 
                postId={post.id}
                comments={comments ? comments.data.map(c => ({...c, created_by: c.created_by || 'Unknown'})) : []}
                onAddComment={(data) => addCommentMutation.mutate(data)}
                onVote={() => {}} 
             />
        </div>
      )}
    </motion.div>
  );
};

const ContractCard = ({ contract, onAccept }) => {
  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/50',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
  };

  return (
    <div className="bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-semibold flex items-center gap-2">
            {contract.user}
            <Badge className={statusColors[contract.status]}>
              {contract.status}
            </Badge>
          </p>
          <p className="text-slate-400 text-sm">{contract.game}</p>
        </div>
        <div className="flex items-center gap-1 text-yellow-400">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm font-semibold">{contract.rating}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm mb-3">
        <div className="flex items-center gap-1 text-slate-300">
          <Shield className="w-4 h-4" />
          <span>{contract.role}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-300">
          <Clock className="w-4 h-4" />
          <span>{contract.duration}</span>
        </div>
        <div className="flex items-center gap-1 text-blue-400 font-semibold">
          <Coins className="w-4 h-4" />
          <span>{contract.tokens} Tokens</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          size="sm" 
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          onClick={() => onAccept(contract)}
        >
          Accept
        </Button>
        <Button size="sm" className="flex-1 bg-white/10 text-white hover:bg-blue-600 border-white/10 backdrop-blur-sm">
          Details
        </Button>
      </div>
    </div>
  );
};

const AbilityCard = ({ ability }) => {
  const rarityColors = {
    Common: 'bg-slate-600/30 border-slate-500/50',
    Rare: 'bg-blue-600/30 border-blue-500/50',
    Epic: 'bg-purple-600/30 border-purple-500/50',
    Legendary: 'bg-orange-600/30 border-orange-500/50'
  };

  return (
    <div className={`rounded-lg border p-3 ${rarityColors[ability.rarity]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{ability.icon}</span>
        <Badge className="text-xs">{ability.rarity}</Badge>
      </div>
      <p className="text-white font-semibold text-sm mb-1">{ability.name}</p>
      <p className="text-slate-400 text-xs mb-2">{ability.game}</p>
      <div className="flex items-center justify-between">
        <span className="text-blue-400 text-sm font-bold">{ability.value} Tokens</span>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          Trade
        </Button>
      </div>
    </div>
  );
};

export default function SocialHub() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('feed');
  const [newPost, setNewPost] = useState('');
  const [showContract, setShowContract] = useState(false);
  const [momentumStatus, setMomentumStatus] = useState('In the Zone');
  const [isEconomyOpen, setIsEconomyOpen] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. Fetch Social Feed
  const { data: feedData, isLoading: isFeedLoading } = useQuery({
    queryKey: ['socialFeed'],
    queryFn: async () => {
        const res = await base44.functions.invoke('getSocialFeed');
        return res.data.data;
    }
  });

  // 2. Fetch Follows
  const { data: followsData, refetch: refetchFollows } = useQuery({
    queryKey: ['myFollows'],
    queryFn: () => base44.entities.Follow.filter({ follower_id: user?.id }),
    enabled: !!user
  });

  const followingIds = followsData?.data?.map(f => f.followed_id) || [];

  // 3. Mutations
  const createMemoryMutation = useMutation({
    mutationFn: async (memoryData) => {
       await base44.entities.Memory.create(memoryData);
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['socialFeed']);
        setNewPost('');
    }
  });

  const followMutation = useMutation({
    mutationFn: async (targetId) => {
        await base44.entities.Follow.create({
            follower_id: user.id,
            followed_id: targetId
        });
    },
    onSuccess: (_, targetId) => {
        refetchFollows();
        queryClient.invalidateQueries(['socialFeed']);
        // Gamification: Award XP to followed user
        base44.functions.invoke('gamification', { action: 'receive_follow', targetUserId: targetId });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetId) => {
        // Need to find the follow record ID first
        const record = followsData.data.find(f => f.followed_id === targetId);
        if (record) {
            await base44.entities.Follow.delete(record.id);
        }
    },
    onSuccess: () => {
        refetchFollows();
        queryClient.invalidateQueries(['socialFeed']);
    }
  });

  const likeMutation = useMutation({
    mutationFn: async (post) => {
        if (post.is_liked) {
             const reactions = await base44.entities.Reaction.filter({ 
                target_id: post.id, 
                user_id: user.id,
                type: 'like'
            });
            if (reactions.data.length > 0) {
                await base44.entities.Reaction.delete(reactions.data[0].id);
                await base44.entities.Memory.update(post.id, { likes_count: Math.max(0, (post.likes_count || 0) - 1) });
            }
        } else {
            await base44.entities.Reaction.create({
                user_id: user.id,
                target_id: post.id,
                target_type: 'memory',
                type: 'like'
            });
            await base44.entities.Memory.update(post.id, { likes_count: (post.likes_count || 0) + 1 });
            
            // Gamification: Award XP to post owner
            if (post.user_id !== user.id) {
                base44.functions.invoke('gamification', { action: 'receive_like', targetUserId: post.user_id });
            }
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['socialFeed']);
    }
  });

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setIsAnalyzing(true);

    try {
      // Call AI Analysis Backend Function
      const analysisRes = await base44.functions.invoke('analyzeMemory', { 
        content: newPost,
        game_context: "General Gaming" 
      });

      const analysis = analysisRes.data;

      // Create Memory Entity
      createMemoryMutation.mutate({
          user_id: user.id,
          title: "Memory",
          description: newPost,
          media_url: "", // No media for now
          media_type: "image",
          game_name: "General",
          ai_analysis: analysis,
          likes_count: 0,
          comments_count: 0
      });
      
      // Gamification: Award XP for posting
      base44.functions.invoke('gamification', { action: 'post_memory' }).then(res => {
          if (res.data.leveledUp) {
              // Ideally show a toast here
              console.log("Leveled Up!", res.data.newLevel);
          }
      });

    } catch (error) {
      console.error("Analysis failed:", error);
      // Create without analysis
      createMemoryMutation.mutate({
          user_id: user.id,
          title: "Memory",
          description: newPost,
          media_url: "",
          media_type: "image",
          game_name: "General",
          ai_analysis: { message: "Analysis unavailable" },
          likes_count: 0,
          comments_count: 0
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex gap-4 relative">
      {/* LEFT COLUMN - Navigation */}
      <div className="w-64 space-y-3 flex-shrink-0">
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700/50">
            <div className="relative">
              <img 
                src={user?.avatar_url || 'https://i.pravatar.cc/150?u=default'} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-slate-900">
                 {user?.level || 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                  <p className="text-white font-semibold truncate">{user?.username || 'Player'}</p>
                  <span className="text-xs text-slate-400">Lvl {user?.level || 1}</span>
              </div>
              
              {/* XP Bar */}
              <div className="w-full bg-slate-700/50 h-2 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full" 
                    style={{ width: `${Math.min(100, ((user?.xp || 0) % 100))}%` }} // Simplified progress visual
                  />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>{user?.xp || 0} XP</span>
                  <span>Next Lvl</span>
              </div>
            </div>
          </div>
          
          {user?.badges && user.badges.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2 px-1">
                {user.badges.map(b => (
                    <span key={b} title={b} className="text-lg cursor-help">
                        {b === 'storyteller' ? '📖' : b === 'novice_gamer' ? '🎮' : '🏅'}
                    </span>
                ))}
            </div>
          )}

          <nav className="space-y-2">
            <Button
              variant={activeTab === 'feed' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('feed')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Life Feed
            </Button>
            <Button
              variant={activeTab === 'holodeck' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('holodeck')}
            >
              <Video className="w-4 h-4 mr-2" />
              The Holodeck
            </Button>
            <Button
              variant={activeTab === 'groups' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('groups')}
            >
              <Users className="w-4 h-4 mr-2" />
              Guilds & Teams
            </Button>
            <Button
              variant={activeTab === 'live' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('live')}
            >
              <Radio className="w-4 h-4 mr-2" />
              Live Activities
            </Button>
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
          <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button size="sm" className="w-full justify-start" variant="outline">
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Stream
            </Button>
            <Button size="sm" className="w-full justify-start" variant="outline">
              <HandshakeIcon className="w-4 h-4 mr-2" />
              Post Contract
            </Button>
            <Button size="sm" className="w-full justify-start" variant="outline">
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Trade Ability
            </Button>
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN - The Feed */}
      <div className="flex-1 overflow-y-auto pr-2">
        {activeTab === 'feed' && (
          <>
            {/* Post Creator */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 mb-4">
              <div className="flex items-start gap-3 mb-3">
                <img 
                  src={user?.avatar_url || 'https://i.pravatar.cc/150?u=default'} 
                  alt="You" 
                  className="w-10 h-10 rounded-full"
                />
                <Input
                  placeholder="Share your victory, ask for help, or post a clip..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="flex-1 bg-slate-700/50 border-slate-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Film className="w-4 h-4 mr-1" />
                  Video
                </Button>
                <Button size="sm" variant="outline">
                  <Image className="w-4 h-4 mr-1" />
                  Image
                </Button>
                <Button 
                  size="sm" 
                  className="ml-auto bg-blue-600 hover:bg-blue-700"
                  onClick={handlePost}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-1 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      Post & Analyze
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Feed */}
            <div className="space-y-4">
              {isFeedLoading ? (
                 <div className="text-center py-10 text-slate-400">Loading feed...</div>
              ) : feedData && feedData.length > 0 ? (
                 feedData.map((post) => (
                    <DualPost 
                        key={post.id} 
                        post={post} 
                        currentUser={user}
                        onLike={(p) => likeMutation.mutate(p)}
                        onFollow={(id) => followMutation.mutate(id)}
                        onUnfollow={(id) => unfollowMutation.mutate(id)}
                        isFollowing={followingIds.includes(post.user_id)}
                    />
                 ))
              ) : (
                 <div className="text-center py-10 text-slate-400">No memories found. Be the first to post!</div>
              )}
            </div>
          </>
        )}

        {activeTab === 'holodeck' && (
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-black text-white mb-4">The Holodeck</h2>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-left"
              >
                <Monitor className="w-8 h-8 text-white mb-3" />
                <h3 className="text-white font-bold mb-1">Screen Share</h3>
                <p className="text-blue-200 text-sm">Over-the-shoulder view with friends</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-left"
              >
                <Gamepad2 className="w-8 h-8 text-white mb-3" />
                <h3 className="text-white font-bold mb-1">Co-Pilot Mode</h3>
                <p className="text-purple-200 text-sm">Let friends control your game</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 text-left"
              >
                <Target className="w-8 h-8 text-white mb-3" />
                <h3 className="text-white font-bold mb-1">War Room</h3>
                <p className="text-green-200 text-sm">Group planning with strategy board</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-6 text-left"
              >
                <Video className="w-8 h-8 text-white mb-3" />
                <h3 className="text-white font-bold mb-1">Video Chat</h3>
                <p className="text-orange-200 text-sm">Face-to-face with party</p>
              </motion.button>
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-black text-white mb-4">Your Guilds & Teams</h2>
            <p className="text-slate-400">Guild system coming soon...</p>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-black text-white mb-4">Live Activities</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <div>
                    <p className="text-white font-semibold">Shadow_Striker</p>
                    <p className="text-slate-400 text-sm">streaming Cyberpunk 2088</p>
                  </div>
                </div>
                <Badge className="bg-orange-500/20 text-orange-400">In the Zone</Badge>
                <Button size="sm" className="ml-auto">Watch</Button>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div>
                    <p className="text-white font-semibold">CyberVixen</p>
                    <p className="text-slate-400 text-sm">in menu</p>
                  </div>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400">Looting</Badge>
                <Button size="sm" variant="outline">Invite</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Button for Economy Sidebar */}
      <div className="absolute right-0 top-0 z-10">
        {!isEconomyOpen && (
          <Button
            onClick={() => setIsEconomyOpen(true)}
            className="bg-white/10 text-white hover:bg-blue-600 backdrop-blur-sm border border-white/10"
            size="sm"
          >
            <HandshakeIcon className="w-4 h-4 mr-2" />
            Economy
          </Button>
        )}
      </div>

      {/* RIGHT COLUMN - The Economy */}
      <motion.div 
        initial={{ width: 384, opacity: 1 }}
        animate={{ 
          width: isEconomyOpen ? 384 : 0,
          opacity: isEconomyOpen ? 1 : 0,
          display: isEconomyOpen ? 'block' : 'none'
        }}
        className="space-y-4 flex-shrink-0 overflow-hidden"
      >
        <div className="flex justify-end">
           <Button
            onClick={() => setIsEconomyOpen(false)}
            className="bg-white/10 text-white hover:bg-blue-600 backdrop-blur-sm border border-white/10 w-full mb-2"
            size="sm"
          >
            Hide Economy <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Active Contracts */}
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <HandshakeIcon className="w-5 h-5 text-blue-400" />
              Active Contracts
            </h3>
            <Badge className="bg-blue-600/30 text-blue-400">3 Active</Badge>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mockContracts.map((contract) => (
              <ContractCard 
                key={contract.id} 
                contract={contract} 
                onAccept={() => setShowContract(true)}
              />
            ))}
          </div>
        </div>

        {/* The Vault - Tradeable Abilities */}
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              The Vault
            </h3>
            <Button size="sm" className="bg-white/10 text-white hover:bg-blue-600 border-white/10 backdrop-blur-sm">
              View All
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {mockAbilities.map((ability) => (
              <AbilityCard key={ability.id} ability={ability} />
            ))}
          </div>
        </div>

        {/* Marketplace Hot Trades */}
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
          <h3 className="text-white font-bold flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Hot Trades
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
              <span className="text-slate-300">Stealth Pathfinding</span>
              <span className="text-green-400 font-bold">↑ 6 Tokens</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
              <span className="text-slate-300">Auto-Looting Script</span>
              <span className="text-red-400 font-bold">↓ 8 Tokens</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Smart Contract Modal */}
      {showContract && (
        <SmartContract
          contract={{
            client: { name: 'GhostReaper', avatar: '👻' },
            worker: { name: user?.username || 'You', avatar: user?.avatar_url || '⚔️', successRate: '95%' },
            objective: 'Carry through "Malenia" Boss Fight',
            duration: '2 Hours',
            reward: { tokens: 1, item: 'Rare Sword' },
            failureCondition: 'If boss is not defeated, only 50% of tokens paid'
          }}
          onAccept={() => {
            setShowContract(false);
            alert('Contract accepted! Mission tracking started.');
          }}
          onReject={() => setShowContract(false)}
        />
      )}
    </div>
  );
}