import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  ShoppingCart, Search, Filter, Star, Trophy, Sword, Package, Zap, Bot,
  Eye, Download, Play, Gamepad2, Sparkles, Coins, Lock, Crown, Flame, ChevronRight, Shield,
  Mic, MicOff, SlidersHorizontal, Grid, List, TrendingUp, Clock, Gift, X, ArrowRight, 
  Cpu, Activity, ThumbsUp, Monitor, Share2, BarChart3, PieChart, Tag, Hash, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/auth/AuthContext';
import { Game } from '@/entities/Game';
import { createPageUrl } from '@/utils';
import { aiGames, otherSampleGames } from '../components/store/mockData';
import HeroScrollBox from '../components/store/HeroScrollBox';

// Enhanced store data with loot boxes and AI games
const storeCategories = {
  featured: { name: 'Featured', icon: Star, color: '#3b82f6' },
  new: { name: 'New Releases', icon: Clock, color: '#10b981' },
  bestsellers: { name: 'Best Sellers', icon: TrendingUp, color: '#f59e0b' },
  ai: { name: 'AI Games', icon: Bot, color: '#8b5cf6' },
  lootboxes: { name: 'Loot Boxes', icon: Gift, color: '#ef4444' }
};

const lootBoxes = [
  {
    id: 'legendary_pack',
    name: 'Legendary Mystery Pack',
    description: 'Contains 5 random items, guaranteed 1 legendary+',
    price: 999,
    currency: 'AGP',
    image: 'https://images.unsplash.com/photo-1607473069269-d82aaf7b37c7?w=400&h=400&fit=crop',
    rarity: 'Legendary',
    contents: ['Equipment', 'Abilities', 'Cosmetics']
  },
  {
    id: 'cyberpunk_pack',
    name: 'Cyberpunk Gear Box',
    description: 'Sci-fi equipment and augmentations',
    price: 599,
    currency: 'AGP',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
    rarity: 'Epic',
    contents: ['Cyber Implants', 'Plasma Weapons', 'Neon Skins']
  }
];

// 3D Item Preview Component (Generalized)
const Item3DPreview = ({ item, color = 0x3b82f6, type = 'box' }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;
    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    currentMount.appendChild(renderer.domElement);

    // Create Shape based on type
    let geometry;
    if (type === 'sphere') geometry = new THREE.SphereGeometry(1, 32, 32);
    else if (type === 'cone') geometry = new THREE.ConeGeometry(0.8, 1.5, 32);
    else if (type === 'torus') geometry = new THREE.TorusGeometry(0.7, 0.3, 16, 100);
    else geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);

    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Lighting
    const light = new THREE.AmbientLight(0x404040, 2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(2, 2, 2);
    scene.add(light);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(color, 1, 100);
    pointLight.position.set(0, 0, 2);
    scene.add(pointLight);

    camera.position.z = 3;

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!currentMount) return;
      const newWidth = currentMount.clientWidth;
      const newHeight = currentMount.clientHeight;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [item, color, type]);

  return <div ref={mountRef} className="w-full h-full" />;
};

// Mock Data for Game Items (Generated on the fly in a real app)
const getMockItemsForGame = (gameId) => [
  { id: `i1_${gameId}`, name: 'Void Reaver', type: 'weapon', rarity: 'Legendary', color: 0xff0055, shape: 'cone', stats: 'DMG: 500 | SPD: 1.2' },
  { id: `i2_${gameId}`, name: 'Aegis Shield', type: 'equipment', rarity: 'Epic', color: 0x3b82f6, shape: 'box', stats: 'DEF: 350 | DUR: 100' },
  { id: `i3_${gameId}`, name: 'Quantum Core', type: 'ability', rarity: 'Rare', color: 0x10b981, shape: 'sphere', stats: 'MP: +50 | CD: -10%' },
  { id: `i4_${gameId}`, name: 'Shadow Cloak', type: 'cosmetic', rarity: 'Uncommon', color: 0xa855f7, shape: 'torus', stats: 'Stealth +15' },
  { id: `i5_${gameId}`, name: 'Neural Link v2', type: 'tech', rarity: 'Common', color: 0xf59e0b, shape: 'box', stats: 'INT +5' },
];

// AI Voice Search Component
const AISearchBox = ({ onSearch, searchTerm, setSearchTerm }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

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
        onSearch(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => setIsListening(false);
      recognitionInstance.onend = () => setIsListening(false);

      setRecognition(recognitionInstance);
    }
  }, [onSearch, setSearchTerm]);

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  return (
    <div className="relative flex-1 max-w-2xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <Input
        placeholder="Search games, or try AI search: 'Show me sci-fi RPGs under $30'"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-slate-800/70 border-slate-600 pl-12 pr-16 h-12 text-lg backdrop-blur-sm"
        onKeyPress={(e) => e.key === 'Enter' && onSearch(searchTerm)}
      />
      <Button
        onClick={startListening}
        variant="ghost"
        size="icon"
        className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-white'}`}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>
    </div>
  );
};

// Enhanced Game Card Component
const GameCard = ({ game, onAddToCart, viewMode = 'grid', compact = false, onClick }) => {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  if (!game) return null;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart(game);
    onAddToCart?.(game);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onClick}
        className={`bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 flex gap-4 hover:border-blue-500/50 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      >
        <img
          src={game.cover_image || game.image}
          alt={game.title}
          className="w-24 h-32 object-cover rounded-lg"
        />
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-white mb-2">{game.title}</h3>
          {!compact && <p className="text-slate-400 text-sm mb-2 line-clamp-2">{game.description}</p>}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">{game.genre}</Badge>
            {game.aiEnhanced && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-xs">
                <Bot className="w-3 h-3 mr-1" />
                AI
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">{game.rating || '4.5'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-400">${game.price}</span>
              <Button onClick={handleAddToCart} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`bg-gradient-to-b from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden group hover:border-blue-500/50 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`relative ${compact ? 'h-40' : 'h-64'} overflow-hidden`}>
        <img
          src={game.cover_image || game.image}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        {game.aiEnhanced && !compact && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 flex items-center gap-1">
            <Bot className="w-3 h-3" />
            AI Enhanced
          </div>
        )}
        
        {!compact && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-white text-xs">{game.rating || '4.5'}</span>
          </div>
        )}

        <AnimatePresence>
          {isHovered && !compact && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                View Details
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4">
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-bold text-white mb-1 group-hover:text-blue-300 transition-colors line-clamp-1`}>
          {game.title}
        </h3>
        {!compact && (
          <p className="text-slate-400 text-sm mb-2 line-clamp-2">
            {game.description}
          </p>
        )}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">{game.genre}</Badge>
          {!compact && game.multiplayer && <Badge variant="outline" className="text-xs">Multiplayer</Badge>}
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-green-400`}>${game.price}</span>
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Loot Box Card Component
const LootBoxCard = ({ lootBox, onPurchase }) => {
  const rarityColors = {
    Common: 'border-slate-500/50 bg-slate-800/50',
    Uncommon: 'border-green-500/50 bg-green-900/20',
    Rare: 'border-blue-500/50 bg-blue-900/20',
    Epic: 'border-purple-500/50 bg-purple-900/20',
    Legendary: 'border-orange-500/50 bg-orange-900/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`rounded-xl p-4 border-2 ${rarityColors[lootBox.rarity]} backdrop-blur-sm transition-all duration-300`}
    >
      <div className="flex flex-col items-center text-center">
        <LootBoxPreview lootBox={lootBox} />
        <h3 className="text-lg font-bold text-white mt-2">{lootBox.name}</h3>
        <p className="text-slate-400 text-sm mb-3">{lootBox.description}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {lootBox.contents.map((item, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="text-xl font-bold text-yellow-400">{lootBox.price}</span>
          <span className="text-yellow-400 text-sm">AGP</span>
        </div>

        <Button onClick={() => onPurchase(lootBox)} className="w-full bg-purple-600 hover:bg-purple-700">
          <Package className="w-4 h-4 mr-2" />
          Purchase
        </Button>
      </div>
    </motion.div>
  );
};

export default function Store() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    genre: 'all',
    priceRange: 'all',
    features: 'all',
    equipment: 'all',
    achievementRarity: 'all'
  });

  // Split View State
  const [selectedGame, setSelectedGame] = useState(null);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  // Pagination / Carousel state for Featured section
  const [featuredPage, setFeaturedPage] = useState(0);
  const ITEMS_PER_PAGE = 4; // Adjust based on grid columns (e.g. 4 for XL screens)

  const { cartCount, addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const fetchedGames = await Game.list();
        // If the DB is empty, use our centralized mock data as a fallback
        const enhancedGames = fetchedGames.length > 0 ? fetchedGames : [
          ...Object.values(aiGames),
          ...Object.values(otherSampleGames)
        ];
        setGames(enhancedGames);
      } catch (error) {
        console.error("Error fetching games:", error);
        // Fallback to mock data even on error
        setGames([...Object.values(aiGames), ...Object.values(otherSampleGames)]);
      }
      setLoading(false);
    };
    fetchGames();
  }, []);

  // Auto-rotate featured pages
  useEffect(() => {
    if (activeCategory === 'featured' && !loading && games.length > 0) {
      const interval = setInterval(() => {
        setFeaturedPage(prev => prev + 1);
      }, 5000); // 5 seconds transition
      return () => clearInterval(interval);
    } else {
      setFeaturedPage(0); // Reset when changing categories
    }
  }, [activeCategory, loading, games.length]);

  const handleAISearch = (query) => {
    // AI search logic would go here
    setSearchTerm(query);
  };

  const handleLootBoxPurchase = (lootBox) => {
    // Loot box purchase logic
    console.log('Purchasing loot box:', lootBox.name);
  };

  // Logic for Search Results (Big Box)
  const searchResults = useMemo(() => {
    let items = [...games]; // Start with all games

    // Apply search filter
    if (searchTerm) {
      items = items.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.genre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply advanced filters (Genre, Price, etc.)
    if (filters.genre !== 'all') {
      items = items.filter(item => item.genre?.toLowerCase() === filters.genre.toLowerCase());
    }
    if (filters.priceRange !== 'all') {
       // Add price logic if needed, e.g., items = items.filter(...)
    }
    if (filters.features !== 'all') {
       if (filters.features === 'multiplayer') items = items.filter(i => i.multiplayer);
       if (filters.features === 'ai') items = items.filter(i => i.aiEnhanced);
    }

    // Apply sort logic
    if (sortBy === 'name') items.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'price-low') items.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') items.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') items.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return items;
  }, [games, searchTerm, filters, sortBy]);

  // Logic for Category Tabs (Bottom Section)
  const categoryItems = useMemo(() => {
    let items = [];
    switch (activeCategory) {
      case 'featured':
        // Start with a subset or specific featured logic
        items = games.slice(0, 12); 
        break;
      case 'new':
        items = games.filter(game => game.isNew || Math.random() > 0.5); 
        break;
      case 'bestsellers':
        items = [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12);
        break;
      case 'ai':
        items = games.filter(game => game.aiEnhanced);
        break;
      case 'lootboxes':
        return lootBoxes;
      default:
        items = games;
    }
    return items;
  }, [games, activeCategory]);

  // Pagination Logic for Featured (Still used for dots, but main view is now split)
  const paginatedItems = useMemo(() => {
    if (activeCategory === 'featured' && viewMode === 'grid') {
      const pageCount = Math.ceil(categoryItems.length / ITEMS_PER_PAGE); // Use categoryItems here for dots
      const validPage = featuredPage % (pageCount || 1);
      const start = validPage * ITEMS_PER_PAGE;
      return categoryItems.slice(start, start + ITEMS_PER_PAGE);
    }
    return categoryItems;
  }, [categoryItems, activeCategory, featuredPage, viewMode]);

  const totalPages = Math.ceil(categoryItems.length / ITEMS_PER_PAGE) || 1;

  return (
    <div className="min-h-screen bg-transparent text-white page-container">
      <div className="p-6 md:p-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            ATOM × EVE STORE
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Discover legendary games, rare loot boxes, and AI-powered experiences
          </p>
        </motion.header>

        {/* NEW HERO SCROLL BOX */}
        <HeroScrollBox />

        {/* Search and Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col lg:flex-row gap-4 mb-8"
        >
          <AISearchBox onSearch={handleAISearch} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-slate-800/70 border-slate-600">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>

            {cartCount > 0 && (
              <Button className="bg-green-600 hover:bg-green-700 relative" asChild>
                <Link to={createPageUrl('Cart')}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart ({cartCount})
                </Link>
              </Button>
            )}
          </div>
        </motion.div>

        {/* Advanced Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16"
        >
          <Select value={filters.genre} onValueChange={(value) => setFilters({...filters, genre: value})}>
            <SelectTrigger className="bg-slate-800/70 border-slate-600">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              <SelectItem value="rpg">RPG</SelectItem>
              <SelectItem value="fps">FPS</SelectItem>
              <SelectItem value="strategy">Strategy</SelectItem>
              <SelectItem value="racing">Racing</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.priceRange} onValueChange={(value) => setFilters({...filters, priceRange: value})}>
            <SelectTrigger className="bg-slate-800/70 border-slate-600">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="under20">Under $20</SelectItem>
              <SelectItem value="under50">Under $50</SelectItem>
              <SelectItem value="premium">$50+</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.features} onValueChange={(value) => setFilters({...filters, features: value})}>
            <SelectTrigger className="bg-slate-800/70 border-slate-600">
              <SelectValue placeholder="Features" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Features</SelectItem>
              <SelectItem value="multiplayer">Multiplayer</SelectItem>
              <SelectItem value="coop">Co-op</SelectItem>
              <SelectItem value="vr">VR Support</SelectItem>
              <SelectItem value="crossplay">Crossplay</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.equipment} onValueChange={(value) => setFilters({...filters, equipment: value})}>
            <SelectTrigger className="bg-slate-800/70 border-slate-600">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Equipment</SelectItem>
              <SelectItem value="swords">Swords</SelectItem>
              <SelectItem value="guns">Firearms</SelectItem>
              <SelectItem value="magic">Magic Items</SelectItem>
              <SelectItem value="vehicles">Vehicles</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.achievementRarity} onValueChange={(value) => setFilters({...filters, achievementRarity: value})}>
            <SelectTrigger className="bg-slate-800/70 border-slate-600">
              <SelectValue placeholder="Achievement Rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              <SelectItem value="common">Common+</SelectItem>
              <SelectItem value="rare">Rare+</SelectItem>
              <SelectItem value="epic">Epic+</SelectItem>
              <SelectItem value="legendary">Legendary+</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* RESOURCEFUL SEARCH SECTION (DIVIDED BY LINES) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-[800px] border-y border-white/10 bg-gradient-to-b from-slate-900/50 to-black/50 backdrop-blur-sm mb-24 flex relative"
        >
          {/* SEARCH RESULTS LIST (Left Side) */}
          <div 
            className={`
              h-full overflow-y-auto border-r border-white/10 p-0 transition-all duration-500 ease-in-out scrollbar-hide
              ${isDetailExpanded ? 'w-[25%]' : 'w-[40%]'}
            `}
          >
            {/* Header with Stats */}
            <div className="sticky top-0 z-20 bg-slate-900/95 border-b border-white/10 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  System Output
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {searchResults.length} matches found
                </span>
              </div>
              {searchTerm && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 bg-cyan-950/10 whitespace-nowrap">
                    Query: "{searchTerm}"
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 whitespace-nowrap">
                    Filter: {filters.genre}
                  </Badge>
                </div>
              )}
            </div>

            {/* List Items */}
            <div className="divide-y divide-white/5">
              {searchResults.map((game, index) => (
                <div
                  key={game.id}
                  onClick={() => {
                    setSelectedGame(game);
                    setIsDetailExpanded(false);
                  }}
                  className={`
                    group relative p-4 cursor-pointer transition-all hover:bg-white/5
                    ${selectedGame?.id === game.id ? 'bg-white/5 border-l-2 border-cyan-500' : 'border-l-2 border-transparent'}
                  `}
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded bg-slate-800 flex-shrink-0 overflow-hidden relative">
                      <img src={game.image || game.cover_image} className="w-full h-full object-cover" />
                      {game.aiEnhanced && (
                        <div className="absolute top-0 left-0 p-0.5 bg-purple-500/80">
                          <Bot className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                         <h4 className={`text-sm font-bold truncate ${selectedGame?.id === game.id ? 'text-cyan-400' : 'text-slate-200'}`}>
                           {game.title}
                         </h4>
                         <span className="text-xs font-mono text-green-400">${game.price}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mb-2">{game.description}</p>
                      
                      {/* AI Match Score Mock */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          <span>{(85 + (index % 14)).toFixed(0)}% Match</span>
                        </div>
                        <div className="flex gap-1">
                          <Monitor className="w-3 h-3 text-slate-600" />
                          {game.vr_support && <div className="w-3 h-3 rounded-full border border-slate-600 text-[6px] flex items-center justify-center text-slate-600">VR</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DETAILS PANEL (Right Side) */}
          <div 
            onClick={() => !isDetailExpanded && setIsDetailExpanded(true)}
            className={`
              h-full overflow-y-auto transition-all duration-500 ease-in-out relative bg-slate-950/30
              ${isDetailExpanded ? 'w-[75%]' : 'w-[60%]'}
            `}
          >
            {selectedGame ? (
              <div className="h-full flex flex-col">
                {/* Header / Hero */}
                <div className="relative h-80 flex-shrink-0 border-b border-white/10 group">
                  <img src={selectedGame.image || selectedGame.cover_image} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                         <Badge className="bg-cyan-500 text-black font-bold hover:bg-cyan-400 rounded-none px-2">
                           {selectedGame.genre}
                         </Badge>
                         <Badge variant="outline" className="border-white/20 text-white rounded-none px-2">
                           v2.4.0
                         </Badge>
                      </div>
                      <h1 className="text-5xl font-black text-white tracking-tight mb-2">{selectedGame.title}</h1>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" className="rounded-full border-white/20 hover:bg-white/10 hover:text-white">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="rounded-full border-white/20 hover:bg-white/10 hover:text-white">
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Expand Toggle Icon */}
                  <div className="absolute top-4 right-4">
                    <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={(e) => { e.stopPropagation(); setIsDetailExpanded(!isDetailExpanded); }}
                       className="text-slate-400 hover:text-white"
                    >
                       {isDetailExpanded ? <SlidersHorizontal className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                       {isDetailExpanded ? 'Collapse View' : 'Expand View'}
                    </Button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                       {/* Resourceful Insight Panel */}
                       <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/20 p-6 rounded-lg flex gap-6 items-start">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-blue-300 font-bold mb-1 text-sm uppercase tracking-wide">Smart Insight</h4>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              This title aligns 95% with your recent gameplay in <span className="text-white font-medium">Cyberpunk 2088</span>. 
                              Players who bought this also enjoyed <span className="text-white font-medium">Neural Link: Origins</span>.
                            </p>
                          </div>
                       </div>

                       <div>
                         <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                           <Hash className="w-4 h-4 text-slate-500" /> Description
                         </h3>
                         <p className="text-slate-400 leading-7 text-lg">{selectedGame.description}</p>
                       </div>

                       {/* System Compatibility & Stats */}
                       <div className="grid grid-cols-2 gap-4">
                          <div className="border border-white/10 p-4 rounded bg-white/5">
                             <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs uppercase font-bold">
                               <Cpu className="w-3 h-3" /> System Load
                             </div>
                             <div className="flex items-center gap-2">
                               <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
                                 <div className="h-full bg-green-500 w-[35%]" />
                               </div>
                               <span className="text-green-400 font-mono text-xs">Low</span>
                             </div>
                          </div>
                          <div className="border border-white/10 p-4 rounded bg-white/5">
                             <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs uppercase font-bold">
                               <Globe className="w-3 h-3" /> Server Status
                             </div>
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                               <span className="text-slate-200 font-mono text-xs">Online (12ms)</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                       <div className="bg-slate-900 border border-white/10 p-6 rounded-lg sticky top-0">
                          <div className="flex justify-between items-baseline mb-6">
                            <span className="text-4xl font-bold text-white">${selectedGame.price}</span>
                            <span className="text-green-400 text-sm font-mono flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" /> -15%
                            </span>
                          </div>
                          
                          <Button onClick={(e) => { e.stopPropagation(); addToCart(selectedGame); }} className="w-full bg-white text-black hover:bg-slate-200 font-bold py-6 mb-3 rounded-none">
                            ADD TO CART
                          </Button>
                          <Button variant="outline" className="w-full border-white/20 hover:bg-white/5 py-6 rounded-none">
                            GIFT TO FRIEND
                          </Button>

                          <div className="mt-6 pt-6 border-t border-white/10">
                             <h5 className="text-xs text-slate-500 uppercase font-bold mb-4">Market Data</h5>
                             <div className="space-y-3">
                               <div className="flex justify-between text-sm">
                                 <span className="text-slate-400">24h Volume</span>
                                 <span className="text-white font-mono">1,240</span>
                               </div>
                               <div className="flex justify-between text-sm">
                                 <span className="text-slate-400">All-time Low</span>
                                 <span className="text-white font-mono">$14.99</span>
                               </div>
                               <div className="flex justify-between text-sm">
                                 <span className="text-slate-400">Review Score</span>
                                 <div className="flex items-center text-yellow-400 gap-1">
                                   <Star className="w-3 h-3 fill-current" />
                                   <span className="font-mono">{selectedGame.rating}</span>
                                 </div>
                               </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                <div className="w-24 h-24 border border-slate-700 rounded-full flex items-center justify-center mb-6 relative">
                   <div className="absolute inset-0 border border-slate-700 rounded-full animate-ping opacity-20" />
                   <Bot className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-mono uppercase tracking-widest mb-2">Awaiting Input</h3>
                <p className="text-sm opacity-50 font-mono">Select a data node from the list to analyze.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Category Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full max-w-4xl">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 backdrop-blur-sm">
              {Object.entries(storeCategories).map(([key, category]) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="flex items-center gap-2 data-[state=active]:bg-blue-600"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Content Grid (Bottom Section driven by Tabs) */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {storeCategories[activeCategory].name} Collection
            </h2>
            <p className="text-slate-400">{categoryItems.length} items available</p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className={
                activeCategory === 'lootboxes' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
              }>
                <AnimatePresence mode="wait">
                  {activeCategory === 'lootboxes' ? (
                    categoryItems.map((lootBox, index) => (
                      <motion.div
                        key={lootBox.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <LootBoxCard lootBox={lootBox} onPurchase={handleLootBoxPurchase} />
                      </motion.div>
                    ))
                  ) : (
                    categoryItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <GameCard
                          game={item}
                          viewMode={viewMode}
                          onAddToCart={(item) => console.log('Added to cart:', item.title)}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Dots Navigation - only for active category grid if needed */}
              {activeCategory === 'featured' && !loading && categoryItems.length > 0 && viewMode === 'grid' && (
                <div className="mt-12 mb-8 flex flex-col items-center gap-6">
                  <div className="flex items-center gap-3">
                    {[...Array(Math.ceil(categoryItems.length / 4) || 1)].map((_, i) => (
                      <button
                        key={i}
                        className={`transition-all duration-300 rounded-full ${
                          i === 0 ? 'w-8 h-2 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
                </div>
              )}
            </>
          )}
        </motion.section>
      </div>
    </div>
  );
}