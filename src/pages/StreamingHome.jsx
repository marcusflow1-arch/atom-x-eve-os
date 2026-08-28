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

  const { saving, isEditMode, activeProfile, activeLayout, activeSponsors, enterEditMode, cancelEdit, saveEdit, updateEditProfile, updateEditLayout, addEditSponsor, removeEditSponsor, updateEditSp } = useCreatorEditMode();
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
        <button type="button" onClick={() => setOverlayFullscreen((value) => !value)} className="h-8 w-8 shrink-0 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"><Maximize2 className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside className="w-1/5 shrink-0 pr-4 md:pr-5 pt-4 flex flex-col min-h-0">
          <div className="text-[9px] uppercase tracking-[0.24em] text-white/35 mb-2">Filter Games</div>
          <div className="relative"><select value={cardGenre} onChange={(event) => setCardGenre(event.target.value)} className="w-full h-9 appearance-none bg-white/[0.035] border border-white/10 rounded-lg px-3 text-sm text-white/90 focus:outline-none focus:border-cyan-300/50 cursor-pointer" /><Sparkles className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" /></div>
          <div className="my-4 h-px w-full bg-gradient-to-r from-white/20 via-cyan-300/30 to-transparent" />
          <div className="relative mb-3"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" /><input value={cardSearch} onChange={(event) => setCardSearch(event.target.value)} type="text" placeholder="Search..." className="w-full h-8 appearance-none bg-white/[0.035] border border-white/10 rounded-lg pl-7 pr-3 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-cyan-300/50" /></div>
          <div className="text-[9px] uppercase tracking-[0.24em] text-white/30 mb-2">Games</div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-hide space-y-1">{filteredGames.map((game) => <button key={game.id} type="button" onClick={() => setSelectedCardGame(game.id)} className={`w-full h-8 flex items-center gap-2 px-2 rounded-lg text-sm transition-all duration-200 ${selectedCardGame === game.id ? 'bg-cyan-600/30 border border-cyan-300/60 text-cyan-100' : 'bg-white/[0.035] border border-white/10 text-white/60 hover:text-white/90'}`}><div className={`w-3 h-3 rounded-full shrink-0 ${game.color}`} /><span className="truncate">{game.name}</span></button>)}</div>
        </aside>
        <div className="relative w-px self-center h-[62%] shrink-0 bg-gradient-to-b from-transparent via-cyan-200/50 to-transparent shadow-[0_0_18px_rgba(103,232,249,.18)]" />
        <section className="w-4/5 min-w-0 pl-5 md:pl-7 pt-4 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between gap-4 shrink-0 mb-3"><div className="min-w-0"><div className="flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-300/80" /><span className="text-[9px] uppercase tracking-[0.24em] text-white/35">{CARD_LIBRARY[selectedCardGame]?.length || 0} Cards</span></div><h4 className="text-sm font-semibold text-white/80 truncate">{CARD_GAMES.find((g) => g.id === selectedCardGame)?.name}</h4></div><div className="flex items-center gap-2 shrink-0"><select value={cardFilter} onChange={(event) => setCardFilter(event.target.value)} className="h-7 appearance-none bg-white/[0.035] border border-white/10 rounded px-2 text-xs text-white/80 focus:outline-none focus:border-cyan-300/50 cursor-pointer"><option value="All">All Rarities</option>{RARITIES.filter((r) => r !== 'All').map((r) => <option key={r} value={r}>{r}</option>)}</select></div></div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-hide"><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">{cardItems.map((name, index) => { const rarity = index % 5 === 0 ? 'Legendary' : index % 3 === 0 ? 'Epic' : index % 2 === 0 ? 'Rare' : 'Common'; const rarityStyle = RARITY_STYLES[rarity]; return (<motion.div key={`${selectedCardGame}-${index}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.02 }} onPointerMove={(e) => handleCardPointerMove(e, `${selectedCardGame}-${index}`)} onPointerLeave={handleCardPointerLeave} className="relative group cursor-pointer h-64 perspective" style={{ perspective: '1000px' }}><motion.div initial={{ rotateX: 0, rotateY: 0 }} animate={{ rotateX: hoveredCard === `${selectedCardGame}-${index}` ? cardTilt.x : 0, rotateY: hoveredCard === `${selectedCardGame}-${index}` ? cardTilt.y : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 40 }} className="w-full h-full" style={{ transformStyle: 'preserve-3d' }} onClick={() => setSelectedCard(`${selectedCardGame}-${index}`)}><div className="relative w-full h-full rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl" style={{ boxShadow: `0 0 30px ${rarityStyle.glow}, inset 0 1px 0 ${rarityStyle.edge}` }}><div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" /><div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center"><div className="mb-2"><Badge className="text-xs font-bold" style={{ backgroundColor: rarityStyle.accent, color: '#000' }}>{rarity}</Badge></div><h5 className="text-sm font-bold text-white mb-1">{name}</h5><p className="text-[9px] text-white/40">{selectedCardGame.replace('-', ' ').toUpperCase()}</p></div></div></motion.div></motion.div>); })}</div></div>
        </section>
      </div>
    </div>
  );

  const renderGameAchievementOverlay = () => (
    <motion.div initial={{ y: '-100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 30 }} className="absolute top-0 left-0 right-0 h-full w-full rounded-2xl overflow-hidden bg-gradient-to-br from-amber-600/20 via-orange-600/10 to-red-600/5 backdrop-blur-xl border border-white/10">
      <div className="h-full w-full p-4 md:p-5 flex flex-col overflow-hidden"><div className="flex items-center justify-between gap-4 shrink-0 pb-3 border-b border-white/10"><div className="min-w-0"><h3 className="text-lg md:text-xl font-bold text-white truncate">Game Achievements</h3></div><button type="button" onClick={() => setShowGameAchievements(false)} className="h-8 w-8 shrink-0 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"><Minimize2 className="w-4 h-4" /></button></div><div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-hide mt-3"><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{gameAchievementItems.map((name, index) => { const rarity = index % 5 === 0 ? 'Legendary' : index % 3 === 0 ? 'Epic' : index % 2 === 0 ? 'Rare' : 'Common'; const rarityStyle = RARITY_STYLES[rarity]; return (<div key={`achievement-${index}`} className="relative group h-48 rounded-lg overflow-hidden border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl flex flex-col items-center justify-center p-3 text-center transition-all duration-300 hover:border-white/30" style={{ boxShadow: `0 0 20px ${rarityStyle.glow}` }}><Badge className="mb-2 text-xs font-bold" style={{ backgroundColor: rarityStyle.accent, color: '#000' }}>{rarity}</Badge><h5 className="text-xs font-bold text-white">{name}</h5></div>); })}</div></div></div>
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
            {/* Main content */}
          </div>
        </div>
      </div>
      {activeTab && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            key="streaming-home-overlay"
            className="fixed inset-0 z-[99999] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={`${activeTabLabel} overlay`}
              className="absolute inset-0 pointer-events-auto flex items-center justify-center p-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={closeOverlay}
            >
              <div
                className="w-full h-full max-w-4xl max-h-[90vh] rounded-2xl bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {renderOverlayContent()}
              </div>
            </motion.section>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </GlassPageFrame>
  );
}
