import React, { useState, useEffect, useRef } from 'react';
import { Home, Library, Globe, ChevronLeft, ChevronRight, X, Play, Info, Trophy, Newspaper, Star, Calendar, Users, Clock, Activity, Settings, Lock, Zap, Shield, Sword, Flame, Crown, Target, Award, Gem, Skull, Search, ShoppingCart, ShoppingBag, Package, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useCart } from '@/components/CartContext';
import GameContentCards from '@/components/dashboard/GameContentCards';

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
      const all = games.map(g => ({ ...g, displayTitle: g.title, displayImage: g.cover_image || g.banner_image }));
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        return all.filter(g => g.displayTitle?.toLowerCase().includes(term) || g.genre?.toLowerCase().includes(term));
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

      {/* ── BOTTOM panel (original position — pulls up from bottom nav) ── */}
      <AnimatePresence>
        {activeTab !== 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-[48px] right-0 z-[34] p-6 flex flex-col justify-end"
            style={{
              left: '5%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)',
              backdropFilter: 'blur(12px)',
              pointerEvents: 'none',
            }}
          >
            <div className="w-full max-w-[1400px] mx-auto" style={{ pointerEvents: 'all' }}>
              <TwoRowGrid
                items={items}
                currentRow={currentRow}
                itemsPerRow={itemsPerRow}
                selectedGame={selectedGame}
                activeTab={activeTab}
                onSelectGame={(item) => { setSelectedGame(item); setCurrentRow(0); setSelectedItem(null); }}
                onSelectItem={(item) => { setSelectedItem(item); setSelectedGame(null); }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP panel (drops from header) ── */}
      <AnimatePresence>
        {activeTab !== 'home' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed top-[64px] right-0 z-[34] p-6 flex flex-col justify-start"
            style={{ 
              left: '5%',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)',
              backdropFilter: 'blur(12px)',
            }}
            onWheel={handleWheel}
          >
            <div className="w-full max-w-[1400px] mx-auto mb-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                {selectedGame ? (
                  <>
                    <button
                      onClick={() => { setSelectedGame(null); setCurrentRow(0); }}
                      className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="w-px h-4 bg-white/20" />
                    <div className="w-6 h-6 rounded overflow-hidden border border-white/20 flex-shrink-0">
                      <img src={selectedGame.displayImage} alt={selectedGame.displayTitle} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold tracking-widest uppercase text-sm text-white">
                      {selectedGame.displayTitle}
                    </span>
                  </>
                ) : (
                  <>
                    {activeTab === 'library' ? <Library className="w-5 h-5 text-cyan-400" /> : <Globe className="w-5 h-5 text-purple-400" />}
                    <h3 className="text-white font-bold tracking-widest uppercase text-sm">
                      {activeTab === 'library' ? (libraryLabel || 'Library Games') : 'Environment Hubs'}
                    </h3>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 text-white/50 text-xs font-medium">
                {!selectedGame && <span>Row {currentRow + 1} of {totalRows}</span>}
                <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                  <button onClick={() => setCurrentRow(p => Math.max(0, p - 1))} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentRow(p => Math.min(totalRows - 1, p + 1))} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
            {selectedGame ? (
              /* ── GAME DETAIL PANEL: Achievements left | Content right ── */
              <div
                className="w-full max-w-[1400px] mx-auto px-2 rounded-2xl overflow-hidden flex"
                style={{
                  height: '280px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                  backdropFilter: 'blur(32px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.2)',
                }}
              >
                {/* LEFT — Game Content Cards */}
                <GameContentCards selectedGame={selectedGame} />

                {/* RIGHT — Store Content (never touched) */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Top bar: game info + action buttons */}
                  <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/15 flex-shrink-0">
                      <img src={selectedGame.displayImage} alt={selectedGame.displayTitle} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-black text-sm truncate">{selectedGame.displayTitle}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/25 text-[9px] text-cyan-300 font-bold uppercase">{selectedGame.genre || 'Action'}</span>
                        {selectedGame.price > 0 && <span className="text-green-400 font-black text-xs">${selectedGame.price}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(createPageUrl('GameDetail') + '?id=' + selectedGame.id + '&from=library')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-[10px] font-semibold transition-all flex-shrink-0"
                    >
                      <ShoppingBag className="w-3 h-3" /> Store
                    </button>
                    <button
                      onClick={() => addToCart({ id: selectedGame.id, title: selectedGame.displayTitle, price: selectedGame.price || 0, cover_image: selectedGame.displayImage, type: 'game' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] transition-all shadow-[0_0_14px_rgba(34,211,238,0.3)] flex-shrink-0"
                    >
                      <ShoppingCart className="w-3 h-3" /> Buy ${selectedGame.price || '0.00'}
                    </button>
                  </div>

                  {/* Content: DLC + News */}
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2" style={{ scrollbarWidth: 'none' }}>
                    {/* What's New */}
                    <div className="rounded-xl p-3 border border-white/8 flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(34,211,238,0.05))' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-bold uppercase rounded">Latest Update</span>
                        <span className="text-white/25 text-[9px]">2 days ago</span>
                      </div>
                      <p className="text-white font-bold text-[10px]">Season 4: Cyber Dawn</p>
                      <p className="text-white/45 text-[9px] leading-relaxed mt-0.5">New maps, weapon balance fixes, cybernetic implants added to marketplace.</p>
                    </div>

                    {/* DLC */}
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3 h-3 text-purple-400" />
                      <span className="text-white/50 text-[9px] font-bold uppercase tracking-widest">DLC</span>
                    </div>
                    {[
                      { name: 'Neon District Pack', desc: '3 new maps + exclusive skins', price: 9.99 },
                      { name: 'Cyber Armory Bundle', desc: 'Weapon skins & gear set', price: 14.99 },
                      { name: 'Season Pass Vol.4', desc: 'Full season content unlock', price: 24.99 },
                    ].map((dlc) => (
                      <div key={dlc.name} className="flex items-center gap-2 rounded-lg p-2 border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all">
                        <div className="w-8 h-8 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-[10px] font-bold truncate">{dlc.name}</p>
                          <p className="text-white/35 text-[9px]">{dlc.desc}</p>
                        </div>
                        <button
                          onClick={() => addToCart({ id: selectedGame.id + '-' + dlc.name, title: dlc.name, price: dlc.price, type: 'dlc' })}
                          className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[9px] font-bold border border-cyan-500/20 transition-all"
                        >${dlc.price}</button>
                      </div>
                    ))}

                    {/* News */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Newspaper className="w-3 h-3 text-blue-400" />
                      <span className="text-white/50 text-[9px] font-bold uppercase tracking-widest">News</span>
                    </div>
                    {[
                      { headline: 'Server Maintenance Tomorrow', body: 'Scheduled downtime 03:00–05:00 AM UTC.', dot: 'bg-yellow-400' },
                      { headline: 'Double XP Weekend', body: 'Earn 2× XP on all modes this weekend.', dot: 'bg-green-400' },
                    ].map((item) => (
                      <div key={item.headline} className="flex items-start gap-2 rounded-lg p-2 border border-white/8 bg-white/[0.03]">
                        <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse ${item.dot}`} />
                        <div>
                          <p className="text-white text-[10px] font-bold">{item.headline}</p>
                          <p className="text-white/40 text-[9px]">{item.body}</p>
                        </div>
                      </div>
                    ))}
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
        </div>
      </div>}
    </>
  );
}