import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Home, Library, Globe, ChevronLeft, ChevronRight, X, Play, Info, Trophy, Newspaper, Star, Calendar, Users, Clock, Activity, Settings, Lock, Zap, Shield, Sword, Flame, Crown, Target, Award, Gem, Skull, Search, ShoppingCart, ShoppingBag, Package, Sparkles, User, Trees, Mic, MicOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useCart } from '@/components/CartContext';
import GameContentCards from '@/components/dashboard/GameContentCards';

const MOCK_DEVELOPERS = [
  { id: 1, name: 'Naughty Dog', logo: 'https://via.placeholder.com/120?text=Naughty+Dog' },
  { id: 2, name: 'Rockstar Games', logo: 'https://via.placeholder.com/120?text=Rockstar' },
  { id: 3, name: 'CD Projekt Red', logo: 'https://via.placeholder.com/120?text=CD+Projekt' },
  { id: 4, name: 'FromSoftware', logo: 'https://via.placeholder.com/120?text=FromSoftware' },
  { id: 5, name: 'Valve', logo: 'https://via.placeholder.com/120?text=Valve' },
  { id: 6, name: 'Epic Games', logo: 'https://via.placeholder.com/120?text=Epic' },
  { id: 7, name: 'Activision Blizzard', logo: 'https://via.placeholder.com/120?text=Activision' },
  { id: 8, name: 'Electronic Arts', logo: 'https://via.placeholder.com/120?text=EA' },
  { id: 9, name: 'Take-Two Interactive', logo: 'https://via.placeholder.com/120?text=Take-Two' },
  { id: 10, name: 'Ubisoft', logo: 'https://via.placeholder.com/120?text=Ubisoft' },
  { id: 11, name: 'Microsoft Game Studios', logo: 'https://via.placeholder.com/120?text=Microsoft' },
  { id: 12, name: 'Sony Interactive', logo: 'https://via.placeholder.com/120?text=Sony' },
];

const ENV_GENRES = [
  { id: 'mmorpg', name: 'MMORPG', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600' },
  { id: 'scifi', name: 'Sci-Fi', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600' },
  { id: 'fantasy', name: 'Fantasy', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600' },
  { id: 'action', name: 'Action', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600' },
  { id: 'shooter', name: 'Shooter', image: 'https://images.unsplash.com/photo-1506544777-64cfbe1142df?w=600' },
  { id: 'adventure', name: 'Adventure', image: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=600' },
  { id: 'fear', name: 'Fear', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=600' },
  { id: 'simulation', name: 'Simulation', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600' },
  { id: 'sports', name: 'Sports', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600' },
];

const MOCK_ACHIEVEMENTS = [
  { id: 1, title: 'First Blood', desc: 'Get your first kill', icon: Sword, unlocked: true, rarity: 'common' },
  { id: 2, title: 'Survivor', desc: 'Complete a match without dying', icon: Shield, unlocked: true, rarity: 'uncommon' },
  { id: 3, title: 'On Fire', desc: 'Get 5 kills in a row', icon: Flame, unlocked: true, rarity: 'rare' },
  { id: 4, title: 'Sharpshooter', desc: 'Land 100 headshots', icon: Target, unlocked: false, rarity: 'rare' },
  { id: 5, title: 'Power Surge', desc: 'Activate all abilities in one match', icon: Zap, unlocked: false, rarity: 'epic' },
  { id: 6, title: 'Champion', desc: 'Win 50 ranked matches', icon: Crown, unlocked: false, rarity: 'epic' },
  { id: 7, title: 'Legendary', desc: 'Reach max prestige level', icon: Gem, unlocked: false, rarity: 'legendary' },
  { id: 8, title: 'Ghost', desc: 'Complete a mission undetected', icon: Skull, unlocked: true, rarity: 'uncommon' },
  { id: 9, title: 'Ace', desc: 'Win a 1v5 situation', icon: Award, unlocked: false, rarity: 'legendary' },
  { id: 10, title: 'Veteran', desc: 'Play 200 matches', icon: Trophy, unlocked: true, rarity: 'common' },
  { id: 11, title: 'Speed Demon', desc: 'Complete campaign in under 4 hours', icon: Zap, unlocked: false, rarity: 'epic' },
  { id: 12, title: 'Collector', desc: 'Unlock all skins', icon: Star, unlocked: false, rarity: 'rare' },
];

const RARITY_STYLES = {
  common:    { glow: 'rgba(160,160,160,0.3)', border: 'rgba(180,180,180,0.3)', text: '#aaa' },
  uncommon:  { glow: 'rgba(80,200,120,0.35)', border: 'rgba(80,200,120,0.35)', text: '#50c878' },
  rare:      { glow: 'rgba(80,140,255,0.4)',  border: 'rgba(80,140,255,0.4)',  text: '#5b8dff' },
  epic:      { glow: 'rgba(160,80,255,0.4)',  border: 'rgba(160,80,255,0.4)',  text: '#a050ff' },
  legendary: { glow: 'rgba(255,180,40,0.45)', border: 'rgba(255,180,40,0.45)', text: '#ffb828' },
};

const SHOWCASE_LABELS = ['Trending', 'New Release', 'Top Rated', 'Staff Pick', 'Fan Favorite'];

function StudioGameCarousel({ games }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const pool = games.slice(0, 10);

  useEffect(() => {
    if (pool.length === 0) return;
    const t = setInterval(() => {
      setDir(1);
      setIdx(p => (p + 1) % pool.length);
    }, 3500);
    return () => clearInterval(t);
  }, [pool.length]);

  const game = pool[idx];
  const label = SHOWCASE_LABELS[idx % SHOWCASE_LABELS.length];

  if (!game) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <Flame className="w-8 h-8 text-white/10" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={game.id + '-' + idx}
          custom={dir}
          initial={{ opacity: 0, x: dir * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -60 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img src={game.banner_image || game.cover_image} alt={game.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />

          {/* Label badge */}
          <div className="absolute top-3 left-4">
            <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/40 rounded-full px-2.5 py-0.5">
              <Flame className="w-2.5 h-2.5 text-orange-400" />
              <span className="text-orange-300 text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </div>
          </div>

          {/* Game info */}
          <div className="absolute bottom-3 left-4 right-10">
            <h3 className="text-white font-black text-sm leading-tight truncate drop-shadow-lg">{game.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-white/50 text-[9px]">{game.genre}</span>
              {game.price > 0 && <span className="text-green-400 font-bold text-[9px]">${game.price}</span>}
              {game.original_year && <span className="text-white/30 text-[9px]">{game.original_year}</span>}
            </div>
          </div>

          {/* Dot nav */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            {pool.slice(0, 6).map((_, i) => (
              <button
                key={i}
                onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }}
                className={`rounded-full transition-all ${i === idx ? 'w-1.5 h-4 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TwoRowGrid({ items, currentRow, itemsPerRow, selectedGame, activeTab, onSelectGame, onSelectItem }) {
  const rows = [0, 1].map(offset => {
    const start = (currentRow + offset) * itemsPerRow;
    const rowItems = items.slice(start, start + itemsPerRow);
    const cells = [];
    for (let i = 0; i < itemsPerRow; i++) {
      const item = rowItems[i];
      if (!item) {
        cells.push(
          <div key={`empty-r${offset}-${i}`} className="flex-1 aspect-[16/9] rounded-xl border border-white/10 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-white/20 text-4xl font-light">?</span>
          </div>
        );
      } else {
        const k = `r${offset}-${item.id || i}`;
        cells.push(
          <div
            key={k}
            className={`flex-1 relative cursor-pointer group transition-all duration-300 ${selectedGame?.id === item.id ? 'ring-2 ring-cyan-400' : ''}`}
            onClick={() => { if (activeTab === 'library') onSelectGame(item); }}
            onDoubleClick={() => { if (activeTab === 'library') onSelectItem(item); }}
          >
            <div className="aspect-[16/9] rounded-xl overflow-hidden relative shadow-lg border border-white/10 group-hover:border-cyan-400/50">
              <img src={item.displayImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.displayTitle} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <p className="text-white text-xs font-bold truncate tracking-wide">{item.displayTitle}</p>
              </div>
            </div>
          </div>
        );
      }
    }
    return <div key={`row-${offset}`} className="flex gap-4 w-full">{cells}</div>;
  });

  return (
    <div className="flex flex-col gap-3 w-full max-w-[1400px] mx-auto px-2">
      {rows}
    </div>
  );
}

function LunaSearchBar({ isLibraryActive, onFocus, value, onChange }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onChange?.(text);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
        isLibraryActive ? 'border-white/10 bg-white/[0.04]' : 'border-transparent bg-transparent'
      }`}
      style={{ minWidth: '220px' }}
    >
      <Search className="w-4 h-4 flex-shrink-0 text-white/30" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        placeholder="Search bar"
        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
      />
      <button
        onClick={(e) => { e.stopPropagation(); handleMic(); }}
        className={`flex-shrink-0 transition-colors ${isListening ? 'text-red-400' : 'text-white/40 hover:text-white'}`}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function LunaBottomNav({ isEnvironmentActive, libraryLabel, forceLibraryOpen, onLibraryClose, hideNav, searchTerm, onSearchChange }) {
  const [activeTab, setActiveTab] = useState(forceLibraryOpen ? 'library' : 'home');
  // Sync forced open state
  useEffect(() => {
    if (forceLibraryOpen) setActiveTab('library');
    else if (activeTab === 'library') setActiveTab('home');
  }, [forceLibraryOpen]);
  const [games, setGames] = useState([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null); // game whose cards are shown in the row
  const [showTrailerMode, setShowTrailerMode] = useState(false);
  const [developerSearch, setDeveloperSearch] = useState('');
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [selectedGenreFilter, setSelectedGenreFilter] = useState(null);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);

  const GENRE_FILTERS = [
    { id: 'action', label: 'Action' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'rpg', label: 'RPG' },
    { id: 'shooting', label: 'Shooter' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'sci-fi', label: 'Sci-Fi' },
    { id: 'horror', label: 'Horror' },
    { id: 'sports', label: 'Sports' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'simulation', label: 'Simulation' },
  ];

  const filteredDevelopers = useMemo(() => {
    return MOCK_DEVELOPERS.filter(dev =>
      dev.name.toLowerCase().includes(developerSearch.toLowerCase())
    );
  }, [developerSearch]);

  // Reset trailer mode when game changes
  useEffect(() => { setShowTrailerMode(false); }, [selectedGame]);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    base44.entities.Game.list().then(setGames);
  }, []);

  const handleTabClick = (tab) => {
    setSelectedItem(null);
    setSelectedGame(null);
    if (tab === 'home') {
      if (!hideNav) navigate(createPageUrl('LunaTemplate'));
    } else {
      // If clicking the same tab that's already active, close it (go home)
      if (activeTab === tab) {
        setActiveTab('home');
        onLibraryClose?.();
        // Dispatch event to notify pages to close their panels
        window.dispatchEvent(new CustomEvent('libraryPanelClose'));
        window.dispatchEvent(new CustomEvent('environmentPanelClose'));
      } else {
        setActiveTab(tab);
        setCurrentRow(0);
      }
    }
  };

  const getItems = () => {
    if (activeTab === 'library') {
      let all = games.map(g => ({ ...g, displayTitle: g.title, displayImage: g.cover_image || g.banner_image }));
      // Filter by selected developer
      if (selectedDeveloper) {
        const devName = selectedDeveloper.name.toLowerCase();
        all = all.filter(g =>
          g.tags?.some(t => t.toLowerCase().includes(devName)) ||
          g.description?.toLowerCase().includes(devName) ||
          // fallback: show all but mark — for mock data just show a subset by id mod
          (g.id && selectedDeveloper.id && (parseInt(g.id, 36) % MOCK_DEVELOPERS.length) + 1 === selectedDeveloper.id)
        );
        // If no real matches, use id-based bucketing so each dev shows something
        if (all.length === 0) {
          all = games
            .map(g => ({ ...g, displayTitle: g.title, displayImage: g.cover_image || g.banner_image }))
            .filter((_, idx) => idx % MOCK_DEVELOPERS.length === (selectedDeveloper.id - 1) % MOCK_DEVELOPERS.length);
        }
      }
      if (selectedGenreFilter) {
        all = all.filter(g => g.genre?.toLowerCase().includes(selectedGenreFilter));
      }
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        all = all.filter(g => g.displayTitle?.toLowerCase().includes(term) || g.genre?.toLowerCase().includes(term));
      }
      return all;
    }
    if (activeTab === 'environment') return ENV_GENRES.map(g => ({ ...g, displayTitle: g.name, displayImage: g.image }));
    return [];
  };

  const items = getItems();
  const itemsPerRow = 7;
  const rowsToShow = 2;
  const totalRows = Math.max(1, Math.ceil(items.length / itemsPerRow));

  const handleWheel = (e) => {
    if (e.deltaY > 0) {
      setCurrentRow(prev => Math.min(prev + 1, totalRows - 1));
    } else if (e.deltaY < 0) {
      setCurrentRow(prev => Math.max(prev - 1, 0));
    }
  };

  const currentItems = items.slice(currentRow * itemsPerRow, (currentRow + rowsToShow) * itemsPerRow);

  // When a game is selected, show its achievement cards in the row
  const achievementItems = selectedGame ? MOCK_ACHIEVEMENTS : [];
  const achievementRows = Math.max(1, Math.ceil(achievementItems.length / itemsPerRow));

  // Listen for panel close events
  useEffect(() => {
    const handlePanelClose = () => {
      setSelectedItem(null);
      setSelectedGame(null);
      setCurrentRow(0);
    };
    window.addEventListener('libraryPanelClose', handlePanelClose);
    window.addEventListener('environmentPanelClose', handlePanelClose);
    return () => {
      window.removeEventListener('libraryPanelClose', handlePanelClose);
      window.removeEventListener('environmentPanelClose', handlePanelClose);
    };
  }, []);

  const renderSlots = () => {
    const slots = [];
    if (selectedGame) {
      // Show achievement cards
      const rowAchs = achievementItems.slice(currentRow * itemsPerRow, (currentRow + 1) * itemsPerRow);
      for (let i = 0; i < itemsPerRow; i++) {
        if (i < rowAchs.length) {
          const ach = rowAchs[i];
          const style = RARITY_STYLES[ach.rarity];
          const Icon = ach.icon;
          slots.push(
            <div
              key={ach.id}
              className="flex-1 aspect-[16/9] rounded-xl relative overflow-hidden border cursor-default"
              style={{
                background: ach.unlocked
                  ? `linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)`
                  : 'rgba(255,255,255,0.03)',
                border: ach.unlocked ? `1px solid ${style.border}` : '1px solid rgba(255,255,255,0.08)',
                boxShadow: ach.unlocked ? `0 0 14px ${style.glow}` : 'none',
                filter: ach.unlocked ? 'none' : 'grayscale(1)',
                opacity: ach.unlocked ? 1 : 0.4,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: ach.unlocked ? `linear-gradient(135deg, ${style.glow}, rgba(255,255,255,0.06))` : 'rgba(255,255,255,0.04)',
                    border: ach.unlocked ? `1px solid ${style.border}` : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {ach.unlocked ? <Icon className="w-4 h-4" style={{ color: style.text }} /> : <Lock className="w-3.5 h-3.5 text-white/20" />}
                </div>
                <p className="text-[9px] font-bold text-center truncate w-full px-1" style={{ color: ach.unlocked ? style.text : 'rgba(255,255,255,0.25)' }}>{ach.title}</p>
                <span
                  className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{
                    background: ach.unlocked ? style.glow : 'rgba(255,255,255,0.04)',
                    color: ach.unlocked ? style.text : 'rgba(255,255,255,0.2)',
                    border: `1px solid ${ach.unlocked ? style.border : 'rgba(255,255,255,0.06)'}`,
                  }}
                >{ach.rarity}</span>
              </div>
            </div>
          );
        } else {
          slots.push(
            <div key={`empty-ach-${i}`} className="flex-1 aspect-[16/9] rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }} />
          );
        }
      }
      return slots;
    }

    for (let i = 0; i < itemsPerRow; i++) {
      if (i < currentItems.length) {
        const item = currentItems[i];
        slots.push(
          <div 
            key={item.id || i} 
            className={`flex-1 relative cursor-pointer group transition-all duration-300 ${
              selectedGame?.id === item.id ? 'ring-2 ring-cyan-400' : ''
            }`}
            onClick={() => {
              if (activeTab === 'library') {
                setSelectedGame(item);
                setCurrentRow(0);
                setSelectedItem(null);
              }
            }}
            onDoubleClick={() => {
              if (activeTab === 'library') {
                setSelectedItem(item);
                setSelectedGame(null);
              }
            }}
          >
            <div className="aspect-[16/9] rounded-xl overflow-hidden relative shadow-lg transition-all border border-white/10 group-hover:border-cyan-400/50">
              <img src={item.displayImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.displayTitle} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <p className="text-white text-xs font-bold truncate tracking-wide">{item.displayTitle}</p>
              </div>
            </div>
          </div>
        );
      } else {
        slots.push(
          <div key={`empty-${i}`} className="flex-1 aspect-[16/9] rounded-xl border border-white/10 flex items-center justify-center shadow-inner" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
            <span className="text-white/20 text-4xl font-light">?</span>
          </div>
        );
      }
    }
    return slots;
  };

  return (
    <>
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed z-[100]"
            style={{ top: '72px', bottom: '240px', left: '80px', right: '24px' }}
          >
            {/* Backdrop blur overlay */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10" onClick={() => setSelectedItem(null)} />

            <div
              className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 flex flex-col"
              style={{ background: 'linear-gradient(135deg, rgba(10,14,22,0.97) 0%, rgba(8,12,20,0.99) 100%)', backdropFilter: 'blur(24px)', boxShadow: '0 0 60px rgba(34,211,238,0.08)' }}
            >
              {/* ── TOP BAR: game info + action buttons ── */}
              <div className="flex items-center gap-5 px-6 py-4 border-b border-white/8 flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                {/* Cover thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/15 flex-shrink-0 shadow-lg">
                  <img src={selectedItem.displayImage || selectedItem.cover_image} alt={selectedItem.displayTitle} className="w-full h-full object-cover" />
                </div>
                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-black text-xl tracking-wide truncate">{selectedItem.displayTitle}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/25 text-[10px] text-cyan-300 font-bold uppercase tracking-wider">{selectedItem.genre || 'Action'}</span>
                    <span className="text-white/30 text-xs">{selectedItem.original_year || '2024'}</span>
                    {selectedItem.price > 0 && (
                      <span className="text-green-400 font-black text-sm ml-1">${selectedItem.price}</span>
                    )}
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => { setSelectedItem(null); navigate(createPageUrl('GameDetail') + '?id=' + selectedItem.id + '&from=library'); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" /> Store Page
                  </button>
                  <button
                    onClick={() => {
                      addToCart({ id: selectedItem.id, title: selectedItem.displayTitle, price: selectedItem.price || 0, cover_image: selectedItem.displayImage, type: 'game' });
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm transition-all shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                  >
                    <ShoppingCart className="w-4 h-4" /> Buy — ${selectedItem.price || '0.00'}
                  </button>
                </div>
                <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors border border-white/10 ml-2 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── MAIN BODY: Achievements left | Content right ── */}
              <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* LEFT — Achievements / Trailers */}
                <div className="w-[48%] flex flex-col border-r border-white/8 min-h-0">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-white/8 flex-shrink-0">
                    {showTrailerMode ? <Play className="w-4 h-4 text-purple-400" /> : <Trophy className="w-4 h-4 text-yellow-400" />}
                    <button
                      onClick={() => setShowTrailerMode(v => !v)}
                      className="font-bold text-xs uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all"
                      style={showTrailerMode
                        ? { background: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.5)', color: '#c084fc' }
                        : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.25)', color: 'white' }
                      }
                    >
                      {showTrailerMode ? 'Trailers' : 'Achievements'}
                    </button>
                    {!showTrailerMode && <span className="ml-auto text-white/30 text-xs">{MOCK_ACHIEVEMENTS.filter(a => a.unlocked).length}/{MOCK_ACHIEVEMENTS.length} Unlocked</span>}
                  </div>
                  {showTrailerMode ? (
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ scrollbarWidth: 'none' }}>
                      {[
                        { title: 'Official Launch Trailer', duration: '2:34', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
                        { title: 'Gameplay Deep Dive', duration: '8:12', thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' },
                        { title: 'Season 4 Reveal', duration: '1:55', thumb: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400' },
                      ].map((vid) => (
                        <div key={vid.title} className="flex items-center gap-3 rounded-xl p-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer group">
                          <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                            <img src={vid.thumb} alt={vid.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                            <span className="absolute bottom-1 right-1 text-[8px] font-bold text-white bg-black/70 px-1 rounded">{vid.duration}</span>
                          </div>
                          <p className="text-white text-xs font-semibold truncate">{vid.title}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2.5 content-start" style={{ scrollbarWidth: 'none' }}>
                    {MOCK_ACHIEVEMENTS.map((ach) => {
                      const style = RARITY_STYLES[ach.rarity];
                      const Icon = ach.icon;
                      return (
                        <div
                          key={ach.id}
                          className="flex items-center gap-3 rounded-xl p-3 border transition-all"
                          style={{
                            background: ach.unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                            border: ach.unlocked ? `1px solid ${style.border}` : '1px solid rgba(255,255,255,0.06)',
                            boxShadow: ach.unlocked ? `0 0 10px ${style.glow}` : 'none',
                            opacity: ach.unlocked ? 1 : 0.45,
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: ach.unlocked ? style.glow : 'rgba(255,255,255,0.04)', border: `1px solid ${ach.unlocked ? style.border : 'rgba(255,255,255,0.06)'}` }}
                          >
                            {ach.unlocked ? <Icon className="w-4 h-4" style={{ color: style.text }} /> : <Lock className="w-3.5 h-3.5 text-white/20" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate" style={{ color: ach.unlocked ? style.text : 'rgba(255,255,255,0.25)' }}>{ach.title}</p>
                            <p className="text-[10px] text-white/30 truncate">{ach.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>

                {/* RIGHT — Content: DLC + News */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-white/8 flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-bold text-xs uppercase tracking-widest">Content & Updates</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ scrollbarWidth: 'none' }}>

                    {/* What's New Banner */}
                    <div className="rounded-xl overflow-hidden border border-white/8 relative flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,238,0.06))' }}>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded">Latest Update</span>
                          <span className="text-white/25 text-[10px]">2 days ago</span>
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">Season 4: Cyber Dawn</h4>
                        <p className="text-white/50 text-xs leading-relaxed">New maps, weapon balance fixes, cybernetic implants added to marketplace. Season pass fully unlocked for premium users.</p>
                      </div>
                    </div>

                    {/* DLC Items */}
                    <div className="flex items-center gap-2 mt-1">
                      <Package className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-white/60 text-xs font-bold uppercase tracking-widest">DLC</span>
                    </div>
                    {[
                      { name: 'Neon District Pack', desc: '3 new maps + exclusive skins', price: 9.99, tag: 'New' },
                      { name: 'Cyber Armory Bundle', desc: 'Weapon skins & gear set', price: 14.99, tag: 'Popular' },
                      { name: 'Season Pass Vol.4', desc: 'Full season content unlock', price: 24.99, tag: 'Best Value' },
                    ].map((dlc) => (
                      <div key={dlc.name} className="flex items-center gap-3 rounded-xl p-3 border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-xs font-bold truncate">{dlc.name}</p>
                            <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 text-[9px] font-bold rounded border border-cyan-500/20 flex-shrink-0">{dlc.tag}</span>
                          </div>
                          <p className="text-white/35 text-[10px]">{dlc.desc}</p>
                        </div>
                        <button
                          onClick={() => addToCart({ id: selectedItem.id + '-' + dlc.name, title: dlc.name, price: dlc.price, type: 'dlc' })}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/20 transition-all"
                        >
                          ${dlc.price}
                        </button>
                      </div>
                    ))}

                    {/* News items */}
                    <div className="flex items-center gap-2 mt-1">
                      <Newspaper className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-white/60 text-xs font-bold uppercase tracking-widest">News</span>
                    </div>
                    {[
                      { headline: 'Server Maintenance Tomorrow', body: 'Scheduled downtime 03:00–05:00 AM UTC.', dot: 'bg-yellow-400' },
                      { headline: 'Double XP Weekend', body: 'Earn 2× XP on all modes this weekend.', dot: 'bg-green-400' },
                    ].map((item) => (
                      <div key={item.headline} className="flex items-start gap-3 rounded-xl p-3 border border-white/8 bg-white/[0.03]">
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${item.dot}`} />
                        <div>
                          <p className="text-white text-xs font-bold">{item.headline}</p>
                          <p className="text-white/40 text-[10px]">{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Blur overlay behind panels ── */}
      <AnimatePresence>
        {activeTab !== 'home' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[45] pointer-events-none"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── TOP panel (drops from header) — Gaming Studios 50/50 ── */}
      <AnimatePresence>
        {activeTab !== 'home' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed top-[64px] right-0 z-[46]"
            style={{
              left: '5%',
              height: '200px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.90) 80%, transparent 100%)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="w-full h-full max-w-[1400px] mx-auto flex gap-0 overflow-hidden">

              <AnimatePresence mode="wait">
                {selectedGame ? (
                  /* ── GAME SELECTED: Left = trailer+screenshots, Right = actions+achievements ── */
                  <motion.div
                    key="game-detail"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full flex"
                  >
                    {/* LEFT — Trailer + screenshots */}
                    <div className="w-[55%] h-full flex gap-2 px-4 py-3 overflow-hidden">
                      {/* Main trailer/banner */}
                      <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10 group cursor-pointer">
                        <img
                          src={selectedGame.banner_image || selectedGame.cover_image || selectedGame.displayImage}
                          alt={selectedGame.displayTitle}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-3">
                          <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Official Trailer</span>
                        </div>
                      </div>
                      {/* Screenshots column */}
                      <div className="flex flex-col gap-2 w-24">
                        {[
                          selectedGame.cover_image,
                          ...(selectedGame.screenshots || []),
                          'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
                          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
                        ].filter(Boolean).slice(0, 3).map((img, i) => (
                          <div key={i} className="flex-1 rounded-lg overflow-hidden border border-white/10 relative group cursor-pointer">
                            <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT — Actions + Achievements */}
                    <div className="flex-1 h-full flex flex-col px-4 py-3 gap-3 overflow-hidden">
                      {/* Game title + actions */}
                      <div className="flex-shrink-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h3 className="text-white font-black text-sm truncate">{selectedGame.displayTitle}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/25 text-[8px] text-cyan-300 font-bold uppercase">{selectedGame.genre || 'Action'}</span>
                              {selectedGame.price > 0 && <span className="text-green-400 font-black text-xs">${selectedGame.price}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedGame(null)}
                            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all flex-shrink-0 border border-white/10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addToCart({ id: selectedGame.id, title: selectedGame.displayTitle, price: selectedGame.price || 0, cover_image: selectedGame.displayImage, type: 'game' })}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] transition-all shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                          >
                            <ShoppingCart className="w-3 h-3" /> Buy ${selectedGame.price || '0.00'}
                          </button>
                          <button
                            onClick={() => navigate(createPageUrl('GameDetail') + '?id=' + selectedGame.id + '&from=library')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-[10px] font-semibold transition-all"
                          >
                            <ShoppingBag className="w-3 h-3" /> Store Page
                          </button>
                        </div>
                      </div>

                      {/* Achievements — single scrollable row of 4 */}
                      <div className="flex-1 min-h-0 flex flex-col">
                        <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest mb-1.5 flex-shrink-0">Achievements</p>
                        <div
                          className="flex-1 overflow-y-auto"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                            {MOCK_ACHIEVEMENTS.map((ach) => {
                              const achTypeMap = {
                                1: { icon: Sword, color: '#22d3ee' },
                                2: { icon: Shield, color: '#a78bfa' },
                                3: { icon: Flame, color: '#fb923c' },
                                4: { icon: Target, color: '#f87171' },
                                5: { icon: Zap, color: '#facc15' },
                                6: { icon: Crown, color: '#fbbf24' },
                                7: { icon: Gem, color: '#c084fc' },
                                8: { icon: Skull, color: '#94a3b8' },
                                9: { icon: Trophy, color: '#22d3ee' },
                                10: { icon: Star, color: '#fbbf24' },
                                11: { icon: Zap, color: '#a78bfa' },
                                12: { icon: Shield, color: '#4ade80' },
                              };
                              const cfg = achTypeMap[ach.id] || { icon: Trophy, color: '#22d3ee' };
                              const Icon = cfg.icon;
                              return (
                                <div
                                  key={ach.id}
                                  className="flex flex-col items-center justify-center gap-1 rounded-xl p-1.5 cursor-default"
                                  style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                  }}
                                >
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center"
                                    style={{ background: `${cfg.color}18`, boxShadow: `0 0 10px ${cfg.color}30` }}
                                  >
                                    <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                  </div>
                                  <p className="text-white/50 text-[7px] font-bold text-center leading-tight truncate w-full px-0.5">{ach.title}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ── DEFAULT: Studios list + spotlight ── */
                  <motion.div
                    key="studios"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full flex"
                  >
                    {/* LEFT 50% — Studios list */}
                    <div className="w-1/2 flex flex-col h-full px-6 py-3">
                      <div className="flex items-center justify-between mb-2 flex-shrink-0">
                        <h3 className="text-xs font-black text-white tracking-widest uppercase">Gaming Studios</h3>
                        <div className="relative w-44">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                          <input
                            type="text"
                            placeholder="Search studios..."
                            value={developerSearch}
                            onChange={(e) => setDeveloperSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] placeholder-white/35 focus:outline-none focus:border-cyan-400/50 transition-all"
                          />
                        </div>
                      </div>
                      <div
                        className="grid overflow-y-auto flex-1"
                        style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', scrollbarWidth: 'none', minHeight: '80px' }}
                      >
                        {filteredDevelopers.map((dev) => (
                          <div
                            key={dev.id}
                            onClick={() => setSelectedDeveloper(selectedDeveloper?.id === dev.id ? null : dev)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
                              selectedDeveloper?.id === dev.id
                                ? 'bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                : 'bg-white/[0.04] border border-transparent hover:bg-white/[0.08] hover:border-white/10'
                            }`}
                          >
                            <img src={dev.logo} alt={dev.name} className="w-7 h-7 rounded-md object-cover bg-white/10 flex-shrink-0" />
                            <p className={`text-[9px] font-semibold leading-tight line-clamp-2 ${selectedDeveloper?.id === dev.id ? 'text-cyan-300' : 'text-white/75'}`}>{dev.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT 50% — Studio banner / spotlight */}
                    <div className="w-1/2 h-full relative overflow-hidden">
                      <AnimatePresence mode="wait">
                        {selectedDeveloper ? (
                          <motion.div
                            key={selectedDeveloper.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0"
                          >
                            {(() => {
                              const devGames = games.filter((_, idx) => idx % MOCK_DEVELOPERS.length === (selectedDeveloper.id - 1) % MOCK_DEVELOPERS.length);
                              const sorted = [...devGames].sort((a, b) => (b.original_year || 0) - (a.original_year || 0));
                              const latestGame = sorted[0];
                              const bannerImg = latestGame?.banner_image || latestGame?.cover_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200';
                              return (
                                <>
                                  <img src={bannerImg} alt={selectedDeveloper.name} className="absolute inset-0 w-full h-full object-cover" />
                                  <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.2) 100%)' }} />
                                  <div className="absolute inset-0 flex flex-col justify-center px-6 gap-3">
                                    <div className="flex items-center gap-3">
                                      <img src={selectedDeveloper.logo} alt={selectedDeveloper.name} className="w-10 h-10 rounded-xl border border-white/20 object-cover bg-white/10 flex-shrink-0" />
                                      <div>
                                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Developer</p>
                                        <h2 className="text-white font-black text-base tracking-wide leading-tight">{selectedDeveloper.name}</h2>
                                        <span className="text-white/50 text-[9px]">{devGames.length} game{devGames.length !== 1 ? 's' : ''} in library</span>
                                      </div>
                                    </div>
                                    <div className="w-full h-px bg-white/10" />
                                    {latestGame && (
                                      <div>
                                        <p className="text-cyan-400/80 text-[9px] font-bold uppercase tracking-widest mb-1.5">Latest Release</p>
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/15 flex-shrink-0">
                                            <img src={latestGame.cover_image || latestGame.banner_image} alt={latestGame.title} className="w-full h-full object-cover" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-white font-bold text-xs truncate">{latestGame.title}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/25 text-[8px] text-cyan-300 font-bold uppercase">{latestGame.genre || 'Action'}</span>
                                              {latestGame.original_year && <span className="text-white/35 text-[9px]">{latestGame.original_year}</span>}
                                              {latestGame.price > 0 && <span className="text-green-400 font-black text-[9px]">${latestGame.price}</span>}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </motion.div>
                        ) : (
                          <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                            <StudioGameCarousel games={games} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM panel (pulls up from bottom nav) — full interactive content ── */}
      <AnimatePresence>
        {activeTab !== 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-[48px] right-0 z-[46] p-6 flex flex-col justify-end"
            style={{ 
              left: '5%',
              top: isLibraryExpanded && activeTab === 'library' ? '264px' : 'auto',
              height: isLibraryExpanded && activeTab === 'library' ? 'calc(100vh - 312px)' : 'auto',
              background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)',
              backdropFilter: 'blur(12px)',
            }}
            onWheel={handleWheel}
          >
            {/* ── Persistent filter bar — always visible (hidden in expanded library) ── */}
            {!(isLibraryExpanded && activeTab === 'library') && (
              <div className="w-full max-w-[1400px] mx-auto mb-3 px-2 flex items-center gap-3">
                {/* Left: Library icon + label, or Back button when in game detail */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Library className={`w-4 h-4 ${activeTab === 'library' ? 'text-cyan-400' : 'text-purple-400'}`} />
                  <button
                    onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
                    className="text-white font-bold text-xs uppercase tracking-widest hover:text-cyan-400 transition-colors"
                  >
                    Store Library
                  </button>
                </div>

                {/* Spacer pushes row nav to far right */}
                <div className="flex-1" />

                {/* Row nav */}
                <div className="flex items-center gap-2 flex-shrink-0 text-white/40 text-[10px]">
                  <span>{currentRow + 1}/{totalRows}</span>
                  <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
                    <button onClick={() => setCurrentRow(p => Math.max(0, p - 1))} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setCurrentRow(p => Math.min(totalRows - 1, p + 1))} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Only show Store Library label in expanded mode */}
            {isLibraryExpanded && activeTab === 'library' && (
              <div className="w-full max-w-[1400px] mx-auto mb-3 px-2">
                <div className="flex items-center gap-2">
                  <Library className="w-4 h-4 text-cyan-400" />
                  <button
                    onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
                    className="text-white font-bold text-xs uppercase tracking-widest hover:text-cyan-400 transition-colors"
                  >
                    Store Library
                  </button>
                </div>
              </div>
            )}
            {(
              isLibraryExpanded && activeTab === 'library' ? (
                /* ── EXPANDED LIBRARY VIEW: Games grid left | Filters right ── */
                <div className="w-full h-full flex gap-4">
                  {/* LEFT: Games Grid */}
                  <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
                    <div className="flex flex-col gap-4">
                      {[0, 1, 2, 3].map((rowIdx) => {
                        const start = (currentRow + rowIdx) * itemsPerRow;
                        const rowItems = items.slice(start, start + itemsPerRow);
                        if (rowItems.length === 0) return null;
                        return (
                          <div key={`expanded-row-${rowIdx}`} className="flex gap-3">
                            {rowItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex-1 relative cursor-pointer group transition-all"
                                onClick={() => { setSelectedGame(item); setCurrentRow(0); }}
                              >
                                <div className="aspect-[16/9] rounded-lg overflow-hidden border border-white/10 group-hover:border-cyan-400/50 shadow-lg">
                                  <img
                                    src={item.displayImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    alt={item.displayTitle}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <p className="text-white text-xs font-bold truncate">{item.displayTitle}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT: Filter Panel */}
                  <div className="w-56 flex flex-col gap-4 p-4 overflow-y-auto border-l border-white/10" style={{ scrollbarWidth: 'none' }}>
                    <div>
                      <p className="text-white text-xs font-bold uppercase tracking-widest mb-3">Filters</p>
                      <div className="flex flex-col gap-2">
                        {GENRE_FILTERS.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => setSelectedGenreFilter(selectedGenreFilter === g.id ? null : g.id)}
                            className={`w-full px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all text-left ${
                              selectedGenreFilter === g.id
                                ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-300'
                                : 'bg-white/[0.05] border-white/10 text-white/55 hover:bg-white/[0.09] hover:text-white'
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full h-px bg-white/10" />

                    <div>
                      <p className="text-white text-xs font-bold uppercase tracking-widest mb-3">Studios</p>
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                        {filteredDevelopers.slice(0, 6).map((dev) => (
                          <button
                            key={dev.id}
                            onClick={() => setSelectedDeveloper(selectedDeveloper?.id === dev.id ? null : dev)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left text-[9px] ${
                              selectedDeveloper?.id === dev.id
                                ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300'
                                : 'bg-white/[0.04] border border-transparent hover:bg-white/[0.08]'
                            }`}
                          >
                            <img src={dev.logo} alt={dev.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                            <span className="truncate">{dev.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <TwoRowGrid
                  items={items}
                  currentRow={currentRow}
                  itemsPerRow={itemsPerRow}
                  selectedGame={selectedGame}
                  activeTab={activeTab}
                  onSelectGame={(item) => { setSelectedGame(item); setCurrentRow(0); setSelectedItem(null); }}
                  onSelectItem={(item) => { setSelectedItem(item); setSelectedGame(null); }}
                />
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!hideNav && <div className="flex items-center justify-center w-full h-full relative">
        <div className="absolute left-6 flex items-center gap-2">
          <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Environment</span>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${isEnvironmentActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-white/40 border border-white/10'}`}>
            {isEnvironmentActive ? 'Active' : 'Off'}
          </span>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={() => handleTabClick('library')}
            className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
              activeTab === 'library'
                ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
            }`}
          >
            {activeTab === 'library' && (
              <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full -z-10 pointer-events-none" />
            )}
            <Library className="w-4 h-4" />
            <span>Library</span>
          </button>

          <div className="w-px h-5 bg-white/10 mx-2" />

          <button
            onClick={() => handleTabClick('home')}
            className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
              activeTab === 'home'
                ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
            }`}
          >
            {activeTab === 'home' && (
              <div className="absolute inset-0 bg-white/10 blur-md rounded-full -z-10 pointer-events-none" />
            )}
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <div className="w-px h-5 bg-white/10 mx-2" />

          <button
            onClick={() => handleTabClick('environment')}
            className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
              activeTab === 'environment'
                ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]'
                : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
            }`}
          >
            {activeTab === 'environment' && (
              <div className="absolute inset-0 bg-purple-400/20 blur-md rounded-full -z-10 pointer-events-none" />
            )}
            <Globe className="w-4 h-4" />
            <span>Environment Hubs</span>
          </button>

          <div className="w-px h-5 bg-white/10 mx-2" />

          <LunaSearchBar
            isLibraryActive={activeTab === 'library'}
            onFocus={() => { if (activeTab !== 'library') handleTabClick('library'); }}
            value={searchTerm || ''}
            onChange={onSearchChange}
          />
        </div>
      </div>}
    </>
  );
}