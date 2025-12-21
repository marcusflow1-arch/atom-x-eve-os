import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import * as THREE from 'three';
import {
  ArrowLeft, Play, ShoppingCart, Heart, Share, Star, Trophy, Sword, Zap, Package,
  Monitor, Gamepad, Cpu, HardDrive, Download, Eye, Users, MessageSquare, Crown, Bot, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '../CartContext';
import { useAuth } from '../auth/AuthContext';
import { Game } from '@/entities/Game';
import { allMockGames } from '../store/mockData';
import { enhancedMockGameData as legacyEnhancedMockData } from '../store/mockGameDetailData';
import StreamAffiliateTab from '../gamedetail/StreamAffiliateTab';
import PlayerStatsPanel from '../gamedetail/PlayerStatsPanel';

// 3D Model Viewer Component
const Model3DViewer = ({ gameId, modelType }) => {
  const mountRef = React.useRef(null);
  const rendererRef = React.useRef(null);
  const frameRef = React.useRef(null);
  const mouseRef = React.useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    currentMount.appendChild(renderer.domElement);

    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    let model;
    let initialCameraZ = 5;

    // Determine model based on modelType or gameId
    if (modelType === 'equipment') {
      const equipmentGroup = new THREE.Group();
      const body = new THREE.BoxGeometry(1.2, 1.5, 0.5);
      const shoulder = new THREE.SphereGeometry(0.6, 16, 16);
      const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
      
      const bodyMesh = new THREE.Mesh(body, material);
      const leftShoulder = new THREE.Mesh(shoulder, material);
      leftShoulder.position.set(-0.8, 0.5, 0);
      const rightShoulder = new THREE.Mesh(shoulder, material);
      rightShoulder.position.set(0.8, 0.5, 0);

      equipmentGroup.add(bodyMesh, leftShoulder, rightShoulder);
      model = equipmentGroup;
      initialCameraZ = 4;
    } else if (modelType === 'ability') {
      const sphere = new THREE.SphereGeometry(1, 32, 32);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff, 
        emissive: 0x00ffff, 
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7 
      });
      model = new THREE.Mesh(sphere, material);
      initialCameraZ = 3;
    } else if (modelType === 'lootbox') {
      const chestGroup = new THREE.Group();
      const base = new THREE.BoxGeometry(2, 1.5, 1.5);
      const lid = new THREE.BoxGeometry(2.1, 0.5, 1.6);
      const material = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
      const accentMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });

      const baseMesh = new THREE.Mesh(base, material);
      const lidMesh = new THREE.Mesh(lid, accentMaterial);
      lidMesh.position.y = 1;

      chestGroup.add(baseMesh, lidMesh);
      model = chestGroup;
      initialCameraZ = 4;
    } else {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshPhongMaterial({ color: 0x3b82f6 });
      model = new THREE.Mesh(geometry, material);
      initialCameraZ = 5;
    }
    
    scene.add(model);
    camera.position.z = initialCameraZ;

    // Mouse interaction
    const onMouseMove = (event) => {
      const rect = currentMount.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    currentMount.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (model) {
        model.rotation.y += (mouseRef.current.x * 0.5 - model.rotation.y) * 0.05;
        model.rotation.x += (-mouseRef.current.y * 0.5 - model.rotation.x) * 0.05;
        model.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (currentMount && renderer && camera) {
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      currentMount.removeEventListener('mousemove', onMouseMove);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [gameId, modelType]);

  return (
    <div ref={mountRef} className="w-full h-full relative" />
  );
};

const rarityColors = {
  Common: 'text-gray-400 bg-gray-500/20',
  Uncommon: 'text-green-400 bg-green-500/20',
  Rare: 'text-blue-400 bg-blue-500/20',
  Epic: 'text-purple-400 bg-purple-500/20',
  Legendary: 'text-orange-400 bg-orange-500/20'
};

// Interactive Card with Tilt and Shine Effect
const InteractiveCard = ({ children, delay = 0 }) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  
  const rotateX = useTransform(y, [0, 1], [10, -10]);
  const rotateY = useTransform(x, [0, 1], [-10, 10]);
  
  const shineX = useTransform(x, [0, 1], ['-100%', '200%']);
  
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;
    x.set(mouseX);
    y.set(mouseY);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 overflow-hidden cursor-pointer transition-all hover:border-white/20"
      whileHover={{ scale: 1.02 }}
    >
      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
          x: shineX,
        }}
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '200%' : '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      
      {/* Glass Reflection */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0.5 }}
      />
      
      {children}
    </motion.div>
  );
};

export default function GameDetailPanel({ gameId, onClose, showBackButton = true, from = 'store' }) {
  const { addToCart, isPurchased } = useCart();
  const { isAuthenticated, user, updateUserData } = useAuth();
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      try {
        if (allMockGames[gameId]) {
          setGame(allMockGames[gameId]);
        } else {
          const fetchedGame = await Game.get(gameId);
          setGame(fetchedGame);
        }
      } catch (error) {
        console.error("Error fetching game:", error);
        if (legacyEnhancedMockData[gameId]) {
          setGame(legacyEnhancedMockData[gameId]);
        } else {
          setGame(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (gameId) {
      fetchGame();
    } else {
      setLoading(false);
      setGame(null);
    }
  }, [gameId]);

  const handlePurchase = async () => {
    if (game && isAuthenticated) {
      const currentPurchased = user?.purchased_items || [];
      if (!currentPurchased.includes(game.id)) {
        await updateUserData({ 
          purchased_items: [...currentPurchased, game.id] 
        });
      }
    }
  };

  const handleStreamToggle = (isStreaming) => {
    if (isStreaming) {
      localStorage.setItem('streaming_game_id', game.id);
    } else {
      localStorage.removeItem('streaming_game_id');
    }
    window.dispatchEvent(new Event('storage'));
  };

  const gameIsOwned = game?.id ? isPurchased(game.id) : false;
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (gameIsOwned) {
        setIsInstalled(true); 
    } else {
        setIsInstalled(false);
    }
  }, [gameIsOwned]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-6">
        <h1 className="text-4xl font-bold mb-4">Game Not Found</h1>
        <p className="text-slate-400 mb-8">The game you're looking for doesn't exist.</p>
        {showBackButton && onClose && (
          <Button onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white overflow-y-auto">
      {/* Header Section */}
      <div className="relative">
        {/* Banner Image */}
        <div className="h-96 relative overflow-hidden">
          <img
            src={game.banner || game.cover_image || game.cover}
            alt={game.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Game Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <h1 className="text-5xl font-black mb-2">{game.title}</h1>
                <p className="text-xl text-blue-300 mb-4">{game.tagline}</p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span>{game.rating} ({game.reviewCount?.toLocaleString()} reviews)</span>
                  </div>
                  <span>{game.developer}</span>
                  <span>{game.genre}</span>
                  {game.aiEnhanced && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                      <Bot className="w-3 h-3 mr-1" />
                      AI Enhanced
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 ml-8">
                <div className="text-right mb-2">
                  {!gameIsOwned && (
                    <>
                      <span className="text-3xl font-bold text-green-400">${game.price}</span>
                      {game.originalPrice && (
                        <span className="text-slate-500 line-through text-lg ml-2">${game.originalPrice}</span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-3">
                  {gameIsOwned ? (
                      isInstalled ? (
                          <Button size="lg" className="bg-green-600 hover:bg-green-700">
                              <Play className="w-5 h-5 mr-2" />
                              Play
                          </Button>
                      ) : (
                          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                              <Download className="w-5 h-5 mr-2" />
                              Download
                          </Button>
                      )
                  ) : (
                      <Button size="lg" onClick={handlePurchase} className="bg-blue-600 hover:bg-blue-700">
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Purchase
                      </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        {showBackButton && onClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all text-white/80 hover:text-white z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Enhanced Tabbed Content */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {from === 'library' && game && (
            <div className="mb-8">
              <PlayerStatsPanel game={game} />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="abilities">Abilities</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">About This Game</h3>
                    <p className="text-slate-300 leading-relaxed mb-6">{game.description}</p>
                  </div>
                  
                  {/* Video Trailer */}
                  <div>
                    <h4 className="text-xl font-semibold mb-4">Game Trailer</h4>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                      <video 
                        className="w-full h-full object-cover"
                        controls
                        poster={game.banner || game.cover_image}
                      >
                        <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                      </video>
                    </div>
                  </div>
                  
                  {/* Screenshots Gallery */}
                  <div>
                    <h4 className="text-xl font-semibold mb-4">Screenshots</h4>
                    <div className="space-y-4">
                      <img
                        src={game.screenshots?.[activeScreenshot] || game.cover}
                        alt="Screenshot"
                        className="w-full aspect-video object-cover rounded-lg border border-white/10"
                      />
                      <div className="grid grid-cols-5 gap-3">
                        {(game.screenshots || [game.cover, game.banner, game.cover, game.banner, game.cover]).map((screenshot, index) => (
                          <img
                            key={index}
                            src={screenshot}
                            alt={`Screenshot ${index + 1}`}
                            className={`aspect-video object-cover rounded cursor-pointer transition-all border-2 ${
                              activeScreenshot === index ? 'border-blue-500 scale-105' : 'border-white/10 hover:border-white/30 hover:scale-105'
                            }`}
                            onClick={() => setActiveScreenshot(index)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-semibold mb-4">System Requirements</h4>
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-white/10">
                      <div>
                        <Monitor className="w-4 h-4 inline mr-2" />
                        <span className="text-slate-400">OS:</span> {game.requirements?.os || 'Windows 10 64-bit'}
                      </div>
                      <div>
                        <Cpu className="w-4 h-4 inline mr-2" />
                        <span className="text-slate-400">Processor:</span> {game.requirements?.processor || 'Intel Core i5-7600K'}
                      </div>
                      <div>
                        <span className="text-slate-400">Memory:</span> {game.requirements?.memory || '16 GB RAM'}
                      </div>
                      <div>
                        <span className="text-slate-400">Graphics:</span> {game.requirements?.graphics || 'NVIDIA GTX 1060'}
                      </div>
                      <div>
                        <HardDrive className="w-4 h-4 inline mr-2" />
                        <span className="text-slate-400">Storage:</span> {game.requirements?.storage || '50 GB'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold mb-4">Game Info</h4>
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-white/10">
                      <div>
                        <span className="text-slate-400">Developer:</span> {game.developer || 'Game Studio'}
                      </div>
                      <div>
                        <span className="text-slate-400">Publisher:</span> {game.publisher || 'Publisher Inc'}
                      </div>
                      <div>
                        <span className="text-slate-400">Release Date:</span> {game.releaseDate || 'TBA'}
                      </div>
                      <div>
                        <span className="text-slate-400">Genre:</span> {game.genre}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold mb-4">Features</h4>
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 border border-white/10">
                      {['Single-player', 'Online Co-op', 'Steam Achievements', 'Cloud Saves', 'Controller Support'].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              <h3 className="text-2xl font-bold mb-6">Achievements & Rewards</h3>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex-1 bg-slate-800/50 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Progress</span>
                    <span className="text-white font-bold">{game?.achievements?.filter(a => a.unlocked).length || 0}/{game?.achievements?.length || 15}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${((game?.achievements?.filter(a => a.unlocked).length || 0) / (game?.achievements?.length || 15)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {(game?.achievements || [
                  { id: 1, name: 'First Steps', description: 'Complete the tutorial', icon: '🎮', rarity: 'Common', points: 10, unlocked: true },
                  { id: 2, name: 'Dragon Slayer', description: 'Defeat the Ancient Dragon', icon: '🐉', rarity: 'Legendary', points: 100, unlocked: false },
                  { id: 3, name: 'Master Explorer', description: 'Discover all hidden locations', icon: '🗺️', rarity: 'Epic', points: 50, unlocked: true },
                  { id: 4, name: 'Speed Runner', description: 'Complete game in under 5 hours', icon: '⚡', rarity: 'Rare', points: 75, unlocked: false },
                  { id: 5, name: 'Collector', description: 'Find all collectibles', icon: '💎', rarity: 'Epic', points: 60, unlocked: false },
                  { id: 6, name: 'Perfect Victory', description: 'Win without taking damage', icon: '🏆', rarity: 'Legendary', points: 100, unlocked: false },
                  { id: 7, name: 'Social Butterfly', description: 'Complete 10 co-op missions', icon: '👥', rarity: 'Uncommon', points: 25, unlocked: true },
                  { id: 8, name: 'Arsenal Master', description: 'Unlock all weapons', icon: '⚔️', rarity: 'Rare', points: 40, unlocked: false },
                ]).map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 4 }}
                    className={`relative p-5 rounded-xl border transition-all ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-r from-green-500/10 to-transparent border-green-500/30' 
                        : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${
                        achievement.unlocked ? 'bg-slate-700' : 'bg-slate-800/50 grayscale opacity-60'
                      }`}>
                        {achievement.icon}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className={`font-bold text-lg ${achievement.unlocked ? 'text-white' : 'text-slate-400'}`}>
                            {achievement.name}
                          </h4>
                          <Badge className={`${rarityColors[achievement.rarity]} text-xs`}>
                            {achievement.rarity}
                          </Badge>
                          {achievement.unlocked && <Crown className="w-5 h-5 text-yellow-400" />}
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{achievement.description}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-yellow-400 font-bold text-sm">{achievement.points} XP</span>
                          {!achievement.unlocked && (
                            <span className="text-slate-500 text-xs">Locked</span>
                          )}
                        </div>
                      </div>

                      <Button size="sm" variant={achievement.unlocked ? 'secondary' : 'outline'} disabled={achievement.unlocked}>
                        {achievement.unlocked ? 'Unlocked' : 'Track'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Equipment Tab */}
            <TabsContent value="equipment">
              <h3 className="text-2xl font-bold mb-6">Equipment & Gear</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(game?.equipment || [
                  { id: 1, name: 'Dragon Blade', type: 'Weapon', rarity: 'Legendary', description: 'A legendary sword forged from dragon scales', stats: { attack: 150, speed: 25 } },
                  { id: 2, name: 'Shadow Armor', type: 'Chest', rarity: 'Epic', description: 'Armor that bends light around the wearer', stats: { defense: 120, stealth: 40 } },
                  { id: 3, name: 'Phoenix Helm', type: 'Head', rarity: 'Rare', description: 'Grants fire resistance and health regeneration', stats: { defense: 80, health_regen: 15 } },
                  { id: 4, name: 'Mystic Gauntlets', type: 'Hands', rarity: 'Epic', description: 'Enchanted gloves that amplify magic', stats: { magic_power: 100, mana: 50 } },
                  { id: 5, name: 'Thunder Boots', type: 'Feet', rarity: 'Rare', description: 'Lightning-infused boots for incredible speed', stats: { speed: 60, agility: 35 } },
                  { id: 6, name: 'Crystal Shield', type: 'Shield', rarity: 'Epic', description: 'Crystalline barrier that reflects magic', stats: { defense: 90, magic_resist: 45 } },
                ]).map((item, index) => (
                  <InteractiveCard key={item.id} delay={index * 0.05}>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={`${rarityColors[item.rarity]} text-xs`}>
                          {item.rarity}
                        </Badge>
                        <span className="text-slate-500 text-xs uppercase">{item.type}</span>
                      </div>
                      
                      <div className="w-full aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg mb-4 flex items-center justify-center border border-white/5">
                        <Sword className="w-16 h-16 text-slate-600" />
                      </div>
                      
                      <h4 className="font-bold text-white text-lg mb-2">{item.name}</h4>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                      
                      <div className="space-y-2 pt-4 border-t border-white/5">
                        {Object.entries(item.stats).map(([stat, value]) => (
                          <div key={stat} className="flex justify-between text-sm">
                            <span className="text-slate-400 capitalize">{stat.replace('_', ' ')}</span>
                            <span className="text-green-400 font-bold">+{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </InteractiveCard>
                ))}
              </div>
            </TabsContent>

            {/* Abilities Tab */}
            <TabsContent value="abilities">
              <h3 className="text-2xl font-bold mb-6">Special Abilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(game?.abilities || [
                  { id: 1, name: 'Inferno Strike', tier: 'Legendary', description: 'Unleash a devastating fire attack that burns enemies', cooldown: '45s', effect: 'Deals 500 fire damage in an area' },
                  { id: 2, name: 'Time Warp', tier: 'Epic', description: 'Slow down time for all enemies around you', cooldown: '60s', effect: 'Slows enemies by 80% for 10s' },
                  { id: 3, name: 'Shadow Step', tier: 'Rare', description: 'Teleport behind your target instantly', cooldown: '15s', effect: 'Instant teleport with 2s invulnerability' },
                  { id: 4, name: 'Void Shield', tier: 'Epic', description: 'Create an impenetrable barrier of void energy', cooldown: '30s', effect: 'Blocks all damage for 5s' },
                  { id: 5, name: 'Lightning Storm', tier: 'Legendary', description: 'Summon a storm of lightning bolts', cooldown: '90s', effect: '300 damage per second for 15s' },
                  { id: 6, name: 'Healing Nova', tier: 'Rare', description: 'Restore health to you and nearby allies', cooldown: '25s', effect: 'Heals 200 HP in 10m radius' },
                ]).map((ability, index) => (
                  <InteractiveCard key={ability.id} delay={index * 0.05}>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={`${rarityColors[ability.tier]} text-xs`}>
                          {ability.tier}
                        </Badge>
                        <span className="text-purple-400 text-xs font-bold">{ability.cooldown}</span>
                      </div>
                      
                      <div className="w-full aspect-square bg-gradient-to-br from-purple-900/30 to-slate-900 rounded-lg mb-4 flex items-center justify-center border border-purple-500/20">
                        <Zap className="w-16 h-16 text-purple-500" />
                      </div>
                      
                      <h4 className="font-bold text-white text-lg mb-2">{ability.name}</h4>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{ability.description}</p>
                      
                      <div className="pt-4 border-t border-white/5">
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-blue-300 text-xs font-medium">{ability.effect}</p>
                        </div>
                      </div>
                    </div>
                  </InteractiveCard>
                ))}
              </div>
            </TabsContent>



          </Tabs>
        </div>
      </div>
    </div>
  );
}