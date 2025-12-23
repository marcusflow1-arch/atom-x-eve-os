import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Video, MessageSquare, Share2, ThumbsUp, Clock, Star, Coins,
  ShoppingBag, Sparkles, Radio, Phone, Monitor, Gamepad2, Trophy,
  Send, Image, Film, Plus, Search, Filter, TrendingUp, Target, Zap,
  Shield, Sword, Package, ArrowLeftRight, CheckCircle, AlertCircle,
  Eye, Award, PlayCircle, User, Bot, Calendar, DollarSign, HandshakeIcon,
  ChevronRight, ChevronLeft, LayoutGrid, X
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

// Mock Friends List
const mockFriends = [
  { id: 1, name: 'Shadow_Striker', avatar: 'https://i.pravatar.cc/150?u=1', status: 'online', game: 'Cyberpunk 2088' },
  { id: 2, name: 'CyberVixen', avatar: 'https://i.pravatar.cc/150?u=2', status: 'online', game: 'Final Fantasy XIV' },
  { id: 3, name: 'GhostReaper', avatar: 'https://i.pravatar.cc/150?u=3', status: 'idle' },
  { id: 4, name: 'IronFist', avatar: 'https://i.pravatar.cc/150?u=4', status: 'offline' },
  { id: 5, name: 'NovaStar', avatar: 'https://i.pravatar.cc/150?u=5', status: 'online', game: 'League of Legends' }
];

// Mock Live Activities
const mockLiveActivities = [
  { id: 1, user: 'Shadow_Striker', action: 'defeated', target: 'Raid Boss', game: 'Elden Ring', time: '2 min ago', icon: Trophy },
  { id: 2, user: 'CyberVixen', action: 'started streaming', target: 'Cyberpunk 2088', time: '5 min ago', icon: Video },
  { id: 3, user: 'GhostReaper', action: 'completed', target: 'Weekly Challenge', game: 'Destiny 2', time: '10 min ago', icon: CheckCircle },
  { id: 4, user: 'NovaStar', action: 'unlocked', target: 'Legendary Skin', game: 'Valorant', time: '15 min ago', icon: Award }
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

// Comment Section Component
const CommentSection = ({ postId, comments, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment({ content: newComment });
    setNewComment('');
  };

  return (
    <div className="space-y-3">
      {comments && comments.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <img 
                src={`https://i.pravatar.cc/150?u=${comment.user_id}`} 
                alt="User" 
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 bg-slate-700/30 rounded-lg p-2">
                <p className="text-white font-semibold text-xs">{comment.created_by}</p>
                <p className="text-white/80 text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          className="flex-1 bg-slate-700/50 border-slate-600 text-sm"
        />
        <Button size="sm" onClick={handleSubmit}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

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
  const [newPost, setNewPost] = useState('');
  const [showContract, setShowContract] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [activeView, setActiveView] = useState('feed'); // 'feed' or 'marketplace'

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
    <div className="h-full flex flex-col" style={{
      background: 'rgba(100, 120, 140, 0.08)',
      backdropFilter: 'blur(25px) saturate(140%)',
      WebkitBackdropFilter: 'blur(25px) saturate(140%)'
    }}>
      {/* Top Navigation Bar - Translucent */}
      <div className="flex items-center gap-4 px-6 py-4" style={{
        background: 'transparent',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <h2 className="text-xl font-bold text-white/60 mr-4">Social Hub</h2>
        <div className="h-6 w-px bg-white/10" />
        <button
          onClick={() => setActiveView('feed')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            activeView === 'feed'
              ? 'text-white'
              : 'text-white/50 hover:text-white/80'
          }`}
          style={activeView === 'feed' ? {
            background: 'rgba(255, 255, 255, 0.10)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          } : {
            background: 'transparent',
            border: '1px solid transparent'
          }}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Feed
        </button>
        <button
          onClick={() => setActiveView('marketplace')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            activeView === 'marketplace'
              ? 'text-white'
              : 'text-white/50 hover:text-white/80'
          }`}
          style={activeView === 'marketplace' ? {
            background: 'rgba(255, 255, 255, 0.10)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          } : {
            background: 'transparent',
            border: '1px solid transparent'
          }}
        >
          <ShoppingBag className="w-4 h-4 inline mr-2" />
          Marketplace
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {activeView === 'feed' ? (
          <>
            {/* LEFT SIDEBAR - User Profile & Friends */}
            <div className="w-80 space-y-4 flex-shrink-0 overflow-y-auto">
        {/* User Profile Card */}
        <div className="backdrop-blur-xl rounded-xl p-6" style={{
          background: 'rgba(100, 120, 140, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
        }}>
          <div className="text-center mb-4">
            <div className="relative inline-block mb-3">
              <img 
                src={user?.avatar_url || 'https://i.pravatar.cc/150?u=default'} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 rounded-full px-3 py-1 text-xs font-bold text-white">
                Level {user?.level || 1}
              </div>
            </div>
            <h2 className="text-xl font-bold text-white">{user?.username || 'Player'}</h2>
            <p className="text-slate-400 text-sm">Gameverse Explorer</p>
          </div>

          {/* XP Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{user?.xp || 0} XP</span>
              <span>Next Level</span>
            </div>
            <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all" 
                style={{ width: `${Math.min(100, ((user?.xp || 0) % 100))}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-700/30 rounded-lg">
            <div className="text-center">
              <p className="text-white font-bold text-lg">245</p>
              <p className="text-slate-400 text-xs">Friends</p>
            </div>
            <div className="text-center border-x border-slate-600">
              <p className="text-white font-bold text-lg">1.2K</p>
              <p className="text-slate-400 text-xs">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">89</p>
              <p className="text-slate-400 text-xs">Games</p>
            </div>
          </div>

          {/* Badges */}
          {user?.badges && user.badges.length > 0 && (
            <div className="flex gap-2 justify-center flex-wrap mb-4">
              {user.badges.map(b => (
                <span key={b} title={b} className="text-2xl cursor-help">
                  {b === 'storyteller' ? '📖' : b === 'novice_gamer' ? '🎮' : '🏅'}
                </span>
              ))}
            </div>
          )}

          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <User className="w-4 h-4 mr-2" />
            View Full Profile
          </Button>
        </div>

        {/* Friends List */}
        <div className="backdrop-blur-xl rounded-xl p-4" style={{
          background: 'rgba(71, 85, 105, 0.25)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 4px 16px rgba(71, 85, 105, 0.3)'
        }}>
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Friends
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {mockFriends.map(friend => (
              <div key={friend.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer">
                <div className="relative">
                  <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${
                    friend.status === 'online' ? 'bg-green-500' : friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{friend.name}</p>
                  {friend.game ? (
                    <p className="text-blue-400 text-xs truncate">{friend.game}</p>
                  ) : (
                    <p className="text-slate-500 text-xs">Offline</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activities */}
        <div className="backdrop-blur-xl rounded-xl p-4" style={{
          background: 'rgba(100, 120, 140, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
        }}>
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-400" />
            Live Activities
          </h3>
          <div className="space-y-2">
            {mockLiveActivities.map(activity => (
              <div key={activity.id} className="flex items-start gap-2 p-2 bg-slate-700/20 rounded-lg">
                <activity.icon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs">
                    <span className="font-semibold">{activity.user}</span> {activity.action}{' '}
                    <span className="text-blue-400">{activity.target}</span>
                    {activity.game && <span className="text-slate-400"> in {activity.game}</span>}
                  </p>
                  <p className="text-slate-500 text-[10px]">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER COLUMN - For You Feed */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Post Creator */}
        <div className="backdrop-blur-xl rounded-xl p-4" style={{
          background: 'rgba(100, 120, 140, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
        }}>
          <div className="flex items-start gap-3 mb-4">
            <img 
              src={user?.avatar_url || 'https://i.pravatar.cc/150?u=default'} 
              alt="You" 
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <Input
                placeholder="What's on your mind, Gamer?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="bg-slate-700/50 border-slate-600 mb-3"
              />
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedMedia('video')}
                >
                  <Video className="w-4 h-4 mr-1" />
                  Live Video
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedMedia('photo')}
                >
                  <Image className="w-4 h-4 mr-1" />
                  Photo
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
                    'Post'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="space-y-4">
          {isFeedLoading ? (
            <div className="text-center py-16 text-slate-400">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              Loading your feed...
            </div>
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
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-16 text-center">
              <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">Welcome to the Gameverse!</h3>
              <p className="text-slate-400">No posts yet. Be the first to share your gaming journey!</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - Active Contracts */}
      <div className="w-80 space-y-4 flex-shrink-0 overflow-y-auto">
        {/* Active Contracts */}
        <div className="backdrop-blur-xl rounded-xl p-4" style={{
          background: 'rgba(100, 120, 140, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <HandshakeIcon className="w-5 h-5 text-cyan-400" />
              Active Contracts
            </h3>
            <Badge className="bg-blue-600/30 text-blue-400">3</Badge>
          </div>
          <div className="space-y-3">
            {mockContracts.map((contract) => (
              <ContractCard 
                key={contract.id} 
                contract={contract} 
                onAccept={() => setShowContract(true)}
              />
            ))}
          </div>
          <Button size="sm" className="w-full mt-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300">
            View All Contracts
          </Button>
        </div>

        {/* The Vault - Tradeable Abilities */}
        <div className="backdrop-blur-xl rounded-xl p-4" style={{
          background: 'rgba(100, 120, 140, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              The Vault
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {mockAbilities.slice(0, 4).map((ability) => (
              <AbilityCard key={ability.id} ability={ability} />
            ))}
          </div>
          <Button size="sm" className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300">
            Trade Items
          </Button>
        </div>

        {/* Marketplace Hot Trades */}
        <div className="backdrop-blur-xl rounded-xl p-4" style={{
          background: 'rgba(100, 120, 140, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
        }}>
          <h3 className="text-white font-bold flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Hot Trades
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded hover:bg-slate-700/50 transition-colors cursor-pointer">
              <span className="text-slate-300">Stealth Pathfinding</span>
              <span className="text-green-400 font-bold">↑ 6 Tokens</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded hover:bg-slate-700/50 transition-colors cursor-pointer">
              <span className="text-slate-300">Auto-Looting Script</span>
              <span className="text-red-400 font-bold">↓ 8 Tokens</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded hover:bg-slate-700/50 transition-colors cursor-pointer">
              <span className="text-slate-300">Combat Prowess</span>
              <span className="text-green-400 font-bold">↑ 4 Tokens</span>
            </div>
          </div>
        </div>
      </div>
          </>
        ) : (
          /* MARKETPLACE VIEW */
          <MarketplaceView user={user} />
        )}
      </div>
      
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

// Marketplace View Component
const MarketplaceView = ({ user }) => {
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

  const categories = [
    { id: 'all', name: 'All Items', icon: LayoutGrid },
    { id: 'abilities', name: 'Abilities', icon: Zap },
    { id: 'equipment', name: 'Equipment', icon: Shield },
    { id: 'companions', name: 'Companions', icon: Users },
    { id: 'tech', name: 'Gaming Tech', icon: Gamepad2 }
  ];

  const mockListings = [
    { id: 1, seller: 'GhostReaper', title: 'Legendary Sniper Scope', category: 'equipment', price: 150, image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=300&fit=crop', condition: 'Like New', game: 'Call of Duty' },
    { id: 2, seller: 'CyberVixen', title: 'Auto-Loot Algorithm', category: 'abilities', price: 200, image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=300&fit=crop', rarity: 'Epic', game: 'MMORPGs' },
    { id: 3, seller: 'IronFist', title: 'Gaming PC RTX 4090', category: 'tech', price: 2500, image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=300&h=300&fit=crop', condition: 'Excellent' },
    { id: 4, seller: 'NovaStar', title: 'Stealth Companion Bot', category: 'companions', price: 180, image: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=300&h=300&fit=crop', rarity: 'Rare', game: 'Cyberpunk 2088' }
  ];

  const filteredListings = mockListings.filter(listing => 
    (category === 'all' || listing.category === category) &&
    (searchQuery === '' || listing.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex gap-6 overflow-hidden">
      {/* Left - Categories & Filters */}
      <div className="w-64 space-y-4 flex-shrink-0">
        <div className="backdrop-blur-xl rounded-xl p-4" style={{
          background: 'rgba(71, 85, 105, 0.25)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 4px 16px rgba(71, 85, 105, 0.3)'
        }}>
          <h3 className="text-white font-bold mb-3">Categories</h3>
          <div className="space-y-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    category === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="backdrop-blur-xl rounded-xl p-4" style={{
          background: 'rgba(100, 120, 140, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
        }}>
          <h3 className="text-white font-bold mb-3">Selling?</h3>
          <Button className="w-full bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Listing
          </Button>
        </div>
      </div>

      {/* Center - Listings Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="mb-4">
          <Input
            placeholder="Search marketplace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-800/60 border-slate-700/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map(listing => (
            <motion.div
              key={listing.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedListing(listing)}
              className="backdrop-blur-xl rounded-xl overflow-hidden cursor-pointer"
              style={{
                background: 'rgba(100, 120, 140, 0.10)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
              }}
            >
              <img src={listing.image} alt={listing.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h4 className="text-white font-bold mb-1">{listing.title}</h4>
                <p className="text-slate-400 text-sm mb-2">by {listing.seller}</p>
                {listing.game && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs mb-2">
                    {listing.game}
                  </Badge>
                )}
                {listing.rarity && (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs mb-2 ml-1">
                    {listing.rarity}
                  </Badge>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-green-400 font-bold text-lg">${listing.price}</span>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    View
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right - Listing Detail / Chat */}
      <AnimatePresence>
        {selectedListing && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-96 backdrop-blur-xl rounded-xl p-6 flex-shrink-0"
            style={{
              background: 'rgba(100, 120, 140, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Listing Details</h3>
              <Button size="sm" variant="ghost" onClick={() => setSelectedListing(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <img src={selectedListing.image} alt={selectedListing.title} className="w-full h-48 object-cover rounded-lg mb-4" />
            
            <h4 className="text-white font-bold text-xl mb-2">{selectedListing.title}</h4>
            <p className="text-slate-400 mb-4">Seller: {selectedListing.seller}</p>
            
            {selectedListing.condition && (
              <div className="mb-2">
                <span className="text-slate-400 text-sm">Condition: </span>
                <span className="text-white font-semibold">{selectedListing.condition}</span>
              </div>
            )}
            
            <div className="text-green-400 font-bold text-2xl mb-4">${selectedListing.price}</div>

            <div className="space-y-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message Seller
              </Button>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Make Offer
              </Button>
            </div>

            <div className="mt-6">
              <h5 className="text-white font-semibold mb-3">Quick Chat</h5>
              <div className="bg-slate-900/40 rounded-lg p-3 h-48 overflow-y-auto mb-3">
                <p className="text-slate-400 text-sm text-center">Start a conversation with the seller</p>
              </div>
              <Input placeholder="Type a message..." className="bg-slate-900/40 border-slate-700/50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};