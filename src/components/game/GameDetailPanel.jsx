import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
                  <Button size="lg" variant="outline">
                    <Heart className="w-5 h-5 mr-2" />
                    Wishlist
                  </Button>
                  <Button size="lg" variant="outline">
                    <Share className="w-5 h-5" />
                  </Button>
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
            <TabsList className="grid w-full grid-cols-6 bg-slate-800/50 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="abilities">Abilities</TabsTrigger>
              <TabsTrigger value="loot">Loot Boxes</TabsTrigger>
              <TabsTrigger value="stream">Stream Affiliate</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h3 className="text-2xl font-bold mb-4">About This Game</h3>
                  <p className="text-slate-300 leading-relaxed mb-6">{game.description}</p>
                  
                  {/* Screenshots */}
                  <h4 className="text-xl font-semibold mb-4">Screenshots</h4>
                  <div className="space-y-4">
                    <img
                      src={game.screenshots?.[activeScreenshot] || game.cover}
                      alt="Screenshot"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {game.screenshots?.map((screenshot, index) => (
                        <img
                          key={index}
                          src={screenshot}
                          alt={`Screenshot ${index + 1}`}
                          className={`aspect-video object-cover rounded cursor-pointer transition-all ${
                            activeScreenshot === index ? 'ring-2 ring-blue-500' : 'hover:opacity-80'
                          }`}
                          onClick={() => setActiveScreenshot(index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-semibold mb-4">System Requirements</h4>
                  <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                    <div>
                      <Monitor className="w-4 h-4 inline mr-2" />
                      <span className="text-slate-400">OS:</span> {game.requirements?.os}
                    </div>
                    <div>
                      <Cpu className="w-4 h-4 inline mr-2" />
                      <span className="text-slate-400">Processor:</span> {game.requirements?.processor}
                    </div>
                    <div>
                      <span className="text-slate-400">Memory:</span> {game.requirements?.memory}
                    </div>
                    <div>
                      <span className="text-slate-400">Graphics:</span> {game.requirements?.graphics}
                    </div>
                    <div>
                      <HardDrive className="w-4 h-4 inline mr-2" />
                      <span className="text-slate-400">Storage:</span> {game.requirements?.storage}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-xl font-semibold mb-4">Game Info</h4>
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-slate-400">Developer:</span> {game.developer}
                      </div>
                      <div>
                        <span className="text-slate-400">Publisher:</span> {game.publisher}
                      </div>
                      <div>
                        <span className="text-slate-400">Release Date:</span> {game.releaseDate}
                      </div>
                      <div>
                        <span className="text-slate-400">Genre:</span> {game.genre}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              <h3 className="text-2xl font-bold mb-6">Achievements & Rewards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {game?.achievements?.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                      achievement.unlocked 
                        ? 'bg-green-500/10 border-green-500/50' 
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{achievement.icon}</span>
                        <div>
                          <h4 className="font-bold text-lg">{achievement.name}</h4>
                          <Badge className={`${rarityColors[achievement.rarity]}`}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                      </div>
                      {achievement.unlocked && <Crown className="w-6 h-6 text-yellow-400" />}
                    </div>
                    <p className="text-slate-400 mb-4">{achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-400 font-bold">{achievement.points} points</span>
                      <Button size="sm" variant={achievement.unlocked ? 'secondary' : 'default'}>
                        {achievement.unlocked ? 'Unlocked' : 'Track Progress'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Equipment Tab */}
            <TabsContent value="equipment">
              <h3 className="text-2xl font-bold mb-6">Equipment & Gear</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {game?.equipment?.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all"
                  >
                    <div className="aspect-square bg-slate-900/50 rounded-lg mb-4 flex items-center justify-center">
                      <Model3DViewer gameId={gameId} modelType="equipment" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">{item.name}</h4>
                    <Badge className={`${rarityColors[item.rarity]} mb-3`}>
                      {item.rarity} {item.type}
                    </Badge>
                    <p className="text-slate-400 text-sm mb-4">{item.description}</p>
                    <div className="space-y-2">
                      {Object.entries(item.stats).map(([stat, value]) => (
                        <div key={stat} className="flex justify-between">
                          <span className="text-slate-400 capitalize">{stat.replace('_', ' ')}:</span>
                          <span className="text-green-400 font-bold">+{value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Abilities Tab */}
            <TabsContent value="abilities">
              <h3 className="text-2xl font-bold mb-6">Special Abilities</h3>
              <div className="space-y-6">
                {game?.abilities?.map((ability) => (
                  <motion.div
                    key={ability.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="aspect-square bg-slate-900/50 rounded-lg flex items-center justify-center">
                        <Model3DViewer gameId={gameId} modelType="ability" />
                      </div>
                      <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-2xl font-bold">{ability.name}</h4>
                            <Badge className={`${rarityColors[ability.tier]} mt-2`}>
                              {ability.tier}
                            </Badge>
                          </div>
                          <div className="text-right text-sm text-slate-400">
                            <div>Cooldown: {ability.cooldown}</div>
                          </div>
                        </div>
                        <p className="text-slate-300 mb-4 text-lg">{ability.description}</p>
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-blue-400" />
                          <span className="text-blue-300 font-semibold">{ability.effect}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Loot Boxes Tab */}
            <TabsContent value="loot">
              <h3 className="text-2xl font-bold mb-6">Loot Boxes & Rewards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {game?.lootBoxes?.map((loot) => (
                  <motion.div
                    key={loot.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-purple-900/30 to-slate-800/50 rounded-xl p-6 border border-purple-500/30"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-bold">{loot.name}</h4>
                      <div className="flex items-center gap-1">
                        <Package className="w-6 h-6 text-yellow-400" />
                        <span className="text-2xl font-bold text-yellow-400">{loot.price}</span>
                        <span className="text-yellow-400">AGP</span>
                      </div>
                    </div>
                    
                    <div className="aspect-square bg-slate-900/50 rounded-lg mb-4 flex items-center justify-center">
                      <Model3DViewer gameId={gameId} modelType="lootbox" />
                    </div>
                    
                    <p className="text-slate-300 mb-6">{loot.contents}</p>
                    
                    <h5 className="font-semibold mb-3">Drop Rates:</h5>
                    <div className="space-y-2 mb-6">
                      {Object.entries(loot.dropRates).map(([rarity, rate]) => (
                        <div key={rarity} className="flex justify-between">
                          <span className={rarityColors[rarity]?.split(' ')[0]}>{rarity}:</span>
                          <span className="font-semibold">{rate}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <Package className="w-4 h-4 mr-2" />
                      Purchase Loot Box
                    </Button>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Stream Affiliate Tab */}
            <TabsContent value="stream">
              <StreamAffiliateTab gameId={game.id} onStreamToggle={handleStreamToggle} />
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}