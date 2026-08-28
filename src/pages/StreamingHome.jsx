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
  const [showGameAchievements, setShowGameAchievements] = useState(false);

  const { saving, isEditMode, activeProfile, activeLayout, activeSponsors, enterEditMode, cancelEdit, saveEdit, updateEditProfile, updateEditLayout, addEditSponsor, removeEditSponsor, updateEditSponsor } = useCreatorEditMode(user?.id);
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
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeTab, showGameAchievements]);

  useEffect(() => setOverlayFullscreen(false), [activeTab]);

  const activeTabLabel = activeTab ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : '';
  const cardItems = useMemo(() => {
    const names = CARD_LIBRARY[selectedCardGame] || [];
    if (cardFilter === 'All') return names;
    if (cardFilter === 'Rare') return names.filter((name) => name.length % 2 === 0);
    return names.filter((name) => name.length % 2 === 1);
  }, [selectedCardGame, cardFilter]);

  const gameAchievementItems = CARD_LIBRARY[streamingGame.id] || [];

  const closeOverlay = () => {
    setActiveTab(null);
    setOverlayFullscreen(false);
  };

  const openTab = (tab) => {
    setActiveTab(activeTab === tab ? null : tab);
    setOverlayFullscreen(false);
  };

  const renderCardsOverlay = () => (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10 shrink-0">
        <div><div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">Collectibles</div><h3 className="text-lg md:text-xl font-bold text-white">Achievement Cards</h3></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setOverlayFullscreen((value) => !value)} className="h-8 w-8 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white" aria-label={overlayFullscreen ? 'Exit full screen' : 'Full screen'}>{overlayFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
        </div>
      </div>
      <div className="flex items-center gap-2 py-3 shrink-0 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] uppercase tracking-widest text-white/35 mr-1">Filter</span>
        {['All', 'Rare', 'Legendary'].map((filter) => <button key={filter} type="button" onClick={() => setCardFilter(filter)} className={`px-3 py-1.5 text-[11px] font-semibold border transition-colors whitespace-nowrap ${cardFilter === filter ? 'bg-white text-black border-white' : 'bg-white/5 text-white/55 border-white/10 hover:bg-white/10'}`}>{filter}</button>)}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 shrink-0 scrollbar-hide">
        {CARD_GAMES.map((game) => <button key={game.id} type="button" onClick={() => setSelectedCardGame(game.id)} className={`relative w-44 md:w-52 shrink-0 h-16 text-left overflow-hidden border transition-all ${selectedCardGame === game.id ? 'border-cyan-300/70 bg-white/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'}`}><div className={`absolute inset-0 bg-gradient-to-br ${game.color}`} /><div className="relative z-10 h-full p-3 flex flex-col justify-center"><span className="text-sm font-bold text-white truncate">{game.name}</span><span className="text-[10px] uppercase tracking-widest text-white/45">{game.genre}</span></div></button>)}
      </div>
      <div className="flex items-center justify-between pb-2 shrink-0"><div className="flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-300" /><span className="text-sm font-semibold text-white">{CARD_GAMES.find((game) => game.id === selectedCardGame)?.name}</span></div><span className="text-[10px] uppercase tracking-widest text-white/35">{cardItems.length} collectibles</span></div>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1"><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">{cardItems.map((name, index) => { const rarity = index % 5 === 0 ? 'Legendary' : index % 2 === 0 ? 'Rare' : 'Common'; return <button key={name} type="button" onClick={() => setSelectedCard({ name, id: `${selectedCardGame}-${index}` })} className="group relative aspect-[3/4] overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950/70 hover:border-cyan-300/50 hover:-translate-y-1 transition-all text-left"><div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_70%_25%,rgba(103,232,249,0.25),transparent_35%),linear-gradient(145deg,transparent,rgba(124,58,237,0.2))]" /><div className="absolute top-2 left-2 right-2 flex justify-between items-center"><Badge className="bg-black/40 border-white/10 text-[8px] h-4 px-1">{rarity}</Badge><Sparkles className="w-3 h-3 text-cyan-300/70" /></div><div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent"><div className="text-[11px] font-bold text-white leading-tight">{name}</div><div className="text-[8px] uppercase tracking-wider text-white/40 mt-1">Achievement</div></div></button>; })}</div></div>
    </div>
  );

  const renderGameAchievementOverlay = () => (
    <motion.div
      initial={{ y: '-100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '-100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="absolute left-0 right-0 top-0 z-50 h-[62%] min-h-[260px] overflow-hidden border-b border-cyan-300/20 bg-slate-950/88 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.6)]"
      role="dialog"
      aria-label={`${streamingGame.name} game achievements and cards`}
    >
      <div className="h-full w-full p-4 md:p-5 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 shrink-0 pb-3 border-b border-white/10">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.28em] text-cyan-300/60">Game Achievements</div>
            <h3 className="text-lg md:text-xl font-bold text-white truncate">{streamingGame.name} — Cards</h3>
          </div>
          <button type="button" onClick={() => setShowGameAchievements(false)} className="text-[11px] font-semibold text-white/50 hover:text-cyan-200 underline underline-offset-4 whitespace-nowrap">Close Achievements</button>
        </div>
        <div className="flex items-center gap-3 py-3 shrink-0 overflow-x-auto scrollbar-hide">
          {gameAchievementItems.map((name, index) => (
            <button key={name} type="button" onClick={() => setSelectedCard({ name, id: `${streamingGame.id}-achievement-${index}` })} className="relative w-32 md:w-40 h-20 shrink-0 overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950/70 hover:border-cyan-300/60 hover:-translate-y-0.5 transition-all text-left">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(103,232,249,0.2),transparent_35%),linear-gradient(145deg,transparent,rgba(124,58,237,0.18))]" />
              <div className="absolute top-2 left-2"><Badge className="bg-black/40 border-white/10 text-[8px] h-4 px-1">{index % 4 === 0 ? 'Rare' : 'Common'}</Badge></div>
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/95 to-transparent"><div className="text-[10px] font-bold text-white leading-tight">{name}</div><div className="text-[8px] uppercase tracking-wider text-cyan-200/50 mt-1">Collectible</div></div>
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {gameAchievementItems.map((name, index) => (
              <button key={`${name}-detail`} type="button" onClick={() => setSelectedCard({ name, id: `${streamingGame.id}-detail-${index}` })} className="group relative aspect-[3/4] overflow-hidden border border-white/10 bg-white/[0.03] hover:border-cyan-300/50 transition-all text-left">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/70 via-slate-900 to-purple-950/70" />
                <Sparkles className="absolute top-3 right-3 w-4 h-4 text-cyan-300/70" />
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 to-transparent"><div className="text-xs font-bold text-white">{name}</div><div className="text-[8px] uppercase tracking-wider text-white/40 mt-1">Game Achievement</div></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderOverlayContent = () => {
    if (activeTab === 'schedule') return <ScheduleSection isEditMode={isEditMode} scheduleData={scheduleData} onUpdateSchedule={(data) => updateEditLayout('schedule_data', data)} onClose={closeOverlay} />;
    if (activeTab === 'gallery') return <GallerySection isEditMode={isEditMode} galleryImages={galleryImages} onUpdateImages={(imgs) => updateEditLayout('gallery_images', imgs)} onClose={closeOverlay} />;
    if (activeTab === 'games') return <GamesSection isEditMode={isEditMode} pinnedGames={pinnedGames} onUpdateGames={(games) => updateEditLayout('pinned_games', games)} onClose={closeOverlay} />;
    if (activeTab === 'cards') return renderCardsOverlay();
    return null;
  };

  return (
    <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
      <SideAccessMenu />
      <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]">
        <div className="flex-1 relative h-full overflow-y-auto pl-6">
          <div className="w-full min-h-full pt-20 pb-24 px-4 md:px-8 relative">
            <AnimatePresence>{isEditMode && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none z-10" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />}</AnimatePresence>
            <div className="mx-auto max-w-none w-full flex flex-col gap-8 relative z-20">
              <div className="grid grid-cols-12 gap-4 h-[420px] md:h-[480px] lg:h-[520px]">
                <div className="col-span-12 lg:col-span-9 xl:col-span-10 flex flex-col min-h-0">
                  <div className="h-14 shrink-0 flex items-center gap-3 px-1 md:px-2">
                    <div className="w-12 h-12 shrink-0 overflow-hidden border border-white/15 bg-slate-900/70 shadow-lg">
                      <img src={streamingGame.image} alt={`${streamingGame.name} game`} className="w-full h-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                    </div>
                    <div className="min-w-0 flex items-center gap-4">
                      <div className="min-w-0">
                        <div className="text-[9px] uppercase tracking-[0.25em] text-white/35">Now Streaming</div>
                        <div className="text-base md:text-lg font-bold text-white truncate">{streamingGame.name}</div>
                      </div>
                      <button type="button" onClick={() => setShowGameAchievements((value) => !value)} aria-expanded={showGameAchievements} className={`text-sm md:text-base font-semibold underline underline-offset-4 decoration-cyan-300/60 transition-colors whitespace-nowrap ${showGameAchievements ? 'text-cyan-200' : 'text-white hover:text-cyan-200'}`}>Game Achievements, Cards</button>
                    </div>
                  </div>
                  <div className={`relative flex-1 min-h-0 transition-all ${isEditMode ? 'ring-1 ring-cyan-500/20 rounded-xl' : ''}`}>
                    <StreamPlayerBox isLive={isLive} onToggleLive={() => setIsLive(!isLive)} isPlaying={isPlaying} onTogglePlay={() => setIsPlaying(!isPlaying)} volume={volume} onVolumeChange={setVolume} />
                    <AnimatePresence>{showGameAchievements && renderGameAchievementOverlay()}</AnimatePresence>
                  </div>
                </div>
                <div className={`col-span-12 lg:col-span-3 xl:col-span-2 order-first lg:order-none h-full transition-all ${isEditMode ? 'ring-1 ring-cyan-500/20 rounded-xl' : ''}`}><StreamChatBox isLive={isLive} /></div>
              </div>
              <div className="flex flex-col">
                <ProfileInfoBar activeProfile={activeProfile || { display_name: user?.full_name || user?.username || 'My Channel' }} isEditMode={isEditMode} isLive={isLive} updateEditProfile={updateEditProfile} activeTab={activeTab} setActiveTab={openTab} onEnterEdit={enterEditMode} />
                <div className="w-full h-px bg-white/10 mb-8" />
                <section className="w-full"><div className="mb-4"><h3 className="text-xl font-bold text-white">Sponsors</h3><p className="text-xs text-white/40">Official channel sponsors and partnerships</p></div>{isEditMode ? <SponsorEditor isEditMode={isEditMode} sponsors={activeSponsors} onAdd={addEditSponsor} onRemove={removeEditSponsor} onUpdate={updateEditSponsor} /> : activeSponsors.length > 0 ? <SponsorEditor isEditMode={false} sponsors={activeSponsors} onAdd={() => {}} onRemove={() => {}} onUpdate={() => {}} /> : <SponsorsSection />}</section>
                <section className="w-full mt-10"><div className="mb-4"><h3 className="text-xl font-bold text-white">Products</h3><p className="text-xs text-white/40">Products and items available from this channel</p></div><ProductsGrid /></section>
                <div className="w-full mt-12 mb-20"><h3 className="text-xl font-bold text-white mb-6">Your Channel Season Pass</h3><ViewerSeasonalPass currentTier={12} maxTier={20} /></div>
              </div>
              <AnimatePresence>{selectedCard && <StreamerCardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />}</AnimatePresence>
            </div>
          </div>
        </div>
        <EditModeToolbar isEditMode={isEditMode} saving={saving} onSave={saveEdit} onCancel={cancelEdit} onEnterEdit={enterEditMode} />
      </div>

      {activeTab && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            key="streaming-home-overlay"
            className="fixed inset-0 z-[99999] pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={`${activeTabLabel} overlay`}
              initial={activeTab === 'games' ? { x: '-100%' } : { y: '100%' }}
              animate={{ x: 0, y: 0 }}
              exit={activeTab === 'games' ? { x: '-100%' } : { y: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className={
                activeTab === 'games'
                  ? `absolute left-0 top-0 bottom-0 ${overlayFullscreen ? 'right-0' : 'w-[75vw]'} overflow-hidden border-r border-white/15 bg-slate-950/82 backdrop-blur-xl shadow-[24px_0_80px_rgba(0,0,0,0.55)] pointer-events-auto`
                  : `absolute left-0 bottom-0 ${overlayFullscreen ? 'right-0 h-screen' : 'w-[75vw] h-[40vh] min-h-[300px] max-h-[560px]'} overflow-hidden border-t border-white/15 bg-slate-950/82 backdrop-blur-xl shadow-[0_-24px_80px_rgba(0,0,0,0.55)] pointer-events-auto`
              }
            >
              <div className="h-full w-full p-5 md:p-7 flex flex-col overflow-hidden">
                {activeTab !== 'cards' && (
                  <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">Streamer Profile</div>
                      <h2 className="text-2xl font-bold text-white">{activeTabLabel}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOverlayFullscreen((value) => !value)}
                      className="w-9 h-9 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                      aria-label={overlayFullscreen ? 'Exit full screen' : 'Full screen'}
                    >
                      {overlayFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                )}
                <div className="flex-1 min-h-0 overflow-hidden">{renderOverlayContent()}</div>
              </div>
            </motion.section>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </GlassPageFrame>
  );
}
