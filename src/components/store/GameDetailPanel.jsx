import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, ShoppingCart, Shield, BrainCircuit, Heart, Award, 
  Package, Info, Trophy, MessageSquare, Gamepad2, Zap, 
  Swords, Target, Sparkles, Check, Lock, ChevronRight,
  Play, Pause, Volume2, VolumeX, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ShinyCard from '@/components/shared/ShinyCard';
import { Post } from '@/entities/Post';
import CreatePostForm from '../community/CreatePostForm';
import GameCardShowcase from './GameCardShowcase';
import { getAIAchievements } from './AIAchievementsData';

// --- Components ---

const ValueHighlight = ({ icon: Icon, text, subtext }) => (
  <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-blue-400" />
    </div>
    <div>
      <p className="text-xs font-bold text-white leading-none">{text}</p>
      <p className="text-[10px] text-white/50 leading-none mt-1">{subtext}</p>
    </div>
  </div>
);

const GainBlock = ({ icon: Icon, title, description }) => (
  <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
      <Icon className="w-5 h-5 text-cyan-400" />
    </div>
    <div>
      <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
      <p className="text-xs text-white/60 leading-relaxed">{description}</p>
    </div>
  </div>
);

const AbilityCard = ({ ability }) => (
  <div className="w-full h-full">
    <ShinyCard>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />
      <img 
        src={ability.image || `https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop`} 
        alt={ability.name}
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" 
      />
      
      <div className="absolute inset-0 p-4 flex flex-col justify-between z-20">
        <div className="flex justify-between items-start">
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] uppercase">
            {ability.tier || 'Rare'}
          </Badge>
          <div className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center border border-white/10">
            <Zap className="w-3 h-3 text-yellow-400" />
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold text-white leading-tight mb-1">{ability.name}</h4>
          <p className="text-[10px] text-white/60 line-clamp-3 mb-3">{ability.description}</p>
          
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-black/40 rounded px-2 py-1">
              <span className="text-[8px] text-white/40 block">COOLDOWN</span>
              <span className="text-[10px] text-white font-mono">{ability.cooldown || 'N/A'}</span>
            </div>
            <div className="bg-black/40 rounded px-2 py-1">
              <span className="text-[8px] text-white/40 block">TYPE</span>
              <span className="text-[10px] text-white font-mono">{ability.type || 'Active'}</span>
            </div>
          </div>
        </div>
      </div>
    </ShinyCard>
  </div>
);

const EquipmentCard = ({ item }) => (
  <div className="w-full h-full">
    <ShinyCard>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />
      <img 
        src={item.image || `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop`} 
        alt={item.name}
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" 
      />
      
      <div className="absolute inset-0 p-4 flex flex-col justify-between z-20">
        <div className="flex justify-between items-start">
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px] uppercase">
            {item.rarity || 'Legendary'}
          </Badge>
          {item.stats && (
            <div className="flex flex-col gap-1 text-right">
              {Object.entries(item.stats).slice(0,2).map(([key, val]) => (
                <span key={key} className="text-[9px] font-mono text-green-400">
                  +{val} {key.substr(0,3).toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-lg font-bold text-white leading-tight mb-1">{item.name}</h4>
          <p className="text-[10px] text-white/60 line-clamp-2 mb-3">{item.description}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="border-white/10 text-white/40 text-[9px]">
              {item.type || 'Gear'}
            </Badge>
            <span className="text-[9px] text-white/30 ml-auto">Tradable</span>
          </div>
        </div>
      </div>
    </ShinyCard>
  </div>
);

export default function GameDetailPanel({ game, onPurchase }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeMedia, setActiveMedia] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPerk, setSelectedPerk] = useState(null);

  // Get AI Achievements for this game
  const aiAchievements = getAIAchievements(game?.id);

  // Construct media list from game properties
  const mediaList = React.useMemo(() => {
    if (!game) return [];
    
    const list = [];
    
    // Add Videos (YouTube)
    if (game.video_urls && Array.isArray(game.video_urls)) {
        game.video_urls.forEach(url => {
            // Extract video ID for thumbnail if possible, or use a generic video placeholder
            let videoId = null;
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
                videoId = match ? match[1] : null;
            }
            
            list.push({
                type: 'video',
                url: url,
                thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : game.cover_image,
                videoId: videoId
            });
        });
    } else if (game.trailer_url) {
         // Legacy fallback
         list.push({ type: 'video', url: game.trailer_url, thumbnail: game.cover_image });
    }

    // Add Screenshots
    if (game.screenshots && Array.isArray(game.screenshots)) {
        game.screenshots.forEach(url => {
            list.push({ type: 'image', url: url });
        });
    }
    
    // Fallback if empty
    if (list.length === 0) {
        list.push({ 
            type: 'image', 
            url: game.cover_image || game.image || 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=600&fit=crop' 
        });
    }
    
    return list;
  }, [game]);

  // Initialize media
  useEffect(() => {
    if (mediaList.length > 0) {
      setActiveMedia(mediaList[0]);
    }
  }, [mediaList]);

  // Fetch posts if community tab active
  useEffect(() => {
    if (activeTab === 'community' && game?.title) {
      const fetchPosts = async () => {
        try {
          const posts = await Post.filter({ game_title: game.title }, '-created_date', 5);
          setCommunityPosts(posts);
        } catch (error) {
          console.error("Failed to fetch posts:", error);
        }
      };
      fetchPosts();
    }
  }, [activeTab, game?.title]);

  if (!game) return <div className="p-8 text-center text-white/40">Select a game to view details.</div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'abilities', label: 'Abilities', icon: BrainCircuit },
    { id: 'equipment', label: 'Equipment', icon: Shield },
    { id: 'ai_achievements', label: 'AI Achievements', icon: Shield },
    { id: 'community', label: 'Community', icon: MessageSquare },
  ];

  const handleCreatePost = async (postData) => {
    try {
      const newPost = { ...postData, game_title: game.title };
      await Post.create(newPost);
      setShowCreatePost(false);
      const posts = await Post.filter({ game_title: game.title }, '-created_date', 5);
      setCommunityPosts(posts);
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0c10] text-white overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-900/10 via-purple-900/5 to-[#0a0c10]" />
        <img 
          src={game.cover_image} 
          className="absolute top-0 left-0 w-full h-[500px] object-cover opacity-10 mask-image-gradient-b"
          alt="bg"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        {/* TOP SECTION: Hero & Decision Anchor */}
        <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left: Media Gallery */}
            <div className="w-full lg:w-[60%] flex flex-col gap-4">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 relative group">
                {activeMedia?.type === 'video' ? (
                  activeMedia.url.includes('youtube') || activeMedia.url.includes('youtu.be') ? (
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${activeMedia.videoId}?autoplay=1&mute=1&loop=1&playlist=${activeMedia.videoId}`} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="w-full h-full object-cover"
                      ></iframe>
                  ) : (
                      <video src={activeMedia.url} autoPlay muted loop className="w-full h-full object-cover" />
                  )
                ) : (
                  <img src={activeMedia?.url} alt="Main" className="w-full h-full object-cover" />
                )}
                
                {/* Overlay Gradient (Only for images) */}
                {activeMedia?.type !== 'video' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />
                )}
                
                {/* Game Logo/Title Overlay - Hide on video to not obstruct */}
                {activeMedia?.type !== 'video' && (
                    <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 drop-shadow-lg">
                        {game.title}
                    </h1>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white text-base">
                        {game.genre}
                        </Badge>
                        <div className="flex items-center gap-1 text-yellow-400">
                        <span className="font-bold text-lg">{game.rating || 4.5}</span>
                        </div>
                    </div>
                    </div>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {mediaList.map((m, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveMedia(m)}
                    className={`relative w-24 aspect-video rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeMedia?.url === m.url ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={m.type === 'video' ? (m.thumbnail || m.url) : m.url} className="w-full h-full object-cover" onError={(e) => e.target.src = game.cover_image} />
                    {m.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Info & Purchase */}
            <div className="w-full lg:w-[40%] flex flex-col gap-6">
              {/* Branding */}
              <div className="flex items-center gap-3 opacity-80">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center font-bold text-xs">
                  {game.developer?.[0] || 'A'}
                </div>
                <div className="text-sm">
                  <p className="text-white font-bold">{game.developer}</p>
                  <p className="text-white/50">Publisher</p>
                </div>
              </div>

              {/* Price & CTA */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold text-white">${game.price}</span>
                  {game.originalPrice && (
                    <span className="text-base text-white/40 line-through">${game.originalPrice}</span>
                  )}
                </div>

                <Button 
                  onClick={() => onPurchase(game)}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-base shadow-[0_0_20px_rgba(37,99,235,0.3)] mb-3"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <div className="text-center text-[10px] text-white/30">
                  Instant digital delivery • Atom XE Secure
                </div>
              </div>

              {/* Quick Value Highlights */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Included in Atom XE</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ValueHighlight 
                    icon={BrainCircuit} 
                    text={`Unlocks ${game.abilities?.length || 3} Abilities`} 
                    subtext="Permanent Avatar Upgrades" 
                  />
                  <ValueHighlight 
                    icon={Shield} 
                    text={`Includes ${game.equipment?.length || 5} Cards`} 
                    subtext="Tradable Equipment" 
                  />
                  <ValueHighlight 
                    icon={Trophy} 
                    text="Genre XP Boost" 
                    subtext="Progress Seasonal Pass" 
                  />
                  <ValueHighlight 
                    icon={Sparkles} 
                    text="Exclusive Badge" 
                    subtext="Early Adopter Reward" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY NAV */}
        <div className="sticky top-0 z-30 bg-[#0a0c10]/90 backdrop-blur-xl border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-10 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-8 h-14">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 h-full text-lg font-bold transition-all relative ${
                    activeTab === tab.id 
                      ? 'text-white' 
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" 
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="max-w-7xl mx-auto w-full p-6 md:p-10 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-8">
                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">About the Game</h2>
                      <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                        {game.description || "Immerse yourself in a world of endless possibilities. Experience groundbreaking gameplay, stunning visuals, and a narrative that adapts to your choices."}
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">Atom XE Platform Gains</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <GainBlock 
                          icon={BrainCircuit}
                          title="Neural Expansion"
                          description="Unlocks the 'Tactical Awareness' ability tree for your global AI Avatar."
                        />
                        <GainBlock 
                          icon={Target}
                          title="Skill Mastery"
                          description="Contributes 1500 XP towards your RPG Genre Mastery level."
                        />
                        <GainBlock 
                          icon={Swords}
                          title="Combat Data"
                          description="Feeds combat decision data to train your AI's PvP behavior model."
                        />
                        <GainBlock 
                          icon={Package}
                          title="Asset Library"
                          description="All 3D assets in this game can be viewed in the Holodeck."
                        />
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-400" />
                        System Specs
                      </h3>
                      <div className="space-y-3 text-xs text-slate-400">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span>OS</span>
                          <span className="text-white text-right">Win 10/11</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span>Processor</span>
                          <span className="text-white text-right">Intel i5 / AMD Ryzen 5</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span>Memory</span>
                          <span className="text-white text-right">16 GB RAM</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span>Storage</span>
                          <span className="text-white text-right">50 GB SSD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABILITIES TAB */}
              {activeTab === 'abilities' && (
                <div>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">Unlockable Abilities</h2>
                      <p className="text-slate-400 text-sm">Purchase this game to add these abilities to your global deck.</p>
                    </div>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                      {game.abilities?.length || 3} Abilities Included
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {(game.abilities || [
                      { id: 1, name: 'Neural Overload', description: 'Stuns enemies in a 10m radius.', tier: 'Rare', type: 'Active' },
                      { id: 2, name: 'Cyber Stealth', description: 'Become invisible to AI detection for 30s.', tier: 'Epic', type: 'Passive' },
                      { id: 3, name: 'Data Siphon', description: 'Steal energy from robotic enemies on hit.', tier: 'Legendary', type: 'Passive' }
                    ]).map((ability, idx) => (
                      <div key={idx} className="aspect-[3/4]">
                        <AbilityCard ability={ability} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EQUIPMENT TAB */}
              {activeTab === 'equipment' && (
                <div>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">Equipment Cards</h2>
                      <p className="text-slate-400 text-sm">Exclusive gear that can be equipped or traded on the marketplace.</p>
                    </div>
                    <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                      Tradable Assets
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {(game.equipment || [
                      { id: 1, name: 'Void Rifle', description: 'High caliber energy weapon.', rarity: 'Epic', type: 'Weapon', stats: { atk: 45, rng: 80 } },
                      { id: 2, name: 'Nano Weave Suit', description: 'Lightweight armor with regeneration.', rarity: 'Rare', type: 'Armor', stats: { def: 30, spd: 10 } },
                      { id: 3, name: 'Quantum Visor', description: 'Highlights enemy weak points.', rarity: 'Legendary', type: 'Accessory', stats: { crt: 15, acc: 20 } }
                    ]).map((item, idx) => (
                      <div key={idx} className="aspect-[3/4]">
                        <EquipmentCard item={item} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI ACHIEVEMENTS TAB */}
              {activeTab === 'ai_achievements' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-cyan-400" />
                    AI Achievements
                  </h2>
                  <p className="text-white/50 text-sm mb-8">Your AI learns combat techniques, fighting styles, and tactical behaviors from this game</p>

                  {/* Main Liquid Glass Card */}
                  <div 
                    className="relative rounded-3xl p-8 border overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                      borderColor: 'rgba(255,255,255,0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 80px rgba(6,182,212,0.1)'
                    }}
                  >
                    {/* Corner Data */}
                    <div className="absolute top-6 left-6 z-20">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <BrainCircuit className="w-4 h-4 text-cyan-400" />
                        <span className="text-cyan-300 font-bold text-sm">AI XP +{aiAchievements.aiXP}</span>
                      </div>
                    </div>
                    <div className="absolute top-6 right-6 z-20">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-300 font-bold text-sm">+{aiAchievements.achievementPoints} Points</span>
                      </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
                      {/* Left: Perks List */}
                      <div className="space-y-2">
                        <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">AI Combat Perks</h3>
                        {aiAchievements.perks.map((perk, idx) => (
                          <button
                            key={perk.id}
                            onClick={() => setSelectedPerk(perk)}
                            className={`w-full text-left p-3 rounded-xl transition-all ${
                              selectedPerk?.id === perk.id
                                ? 'bg-cyan-500/20 border-cyan-400/40 text-white'
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                            } border`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{perk.icon}</span>
                              <span className="font-medium text-sm">{perk.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Center: Divider */}
                      <div className="hidden lg:flex items-center justify-center">
                        <div className="w-px h-[60%] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                      </div>

                      {/* Right: Dynamic Preview Card */}
                      <div className="lg:col-span-1">
                        {selectedPerk ? (
                          <motion.div
                            key={selectedPerk.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl overflow-hidden border border-white/20"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)'
                            }}
                          >
                            {/* Holographic Preview Image */}
                            <div className="relative aspect-[4/3] overflow-hidden">
                              <img 
                                src={selectedPerk.image} 
                                alt={selectedPerk.name}
                                className="w-full h-full object-cover opacity-80"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                              <div className="absolute top-3 left-3">
                                <span className="text-4xl">{selectedPerk.icon}</span>
                              </div>
                            </div>

                            {/* Perk Details */}
                            <div className="p-5 space-y-4">
                              <div>
                                <h4 className="text-white font-bold text-lg mb-2">{selectedPerk.name}</h4>
                                <p className="text-white/70 text-sm leading-relaxed">{selectedPerk.description}</p>
                              </div>

                              <div className="pt-4 border-t border-white/10 space-y-3">
                                <div>
                                  <span className="text-white/40 text-xs font-bold uppercase block mb-1">Combat Style</span>
                                  <span className="text-cyan-300 text-sm">{selectedPerk.combatStyle}</span>
                                </div>
                                <div>
                                  <span className="text-white/40 text-xs font-bold uppercase block mb-1">AI Behavior Impact</span>
                                  <span className="text-white/80 text-sm">{selectedPerk.behaviorImpact}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-white/30 text-center p-8">
                            <div>
                              <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                              <p className="text-sm">Select a perk to view details</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Center Holographic Preview (Auto-plays once) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
                      <img 
                        src={aiAchievements.holographicPreview} 
                        alt="Holographic preview"
                        className="w-32 h-32 object-cover rounded-full blur-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* COMMUNITY TAB */}
              {activeTab === 'community' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Community Feed</h2>
                    <Button variant="outline" onClick={() => setShowCreatePost(true)}>Create Post</Button>
                  </div>
                  
                  {showCreatePost && (
                    <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                      <CreatePostForm
                        onSubmit={handleCreatePost}
                        onCancel={() => setShowCreatePost(false)}
                        initialType="game_discussion"
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    {communityPosts.length > 0 ? (
                      communityPosts.map(post => (
                        <div key={post.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-white">{post.title}</h4>
                            <span className="text-xs text-slate-500">{new Date(post.created_date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-slate-300 line-clamp-3">{post.content}</p>
                          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><User className="w-3 h-3"/> {post.created_by?.split('@')[0] || 'User'}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3"/> {post.comments?.length || 0} Comments</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No community posts yet. Be the first to start a discussion!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CARD SHOWCASE SECTION (Scroll Revealed) */}
        <GameCardShowcase game={game} />
        
      </div>
    </div>
  );
}