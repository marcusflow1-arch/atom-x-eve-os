import React, { useState, useEffect } from 'react';
import { Home, Library, Globe, ChevronLeft, ChevronRight, X, Play, Info, Trophy, Newspaper, Star, Calendar, Users, Clock, Activity, Settings } from 'lucide-react';
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

export default function LunaBottomNav() {
  const [activeTab, setActiveTab] = useState('home');
  const [games, setGames] = useState([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quickActionItem, setQuickActionItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Game.list().then(setGames);
  }, []);

  const handleTabClick = (tab) => {
    setSelectedItem(null);
    setQuickActionItem(null);
    if (tab === 'home') {
      setActiveTab('home');
    } else {
      setActiveTab(activeTab === tab ? 'home' : tab);
      setCurrentRow(0);
    }
  };

  const getItems = () => {
    if (activeTab === 'library') return games.map(g => ({ ...g, displayTitle: g.title, displayImage: g.cover_image || g.banner_image }));
    if (activeTab === 'environment') return GENRES.map(g => ({ ...g, displayTitle: g.name, displayImage: g.image }));
    return [];
  };

  const items = getItems();
  const itemsPerRow = 7;
  const totalRows = Math.max(1, Math.ceil(items.length / itemsPerRow));

  const handleWheel = (e) => {
    if (e.deltaY > 0) {
      setCurrentRow(prev => Math.min(prev + 1, totalRows - 1));
    } else if (e.deltaY < 0) {
      setCurrentRow(prev => Math.max(prev - 1, 0));
    }
  };

  const currentItems = items.slice(currentRow * itemsPerRow, (currentRow + 1) * itemsPerRow);

  const renderSlots = () => {
    const slots = [];
    for (let i = 0; i < itemsPerRow; i++) {
      if (i < currentItems.length) {
        const item = currentItems[i];
        slots.push(
          <div 
            key={item.id || i} 
            className={`flex-1 relative cursor-pointer group transition-all duration-300 z-0 ${quickActionItem === item.id ? 'z-50' : ''}`}
            onClick={() => {
              if (activeTab === 'library') {
                setSelectedItem(null);
                if (quickActionItem === item.id) setQuickActionItem(null);
                else setQuickActionItem(item.id);
              }
            }}
            onDoubleClick={() => {
              if (activeTab === 'library') {
                setSelectedItem(item);
                setQuickActionItem(null);
              }
            }}
          >
            <div className={`aspect-[16/9] rounded-xl overflow-hidden relative shadow-lg transition-all ${
              quickActionItem === item.id ? 'border-2 border-cyan-400' : 'border border-white/10 group-hover:border-cyan-400/50'
            }`}>
              <img src={item.displayImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.displayTitle} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <p className="text-white text-xs font-bold truncate tracking-wide">{item.displayTitle}</p>
              </div>
            </div>

            {/* Quick Actions Extension */}
            <AnimatePresence>
              {quickActionItem === item.id && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute bottom-full left-0 right-0 pb-2 flex gap-2"
                >
                  <div className="flex-1 bg-[rgba(15,20,30,0.95)] backdrop-blur-xl border border-cyan-400/30 rounded-lg p-1.5 flex gap-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(createPageUrl('Library')); }}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-1.5 rounded text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" /> Play
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(createPageUrl('GameDetail') + '?id=' + item.id + '&from=library'); }}
                      className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded flex items-center justify-center transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              bottom: '250px', // Positioned closer to the library drawer
              left: '310px', // Extended all the way to the left side without overlapping sidebars
              right: '310px', // Extended all the way to the right side without overlapping live feed
              perspective: '1000px'
            }}
          >
            {/* Ambient Shade Effect behind the box */}
            <div className="absolute inset-[-100px] bg-black/80 blur-[50px] rounded-[100px] -z-10 pointer-events-none" />

            <div 
              className="relative w-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.15)] border border-white/10"
              style={{
                background: 'linear-gradient(135deg, rgba(15,20,30,0.95) 0%, rgba(10,15,25,0.98) 100%)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10 backdrop-blur-md z-50">
                <X className="w-4 h-4" />
              </button>

              {/* Content Grid */}
              <div className="p-6 relative z-10 flex gap-6">
                {/* Column 1: Game Details */}
                <div className="flex gap-5 w-[380px] flex-shrink-0">
                  <div className="w-32 flex-shrink-0 hidden sm:block">
                    <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                      <img src={selectedItem.displayImage || selectedItem.cover_image} alt={selectedItem.displayTitle} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1 pt-6 sm:pt-0 flex flex-col justify-between">
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-wide mb-2 leading-tight">{selectedItem.displayTitle}</h2>
                      <div className="flex gap-2 mb-4">
                        <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-cyan-300 font-bold uppercase tracking-wider">{selectedItem.genre || 'Action'}</span>
                        <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white/50 font-bold uppercase tracking-wider">{selectedItem.original_year || '2024'}</span>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed mb-6 line-clamp-3">
                        {selectedItem.description || 'Dive into an immersive world where every decision shapes your destiny. Experience breathtaking visuals and thrilling gameplay in this highly acclaimed title.'}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setSelectedItem(null); navigate(createPageUrl('Library')); }} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                        <Play className="w-4 h-4 fill-current" /> Play Game
                      </button>
                      <button onClick={() => { setSelectedItem(null); navigate(createPageUrl('GameDetail') + '?id=' + selectedItem.id + '&from=library'); }} className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all">
                        <Info className="w-4 h-4" /> Details
                      </button>
                    </div>
                  </div>
                </div>

                <div className="w-px bg-gradient-to-b from-transparent via-white/20 to-transparent flex-shrink-0" />

                {/* Column 2: Stats & Achievements */}
                <div className="w-[300px] flex-shrink-0 flex flex-col gap-5 pt-2">
                  {/* Quick Stats Strip */}
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 shadow-inner">
                    <div className="text-center flex-1">
                      <div className="flex items-center justify-center gap-1 mb-0.5 text-white/50">
                        <Clock className="w-3 h-3" />
                        <p className="text-[9px] uppercase tracking-wider font-bold">Time Played</p>
                      </div>
                      <p className="text-white text-sm font-black tracking-wide">124<span className="text-white/50 text-xs font-medium">h</span></p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-center flex-1">
                      <div className="flex items-center justify-center gap-1 mb-0.5 text-white/50">
                        <Calendar className="w-3 h-3" />
                        <p className="text-[9px] uppercase tracking-wider font-bold">Last Played</p>
                      </div>
                      <p className="text-white text-sm font-black tracking-wide">Today</p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-center flex-1">
                      <div className="flex items-center justify-center gap-1 mb-0.5 text-white/50">
                        <Activity className="w-3 h-3" />
                        <p className="text-[9px] uppercase tracking-wider font-bold">Completion</p>
                      </div>
                      <p className="text-cyan-400 text-sm font-black tracking-wide">68%</p>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between text-white/90 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <h3 className="text-xs font-bold tracking-widest uppercase">Top Achievements</h3>
                      </div>
                      <span className="text-[10px] text-white/50 font-medium bg-white/5 px-2 py-0.5 rounded border border-white/5">12 / 42</span>
                    </div>
                    
                    <div className="flex flex-col gap-2.5">
                      <div className="group bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 border border-white/10 hover:border-white/20 rounded-xl p-2.5 flex items-center gap-3 transition-all cursor-pointer">
                        <div className="w-10 h-10 rounded-lg border border-yellow-400/30 bg-yellow-400/10 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(250,204,21,0.1)] group-hover:scale-105 transition-transform">
                          <Star className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-bold truncate mb-0.5 group-hover:text-yellow-400 transition-colors">First Blood</p>
                          <p className="text-white/40 text-[10px] truncate">Complete the tutorial mission.</p>
                        </div>
                      </div>
                      <div className="group bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 border border-white/10 hover:border-white/20 rounded-xl p-2.5 flex items-center gap-3 transition-all cursor-pointer">
                        <div className="w-10 h-10 rounded-lg border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.1)] group-hover:scale-105 transition-transform">
                          <Trophy className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-bold truncate mb-0.5 group-hover:text-cyan-400 transition-colors">Sharpshooter</p>
                          <p className="text-white/40 text-[10px] truncate">Achieve 100 headshots.</p>
                        </div>
                      </div>
                      <button className="text-cyan-400 hover:text-cyan-300 text-[10px] font-bold uppercase tracking-wider mt-1 text-left w-max flex items-center gap-1 group">
                        View All Progress <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="w-px bg-gradient-to-b from-transparent via-white/20 to-transparent flex-shrink-0" />

                {/* Column 3: Social & News */}
                <div className="flex-1 flex flex-col gap-5 pt-2 min-w-0 pr-8">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between text-white/90 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-400" />
                        <h3 className="text-xs font-bold tracking-widest uppercase">Live Network</h3>
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider">Online</span>
                      </div>
                    </div>

                    <div className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-3.5 transition-all">
                       <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold mb-3">Friends Playing Now</p>
                       <div className="flex items-center justify-between">
                         <div className="flex -space-x-2">
                           <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" className="w-9 h-9 rounded-full border-2 border-[rgba(15,20,30,0.95)] object-cover shadow-lg" alt="Friend 1" />
                           <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop" className="w-9 h-9 rounded-full border-2 border-[rgba(15,20,30,0.95)] object-cover shadow-lg" alt="Friend 2" />
                           <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop" className="w-9 h-9 rounded-full border-2 border-[rgba(15,20,30,0.95)] object-cover shadow-lg" alt="Friend 3" />
                           <div className="w-9 h-9 rounded-full border-2 border-[rgba(15,20,30,0.95)] bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">+2</div>
                         </div>
                         <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold text-white transition-all shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105">
                           Join Party
                         </button>
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 flex-1">
                    <div className="flex items-center justify-between text-white/90 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs font-bold tracking-widest uppercase">Latest Update</h3>
                      </div>
                      <span className="text-[10px] text-white/50 font-medium">2 days ago</span>
                    </div>

                    <div className="group flex-1 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 rounded-xl p-5 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-center shadow-inner">
                      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider rounded">Patch Notes</span>
                        <span className="text-blue-400/60 text-[10px] font-bold">v1.4.2</span>
                      </div>
                      
                      <h4 className="text-white text-base font-bold mb-2 group-hover:text-blue-300 transition-colors">Season 4 is Live!</h4>
                      <p className="text-white/60 text-xs leading-relaxed line-clamp-2 mb-4">
                        Experience new multiplayer maps, a fully reworked weapon progression system, and unlock the brand new Battle Pass rewards.
                      </p>
                      
                      <div className="mt-auto flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        Read Full Notes <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
                 {activeTab === 'library' ? <Library className="w-5 h-5 text-cyan-400" /> : <Globe className="w-5 h-5 text-purple-400" />}
                 <h3 className="text-white font-bold tracking-widest uppercase text-sm">
                   {activeTab === 'library' ? 'Library Games' : 'Environment Hubs'}
                 </h3>
               </div>
               <div className="flex items-center gap-3 text-white/50 text-xs font-medium">
                  <span>Row {currentRow + 1} of {totalRows}</span>
                  <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                    <button onClick={() => setCurrentRow(p => Math.max(0, p - 1))} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentRow(p => Math.min(totalRows - 1, p + 1))} className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </div>
               </div>
            </div>
            <div className="flex gap-4 w-full max-w-[1400px] mx-auto px-2">
              {renderSlots()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center w-full h-full">
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
      </div>
    </>
  );
}