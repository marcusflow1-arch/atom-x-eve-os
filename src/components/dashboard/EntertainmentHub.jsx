
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { createPageUrl } from '@/utils';
import { 
  Film, Clapperboard, Scissors, Gamepad2, Play, Star, ChevronLeft, ChevronRight,
  Tv, Music, Video, Camera, Settings, Users, Eye, Lock, Radio, Edit3, Share2, Palette,
  Search, Mic, MicOff, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '../auth/AuthContext';
import GameplayClipEditor from './GameplayClipEditor';

// Voice Search Component for Games
const GameVoiceSearch = ({ onSearch, games, onGameSelect }) => {
  const [isListening, setIsListening] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGames, setFilteredGames] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // useCallback to stabilize handleSearch, as it's a dependency for useEffect
  const handleSearch = useCallback((query) => {
    if (query.length > 0) {
      const filtered = games.filter(game => 
        game.title.toLowerCase().includes(query.toLowerCase()) ||
        game.genre.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredGames(filtered);
      setShowSuggestions(true);
      onSearch(query);
    } else {
      setShowSuggestions(false);
      // Following outline: Removed setFilteredGames([]) and onSearch('') from else block
    }
  }, [games, onSearch]); // Dependencies for useCallback

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        handleSearch(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => setIsListening(false); // Following outline: Removed console.error
      recognitionInstance.onend = () => setIsListening(false);

      setRecognition(recognitionInstance);
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, [handleSearch]); // Added handleSearch dependency

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      // Following outline: Removed setSearchTerm(''), setFilteredGames([]), onSearch('')
      recognition.start();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    setFilteredGames([]); // Clear filtered games when search term is empty
    onSearch('');
  };

  // selectGameAndClear logic is now inline in the onClick, matching the outline's structure.
  // The original had a separate function, but the outline moved it inline and simplified.

  return (
    <div className="relative mb-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3">
        <Search className="w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search your games or say 'Play [game name]'..." // Added ellipsis per outline
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleSearch(e.target.value);
          }}
          className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-400" // Changed focus-visible to focus per outline
        />
        {searchTerm && (
          <Button onClick={clearSearch} size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        )}
        <Button
          onClick={startListening}
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${isListening ? 'text-red-500 animate-pulse bg-red-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
      </div>

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && filteredGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 z-20 mt-2 bg-slate-900/95 backdrop-blur-lg border border-slate-700/50 rounded-xl shadow-xl max-h-60 overflow-y-auto"
          >
            <div className="p-2">
              {filteredGames.slice(0, 5).map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    onGameSelect(game);
                    setShowSuggestions(false);
                    setSearchTerm('');
                    // Following outline: Removed onSearch('')
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 rounded-lg transition-colors text-left"
                >
                  <img src={game.image} alt={game.title} className="w-10 h-10 object-cover rounded" />
                  <div>
                    <p className="text-white font-medium">{game.title}</p>
                    <p className="text-slate-400 text-sm">{game.genre}</p>
                  </div>
                  <Play className="w-4 h-4 text-blue-400 ml-auto" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EntertainmentHub = () => {
  const [activeTab, setActiveTab] = useState('pinned-games');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const gamesPerPage = 12;
  const { user, isAuthenticated } = useAuth();
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);

  // Sample owned games - wrapped in useMemo to prevent recreation on every render
  const ownedGames = useMemo(() => [
    { id: '1', title: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=300&fit-crop', genre: 'RPG' },
    { id: '2', title: 'Elder Scrolls Reborn', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=300&fit-crop', genre: 'Fantasy' },
    { id: '3', title: 'Half-Life Reconstructed', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=300&fit-crop', genre: 'FPS' },
    { id: '4', title: 'Diablo Eternal', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=200&h=300&fit-crop', genre: 'ARPG' },
    { id: '5', title: 'StarCraft Ghost', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200&h=300&fit-crop', genre: 'Strategy' },
    { id: '6', title: 'Metroid Evolved', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&h=300&fit-crop', genre: 'Adventure' },
    { id: '7', title: 'Final Fantasy XVI', image: 'https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?w=200&h=300&fit-crop', genre: 'JRPG' },
    { id: '8', title: 'Mass Effect Legacy', image: 'https://images.unsplash.com/photo-1614732444964-6e4fb0aa7e51?w=200&h=300&fit-crop', genre: 'Sci-Fi' },
    { id: '9', title: 'Witcher IV', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200&h=300&fit-crop', genre: 'RPG' },
    { id: '10', title: 'Assassins Creed Origins', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200&h=300&fit-crop', genre: 'Action' },
    { id: '11', title: 'Call of Duty Future', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=200&h=300&fit-crop', genre: 'FPS' },
    { id: '12', title: 'Minecraft Evolved', image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=200&h=300&fit-crop', genre: 'Sandbox' },
    { id: '13', title: 'Overwatch 3', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=200&h=300&fit-crop', genre: 'Hero Shooter' },
    { id: '14', title: 'League of Legends 2', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=300&fit-crop', genre: 'MOBA' }
  ], []);

  const streamingServices = useMemo(() => [
    { name: 'Netflix', icon: 'https://img.icons8.com/color/48/netflix.png', url: 'https://netflix.com', color: '#E50914' },
    { name: 'Hulu', icon: 'https://img.icons8.com/color/48/hulu.png', url: 'https://hulu.com', color: '#1CE783' },
    { name: 'Prime Video', icon: 'https://img.icons8.com/color/48/amazon-prime-video.png', url: 'https://primevideo.com', color: '#00A8E1' },
    { name: 'Disney+', icon: 'https://img.icons8.com/color/48/disney-plus.png', url: 'https://disneyplus.com', color: '#113CCF' },
    { name: 'Max', icon: 'https://img.icons8.com/color/48/hbo-max.png', url: 'https://max.com', color: '#7B2D8E' },
    { name: 'Crunchyroll', icon: 'https://img.icons8.com/color/48/crunchyroll.png', url: 'https://crunchyroll.com', color: '#FF6600' },
    { name: 'YouTube', icon: 'https://img.icons8.com/color/48/youtube-play.png', url: 'https://youtube.com', color: '#FF0000' },
    { name: 'Twitch', icon: 'https://img.icons8.com/color/48/twitch.png', url: 'https://twitch.tv', color: '#9146FF' },
    { name: 'Apple TV', icon: 'https://img.icons8.com/color/48/apple-tv.png', url: 'https://tv.apple.com', color: '#000000' },
    { name: 'Spotify', icon: 'https://img.icons8.com/color/48/spotify.png', url: 'https://spotify.com', color: '#1DB954' }
  ], []);

  // 3D Animation for background
  useEffect(() => {
    if (activeTab !== 'clip-editor') return;
    
    const canvas = document.getElementById('entertainment-3d-bg');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Add floating geometric shapes for clip editor ambiance
    const geometry = new THREE.OctahedronGeometry(0.5);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x8b5cf6, 
      transparent: true, 
      opacity: 0.3,
      wireframe: true 
    });

    const shapes = [];
    for (let i = 0; i < 8; i++) {
      const shape = new THREE.Mesh(geometry, material.clone());
      shape.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      shapes.push(shape);
      scene.add(shape);
    }

    // Lighting
    const light = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(light);
    const directional = new THREE.DirectionalLight(0x8b5cf6, 0.8);
    directional.position.set(5, 5, 5);
    scene.add(directional);

    camera.position.z = 8;

    const animate = () => {
      requestAnimationFrame(animate);
      shapes.forEach((shape, index) => {
        shape.rotation.x += 0.002 + index * 0.0005;
        shape.rotation.y += 0.003 + index * 0.0003;
        shape.position.y += Math.sin(Date.now() * 0.001 + index) * 0.001;
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      // Clean up Three.js resources
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      if (sceneRef.current) {
        // Dispose of geometry and materials
        sceneRef.current.traverse((object) => {
          if (object.isMesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material) => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
        sceneRef.current = null;
      }
    };
  }, [activeTab]);

  // Filter games based on search - now with stable ownedGames dependency
  const filteredOwnedGames = useMemo(() => {
    if (!searchQuery) return ownedGames;
    return ownedGames.filter(game => 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.genre.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, ownedGames]);

  const handleGameSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  }, []); // No dependencies needed as setSearchQuery and setCurrentPage are stable setters

  const handleGameSelect = useCallback((game) => {
    console.log('Selected game:', game.title);
    // Add game launch logic here
    // Following outline: Removed setSearchQuery('')
  }, []); // No dependencies needed for this simple logic

  // Pagination logic
  const totalPages = Math.ceil(filteredOwnedGames.length / gamesPerPage);
  const paginatedGames = filteredOwnedGames.slice((currentPage - 1) * gamesPerPage, currentPage * gamesPerPage);

  const tabs = [
    { id: 'pinned-games', label: 'Pinned Games', icon: Gamepad2 },
    { id: 'entertainment', label: 'Entertainment', icon: Tv },
    { id: 'clip-editor', label: 'Clip Editor', icon: Video }
  ];

  const GameTile = ({ game }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="bg-slate-800/60 rounded-lg overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group"
    >
      <div className="relative h-32 overflow-hidden">
        <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <Badge className="absolute top-2 left-2 text-xs" variant="secondary">{game.genre}</Badge>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
          <Play className="w-8 h-8 text-white" />
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-white text-sm truncate">{game.title}</h4>
      </div>
    </motion.div>
  );

  const StreamingTile = ({ service }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => window.open(service.url, '_blank')}
      className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group text-center"
    >
      <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
        <img src={service.icon} alt={service.name} className="w-10 h-10 group-hover:scale-110 transition-transform" />
      </div>
      <h4 className="font-semibold text-white text-sm">{service.name}</h4>
    </motion.div>
  );

  return (
    <div 
      className="flex flex-col relative"
    >
      {/* 3D Background for Clip Editor */}
      {activeTab === 'clip-editor' && (
        <canvas 
          id="entertainment-3d-bg" 
          className="absolute inset-0 pointer-events-none opacity-20 z-0" 
          style={{ width: '100%', height: '100%' }}
        />
      )}

      <div className="relative z-10">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg max-w-lg mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            {activeTab === 'pinned-games' && (
              <motion.div
                key="pinned-games"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                {/* Voice Search Bar */}
                <GameVoiceSearch 
                  onSearch={handleGameSearch}
                  games={ownedGames}
                  onGameSelect={handleGameSelect}
                />

                {/* Search Results Info */}
                {searchQuery && (
                  <div className="mb-4 text-center">
                    <p className="text-slate-400">
                      {filteredOwnedGames.length > 0 
                        ? `Found ${filteredOwnedGames.length} games matching "${searchQuery}"`
                        : `No games found matching "${searchQuery}"`
                      }
                    </p>
                  </div>
                )}

                {/* Games Grid */}
                {filteredOwnedGames.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4 max-w-4xl mx-auto">
                    <AnimatePresence>
                      {paginatedGames.map((game) => (
                        <GameTile key={game.id} game={game} />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  // No Results Message
                  searchQuery && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1 flex flex-col items-center justify-center py-10"
                    >
                      <div className="text-center">
                        <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">No Games Found</h3>
                        <p className="text-slate-500">Try a different search term or browse all games</p>
                        <Button onClick={() => setSearchQuery('')} className="mt-4" variant="outline">
                          Clear Search
                        </Button>
                      </div>
                    </motion.div>
                  )
                )}

                {/* Pagination - only show if there are results */}
                {filteredOwnedGames.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50 max-w-4xl mx-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="text-slate-300 border-slate-600"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 p-0 ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-300 border-slate-600'
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="text-slate-300 border-slate-600"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'entertainment' && (
              <motion.div
                key="entertainment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
                  {streamingServices.map((service) => (
                    <StreamingTile key={service.name} service={service} />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'clip-editor' && (
              <motion.div
                key="clip-editor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full relative z-10"
              >
                <GameplayClipEditor />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EntertainmentHub;
