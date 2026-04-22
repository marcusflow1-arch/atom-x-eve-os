import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Cpu, ChevronRight, ChevronDown, Lock, 
  Unlock, Database, Server, Info, AlertCircle,
  Download, Play, CreditCard, Check, X, Loader2,
  Maximize2, Star, ThumbsUp, MessageSquare, User, Radio, Trophy, Users,
  Package, Tag, ArrowUpCircle, Bug, Sparkles
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useCart } from '@/components/CartContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AchievementCardStrip from './AchievementCardStrip';
import DLCInfoPanel from './DLCInfoPanel';
import ReviewSection from '@/components/store/ReviewSection';
import AdvancedModel3DViewer from '@/components/3d/AdvancedModel3DViewer';


// --- Components ---

const DataPoint = ({ label, value, icon: Icon, color = "text-white" }) => (
  <div className="flex flex-col bg-white/5 border border-white/5 rounded-xl p-4 backdrop-blur-sm">
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className={`w-4 h-4 ${color} opacity-80`} />}
      <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{label}</span>
    </div>
    <span className="text-lg font-medium text-white tracking-tight">{value}</span>
  </div>
);

const SystemPreviewCard = ({ type, title, subtitle, onClick }) => (
  <div 
    onClick={onClick}
    className="relative group overflow-hidden rounded-xl border border-white/10 bg-black/20 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-105"
  >
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
    <div className="p-4">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[9px] uppercase tracking-wider text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
          {type}
        </span>
        <div className="w-3 h-3 flex items-center justify-center">
          <Play className="w-2.5 h-2.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <h4 className="text-white font-bold text-sm mb-1 group-hover:text-cyan-300 transition-colors">{title}</h4>
      <p className="text-white/40 text-xs group-hover:text-white/60 transition-colors">{subtitle}</p>
    </div>
  </div>
);

const SpecsTab = ({ game }) => {
  // Enhanced mock data logic for demonstration if actual data is missing
  const specs = game?.system_requirements || {};
  
  const RequirementSection = ({ title, data, icon: Icon, color, level = "mid" }) => (
    <div className={`flex-1 min-w-[300px] border rounded-xl p-6 backdrop-blur-md transition-colors ${
        level === 'low' ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-900/60' :
        level === 'high' ? 'bg-purple-900/10 border-purple-500/20 hover:bg-purple-900/20' :
        'bg-white/5 border-white/10 hover:bg-white/[0.07]'
    }`}>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
        <div className={`w-10 h-10 rounded-lg ${color} bg-opacity-20 flex items-center justify-center border border-white/10 shadow-lg`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <h4 className="text-white font-black uppercase tracking-wider text-sm">{title}</h4>
            <p className="text-white/40 text-[10px] uppercase tracking-widest">{level === 'low' ? 'Entry Level' : level === 'high' ? 'Enthusiast' : 'Standard'}</p>
        </div>
      </div>
      
      <div className="space-y-5">
        {[
            { label: 'OS', value: data.os || 'Windows 10 64-bit' },
            { label: 'Processor', value: data.processor },
            { label: 'Memory', value: data.memory },
            { label: 'Graphics', value: data.graphics },
            { label: 'DirectX', value: 'Version 12' },
            { label: 'Storage', value: data.storage },
            { label: 'Sound Card', value: 'DirectX Compatible' },
            { label: 'VR Support', value: level === 'high' ? 'Supported' : 'Not Required' }
        ].map((item, idx) => (
            <div key={idx} className="group flex flex-col gap-1">
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest group-hover:text-cyan-400 transition-colors">{item.label}</span>
                <span className="text-white/90 text-sm font-medium border-b border-white/5 pb-1 group-hover:border-cyan-500/30 transition-colors">{item.value}</span>
            </div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Dev Info Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-white/40 text-xs uppercase tracking-widest mb-1">Developer</span>
          <span className="text-white font-bold truncate">{game.developer || 'Studio Unknown'}</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-white/40 text-xs uppercase tracking-widest mb-1">Publisher</span>
          <span className="text-white font-bold truncate">{game.publisher || 'Atom Publishing'}</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-white/40 text-xs uppercase tracking-widest mb-1">Release Date</span>
          <span className="text-white font-bold truncate">{game.original_year || '2025'}</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-white/40 text-xs uppercase tracking-widest mb-1">Version</span>
          <span className="text-white font-bold truncate">{game.version || 'v1.0.4'}</span>
        </div>
      </div>

      {/* Specs Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <Cpu className="w-6 h-6 text-cyan-400" />
            System Specifications
            </h3>
            <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-white/40 border border-white/10">Windows</span>
                <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-white/40 border border-white/10">macOS</span>
                <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-white/40 border border-white/10">SteamOS</span>
            </div>
        </div>
        
        <div className="flex flex-col xl:flex-row gap-6 overflow-x-auto pb-4">
          <RequirementSection 
            title="Minimum" 
            level="low"
            data={{
              os: specs.os || "Windows 10 64-bit",
              processor: "Intel Core i3-8100 or AMD Ryzen 3 1200",
              memory: "8 GB RAM",
              graphics: "NVIDIA GeForce GTX 960 4GB or AMD Radeon R9 380 4GB",
              storage: specs.storage || "40 GB available space"
            }}
            icon={Shield}
            color="bg-slate-500"
          />
          
          <RequirementSection 
            title="Recommended" 
            level="mid"
            data={{
              os: "Windows 10/11 64-bit",
              processor: specs.processor || "Intel Core i5-10400 or AMD Ryzen 5 3600",
              memory: specs.memory || "16 GB RAM",
              graphics: specs.graphics || "NVIDIA GeForce RTX 2060 or AMD Radeon RX 5600 XT",
              storage: specs.storage || "40 GB available space (SSD)"
            }}
            icon={Zap}
            color="bg-blue-500"
          />
          
          <RequirementSection 
            title="Ultra (4K)" 
            level="high"
            data={{
              os: "Windows 11 64-bit",
              processor: "Intel Core i9-12900K or AMD Ryzen 9 5900X",
              memory: "32 GB RAM",
              graphics: "NVIDIA GeForce RTX 4080 or AMD Radeon RX 7900 XTX",
              storage: specs.storage ? `${specs.storage} (NVMe SSD)` : "40 GB available space (NVMe SSD)"
            }}
            icon={Star}
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6 flex gap-4 items-start">
        <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
        <div className="space-y-2">
          <p className="text-white font-bold text-sm tracking-wide">PERFORMANCE NOTES</p>
          <p className="text-white/60 text-sm leading-relaxed">
            Game requires a 64-bit processor and operating system. Ray tracing features require compatible hardware and Windows 10 version 2004 or newer. 
            SSD highly recommended for optimal loading times. Online features require a broadband internet connection. 
            DirectX 12 Ultimate enabled GPU required for advanced graphical features.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// PurchaseModal component removed - now using global CartDrawer

export default function GameDetailPanel({ gameId, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const { addToCart, isPurchased } = useCart();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'specs'
  const [mediaTab, setMediaTab] = useState('content'); // 'content' or 'achievement_loot'
  const [isViewingMedia, setIsViewingMedia] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showNavArrows, setShowNavArrows] = useState(false);
  const [mouseTimeout, setMouseTimeout] = useState(null);
  const [selectedDLC, setSelectedDLC] = useState(null);
  const [selectedMediaItem, setSelectedMediaItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  
  // Auto-select first media item on load
  useEffect(() => {
    if (videos.length > 0 && !selectedMediaItem) {
      setSelectedMediaItem(videos[0]);
    }
  }, [game]);
  const [devReview, setDevReview] = useState(null);
  const [newReview, setNewReview] = useState({ rating: 5, content: '' });
  const owned = isPurchased(gameId);
  const [userReactions, setUserReactions] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedAIPerk, setSelectedAIPerk] = useState(null);

  // Helper to extract YouTube ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Process Real Media
  const realVideos = (game?.video_urls?.length > 0 ? game.video_urls : (game?.trailer_url ? [game.trailer_url] : []))
    .filter(url => url && typeof url === 'string')
    .map((url, i) => {
        const id = getYouTubeId(url);
        return {
            type: 'video',
            title: i === 0 ? 'Gameplay Trailer' : `Video Showcase ${i + 1}`,
            url: url,
            image: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : game?.cover_image,
            embedUrl: id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null
        };
    });

  // Ensure at least placeholders if no real videos
  const videos = realVideos.length > 0 ? realVideos : [
    { title: 'Gameplay Trailer', image: game?.cover_image, type: 'image' } // Fallback to image if no video
  ];

  const realScreenshots = (game?.screenshots?.length > 0 ? game.screenshots : [])
    .map((url, i) => ({
        type: 'image',
        title: `Screenshot ${i + 1}`,
        image: url
    }));

  // Ensure at least 3 images as requested, using cover as fallback if needed
  const screenshots = realScreenshots.length > 0 ? realScreenshots : [
    { title: 'Screenshot 1', image: game?.cover_image, type: 'image' },
    { title: 'Screenshot 2', image: game?.cover_image, type: 'image' },
    { title: 'Screenshot 3', image: game?.cover_image, type: 'image' },
  ];

  const achievements = [
    { name: 'Neural Shock', icon: '⚡' },
    { name: 'Cyber Metabolism', icon: '💚' },
    { name: 'Void Walker', icon: '👻' },
    { name: 'Tactical Mind', icon: '🧠' },
    { name: 'Data Stream', icon: '📡' },
  ];

  const achievementCards = [
    { name: 'Neural Shock', type: 'Ability', description: 'Stun enemies in radius', edition: 'Standard Edition' },
    { name: 'Cyber Metabolism', type: 'Ability', description: '+10% Regeneration', edition: 'Standard Edition' },
    { name: 'Void Walker Set', type: 'Equipment', description: 'Stealth Bonus', edition: 'Neural Expansion' },
    { name: 'Tactical Mind', type: 'Teacher', description: 'AI Behavior Mod', edition: 'Digital Edition' },
    { name: 'Data Stream', type: 'Ability', description: 'Hack networks', edition: 'Void Arsenal DLC' },
    { name: 'Shadow Clone', type: 'Ability', description: 'Create decoys', edition: 'Void Arsenal DLC' },
    { name: 'Drone Companion', type: 'Companion', description: 'Automated support unit', edition: 'Standard Edition' },
    { name: 'Master Swordsman', type: 'Teacher', description: 'Learn advanced combat', edition: 'Dojo Pack' },
    { name: 'Heavy Armor', type: 'Equipment', description: 'Increased defense', edition: 'Standard Edition' },
    { name: 'Stealth Suit', type: 'Equipment', description: 'Invisible to cameras', edition: 'Void Arsenal DLC' },
    { name: 'Hacking Tool', type: 'Equipment', description: 'Speed up hacking', edition: 'Standard Edition' },
    { name: 'Combat Drone', type: 'Companion', description: 'Fights alongside you', edition: 'Standard Edition' },
  ];

  // Mock DLC data
  const dlcList = [
    {
      id: 'standard',
      name: 'Standard Edition',
      description: 'The base game experience with all core features and content.',
      offers: ['Base Game Content', 'Core Story Campaign', 'Standard Abilities', 'Base Card Collection'],
      price: 0,
      stats: {},
      achievements: [],
      abilities: [],
      quests: []
    },
    {
      id: 'dlc_1',
      name: 'Neural Expansion Pack',
      description: 'Unlock advanced neural abilities and new storyline chapters set in the cybernetic underworld.',
      offers: ['5 New Abilities', '+20% XP Boost', '3 Legendary Cards', '10 Story Missions'],
      price: 14.99,
      stats: { abilities: 5, xpBoost: 20, cards: 3, missions: 10 },
      achievements: [
        { name: 'Neural Master', type: 'Ability', power: 850, rarity: 'Legendary', id: '#NM-001', description: 'Master the neural networks to control battlefield electronics.' },
        { name: 'Cyber Overlord', type: 'Title', power: 500, rarity: 'Epic', id: '#CO-092', description: 'Rule the cyber space with an iron fist.' },
        { name: 'Data Stream Complete', type: 'Collection', power: 300, rarity: 'Rare', id: '#DS-114', description: 'Collect all data shards in the Neural sector.' }
      ],
      abilities: ['Neural Shock', 'Mind Control', 'Synaptic Burst'],
      quests: [
        { name: 'Neural Awakening', xp: 1500, type: 'Main' },
        { name: 'Cyber Heist', xp: 800, type: 'Side' },
        { name: 'The Architect', xp: 2000, type: 'Main' }
      ]
    },
    {
      id: 'dlc_2',
      name: 'Void Walker Arsenal',
      description: 'Gain access to stealth-focused equipment and void manipulation powers.',
      offers: ['7 New Equipment Sets', '+15% Stealth Rating', '2 Epic Traits', '5 New Weapons'],
      price: 9.99,
      stats: { equipment: 7, stealthBoost: 15, traits: 2, weapons: 5 },
      achievements: [
        { name: 'Shadow Master', type: 'Technique', power: 920, rarity: 'Legendary', id: '#SM-666', description: 'Complete an entire mission without being detected.' },
        { name: 'Void Walker', type: 'Transformation', power: 1200, rarity: 'Mythic', id: '#VW-000', description: 'Unlock the ultimate void form.' }
      ],
      abilities: ['Phase Shift', 'Shadow Clone', 'Void Manipulation'],
      quests: [
        { name: 'Shadow Infiltration', xp: 1200, type: 'Main' },
        { name: 'Void Echoes', xp: 950, type: 'Side' }
      ]
    },
    {
      id: 'dlc_3',
      name: 'Season Pass: Year One',
      description: 'All future DLC releases for the first year, plus exclusive seasonal rewards.',
      offers: ['All DLC Access', '+50% Genre XP', 'Exclusive Avatar Skin', 'Priority Updates'],
      price: 29.99,
      stats: { dlcAccess: 'unlimited', genreXP: 50 },
      achievements: [
        { name: 'Season Champion', type: 'Trophy', power: 2500, rarity: 'Exotic', id: '#SC-2025', description: 'Complete all season 1 challenges.' },
        { name: 'Year One Veteran', type: 'Badge', power: 1000, rarity: 'Epic', id: '#Y1-VET', description: 'Logged in for 365 days.' },
        { name: 'Ultimate Collector', type: 'Collection', power: 1500, rarity: 'Legendary', id: '#UC-MAX', description: 'Collect every item in the base game.' }
      ],
      abilities: ['All DLC Abilities'],
      quests: [
        { name: 'Season Opener', xp: 2500, type: 'Main' },
        { name: 'Weekly Challenge', xp: 500, type: 'Side' }
      ]
    }
  ];

  const currentContent = mediaTab === 'content' 
    ? [...videos, ...screenshots] 
    : achievements;

  // ESC key and arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isViewingMedia) {
          setIsViewingMedia(false);
          setCurrentMediaIndex(0);
        } else {
          // Go back to Store when not in media view
          onClose();
        }
      } else if (isViewingMedia) {
        if (e.key === 'ArrowLeft') {
          handlePrevious();
        } else if (e.key === 'ArrowRight') {
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewingMedia, currentMediaIndex, currentContent.length, onClose]);

  // Mouse move handler for arrows
  const handleMouseMove = () => {
    setShowNavArrows(true);
    if (mouseTimeout) clearTimeout(mouseTimeout);
    const timeout = setTimeout(() => setShowNavArrows(false), 2000);
    setMouseTimeout(timeout);
  };

  const handleMediaTrigger = (index) => {
    setCurrentMediaIndex(index);
    setSelectedMediaItem(currentContent[index]);
  };

  const handleFullscreen = () => {
    setIsViewingMedia(true);
  };

  const handleNext = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % currentContent.length);
  };

  const handlePrevious = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + currentContent.length) % currentContent.length);
  }; // Use CartContext check or local state if preferred, but context is better for syncing.
  
  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      try {
        const fetchedGame = await base44.entities.Game.get(gameId);
        setGame(fetchedGame);
        
        // Fetch reviews
        const gameReviews = await base44.entities.Post.filter({ 
          type: 'game_review', 
          game_title: fetchedGame.title 
        }, '-created_date');
        setReviews(gameReviews);
        
        // Mock dev review (in production, this would be fetched from a DevReview entity)
        setDevReview({
          dev_name: "Studio Unknown",
          dev_title: "Lead Game Designer",
          content: "Our vision for the card system is to make every achievement feel earned. Cards aren't just collectibles—they're extensions of your playstyle. We wanted players to feel like they're building their own legend, one card at a time. The synergy between abilities and equipment cards mirrors the game's core philosophy: adaptation is survival.",
          card_philosophy: "Merge, Ascend, Dominate"
        });
      } catch (err) {
        console.error("Failed to fetch game", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      alert("Please sign in to leave a review");
      return;
    }
    if (!newReview.content.trim()) return;
    
    try {
      await base44.entities.Post.create({
        title: `Review: ${game.title}`,
        content: newReview.content,
        type: 'game_review',
        game_title: game.title,
        genre: game.genre,
        rating: newReview.rating,
        community: 'reviews'
      });
      
      // Refresh reviews
      const gameReviews = await base44.entities.Post.filter({ 
        type: 'game_review', 
        game_title: game.title 
      }, '-created_date');
      setReviews(gameReviews);
      setNewReview({ rating: 5, content: '' });
    } catch (err) {
      console.error("Failed to submit review", err);
    }
  };

  const handleReaction = async (reviewId, reactionType) => {
    if (!isAuthenticated) {
      alert("Please sign in to react");
      return;
    }
    
    try {
      const existingReactions = await base44.entities.Reaction.filter({
        target_id: reviewId,
        created_by: user.email
      });
      
      if (existingReactions.length > 0) {
        const existingReaction = existingReactions[0];
        if (existingReaction.type === reactionType) {
          // Remove reaction
          await base44.entities.Reaction.delete(existingReaction.id);
        } else {
          // Update reaction
          await base44.entities.Reaction.update(existingReaction.id, { type: reactionType });
        }
      } else {
        // Create new reaction
        await base44.entities.Reaction.create({
          target_id: reviewId,
          target_type: 'post',
          type: reactionType
        });
      }
      
      // Refresh user reactions
      const allUserReactions = await base44.entities.Reaction.filter({
        created_by: user.email
      });
      const reactionsMap = {};
      allUserReactions.forEach(r => {
        reactionsMap[r.target_id] = r.type;
      });
      setUserReactions(reactionsMap);
    } catch (err) {
      console.error("Failed to react", err);
    }
  };

  // Fetch user reactions on mount
  useEffect(() => {
    const fetchUserReactions = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const allUserReactions = await base44.entities.Reaction.filter({
          created_by: user.email
        });
        const reactionsMap = {};
        allUserReactions.forEach(r => {
          reactionsMap[r.target_id] = r.type;
        });
        setUserReactions(reactionsMap);
      } catch (err) {
        console.error("Failed to fetch reactions", err);
      }
    };
    fetchUserReactions();
  }, [isAuthenticated, user]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
        alert("Authentication Required: Identity Protocol.");
        return;
    }
    addToCart({
        id: game.id,
        type: 'game',
        title: game.title,
        price: game.price,
        image: game.cover_image,
        genre: game.genre
    });
  };

  const handleAddDLCToCart = (dlc) => {
    if (!isAuthenticated) {
        alert("Authentication Required: Identity Protocol.");
        return;
    }
    addToCart({
        id: dlc.id,
        type: 'dlc',
        title: dlc.name,
        price: dlc.price,
        image: game.cover_image,
        gameTitle: game.title,
        gameId: game.id
    });
  };

  const handleTransactionConfirm = async () => {
    setUnlocking(true);
    try {
        await base44.functions.invoke('unlockGameSystem', { gameId });
        // Cart context will handle ownership state
    } catch (err) {
        console.error("Unlock failed", err);
    } finally {
        setUnlocking(false);
    }
  };

  const handlePlay = () => {
      navigate(createPageUrl('Library'));
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center text-white/20">Initializing...</div>;
  }

  if (!game) {
    return <div className="h-full flex items-center justify-center text-red-400">Signal Lost. Game Data Corrupted.</div>;
  }

  return (
    <div className="h-full w-full relative bg-[#0d0d0d] text-white font-sans overflow-hidden flex flex-col">
      {/* Immersive Background Media Layer */}
      <AnimatePresence>
        {isViewingMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-40"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsViewingMedia(false);
                setCurrentMediaIndex(0);
              }
            }}
            onMouseMove={handleMouseMove}
          >
            {/* Video/Media Background */}
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              {currentContent[currentMediaIndex]?.type === 'video' && currentContent[currentMediaIndex]?.embedUrl ? (
                  <iframe 
                      src={currentContent[currentMediaIndex].embedUrl} 
                      title={currentContent[currentMediaIndex].title}
                      className="w-[80%] h-[80%] shadow-2xl border border-white/10 rounded-xl z-20"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                  />
              ) : (
                  <img 
                    src={currentContent[currentMediaIndex]?.image || currentContent[currentMediaIndex]?.icon || game.cover_image}
                    alt={currentContent[currentMediaIndex]?.title || currentContent[currentMediaIndex]?.name}
                    className="w-full h-full object-contain"
                  />
              )}
              <div className="absolute inset-0 bg-black/20 -z-10" />
            </div>

            {/* Navigation Arrows */}
            <AnimatePresence>
              {showNavArrows && (
                <>
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 hover:scale-110 transition-all z-10"
                  >
                    <ChevronRight className="w-8 h-8 text-white rotate-180" />
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 hover:scale-110 transition-all z-10"
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            {/* Subtle UI Hint - Only visible when hovering */}
            <AnimatePresence>
              {showNavArrows && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <h3 className="text-white text-2xl font-bold mb-2">
                      {currentContent[currentMediaIndex]?.title || currentContent[currentMediaIndex]?.name}
                    </h3>
                    <p className="text-white/60 text-sm">
                      Use arrow keys or click arrows to navigate • ESC to exit
                    </p>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Background */}
      <motion.div 
        animate={{ opacity: isViewingMedia ? 0 : 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={game.cover_image} 
          alt={game.title} 
          className="w-full h-full object-cover opacity-40 blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-transparent to-[#0d0d0d]" />
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      </motion.div>

      {/* Header / Nav */}
      <motion.div 
        animate={{ opacity: isViewingMedia ? 0 : 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative z-20 p-8 pt-20 flex justify-end items-start"
      >
        {/* Tabs Switcher */}
        <div className="flex p-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full">
          <button 
            onClick={() => setActiveTab('system')}
            className={`relative px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${
              activeTab === 'system' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            System Core
          </button>
          <button 
            onClick={() => setActiveTab('specs')}
            className={`relative px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${
              activeTab === 'specs' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            Tech Specs
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div 
        animate={{ opacity: isViewingMedia ? 0 : 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative z-10 flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-12 py-12"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'system' ? (
            <motion.div 
              key="system"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Header Section: Title & Actions */}
              <div className="flex items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">
                    {game.title}
                  </h1>
                  {owned && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded bg-green-500/20 border border-green-500/30 text-[10px] font-bold uppercase tracking-widest text-green-400">
                      <Unlock className="w-3 h-3" /> In Library
                    </span>
                  )}
                </div>

                {/* Actions: Price & Buy Button (Eye-level with Title) */}
                <div className="flex items-center gap-4">
                   {!owned ? (
                      <>
                        <div className="bg-black/40 backdrop-blur-md px-4 py-3 rounded-xl text-white font-bold text-xl border border-white/10 shadow-lg">
                          ${game.price?.toFixed(2) || '0.00'}
                        </div>
                        <button 
                          onClick={handleAddToCart}
                          className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl text-base shadow-lg shadow-green-900/20 transition-all flex items-center gap-2 transform hover:scale-105"
                        >
                          Add to Cart
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={handlePlay}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl text-base shadow-lg shadow-green-900/20 transition-all flex items-center gap-2 transform hover:scale-105"
                      >
                        <Play className="w-5 h-5 fill-white" />
                        Play Now
                      </button>
                    )}
                </div>
              </div>



              {/* Main Grid: Trailer Left, Info Right */}
              <div className="flex flex-col lg:flex-row gap-8">

                {/* Left: Trailer Section */}
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                  <h4 className="text-lg font-bold text-white">Game Trailer</h4>

                  {/* Main Trailer Box */}
                  <div className="relative bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden aspect-video group/preview flex items-center justify-center">
                    {selectedMediaItem?.type === 'video' && selectedMediaItem?.embedUrl ? (
                        <iframe 
                            src={selectedMediaItem.embedUrl} 
                            title={selectedMediaItem.title}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <>
                            <img 
                              src={selectedMediaItem?.image || selectedMediaItem?.icon || game.cover_image}
                              alt={selectedMediaItem?.title || game.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                            {/* Media Title Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                                <h4 className="text-white font-bold text-lg mb-1 drop-shadow-md">
                                  {selectedMediaItem?.title || game.title}
                                </h4>
                            </div>

                            {/* Fullscreen Button */}
                            <button
                              onClick={handleFullscreen}
                              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/80 hover:scale-110 transition-all group opacity-0 group-hover/preview:opacity-100"
                            >
                              <Maximize2 className="w-4 h-4 text-white group-hover:text-cyan-400" />
                            </button>
                        </>
                    )}
                  </div>

                  {/* Thumbnails Strip */}
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {videos.map((video, i) => (
                      <div 
                        key={i}
                        onClick={() => handleMediaTrigger(i)}
                        className={`relative w-28 aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group border transition-all flex-shrink-0 ${
                          selectedMediaItem === currentContent[i] ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-white/10 hover:border-cyan-400/30'
                        }`}
                      >
                        <img 
                          src={video.image} 
                          alt={video.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Play className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      </div>
                    ))}
                    {screenshots.map((screenshot, i) => (
                      <div 
                        key={i}
                        onClick={() => handleMediaTrigger(videos.length + i)}
                        className={`w-28 aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group flex-shrink-0 border transition-all ${
                          selectedMediaItem === currentContent[videos.length + i] ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-white/10 hover:border-cyan-400/30'
                        }`}
                      >
                        <img 
                          src={screenshot.image} 
                          alt={screenshot.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>

                </div>

                {/* Right: Game Info Sidebar */}
                <div className="flex-1 lg:max-w-md flex flex-col gap-6">
                  {/* Info Box */}
                  <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-5 space-y-4">
                    {/* Header Image (Capsule) - Reduced to 30% */}
                    <div className="rounded-lg overflow-hidden border border-white/10 shadow-lg w-[30%]">
                      <img src={game.cover_image} alt={game.title} className="w-full h-auto object-cover" />
                    </div>

                    {/* Short Description */}
                    <p className="text-sm text-white/80 leading-relaxed line-clamp-6">
                      {game.description || 'Experience a world transformed by technology and ancient power. Master unique abilities, collect rare artifacts, and forge your destiny in this immersive adventure.'}
                    </p>

                    {/* Metadata Table */}
                    <div className="text-xs space-y-2 border-t border-white/10 pt-4">
                      <div className="flex gap-2">
                        <span className="text-white/40 uppercase tracking-wider w-24">Release Date:</span>
                        <span className="text-white/80">{game.original_year || '2025'}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-white/40 uppercase tracking-wider w-24">Developer:</span>
                        <span className="text-cyan-300 hover:underline cursor-pointer">{game.developer || 'Studio Unknown'}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-white/40 uppercase tracking-wider w-24">Publisher:</span>
                        <span className="text-cyan-300 hover:underline cursor-pointer">{game.publisher || 'Atom Publishing'}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {[game.genre, 'Action', 'Multiplayer', 'Sci-Fi'].map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-cyan-200/80 hover:bg-white/10 hover:text-cyan-200 cursor-pointer transition-colors">
                          {tag}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/40 hover:bg-white/10 cursor-pointer transition-colors">+</span>
                    </div>
                    </div>
                    </div>
                    </div>

                  {/* Separator Line */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 max-w-[150px] h-px bg-gradient-to-r from-white/20 to-transparent" />
                    <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Live Stream</span>
                    <div className="flex-1 max-w-[150px] h-px bg-gradient-to-l from-white/20 to-transparent" />
                  </div>

                  {/* Live Stream + Chat Row */}
                  <div className="flex flex-col lg:flex-row gap-4">
              {/* Live Stream Box — same aspect ratio as media preview */}
              <div className="flex-[2] min-w-0">
                  <div className="relative bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden aspect-video flex flex-col">
                    {/* Stream Header Bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-white/10 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <span className="text-white font-bold text-xs uppercase tracking-wider">Live Stream</span>
                        <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold">LIVE</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-white/40">
                        <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-red-400" /> 1,204 watching</span>
                        <span>StreamerXO is playing {game?.title}</span>
                      </div>
                    </div>
                    {/* Stream Embed / Placeholder */}
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                      <img
                        src={game?.banner_image || game?.cover_image}
                        alt="Live Stream"
                        className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50" />
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                          <Play className="w-7 h-7 text-white fill-white ml-1" />
                        </div>
                        <p className="text-white font-bold text-sm">Tap to Watch Live</p>
                        <p className="text-white/40 text-xs">StreamerXO • {game?.genre} • Started 2h ago</p>
                      </div>
                      {/* Stream overlays */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white border-2 border-white/20">S</div>
                        <div className="px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-xs text-white font-medium">StreamerXO</div>
                      </div>
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-black/70 backdrop-blur-sm">
                        <Users className="w-3 h-3 text-white/60" />
                        <span className="text-white/60 text-xs">1,204</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Box */}
                <div className="lg:w-72 flex-shrink-0 flex flex-col" style={{ aspectRatio: undefined }}>
                  <div className="flex flex-col h-full min-h-[280px] lg:min-h-0 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-black/60 border-b border-white/10 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-white font-bold text-xs uppercase tracking-wider">Stream Chat</span>
                      </div>
                      <span className="text-white/30 text-[10px]">842 chatters</span>
                    </div>
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ scrollbarWidth: 'none' }}>
                      {[
                        { user: 'NovaPulse', color: 'text-purple-400', msg: 'insane run omg!! 🔥' },
                        { user: 'CyberAce', color: 'text-cyan-400', msg: 'bro just one-shotted that boss' },
                        { user: 'VoidWalker', color: 'text-pink-400', msg: 'what build is this? 👀' },
                        { user: 'ShadowX', color: 'text-yellow-400', msg: 'W streamer always coming through' },
                        { user: 'NeonKid', color: 'text-green-400', msg: 'PogChamp PogChamp PogChamp' },
                        { user: 'DataStream', color: 'text-blue-400', msg: 'this game is actually underrated' },
                        { user: 'NovaPulse', color: 'text-purple-400', msg: 'how many hours do you have??' },
                        { user: 'CryptoMage', color: 'text-orange-400', msg: 'just bought this game watching this lol' },
                        { user: 'Axion_7', color: 'text-red-400', msg: 'clip that!! clip that!!' },
                        { user: 'LunarDev', color: 'text-cyan-300', msg: 'EZ Clap the devs cooked' },
                      ].map((msg, i) => (
                        <div key={i} className="text-xs leading-relaxed">
                          <span className={`font-bold ${msg.color}`}>{msg.user}</span>
                          <span className="text-white/20 mx-1">:</span>
                          <span className="text-white/70">{msg.msg}</span>
                        </div>
                      ))}
                    </div>
                    {/* Chat Input */}
                    <div className="px-3 py-2.5 border-t border-white/10 flex-shrink-0">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                        <input
                          type="text"
                          placeholder="Send a message..."
                          className="flex-1 bg-transparent text-xs text-white/80 placeholder-white/25 outline-none"
                        />
                        <button className="text-cyan-400 hover:text-cyan-200 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement Cards + 3D Viewer - 50/50 Side by Side */}
              <div className="flex gap-0" style={{ minHeight: 420 }}>

                {/* Left (50%): 3D Model Viewer */}
                <div className="w-1/2 flex-shrink-0 flex flex-col gap-4 p-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <h3 className="text-xl font-bold text-white mb-2">3D Model Viewer</h3>
                  <div className="relative flex-1 rounded-xl overflow-hidden" style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.25)',
                  }}>
                    {/* Liquid glass shimmer highlight */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 100%)',
                      borderRadius: 'inherit',
                      zIndex: 1,
                    }} />
                    <AdvancedModel3DViewer modelUrl="https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/c586602ff_tomb_raider_laracroft.glb" />
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-gradient-to-b from-transparent via-white/20 to-transparent flex-shrink-0" />

                {/* Right (50%): Achievement Cards */}
                <div className="w-1/2 flex-shrink-0 flex flex-col gap-4 p-6">
                  <h3 className="text-xl font-bold text-white mb-2">Developer Cards</h3>
                  <AchievementCardStrip 
                    achievementCards={achievementCards} 
                    dlcList={dlcList}
                    onSelectCard={setSelectedCard} 
                  />
                </div>

              </div>

              {/* Lower Section: Content */}
              <div className="border-t border-white/10 pt-8">
                {/* Content For This Game (DLCs & About) */}
                <div className="space-y-8">
                  {/* DLC Section - Two Column Split */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">Content For This Game</h3>
                      <button className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors">Browse All DLC</button>
                    </div>
                    
                    <div className="flex gap-0">
                      {/* Left Column: DLC List with dropdowns */}
                      <motion.div 
                        animate={{ flex: selectedDLC ? '1' : '1' }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="min-w-0 space-y-1 flex-1"
                      >
                        {dlcList.filter(dlc => dlc.id !== 'standard').map((dlc) => (
                          <div key={dlc.id} className="rounded-lg bg-black/20 border border-white/5 overflow-hidden transition-all duration-300">
                            <div 
                              className={`group flex items-center gap-4 p-3 hover:bg-white/5 hover:border-white/10 transition-colors cursor-pointer ${selectedDLC?.id === dlc.id ? 'bg-white/5' : ''}`} 
                              onClick={() => setSelectedDLC(selectedDLC?.id === dlc.id ? null : dlc)}
                            >
                              <div className="w-24 h-12 bg-gray-800 rounded border border-white/10 flex-shrink-0 overflow-hidden">
                                 <img src={game.cover_image} className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all" alt="" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                                  {dlc.name}
                                  <ChevronDown className={`w-3 h-3 text-white/40 transition-transform duration-300 ${selectedDLC?.id === dlc.id ? 'rotate-180' : ''}`} />
                                </h4>
                                <div className="flex gap-2 mt-0.5">
                                   {dlc.abilities && dlc.abilities.length > 0 && <span className="text-[10px] text-cyan-400 bg-cyan-900/20 px-1.5 py-0.5 rounded">Abilities</span>}
                                   {dlc.stats?.equipment && <span className="text-[10px] text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded">Equipment</span>}
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <span className="text-sm font-bold text-white/90">${dlc.price}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddDLCToCart(dlc);
                                  }}
                                  className="p-2 bg-green-600/20 hover:bg-green-600 hover:text-white text-green-400 rounded-md transition-colors"
                                  title="Add to Cart"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Dropdown Details */}
                            <AnimatePresence>
                              {selectedDLC?.id === dlc.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1], opacity: { duration: 0.25, delay: 0.1 } }}
                                  className="border-t border-white/5 bg-black/40 overflow-hidden"
                                >
                                  <div className="p-4 space-y-4">
                                    <p className="text-sm text-white/70 leading-relaxed">
                                      {dlc.description}
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                                          <Check className="w-3 h-3" /> Includes
                                        </h5>
                                        <ul className="space-y-1">
                                          {dlc.offers.map((offer, i) => (
                                            <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                                              <span className="text-cyan-400/60">•</span> {offer}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      
                                      {dlc.stats && Object.keys(dlc.stats).length > 0 && (
                                        <div>
                                          <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <Database className="w-3 h-3" /> Content Stats
                                          </h5>
                                          <div className="space-y-1">
                                            {Object.entries(dlc.stats).map(([key, value]) => (
                                              <div key={key} className="flex justify-between text-xs">
                                                <span className="text-white/60 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                <span className="text-white font-mono">{value}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {dlc.achievements && dlc.achievements.length > 0 && (
                                      <div>
                                        <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1">
                                          <Trophy className="w-3 h-3" /> New Achievements
                                        </h5>
                                        <div className="flex flex-wrap gap-3">
                                          {dlc.achievements.map((ach, i) => (
                                            <div 
                                              key={i} 
                                              onClick={(e) => { e.stopPropagation(); setSelectedAchievement(ach); }}
                                              className="group/card relative w-10 h-14 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-md flex items-center justify-center cursor-pointer overflow-hidden hover:scale-110 transition-transform shadow-lg hover:border-cyan-400/50 hover:shadow-cyan-500/20"
                                            >
                                               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-50" />
                                               <span className="text-white/30 font-bold text-lg group-hover/card:text-cyan-400 transition-colors">?</span>
                                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-white/20 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl backdrop-blur-md">
                                                 {typeof ach === 'string' ? ach : ach.name}
                                               </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {dlc.quests && dlc.quests.length > 0 && (
                                      <div>
                                        <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                                          <Radio className="w-3 h-3" /> Available Quests
                                        </h5>
                                        <div className="space-y-1">
                                          {dlc.quests.map((quest, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 hover:border-white/10 transition-colors">
                                              <div className="flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${quest.type === 'Main' ? 'bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]'}`} />
                                                <span className="text-xs text-white/80 font-medium">{quest.name}</span>
                                              </div>
                                              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-500/20">+{quest.xp} XP</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    <button
                                      onClick={() => handleAddDLCToCart(dlc)}
                                      className="w-full py-2 mt-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-bold text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                    >
                                      <CreditCard className="w-3 h-3" /> Add to Cart - ${dlc.price}
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </motion.div>

                      {/* Vertical Divider + Right Info Panel */}
                      <AnimatePresence>
                        {selectedDLC && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1], opacity: { duration: 0.3, delay: 0.05 } }}
                            className="flex overflow-hidden flex-shrink-0"
                          >
                            <motion.div 
                              initial={{ opacity: 0, scaleY: 0.3 }}
                              animate={{ opacity: 1, scaleY: 1 }}
                              exit={{ opacity: 0, scaleY: 0.3 }}
                              transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
                              className="w-px bg-gradient-to-b from-transparent via-white/15 to-transparent mx-5 flex-shrink-0 self-stretch origin-center" 
                            />
                            <motion.div
                              initial={{ opacity: 0, x: 15, filter: 'blur(4px)' }}
                              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                              exit={{ opacity: 0, x: 15, filter: 'blur(4px)' }}
                              transition={{ duration: 0.3, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
                              className="w-72 flex-shrink-0"
                            >
                              <AnimatePresence mode="wait">
                                <DLCInfoPanel key={selectedDLC.id} dlc={selectedDLC} />
                              </AnimatePresence>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* About This Game */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">About This Game</h3>
                    <p className="text-white/70 leading-relaxed text-sm">
                      {game.description || 'Dive into a sprawling universe where your choices matter. Engage in tactical combat, solve complex puzzles, and unravel a narrative that adapts to your decisions. Featuring state-of-the-art graphics and immersive sound design, this title pushes the boundaries of the genre.'}
                    </p>
                    <p className="text-white/70 leading-relaxed text-sm">
                      Explore unique biomes, from neon-lit cityscapes to desolate wastelands. Customize your loadout with thousands of combinations of weapons, armor, and abilities. Join forces with friends or go it alone in this unforgettable journey.
                    </p>
                  </div>

                  {/* Content Updates & Patch Notes */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-cyan-400" />
                        Content Updates
                      </h3>
                      <span className="text-[10px] text-white/30 uppercase tracking-wider">Recent Patch Notes</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          version: 'v2.4.1',
                          date: 'Mar 28, 2026',
                          type: 'patch',
                          title: 'Stability & Balance Update',
                          notes: ['Fixed crash on loading certain maps', 'Adjusted weapon damage scaling for PvP', 'Performance improvements for mid-range GPUs']
                        },
                        {
                          version: 'v2.4.0',
                          date: 'Mar 15, 2026',
                          type: 'update',
                          title: 'Season 2 Content Drop',
                          notes: ['Added 3 new biome zones', 'Introduced ranked PvP ladder system', 'New legendary equipment tier unlocked']
                        },
                        {
                          version: 'v2.3.2',
                          date: 'Feb 20, 2026',
                          type: 'hotfix',
                          title: 'Hotfix — Item Duplication Bug',
                          notes: ['Resolved item duplication exploit in Marketplace', 'Minor UI fixes for inventory overlays']
                        },
                      ].map((patch, i) => {
                        const typeConfig = {
                          patch:   { label: 'Patch',   icon: Bug,             color: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30' },
                          update:  { label: 'Update',  icon: ArrowUpCircle,   color: 'text-cyan-400 bg-cyan-900/20 border-cyan-700/30' },
                          hotfix:  { label: 'Hotfix',  icon: Sparkles,        color: 'text-red-400 bg-red-900/20 border-red-700/30' },
                        }[patch.type];
                        const TypeIcon = typeConfig.icon;
                        return (
                          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${typeConfig.color}`}>
                                  <TypeIcon className="w-3 h-3" /> {typeConfig.label}
                                </span>
                                <span className="text-white font-bold text-sm">{patch.title}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 text-right">
                                <span className="text-[10px] font-mono text-white/30">{patch.version}</span>
                                <span className="text-[10px] text-white/20">{patch.date}</span>
                              </div>
                            </div>
                            <ul className="space-y-1">
                              {patch.notes.map((note, j) => (
                                <li key={j} className="text-xs text-white/50 flex items-start gap-2">
                                  <span className="text-cyan-500/50 mt-0.5">•</span> {note}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews Section - Full Width Below Everything */}
              <ReviewSection reviews={reviews} user={user} />
            </motion.div>
          ) : (
            <SpecsTab game={game} />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Achievement Detail Overlay */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
            onClick={() => setSelectedAchievement(null)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-3xl bg-[#0f1115] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
              style={{
                boxShadow: '0 0 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)'
              }}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedAchievement(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>

              {/* Left Side: Card Visual */}
              <div className="w-full md:w-1/3 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 relative p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                
                {/* 3D Card Effect Container */}
                <div className="relative w-48 aspect-[2/3] group perspective-1000">
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-gray-800 to-black border-2 border-white/10 relative overflow-hidden shadow-2xl transform transition-transform duration-500 hover:rotate-y-12 hover:rotate-x-12">
                     {/* Card Art */}
                     <img 
                       src={game.cover_image} 
                       alt="Achievement Art" 
                       className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                     
                     {/* Card Info Overlay */}
                     <div className="absolute bottom-4 left-4 right-4">
                        <div className="px-2 py-0.5 rounded bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-bold text-white/80 w-fit mb-2">
                           {selectedAchievement.rarity || 'Common'}
                        </div>
                        <h3 className="text-white font-bold text-lg leading-tight mb-1">{selectedAchievement.name}</h3>
                        <div className="flex gap-1">
                           {[1,2,3].map(i => <Star key={i} className="w-2 h-2 text-yellow-400 fill-yellow-400" />)}
                        </div>
                     </div>

                     {/* Shine Effect */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ transform: 'skewX(-20deg) translateX(-150%)' }} />
                  </div>
                </div>
              </div>

              {/* Right Side: Details */}
              <div className="flex-1 p-8 flex flex-col relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider">
                         Season 1 Exclusive
                      </span>
                   </div>
                   
                   <h2 className="text-3xl font-black text-white mb-3 tracking-tight">{selectedAchievement.name}</h2>
                   <p className="text-white/60 text-sm leading-relaxed mb-8">
                      {selectedAchievement.description || 'An exclusive achievement awarded to those who demonstrate exceptional skill and dedication. Unlocks permanent rewards for your profile.'}
                   </p>

                   <div className="space-y-6">
                      <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 pb-2">Reward Details</h4>
                      
                      <div className="space-y-1 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                         <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                  <Radio className="w-4 h-4" />
                               </div>
                               <span className="text-sm font-medium text-white/80">Item Type</span>
                            </div>
                            <span className="text-white font-bold text-sm">{selectedAchievement.type || 'Unknown'}</span>
                         </div>
                         
                         <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                                  <Zap className="w-4 h-4" />
                               </div>
                               <span className="text-sm font-medium text-white/80">Power Score</span>
                            </div>
                            <span className="text-white font-bold text-sm">{selectedAchievement.power || '0'}</span>
                         </div>

                         <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                  <Database className="w-4 h-4" />
                               </div>
                               <span className="text-sm font-medium text-white/80">Card ID</span>
                            </div>
                            <span className="text-white font-mono text-xs opacity-60">{selectedAchievement.id || '---'}</span>
                         </div>
                      </div>
                   </div>

                   <div className="mt-8">
                      <button 
                        onClick={() => {
                           // Mock claim action
                           alert('Reward Claimed! Check your inventory.');
                           setSelectedAchievement(null);
                        }}
                        className="w-full py-4 bg-white text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2"
                      >
                         <Check className="w-4 h-4" /> Claim Reward
                      </button>
                   </div>
                   
                   {/* Bonus Equipment Mini-Section */}
                   <div className="mt-8 pt-6 border-t border-white/10">
                      <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Bonus Equipment
                      </h4>
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                         <div className="w-10 h-10 rounded bg-gray-800 flex-shrink-0">
                            <img src={game.cover_image} className="w-full h-full object-cover opacity-50 grayscale" />
                         </div>
                         <div>
                            <div className="text-xs font-bold text-white">Elite Gear Tier 5</div>
                            <div className="text-[10px] text-white/40">High-performance equipment unlocked.</div>
                         </div>
                         <span className="ml-auto text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">Epic</span>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Detail Overlay */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            onClick={() => setSelectedCard(null)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 max-w-5xl w-full flex gap-8 items-center"
            >
              {/* Left: Card Display */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <motion.div
                  className="relative group perspective-1000"
                  style={{ width: '280px' }}
                  whileHover={{ scale: 1.05 }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    e.currentTarget.style.transform = `perspective(1000px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg) scale(1.05)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
                  }}
                >
                  <div 
                    className="relative w-full aspect-[2.5/3.5] rounded-2xl overflow-hidden border-2 border-white/40"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                      backdropFilter: 'blur(30px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.1s ease-out'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center text-9xl opacity-10 text-white">
                      ?
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right: Card Information */}
              <div className="flex-1 space-y-6 text-white">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold">{selectedCard.name}</h2>
                    <span className="text-cyan-400/80 text-sm">{selectedCard.edition}</span>
                  </div>
                  <p className="text-cyan-300 text-lg">{selectedCard.type}</p>
                </div>

                <p className="text-white/70 text-base leading-relaxed">
                  {selectedCard.description}
                </p>

                <div className="space-y-3">
                  <h3 className="text-white/50 text-sm uppercase tracking-wider">Details</h3>
                  <div className="space-y-2 text-white/60">
                    <p>Rarity: <span className="text-white/40">Unknown</span></p>
                    <p>Power: <span className="text-white/40">?</span></p>
                    <p>Unlock Method: <span className="text-white/40">?</span></p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCard(null)}
                  className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Modal removed in favor of global Cart */}
    </div>
  );
}