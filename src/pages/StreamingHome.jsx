import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Minimize2, Search, Layers, Sparkles } from 'lucide-react';

import { useAuth } from '@/components/auth/AuthContext';
import useCreatorEditMode from '@/components/streaming/hooks/useCreatorEditMode';
import EditModeToolbar from '@/components/streaming/creator/EditModeToolbar';
import ProfileInfoBar from '@/components/streaming/creator/ProfileInfoBar';
import ScheduleSection from '@/components/streaming/creator/ScheduleSection';
import GallerySection from '@/components/streaming/creator/GallerySection';
import GamesSection from '@/components/streaming/creator/GamesSection';
import SponsorEditor from '@/components/streaming/creator/SponsorEditor';
import SponsorsSection from '@/components/streaming/profile/SponsorsSection';
import ProductsGrid from '@/components/streaming/profile/ProductsGrid';
import ViewerSeasonalPass from '@/components/streaming/ViewerSeasonalPass';
import StreamerCardDetailModal from '@/components/streaming/StreamerCardDetailModal';
import StreamPlayerBox from '@/components/streaming/StreamPlayerBox';
import StreamChatBox from '@/components/streaming/StreamChatBox';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import AuraBottomNav from '@/components/streaming/AuraBottomNav.jsx';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import { useSidebarVisible } from '../hooks/useSidebarVisible';

const CARD_GAMES = [
  { id: 'elder-scrolls', name: 'The Elder Scrolls', genre: 'Fantasy', color: 'from-indigo-700/70 to-cyan-700/50', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/306130/header.jpg' },
  { id: 'smite-2', name: 'SMITE 2', genre: 'MOBA', color: 'from-cyan-700/70 to-blue-900/60', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2687550/header.jpg' },
  { id: 'fallout', name: 'Fallout', genre: 'RPG', color: 'from-emerald-700/70 to-slate-900/70', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/377160/header.jpg' },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', genre: 'Action RPG', color: 'from-fuchsia-700/60 to-purple-900/70', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg' },
  { id: 'destiny', name: 'Destiny 2', genre: 'Shooter', color: 'from-sky-700/70 to-slate-900/70', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1085660/header.jpg' },
];

const CARD_LIBRARY = {
  'elder-scrolls': ['Dragonborn', 'Dwemer Centurion', 'Flame Atronach', 'Daedric Prince', 'Nightblade', 'Ancient Hero'],
  'smite-2': ['Divine Warrior', 'Storm Caller', 'Shadow Hunter', 'Battle Mage', 'Titan Slayer', 'Arena Champion'],
  fallout: ['Wasteland Survivor', 'Vault Dweller', 'Brotherhood Knight', 'Deathclaw Hunter', 'Rad Runner', 'Overseer'],
  cyberpunk: ['Night City Legend', 'Chrome Runner', 'Netrunner', 'Street Samurai', 'Fixer', 'Afterlife Icon'],
  destiny: ['Guardian', 'Vanguard', 'Crucible Ace', 'Hive Slayer', 'Arc Walker', 'Voidwalker'],
};

const GENRES = ['All Genres', 'MMORPG', 'RPG', 'Action RPG', 'MOBA', 'Shooter', 'Fantasy', 'Sci-Fi'];
const RARITIES = ['All', 'Common', 'Rare', 'Epic', 'Legendary'];
const RARITY_STYLES = {
  Common: { glow: 'rgba(148,163,184,.22)', edge: 'rgba(226,232,240,.38)', accent: '#cbd5e1' },
  Rare: { glow: 'rgba(59,130,246,.34)', edge: 'rgba(96,165,250,.72)', accent: '#93c5fd' },
  Epic: { glow: 'rgba(168,85,247,.38)', edge: 'rgba(216,180,254,.76)', accent: '#d8b4fe' },
  Legendary: { glow: 'rgba(245,158,11,.42)', edge: 'rgba(253,186,116,.86)', accent: '#fdba74' },
};

export default function StreamingHome() {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();
  const [overlayFullscreen, setOverlayFullscreen] = useState(false);
  const [selectedCardGame, setSelectedCardGame] = useState(CARD_GAMES[0].id);
  const [cardFilter, setCardFilter] = useState('All');
  const [cardGenre, setCardGenre] = useState('All Genres');
  const [cardSearch, setCardSearch] = useState('');
  const [showGameAchievements, setShowGameAchievements] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });

  const { saving, isEditMode, activeProfile, activeLayout, activeSponsors, enterEditMode, cancelEdit, saveEdit, updateEditProfile, updateEditLayout, addEditSponsor, removeEditSponsor, updateEditSponsors } = useCreatorEditMode();
  const scheduleData = activeLayout?.schedule_data || {};
  const galleryImages = activeLayout?.gallery_images || [];
  const pinnedGames = activeLayout?.pinned_games || [];
  const streamingGame = CARD_GAMES.find((game) => game.id === (activeLayout?.current_game_id || activeProfile?.current_game_id)) || CARD_GAMES[0];

  useEffect(() => {
    if (!activeTab && !showGameAchievements) return;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setActiveTab(null);
        setOverlayFullscreen(false);
        setShowGameAchievements(false);
        setHoveredCard(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeTab, showGameAchievements]);

  useEffect(() => setOverlayFullscreen(false), [activeTab]);

  const activeTabLabel = activeTab ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : '';
  const filteredGames = useMemo(() => CARD_GAMES.filter((game) => {
    const genreMatches = cardGenre === 'All Genres' || game.genre === cardGenre || (cardGenre === 'RPG' && game.genre === 'Action RPG');
    const searchMatches = !cardSearch.trim() || game.name.toLowerCase().includes(cardSearch.trim().toLowerCase());
    return genreMatches && searchMatches;
  }), [cardGenre, cardSearch]);
  const cardItems = useMemo(() => {
    const names = CARD_LIBRARY[selectedCardGame] || [];
    if (cardFilter === 'All') return names;
    return names.filter((_, index) => {
      const rarity = index % 5 === 0 ? 'Legendary' : index % 3 === 0 ? 'Epic' : index % 2 === 0 ? 'Rare' : 'Common';
      return rarity === cardFilter;
    });
  }, [selectedCardGame, cardFilter]);
  const gameAchievementItems = CARD_LIBRARY[streamingGame.id] || [];

  const closeOverlay = () => { setActiveTab(null); setOverlayFullscreen(false); setHoveredCard(null); };
  const openTab = (tab) => { setActiveTab(activeTab === tab ? null : tab); setOverlayFullscreen(false); };
  const handleCardPointerMove = (event, cardKey) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setHoveredCard(cardKey);
    setCardTilt({ x: (0.5 - py) * 12, y: (px - 0.5) * 14 });
  };
  const handleCardPointerLeave = () => { setHoveredCard(null); setCardTilt({ x: 0, y: 0 }); };

  const renderCardsOverlay = () => (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 pb-3 shrink-0 border-b border-white/10">
        <div><div className="text-[9px] uppercase tracking-[0.3em] text-cyan-300/60">Collector Showcase</div><h3 className="text-lg md:text-xl font-bold text-white truncate">Achievement Cards</h3></div>
        <button type="button" onClick={() => setOverlayFullscreen((value) => !value)} className="h-8 w-8 shrink-0 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white">{overlayFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
      </div>
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside className="w-1/5 shrink-0 pr-4 md:pr-5 pt-4 flex flex-col min-h-0">
          <div className="text-[9px] uppercase tracking-[0.24em] text-white/35 mb-2">Filter Games</div>
          <div className="relative"><select value={cardGenre} onChange={(event) => setCardGenre(event.target.value)} className="w-full h-9 appearance-none bg-white/[0.035] border border-white/10 rounded text-white/80 text-sm cursor-pointer"><option value="All Genres">All Genres</option>{GENRES.filter((g) => g !== 'All Genres').map((genre) => <option key={genre} value={genre}>{genre}</option>)}</select><Sparkles className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300/50" /></div>
          <div className="my-4 h-px w-full bg-gradient-to-r from-white/20 via-cyan-300/30 to-transparent" />
          <div className="relative mb-3"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" /><input value={cardSearch} onChange={(event) => setCardSearch(event.target.value)} placeholder="Search games..." className="w-full pl-8 pr-2.5 h-9 bg-white/[0.035] border border-white/10 rounded text-white/70 placeholder-white/30 text-sm outline-none focus:border-cyan-300/40 focus:bg-white/[0.06]" /></div>
          <div className="text-[9px] uppercase tracking-[0.24em] text-white/30 mb-2">Games</div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-hide space-y-1">{filteredGames.map((game) => <button key={game.id} type="button" onClick={() => setSelectedCardGame(game.id)} className={`w-full px-2.5 py-2 text-left text-sm rounded transition-all duration-200 ${selectedCardGame === game.id ? 'bg-gradient-to-r from-cyan-500/30 to-cyan-500/10 border border-cyan-300/50 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>{game.name}</button>)}</div>
        </aside>
        <div className="relative w-px self-center h-[62%] shrink-0 bg-gradient-to-b from-transparent via-cyan-200/50 to-transparent shadow-[0_0_18px_rgba(103,232,249,.18)]" />
        <section className="w-4/5 min-w-0 pl-5 md:pl-7 pt-4 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between gap-4 shrink-0 mb-3"><div className="min-w-0"><div className="flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-300/80" /><span className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/60">Collection</span></div><h3 className="text-lg font-semibold text-white truncate">{streamingGame.name}</h3></div><div className="flex items-center gap-2 shrink-0"><select value={cardFilter} onChange={(event) => setCardFilter(event.target.value)} className="h-8 px-2 appearance-none bg-white/[0.035] border border-white/10 rounded text-white/60 text-xs outline-none hover:bg-white/[0.055]"><option>All</option>{RARITIES.filter((r) => r !== 'All').map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}</select></div></div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-hide"><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">{cardItems.map((name, index) => { const rarity = index % 5 === 0 ? 'Legendary' : index % 3 === 0 ? 'Epic' : index % 2 === 0 ? 'Rare' : 'Common'; const rarityStyle = RARITY_STYLES[rarity]; return <motion.div key={`${name}-${index}`} layoutId={`card-${selectedCardGame}-${name}`} onClick={() => setSelectedCard({ game: selectedCardGame, name, rarity })} onPointerMove={(event) => handleCardPointerMove(event, `${selectedCardGame}-${name}`)} onPointerLeave={handleCardPointerLeave} whileHover={{ scale: 1.02 }} className="group relative h-64 md:h-72 cursor-pointer rounded-lg overflow-hidden" style={{ perspective: '1000px' }}><motion.div style={{ rotateX: cardTilt.x, rotateY: cardTilt.y, transformStyle: 'preserve-3d' }} transition={{ type: 'spring', stiffness: 400, damping: 60 }} className="w-full h-full"><div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle at 50% 50%, ${rarityStyle.glow}, transparent 70%)` }} /><div className="absolute inset-0 border border-transparent rounded-lg group-hover:border-opacity-100 transition-all duration-300" style={{ borderColor: rarityStyle.edge, boxShadow: `0 0 20px ${rarityStyle.glow}, inset 0 0 20px ${rarityStyle.glow}33` }} /><div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-3 relative"><div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity" style={{ backgroundImage: `linear-gradient(45deg, ${rarityStyle.accent}15 1px, transparent 1px)`, backgroundSize: '20px 20px' }} /><Badge className="mb-2 text-xs" variant="outline">{rarity}</Badge><p className="text-center font-semibold text-white text-sm">{name}</p></div></div></motion.div></motion.div>; })}</div></div>
        </section>
      </div>
    </div>
  );

  const renderGameAchievementOverlay = () => (
    <motion.div initial={{ y: '-100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 30 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl rounded-lg overflow-hidden">
      <div className="h-full w-full p-4 md:p-5 flex flex-col overflow-hidden"><div className="flex items-center justify-between gap-4 shrink-0 pb-3 border-b border-white/10"><div className="min-w-0"><div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">Achievements</div><h2 className="text-xl md:text-2xl font-bold text-white">{streamingGame.name}</h2></div><button type="button" onClick={() => setShowGameAchievements(false)} className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"><Minimize2 className="w-4 h-4" /></button></div><div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-hide"><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">{gameAchievementItems.map((name, index) => <motion.div key={`achievement-${index}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} onClick={() => { setShowGameAchievements(false); setSelectedCard({ game: streamingGame.id, name, rarity: 'Legendary' }); }} className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"><div className="absolute inset-0 bg-gradient-to-br from-amber-600/40 to-orange-900/60 rounded-lg" /><div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,.4), transparent 70%)' }} /><div className="absolute inset-0 flex items-center justify-center p-2"><p className="text-[9px] font-bold text-center text-white group-hover:scale-105 transition-transform">{name}</p></div></motion.div>)}</div></div></div>
    </motion.div>
  );

  const renderOverlayContent = () => {
    if (activeTab === 'schedule') return <ScheduleSection isEditMode={isEditMode} scheduleData={scheduleData} onUpdateSchedule={(data) => updateEditLayout('schedule_data', data)} onClose={closeOverlay} />;
    if (activeTab === 'gallery') return <GallerySection isEditMode={isEditMode} galleryImages={galleryImages} onUpdateImages={(imgs) => updateEditLayout('gallery_images', imgs)} onClose={closeOverlay} />;
    if (activeTab === 'games') return <GamesSection isEditMode={isEditMode} pinnedGames={pinnedGames} onUpdateGames={(games) => updateEditLayout('pinned_games', games)} onClose={closeOverlay} />;
    return activeTab === 'cards' ? renderCardsOverlay() : null;
  };

  return (
    <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
      <SideAccessMenu />
      <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]">
        <div className="flex-1 relative h-full overflow-y-auto pl-6">
          <div className="w-full min-h-full pt-20 pb-24 px-4 md:px-8 relative">
            <div className="mx-auto max-w-none w-full flex flex-col gap-8">
              <ProfileInfoBar activeProfile={activeProfile} isEditMode={isEditMode} onEdit={enterEditMode} />
              {isEditMode && <EditModeToolbar onSave={saveEdit} onCancel={cancelEdit} saving={saving} />}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <StreamPlayerBox isLive={isLive} isPlaying={isPlaying} onPlayToggle={setIsPlaying} volume={volume} onVolumeChange={setVolume} />
                  <StreamChatBox />
                </div>
                <aside className="space-y-6">
                  <SponsorsSection sponsors={activeSponsors} isEditMode={isEditMode} onEdit={enterEditMode} />
                  <ProductsGrid />
                  <ViewerSeasonalPass />
                </aside>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={() => openTab('schedule')} className="p-4 bg-white/5 border border-white/10 hover:border-cyan-300/50 rounded-lg text-white hover:bg-white/10 transition-all">
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/60">Manage</div>
                  <div className="text-sm font-semibold">Schedule</div>
                </button>
                <button onClick={() => openTab('gallery')} className="p-4 bg-white/5 border border-white/10 hover:border-cyan-300/50 rounded-lg text-white hover:bg-white/10 transition-all">
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/60">View</div>
                  <div className="text-sm font-semibold">Gallery</div>
                </button>
                <button onClick={() => openTab('games')} className="p-4 bg-white/5 border border-white/10 hover:border-cyan-300/50 rounded-lg text-white hover:bg-white/10 transition-all">
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/60">Pin</div>
                  <div className="text-sm font-semibold">Games</div>
                </button>
                <button onClick={() => openTab('cards')} className="p-4 bg-white/5 border border-white/10 hover:border-cyan-300/50 rounded-lg text-white hover:bg-white/10 transition-all">
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/60">Collect</div>
                  <div className="text-sm font-semibold">Cards</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {activeTab && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            key="streaming-home-overlay"
            className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOverlay}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={`${activeTabLabel} overlay`}
              initial={activeTab === 'games' || activeTab === 'cards' ? { x: '-100%' } : { y: '100%' }}
              animate={{ x: 0, y: 0 }}
              exit={activeTab === 'games' || activeTab === 'cards' ? { x: '-100%' } : { y: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className={activeTab === 'games' || activeTab === 'cards' ? `absolute left-0 top-0 bottom-0 ${overlayFullscreen ? 'right-0' : 'w-[80vw]'} overflow-hidden border-r border-white/15 bg-slate-950/82 backdrop-blur-xl shadow-[24px_0_80px_rgba(0,0,0,0.55)] pointer-events-auto` : activeTab === 'gallery' ? `absolute left-0 bottom-0 ${overlayFullscreen ? 'right-0 h-screen' : 'right-0 h-[40vh] min-h-[300px] max-h-[560px]'} overflow-hidden border-t border-white/15 bg-slate-950/82 backdrop-blur-xl shadow-[0_-24px_80px_rgba(0,0,0,0.55)] pointer-events-auto` : `absolute left-0 bottom-0 ${overlayFullscreen ? 'right-0 h-screen' : 'w-[75vw] h-[40vh] min-h-[300px] max-h-[560px]'} overflow-hidden border-t border-white/15 bg-slate-950/82 backdrop-blur-xl shadow-[0_-24px_80px_rgba(0,0,0,0.55)] pointer-events-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full w-full p-5 md:p-7 flex flex-col overflow-hidden">
                {activeTab !== 'cards' && (
                  <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">Streamer Profile</div>
                      <h2 className="text-2xl font-bold text-white">{activeTabLabel}</h2>
                    </div>
                    <button type="button" onClick={() => setOverlayFullscreen((value) => !value)} className="w-9 h-9 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white">
                      {overlayFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                )}
                <div className="flex-1 min-h-0 overflow-hidden">
                  {renderOverlayContent()}
                </div>
              </div>
            </motion.section>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </GlassPageFrame>
  );
}
