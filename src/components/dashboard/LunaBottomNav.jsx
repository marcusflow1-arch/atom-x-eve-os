import React, { useState, useEffect } from 'react';
import { Home, Library, Globe, ChevronLeft, ChevronRight, X, Play, Info, Trophy, Newspaper, Star, Calendar, Users, Clock, Activity, Settings, Lock, Zap, Shield, Sword, Flame, Crown, Target, Award, Gem, Skull } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const GENRES = [
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

export default function LunaBottomNav({ isEnvironmentActive, libraryLabel, forceLibraryOpen, onLibraryClose, hideNav, searchTerm }) {
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
  const navigate = useNavigate();

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
    if (activeTab === 'environment') return GENRES.map(g => ({ ...g, displayTitle: g.name, displayImage: g.image }));
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
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed z-[100]"
            style={{ 
              top: '80px',
              bottom: '250px', // Positioned closer to the library drawer
              left: '96px', // Extended all the way to the left side without overlapping sidebars
              right: '32px', // Extended all the way to the right side
              perspective: '1000px'
            }}
          >
            {/* Ambient Shade Effect behind the box */}
            <div className="absolute inset-[-100px] bg-black/80 blur-[50px] rounded-[100px] -z-10 pointer-events-none" />

            <div 
              className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.15)] border border-white/10 flex flex-col"
              style={{
                background: 'linear-gradient(135deg, rgba(15,20,30,0.95) 0%, rgba(10,15,25,0.98) 100%)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10 backdrop-blur-md z-50">
                <X className="w-5 h-5" />
              </button>

              {/* Content Grid */}
              <div className="p-8 relative z-10 flex gap-8 h-full">
                {/* Column 1: Game Details */}
                <div className="flex gap-6 w-[450px] flex-shrink-0 h-full">
                  <div className="w-48 flex-shrink-0 hidden sm:block h-full">
                    <div className="w-full h-full rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                      <img src={selectedItem.displayImage || selectedItem.cover_image} alt={selectedItem.displayTitle} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-4 min-h-0">
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <h2 className="text-4xl font-black text-white tracking-wide mb-3 leading-tight">{selectedItem.displayTitle}</h2>
                      <div className="flex gap-3 mb-6">
                        <span className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[11px] text-cyan-300 font-bold uppercase tracking-wider">{selectedItem.genre || 'Action'}</span>
                        <span className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[11px] text-white/50 font-bold uppercase tracking-wider">{selectedItem.original_year || '2024'}</span>
                      </div>
                      <p className="text-white/70 text-base leading-relaxed mb-8">
                        {selectedItem.description || 'Dive into an immersive world where every decision shapes your destiny. Experience breathtaking visuals and thrilling gameplay in this highly acclaimed title.'}
                      </p>
                    </div>
                    <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
                      <button onClick={() => { setSelectedItem(null); navigate(createPageUrl('Library')); }} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                        <Play className="w-5 h-5 fill-current" /> Play Game
                      </button>
                      <button onClick={() => { setSelectedItem(null); navigate(createPageUrl('GameDetail') + '?id=' + selectedItem.id + '&from=library'); }} className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-base font-semibold flex items-center justify-center gap-2 transition-all">
                        <Settings className="w-5 h-5" /> Settings
                      </button>
                    </div>
                  </div>
                </div>

                <div className="w-px bg-gradient-to-b from-transparent via-white/20 to-transparent flex-shrink-0" />

                {/* Column 2: Community & LFG */}
                <div className="w-[380px] flex-shrink-0 flex flex-col gap-6 py-4 h-full">
                  {/* Game Stats */}
                  <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-xl p-5 shadow-inner">
                    <div className="flex-1 text-center border-r border-white/10 pr-3">
                      <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider mb-1">Playing Now</p>
                      <p className="text-cyan-400 text-2xl font-black tracking-wide">24,502</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-[11px] text-white/40 font-bold uppercase tracking-wider mb-1">Downloads</p>
                      <p className="text-white text-2xl font-black tracking-wide">1.2M</p>
                    </div>
                  </div>

                  {/* LFG List */}
                  <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
                    <div className="flex items-center justify-between text-white/90 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-green-400" />
                        <h3 className="text-sm font-bold tracking-widest uppercase">Looking For Party</h3>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar h-full">
                      {/* Mock LFG Item 1 */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold">AK</div>
                            <span className="text-sm font-bold text-white">AtomKiller</span>
                          </div>
                          <span className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded">Lvl 42</span>
                        </div>
                        <div className="text-xs text-cyan-300 bg-cyan-900/10 px-3 py-2 rounded-lg border border-cyan-900/20">
                          Looking for: <span className="text-cyan-100 font-medium">"Sharpshooter" Achievement</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-bold py-2 rounded-lg transition-colors">Join Party</button>
                          <button className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 text-xs font-bold py-2 rounded-lg transition-colors">Message</button>
                          <button className="px-3 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 text-xs font-bold py-2 rounded-lg transition-colors">+</button>
                        </div>
                      </div>

                      {/* Mock LFG Item 2 */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-[10px] font-bold">EC</div>
                            <span className="text-sm font-bold text-white">EveCommander</span>
                          </div>
                          <span className="text-[10px] text-green-400 bg-green-900/10 px-2 py-1 rounded border border-green-900/20">Friend</span>
                        </div>
                        <div className="text-xs text-purple-300 bg-purple-900/10 px-3 py-2 rounded-lg border border-purple-900/20">
                          Looking for: <span className="text-purple-100 font-medium">Co-op Campaign</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-bold py-2 rounded-lg transition-colors">Join Party</button>
                          <button className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 text-xs font-bold py-2 rounded-lg transition-colors">Message</button>
                        </div>
                      </div>
                      
                      {/* Mock LFG Item 3 */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold">NL</div>
                            <span className="text-sm font-bold text-white">NightLotus</span>
                          </div>
                          <span className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded">Lvl 18</span>
                        </div>
                        <div className="text-xs text-amber-300 bg-amber-900/10 px-3 py-2 rounded-lg border border-amber-900/20">
                          Looking for: <span className="text-amber-100 font-medium">Casual Matches</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-bold py-2 rounded-lg transition-colors">Join Party</button>
                          <button className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 text-xs font-bold py-2 rounded-lg transition-colors">Message</button>
                          <button className="px-3 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 text-xs font-bold py-2 rounded-lg transition-colors">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-px bg-gradient-to-b from-transparent via-white/20 to-transparent flex-shrink-0" />

                {/* Column 3: Updates & Info */}
                <div className="flex-1 flex flex-col gap-6 py-4 min-w-0 pr-8 h-full">
                  <div className="flex flex-col gap-5 h-full">
                    <div className="flex items-center justify-between text-white/90 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-3">
                        <Newspaper className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-bold tracking-widest uppercase">Game Updates</h3>
                      </div>
                      <span className="text-xs text-white/50 font-medium">v1.4.2</span>
                    </div>

                    <div className="group bg-gradient-to-br from-blue-500/5 to-transparent border border-white/10 hover:border-blue-500/30 rounded-xl p-6 cursor-pointer transition-all flex-1 flex flex-col justify-center min-h-0">
                       <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider rounded">Patch Notes</span>
                          <span className="text-white/30 text-xs">2 days ago</span>
                       </div>
                       <h4 className="text-white text-2xl font-bold mb-3 group-hover:text-blue-300 transition-colors">Season 4: Cyber Dawn</h4>
                       <p className="text-white/60 text-base leading-relaxed mb-6 flex-1 overflow-y-auto custom-scrollbar">
                          New Cybernetic implants available in the marketplace. Fixed issues with party synchronization in ranked matches. Added 3 new maps: Neon District, The Spire, and Core Sector. Weapon balance changes applied to all Assault Rifles. Season pass is now fully unlocked for premium users.
                       </p>
                       <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mt-auto pt-2">
                          Read More <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-start gap-4 flex-shrink-0">
                       <div className="mt-1.5 w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                       <div>
                          <p className="text-white text-base font-bold mb-1">Server Maintenance</p>
                          <p className="text-white/50 text-sm leading-relaxed">Scheduled for tomorrow at 03:00 AM UTC. Downtime approx 2h.</p>
                       </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTab !== 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[48px] right-0 z-[34] p-6 flex flex-col justify-end"
            style={{ 
              left: '5%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 70%, transparent 100%)',
              backdropFilter: 'blur(12px)'
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
                    <h3 className="text-white font-bold tracking-widest uppercase text-sm">{selectedGame.displayTitle} — Achievements</h3>
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
                {selectedGame && (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-xs transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" /> Play {selectedGame.displayTitle}
                  </button>
                )}
                <span>Row {currentRow + 1} of {selectedGame ? achievementRows : totalRows}</span>
                <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                  <button onClick={() => setCurrentRow(p => Math.max(0, p - 1))} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentRow(p => Math.min((selectedGame ? achievementRows : totalRows) - 1, p + 1))} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
            {selectedGame ? (
              <div className="flex gap-4 w-full max-w-[1400px] mx-auto px-2">
                {renderSlots()}
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full max-w-[1400px] mx-auto px-2">
                {[0, 1].map(rowOffset => {
                  const rowItems = items.slice((currentRow + rowOffset) * itemsPerRow, (currentRow + rowOffset + 1) * itemsPerRow);
                  return (
                    <div key={rowOffset} className="flex gap-4 w-full">
                      {Array.from({ length: itemsPerRow }).map((_, i) => {
                        const item = rowItems[i];
                        if (!item) return (
                          <div key={`empty-${rowOffset}-${i}`} className="flex-1 aspect-[16/9] rounded-xl border border-white/10 flex items-center justify-center shadow-inner" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
                            <span className="text-white/20 text-4xl font-light">?</span>
                          </div>
                        );
                        const itemKey = item.id ? String(item.id) : `item-${rowOffset}-${i}`;
                        return (
                          <div
                            key={itemKey}
                            className={`flex-1 relative cursor-pointer group transition-all duration-300 ${selectedGame?.id === item.id ? 'ring-2 ring-cyan-400' : ''}`}
                            onClick={() => { if (activeTab === 'library') { setSelectedGame(item); setCurrentRow(0); setSelectedItem(null); } }}
                            onDoubleClick={() => { if (activeTab === 'library') { setSelectedItem(item); setSelectedGame(null); } }}
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
                      })}
                    </div>
                  );
                })}
              </div>
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