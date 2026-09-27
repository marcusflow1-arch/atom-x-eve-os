import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Cpu, ChevronRight, ChevronDown, 
  Unlock, Database, AlertCircle,
  Download, Play, CreditCard, Check, X, Star, MessageSquare, Radio, Trophy, Users,
  Package, ArrowUpCircle, Bug, Sparkles
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useCart } from '@/components/CartContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AchievementCardStrip from './AchievementCardStrip';
import ReviewSection from '@/components/store/ReviewSection';
import StoreIdleViewer from '@/components/3d/StoreIdleViewer';
import GameGallery from './detail/GameGallery';
import GamePurchasePanel from './detail/GamePurchasePanel';
import './detail/game-detail.css';


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

export default function GameDetailPanel({ game: providedGame, gameId: providedGameId, onClose, returnLabel = 'Store' }) {
  const gameId = providedGameId || providedGame?.id;
  const { user, isAuthenticated } = useAuth();
  const { addToCart, isPurchased } = useCart();
  const navigate = useNavigate();
  const devZoneRef = useRef(null);
  const [game, setGame] = useState(providedGame || null);
  const [loading, setLoading] = useState(!providedGame);
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
  const [liveModalOpen, setLiveModalOpen] = useState(false);

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

  // Listen for Dev button click from sidebar to scroll to DevZone
  useEffect(() => {
    const handler = () => {
      setActiveTab('system');
      setTimeout(() => {
        devZoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    };
    window.addEventListener('showDevZone', handler);
    return () => window.removeEventListener('showDevZone', handler);
  }, []);

  // ESC key and arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isViewingMedia) {
          setIsViewingMedia(false);
          setCurrentMediaIndex(0);
        } else {
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
    let cancelled = false;
    const loadGamePage = async () => {
      if (!gameId) return;
      setLoading(!providedGame);
      try {
        const fetchedGame = providedGame?.id === gameId ? providedGame : await base44.entities.Game.get(gameId);
        if (cancelled) return;
        setGame(fetchedGame);

        const gameReviews = await base44.entities.Post.filter({
          type: 'game_review',
          game_title: fetchedGame.title
        }, '-created_date');
        if (cancelled) return;
        setReviews(gameReviews);
        setDevReview({
          dev_name: "Studio Unknown",
          dev_title: "Lead Game Designer",
          content: "Our vision for the card system is to make every achievement feel earned. Cards aren't just collectibles—they're extensions of your playstyle. We wanted players to feel like they're building their own legend, one card at a time. The synergy between abilities and equipment cards mirrors the game's core philosophy: adaptation is survival.",
          card_philosophy: "Merge, Ascend, Dominate"
        });
      } catch (err) {
        console.error("Failed to fetch game", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadGamePage();
    return () => { cancelled = true; };
  }, [gameId, providedGame]);

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
    <div className="h-full w-full relative bg-[#eef0f2] text-[#252a31] font-sans overflow-hidden flex flex-col">


      {/* Live Stream Modal - Centered Overlay with Blurred Background */}
      <AnimatePresence>
        {liveModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLiveModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="fixed top-16 bottom-0 left-1/2 -translate-x-1/2 z-[61] w-[80vw] overflow-hidden rounded-t-3xl flex flex-col"
              style={{ background: 'rgba(13, 13, 13, 0.98)', backdropFilter: 'blur(10px)' }}
            >
              <div className="flex flex-col lg:flex-row gap-4 h-full p-6">
                {/* Live Stream Box */}
                <div className="flex-[2] min-w-0">
                  <div className="relative bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden aspect-video flex flex-col h-full">
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
                <div className="lg:w-72 flex-shrink-0 flex flex-col">
                  <div className="flex flex-col h-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
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
            </motion.div>
          </>
        )}
      </AnimatePresence>



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
          className="w-full h-full object-cover opacity-[0.10] blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#eef0f2] via-[#eef0f2]/94 to-white/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#eef0f2]/95 via-white/65 to-[#eef0f2]/95" />
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      </motion.div>

      {/* Header / Nav */}
      <motion.div 
        animate={{ opacity: isViewingMedia ? 0 : 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative z-20 p-8 pt-20 flex justify-end items-start"
      >
        <div className="flex items-center gap-3">
          {/* Tabs Switcher */}
          <div className="flex p-1.5 bg-white/85 backdrop-blur-xl border border-[#cfd4da] rounded-full shadow-[0_10px_30px_rgba(31,36,42,0.08)]">
            <button 
              onClick={() => setActiveTab('system')}
              className={`relative px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${
                activeTab === 'system' ? 'bg-[#2d3238] text-white shadow-sm' : 'text-[#69717a] hover:text-[#2d3238] hover:bg-[#e8eaed]'
              }`}
            >
              System Core
            </button>
            <button 
              onClick={() => setActiveTab('specs')}
              className={`relative px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${
                activeTab === 'specs' ? 'bg-[#2d3238] text-white shadow-sm' : 'text-[#69717a] hover:text-[#2d3238] hover:bg-[#e8eaed]'
              }`}
            >
              Tech Specs
            </button>
          </div>


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
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#252a31] leading-none">
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
                        <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl text-[#252a31] font-bold text-xl border border-[#d3d7dc] shadow-sm">
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



              {/* Keep the current September hero placement: media/gallery left, purchase/info right. */}
              <div className="gd-hero-grid">
                <GameGallery game={game} />
                <GamePurchasePanel game={game} />
              </div>


              {/* Achievement Cards + 3D Viewer - 50/50 Side by Side */}
              <div className="flex gap-0" style={{ minHeight: 420, background: 'transparent' }}>

                {/* Left (50%): 3D Model Viewer */}
                <div className="w-1/2 flex-shrink-0 flex flex-col gap-4 p-6">
                  <h3 className="text-xl font-bold text-[#252a31] mb-2">3D Model Viewer</h3>
                  <div className="relative flex-1">
                    <StoreIdleViewer />
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-gradient-to-b from-transparent via-[#cbd0d6] to-transparent flex-shrink-0" />

                {/* Right (50%): Achievement Cards */}
                <div className="w-1/2 flex-shrink-0 flex flex-col gap-4 p-6">
                  <h3 className="text-xl font-bold text-[#252a31] mb-2">Developer Cards</h3>
                  <AchievementCardStrip 
                    achievementCards={achievementCards} 
                    dlcList={dlcList}
                    onSelectCard={setSelectedCard} 
                  />
                </div>

              </div>

              {/* Lower Section: Content */}
              <div className="border-t border-[#d3d7dc] pt-10">
                <div className="space-y-12">
                  {/* Content For This Game — left-side selector + detailed right panel */}
                  <section className="space-y-5" aria-labelledby="content-for-game-title">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a838d]">Available content</span>
                        <h3 id="content-for-game-title" className="mt-1 text-2xl font-semibold tracking-tight text-[#252a31]">Content For This Game</h3>
                        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6b737c]">Select an expansion or add-on from the left to review exactly what it includes.</p>
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9299a1]">{dlcList.filter(dlc => dlc.id !== 'standard').length} available</div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.35fr)]">
                      <div className="overflow-hidden rounded-2xl border border-[#d7dbe0] bg-[#f8f9fa] shadow-[0_14px_40px_rgba(31,36,42,0.05)]">
                        <div className="border-b border-[#dde1e5] px-4 py-3">
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b838c]">Game content</span>
                        </div>
                        <div className="divide-y divide-[#e1e4e8]">
                          {dlcList.filter(dlc => dlc.id !== 'standard').map((dlc, index) => {
                            const active = selectedDLC?.id === dlc.id;
                            return (
                              <button key={dlc.id} type="button" onClick={() => setSelectedDLC(dlc)} className={`group flex w-full items-center gap-3 px-4 py-4 text-left transition-colors ${active ? 'bg-white' : 'hover:bg-white/70'}`} aria-pressed={active}>
                                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border text-xs font-black ${active ? 'border-[#31363c] bg-[#31363c] text-white' : 'border-[#d6dbe0] bg-[#eef0f2] text-[#5d6670]'}`}>{String(index + 1).padStart(2, '0')}</div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2"><strong className="truncate text-sm font-semibold text-[#2b3036]">{dlc.name}</strong>{active && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-600" />}</div>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#818891]">
                                    <span>${Number(dlc.price || 0).toFixed(2)}</span>
                                    {dlc.abilities?.length > 0 && <span>{dlc.abilities.length} abilities</span>}
                                    {dlc.achievements?.length > 0 && <span>{dlc.achievements.length} rewards</span>}
                                  </div>
                                </div>
                                <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${active ? 'translate-x-0.5 text-[#30353b]' : 'text-[#a0a6ad] group-hover:translate-x-0.5'}`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="min-h-[360px] rounded-2xl border border-[#d7dbe0] bg-white p-6 shadow-[0_18px_50px_rgba(31,36,42,0.06)]">
                        {selectedDLC ? (
                          <motion.div key={selectedDLC.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700">Selected content</span>
                                <h4 className="mt-1 text-2xl font-semibold tracking-tight text-[#252a31]">{selectedDLC.name}</h4>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666f78]">{selectedDLC.description}</p>
                              </div>
                              <div className="flex flex-shrink-0 items-center gap-3">
                                <span className="text-xl font-semibold text-[#2c3137]">${Number(selectedDLC.price || 0).toFixed(2)}</span>
                                <button type="button" onClick={() => handleAddDLCToCart(selectedDLC)} className="inline-flex items-center gap-2 rounded-lg bg-[#2f343a] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#1f2328]"><Download className="h-4 w-4" /> Add to Cart</button>
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="rounded-xl border border-[#e0e3e6] bg-[#f7f8f9] p-4">
                                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#717982]"><Check className="h-3.5 w-3.5 text-cyan-700" /> Included</div>
                                <div className="space-y-2">
                                  {(selectedDLC.offers || []).map((offer, i) => <div key={i} className="flex items-start gap-2 text-xs leading-5 text-[#505861]"><span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[#5e6770]" />{offer}</div>)}
                                  {(!selectedDLC.offers || selectedDLC.offers.length === 0) && <p className="text-xs text-[#8a9198]">No included-content notes published yet.</p>}
                                </div>
                              </div>

                              <div className="rounded-xl border border-[#e0e3e6] bg-[#f7f8f9] p-4">
                                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#717982]"><Database className="h-3.5 w-3.5 text-cyan-700" /> Content details</div>
                                <dl className="space-y-2">
                                  {Object.entries(selectedDLC.stats || {}).map(([key, value]) => <div key={key} className="flex items-center justify-between gap-4 border-b border-[#e3e6e9] pb-2 text-xs last:border-0 last:pb-0"><dt className="capitalize text-[#78808a]">{key.replace(/([A-Z])/g, ' $1').trim()}</dt><dd className="font-semibold text-[#353a40]">{value}</dd></div>)}
                                  {Object.keys(selectedDLC.stats || {}).length === 0 && <div className="text-xs text-[#8a9198]">Detailed content stats have not been published.</div>}
                                </dl>
                              </div>
                            </div>

                            {selectedDLC.achievements?.length > 0 && (
                              <div>
                                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#717982]"><Trophy className="h-3.5 w-3.5 text-cyan-700" /> Cards & rewards</div>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {selectedDLC.achievements.map((ach, i) => {
                                    const reward = typeof ach === 'string' ? { name: ach } : ach;
                                    return <button key={i} type="button" onClick={() => typeof ach === 'object' && setSelectedAchievement(ach)} className="rounded-lg border border-[#dfe3e7] bg-[#fafbfb] p-3 text-left transition-colors hover:bg-[#f1f3f4]"><small className="text-[9px] font-bold uppercase tracking-[0.13em] text-cyan-700">{reward.type || 'Reward'}</small><strong className="mt-1 block text-xs font-semibold text-[#34393f]">{reward.name}</strong>{reward.rarity && <span className="mt-1 block text-[10px] text-[#838a92]">{reward.rarity}</span>}</button>;
                                  })}
                                </div>
                              </div>
                            )}

                            {selectedDLC.quests?.length > 0 && (
                              <div>
                                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#717982]"><Radio className="h-3.5 w-3.5 text-cyan-700" /> Included quests</div>
                                <div className="divide-y divide-[#e4e7ea] rounded-xl border border-[#dfe3e7] bg-[#fafbfb]">
                                  {selectedDLC.quests.map((quest, i) => <div key={i} className="flex items-center justify-between gap-4 px-4 py-3"><span className="text-xs font-medium text-[#42484f]">{quest.name}</span><span className="text-[10px] font-semibold text-[#7b838c]">{quest.type || 'Quest'}{quest.xp ? ` · +${quest.xp} XP` : ''}</span></div>)}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-8 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9dde1] bg-[#f4f5f6]"><Package className="h-5 w-5 text-[#646d76]" /></div>
                            <h4 className="text-base font-semibold text-[#34393f]">Choose content from the left</h4>
                            <p className="mt-2 max-w-sm text-xs leading-5 text-[#7a828b]">The selected expansion, rewards, quests, and included features will appear here without leaving the page.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* About This Game */}
                  <section className="rounded-2xl border border-[#d7dbe0] bg-white p-6 shadow-[0_14px_40px_rgba(31,36,42,0.04)]">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a838d]">Game overview</span>
                    <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[#252a31]">About This Game</h3>
                    <div className="mt-4 grid gap-5 text-sm leading-7 text-[#626b74] md:grid-cols-2">
                      <p>{game.description || 'Dive into a sprawling universe where your choices matter. Engage in tactical combat, solve complex puzzles, and unravel a narrative that adapts to your decisions. Featuring state-of-the-art graphics and immersive sound design, this title pushes the boundaries of the genre.'}</p>
                      <p>Explore unique biomes, customize your loadout with weapons, armor, and abilities, and approach the experience alone or alongside other players.</p>
                    </div>
                  </section>

                  {/* Content Updates — light detailed changelog */}
                  <section className="space-y-5" aria-labelledby="content-updates-title">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a838d]">Developer changelog</span>
                        <h3 id="content-updates-title" className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[#252a31]"><Package className="h-5 w-5 text-cyan-700" /> Content Updates</h3>
                        <p className="mt-1 text-sm text-[#6b737c]">Recent patches, content drops, and hotfixes in one compact timeline.</p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9299a1]">Recent patch notes</span>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#d7dbe0] bg-white shadow-[0_16px_44px_rgba(31,36,42,0.05)]">
                      {[
                        { version: 'v2.4.1', date: 'Mar 28, 2026', type: 'patch', title: 'Stability & Balance Update', notes: ['Fixed crash on loading certain maps', 'Adjusted weapon damage scaling for PvP', 'Performance improvements for mid-range GPUs'] },
                        { version: 'v2.4.0', date: 'Mar 15, 2026', type: 'update', title: 'Season 2 Content Drop', notes: ['Added 3 new biome zones', 'Introduced ranked PvP ladder system', 'New legendary equipment tier unlocked'] },
                        { version: 'v2.3.2', date: 'Feb 20, 2026', type: 'hotfix', title: 'Hotfix — Item Duplication Bug', notes: ['Resolved item duplication exploit in Marketplace', 'Minor UI fixes for inventory overlays'] },
                      ].map((patch, i) => {
                        const typeConfig = {
                          patch: { label: 'Patch', icon: Bug, badge: 'border-amber-200 bg-amber-50 text-amber-700' },
                          update: { label: 'Update', icon: ArrowUpCircle, badge: 'border-cyan-200 bg-cyan-50 text-cyan-700' },
                          hotfix: { label: 'Hotfix', icon: Sparkles, badge: 'border-rose-200 bg-rose-50 text-rose-700' },
                        }[patch.type];
                        const TypeIcon = typeConfig.icon;
                        return (
                          <article key={i} className="grid gap-4 border-b border-[#e0e3e6] px-5 py-5 last:border-0 md:grid-cols-[125px_minmax(0,1fr)] md:px-6">
                            <div className="md:border-r md:border-[#e1e4e7] md:pr-5">
                              <div className="text-sm font-semibold text-[#383e44]">{patch.version}</div>
                              <time className="mt-1 block text-[10px] uppercase tracking-[0.08em] text-[#8a9199]">{patch.date}</time>
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${typeConfig.badge}`}><TypeIcon className="h-3 w-3" />{typeConfig.label}</span>
                                <h4 className="text-sm font-semibold text-[#30363c]">{patch.title}</h4>
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {patch.notes.map((note, j) => <div key={j} className="flex items-start gap-2 rounded-lg bg-[#f6f7f8] px-3 py-2.5 text-xs leading-5 text-[#606872]"><span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-cyan-700" />{note}</div>)}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
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