import React, { useState, useEffect } from 'react';
import { Home, Library, Globe, ChevronLeft, ChevronRight, X, Play, Info } from 'lucide-react';
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
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Game.list().then(setGames);
  }, []);

  const handleTabClick = (tab) => {
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
            onClick={() => {
              if (activeTab === 'library') setSelectedItem(item);
            }}
            className="flex-1 aspect-[16/9] rounded-xl overflow-hidden relative cursor-pointer group border border-white/10 hover:border-cyan-400/50 transition-all shadow-lg"
          >
            <img src={item.displayImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.displayTitle} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-center">
              <p className="text-white text-xs font-bold truncate tracking-wide">{item.displayTitle}</p>
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
            className="fixed left-1/2 z-[100] w-full max-w-2xl"
            style={{ 
              bottom: '340px', // Positioned above the library drawer
              transform: 'translateX(-50%)',
              perspective: '1000px'
            }}
          >
            <div 
              className="relative w-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.15)] border border-white/10"
              style={{
                background: 'linear-gradient(135deg, rgba(15,20,30,0.95) 0%, rgba(10,15,25,0.98) 100%)',
                backdropFilter: 'blur(20px)'
              }}
            >
              {/* Cover Image Header */}
              <div className="relative h-64 w-full">
                <img src={selectedItem.displayImage || selectedItem.cover_image} alt={selectedItem.displayTitle} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,15,25,0.98)] via-[rgba(10,15,25,0.6)] to-transparent" />
                <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10 backdrop-blur-md z-10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 -mt-16 relative z-10 flex gap-8">
                {/* Left Side: Thumbnail / Capsule */}
                <div className="w-48 flex-shrink-0 hidden md:block">
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl">
                    <img src={selectedItem.displayImage || selectedItem.cover_image} alt={selectedItem.displayTitle} className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Right Side: Details */}
                <div className="flex-1 pt-8 md:pt-0 flex flex-col justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-wide mb-2">{selectedItem.displayTitle}</h2>
                    <div className="flex gap-2 mb-4">
                      <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-cyan-300 font-bold uppercase tracking-wider">{selectedItem.genre || 'Action'}</span>
                      <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/50 font-bold uppercase tracking-wider">{selectedItem.original_year || '2024'}</span>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed mb-6 line-clamp-3">
                      {selectedItem.description || 'Dive into an immersive world where every decision shapes your destiny. Experience breathtaking visuals and thrilling gameplay in this highly acclaimed title.'}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setSelectedItem(null);
                        navigate(createPageUrl('Library'));
                      }}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Play Now
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedItem(null);
                        navigate(createPageUrl('GameDetail') + '?id=' + selectedItem.id + '&from=library');
                      }}
                      className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <Info className="w-5 h-5" />
                      Game Info
                    </button>
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