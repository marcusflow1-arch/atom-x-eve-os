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
    <div className="h-full min-h-0 flex flex-col overflow-hidden rounded-none bg-white/[0.025] backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_90px_rgba(0,0,0,.48)]">
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 shrink-0 border-b border-white/10 bg-white/[0.025]">
        <div><div className="text-[9px] uppercase tracking-[0.3em] text-cyan-300/60">Collector Showcase</div><h3 className="text-lg md:text-xl font-bold text-white truncate">Achievement Cards</h3></div>
        <button type="button" onClick={() => setOverlayFullscreen((value) => !value)} className="h-8 w-8 shrink-0 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white" aria-label={overlayFullscreen ? 'Exit full screen' : 'Full screen'}>{overlayFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
      </div>
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside className="w-1/5 shrink-0 pr-4 md:pr-5 pt-4 flex flex-col min-h-0">
          <div className="text-[9px] uppercase tracking-[0.24em] text-white/35 mb-2">Filter Games</div>
          <div className="relative"><select value={cardGenre} onChange={(event) => setCardGenre(event.target.value)} className="w-full h-9 appearance-none bg-white/[0.035] border border-white/10 px-3 pr-8 text-[11px] font-semibold text-white/75 outline-none focus:border-cyan-300/40" aria-label="Filter games by genre">{GENRES.map((genre) => <option key={genre} value={genre} className="bg-slate-950 text-white">{genre}</option>)}</select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/35 text-[10px]">⌄</span></div>
          <div className="my-4 h-px w-full bg-gradient-to-r from-white/20 via-cyan-300/30 to-transparent" />
          <div className="relative mb-3"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" /><input value={cardSearch} onChange={(event) => setCardSearch(event.target.value)} placeholder="Search games" className="w-full h-8 pl-8 pr-2 bg-transparent border border-white/10 text-[10px] text-white placeholder:text-white/25 outline-none focus:border-cyan-300/35" /></div>
          <div className="text-[9px] uppercase tracking-[0.24em] text-white/30 mb-2">Games</div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-hide space-y-1">{filteredGames.map((game) => <button key={game.id} type="button" onClick={() => setSelectedCardGame(game.id)} className={`group w-full text-left flex items-center gap-2 p-2 border transition-all ${selectedCardGame === game.id ? 'border-cyan-300/45 bg-cyan-300/[0.07]' : 'border-transparent hover:border-white/10 hover:bg-white/[0.035]'}`}><div className="w-11 h-7 shrink-0 overflow-hidden border border-white/10 bg-slate-900"><img src={game.image} alt="" className="w-full h-full object-cover" /></div><div className="min-w-0"><div className="text-[10px] font-semibold text-white/80 truncate">{game.name}</div><div className="text-[8px] uppercase tracking-wider text-white/30 truncate">{game.genre}</div></div></button>)}</div>
        </aside>
        <div className="relative w-px self-center h-[62%] shrink-0 bg-gradient-to-b from-transparent via-cyan-200/50 to-transparent shadow-[0_0_18px_rgba(103,232,249,.18)]" />
        <section className="w-4/5 min-w-0 pl-5 md:pl-7 pt-4 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between gap-4 shrink-0 mb-3"><div className="min-w-0"><div className="flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-300/80" /><span className="text-sm font-bold text-white truncate">{CARD_GAMES.find((game) => game.id === selectedCardGame)?.name}</span></div><div className="text-[9px] uppercase tracking-[0.22em] text-white/30 mt-1">Collected achievements &amp; trading cards</div></div><div className="flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-hide">{RARITIES.map((rarity) => <button key={rarity} type="button" onClick={() => setCardFilter(rarity)} className={`px-2.5 py-1 text-[9px] font-semibold border whitespace-nowrap ${cardFilter === rarity ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 bg-white/[0.025] text-white/40 hover:text-white/70'}`}>{rarity}</button>)}</div></div>
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pr-2 pb-3 scrollbar-hide snap-x snap-mandatory"><div className="flex flex-nowrap items-stretch gap-5 min-w-max h-full">{cardItems.map((name, index) => { const rarity = index % 5 === 0 ? 'Legendary' : index % 3 === 0 ? 'Epic' : index % 2 === 0 ? 'Rare' : 'Common'; const style = RARITY_STYLES[rarity]; const key = `${selectedCardGame}-${name}`; const hovered = hoveredCard === key; return <button key={key} type="button" onClick={() => setSelectedCard({ name, id: key, game: selectedCardGame, rarity })} onMouseMove={(event) => handleCardPointerMove(event, key)} onMouseLeave={handleCardPointerLeave} className="relative w-[150px] md:w-[175px] lg:w-[190px] h-[230px] md:h-[255px] shrink-0 snap-start text-left outline-none" style={{ perspective: '1100px' }}><motion.div animate={{ rotateX: hovered ? cardTilt.x : 0, rotateY: hovered ? cardTilt.y : 0, y: hovered ? -7 : 0, scale: hovered ? 1.035 : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} className="absolute inset-0 overflow-hidden border bg-slate-950/90 shadow-[0_18px_42px_rgba(0,0,0,.42)]" style={{ borderColor: hovered ? style.edge : 'rgba(255,255,255,.14)', boxShadow: hovered ? `0 18px 46px ${style.glow}, 0 0 32px ${style.glow}, inset 0 0 22px ${style.glow}` : `0 0 18px ${style.glow}` }}><div className="absolute -inset-8 opacity-90" style={{ background: `radial-gradient(circle at 72% 20%, ${style.glow}, transparent 36%), linear-gradient(145deg, rgba(255,255,255,.09), transparent 28%, rgba(124,58,237,.12) 75%, rgba(15,23,42,.95))` }} /><div className="absolute inset-[3px] border border-white/[0.07] pointer-events-none" /><div className="absolute inset-x-0 top-0 h-[55%] overflow-hidden"><img src={CARD_GAMES.find((game) => game.id === selectedCardGame)?.image} alt="" className="w-full h-full object-cover opacity-75 mix-blend-screen" /><div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/10 to-slate-950" /></div><div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2"><span className="px-1.5 py-0.5 text-[7px] uppercase tracking-[0.16em] font-bold border bg-black/45" style={{ color: style.accent, borderColor: style.edge }}>{rarity}</span><Sparkles className="w-3.5 h-3.5" style={{ color: style.accent }} /></div><div className="absolute left-3 right-3 bottom-3"><div className="text-[8px] uppercase tracking-[0.18em] text-white/35 mb-1">{CARD_GAMES.find((game) => game.id === selectedCardGame)?.name}</div><div className="text-sm font-extrabold text-white leading-tight">{name}</div><div className="mt-2 h-px bg-gradient-to-r from-white/30 via-white/10 to-transparent" /><div className="text-[8px] uppercase tracking-wider text-white/30 mt-2">Collectible achievement</div></div>{hovered && <motion.div initial={{ x: '-120%', opacity: 0 }} animate={{ x: '120%', opacity: [0, .7, 0] }} transition={{ duration: .9, ease: 'easeInOut' }} className="absolute top-0 bottom-0 w-8 -skew-x-12 bg-gradient-to-r from-transparent via-white/85 to-transparent blur-[2px] pointer-events-none" />}</motion.div></button>; })}</div></div>
        </section>
      </div>
    </div>
  );

  const renderGameAchievementOverlay = () => (
    <motion.div initial={{ y: '-100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 30 }} className="absolute left-0 right-0 top-0 z-50 h-[62%] min-h-[260px] overflow-hidden border-b border-cyan-300/20 bg-slate-950/88 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.6)]" role="dialog" aria-label={`${streamingGame.name} game achievements and cards`}>
      <div className="h-full w-full p-4 md:p-5 flex flex-col overflow-hidden"><div className="flex items-center justify-between gap-4 shrink-0 pb-3 border-b border-white/10"><div className="min-w-0"><div className="text-[9px] uppercase tracking-[0.28em] text-cyan-300/60">Game Achievements</div><h3 className="text-lg md:text-xl font-bold text-white truncate">{streamingGame.name} — Cards</h3></div><button type="button" onClick={() => setShowGameAchievements(false)} className="text-[11px] font-semibold text-white/50 hover:text-cyan-200 underline underline-offset-4 whitespace-nowrap">Close Achievements</button></div><div className="flex items-center gap-3 py-3 shrink-0 overflow-x-auto scrollbar-hide">{gameAchievementItems.map((name, index) => <button key={name} type="button" onClick={() => setSelectedCard({ name, id: `${streamingGame.id}-achievement-${index}` })} className="relative w-32 md:w-40 h-20 shrink-0 overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950/70 hover:border-cyan-300/60 hover:-translate-y-0.5 transition-all text-left"><div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(103,232,249,0.2),transparent_35%),linear-gradient(145deg,transparent,rgba(124,58,237,0.18))]" /><div className="absolute top-2 left-2"><Badge className="bg-black/40 border-white/10 text-[8px] h-4 px-1">{index % 4 === 0 ? 'Rare' : 'Common'}</Badge></div><div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/95 to-transparent"><div className="text-[10px] font-bold text-white leading-tight">{name}</div><div className="text-[8px] uppercase tracking-wider text-cyan-200/50 mt-1">Collectible</div></div></button>)}</div><div className="flex-1 min-h-0 overflow-y-auto pr-1"><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">{gameAchievementItems.map((name, index) => <button key={`${name}-detail`} type="button" onClick={() => setSelectedCard({ name, id: `${streamingGame.id}-detail-${index}` })} className="group relative aspect-[3/4] overflow-hidden border border-white/10 bg-white/[0.03] hover:border-cyan-300/50 transition-all text-left"><div className="absolute inset-0 bg-gradient-to-br from-cyan-950/70 via-slate-900 to-purple-950/70" /><Sparkles className="absolute top-3 right-3 w-4 h-4 text-cyan-300/70" /><div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 to-transparent"><div className="text-xs font-bold text-white">{name}</div><div className="text-[8px] uppercase tracking-wider text-white/40 mt-1">Game Achievement</div></div></button>)}</div></div></div>
    </motion.div>
  );

  const renderOverlayContent = () => {
    if (activeTab === 'schedule') return <ScheduleSection isEditMode={isEditMode} scheduleData={scheduleData} onUpdateSchedule={(data) => updateEditLayout('schedule_data', data)} onClose={closeOverlay} />;
    if (activeTab === 'gallery') return <GallerySection isEditMode={isEditMode} galleryImages={galleryImages} onUpdateImages={(imgs) => updateEditLayout('gallery_images', imgs)} onClose={closeOverlay} />;
    if (activeTab === 'games') return <GamesSection isEditMode={isEditMode} pinnedGames={pinnedGames} onUpdateGames={(games) => updateEditLayout('pinned_games', games)} onClose={closeOverlay} />;
    return activeTab === 'cards' ? renderCardsOverlay() : null;
  };

  return <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
    <SideAccessMenu />
    <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]"><div className="flex-1 relative h-full overflow-y-auto pl-6"><div className="w-full min-h-full pt-20 pb-24 px-4 md:px-8 relative"><div className="mx-auto max-w-none w-full flex flex-col gap-8 relative z-20"><div className="grid grid-cols-12 gap-4 h-[420px] md:h-[480px] lg:h-[520px]"><div className="col-span-12 lg:col-span-9 xl:col-span-10 flex flex-col min-h-0"><div className="h-14 shrink-0 flex items-center gap-3 px-1 md:px-2"><div className="w-12 h-12 shrink-0 overflow-hidden border border-white/15 bg-slate-900/70 shadow-lg"><img src={streamingGame.image} alt={`${streamingGame.name} game`} className="w-full h-full object-cover" /></div><div className="min-w-0 flex items-center gap-4"><div className="min-w-0"><div className="text-[9px] uppercase tracking-[0.25em] text-white/35">Now Streaming</div><div className="text-base md:text-lg font-bold text-white truncate">{streamingGame.name}</div></div><button type="button" onClick={() => setShowGameAchievements((value) => !value)} className="text-sm md:text-base font-semibold underline underline-offset-4 decoration-cyan-300/60 text-white hover:text-cyan-200 whitespace-nowrap">Game Achievements, Cards</button></div></div><div className="relative flex-1 min-h-0"><StreamPlayerBox isLive={isLive} onToggleLive={() => setIsLive(!isLive)} isPlaying={isPlaying} onTogglePlay={() => setIsPlaying(!isPlaying)} volume={volume} onVolumeChange={setVolume} /><AnimatePresence>{showGameAchievements && renderGameAchievementOverlay()}</AnimatePresence></div></div><div className="col-span-12 lg:col-span-3 xl:col-span-2 order-first lg:order-none h-full"><StreamChatBox isLive={isLive} /></div></div><ProfileInfoBar activeProfile={activeProfile || { display_name: user?.full_name || user?.username || 'My Channel' }} isEditMode={isEditMode} isLive={isLive} updateEditProfile={updateEditProfile} activeTab={activeTab} setActiveTab={openTab} onEnterEdit={enterEditMode} /><div className="w-full h-px bg-white/10 mb-8" /><section><div className="mb-4"><h3 className="text-xl font-bold text-white">Sponsors</h3><p className="text-xs text-white/40">Official channel sponsors and partnerships</p></div>{isEditMode ? <SponsorEditor isEditMode sponsors={activeSponsors} onAdd={addEditSponsor} onRemove={removeEditSponsor} onUpdate={updateEditSponsor} /> : activeSponsors.length ? <SponsorEditor isEditMode={false} sponsors={activeSponsors} onAdd={() => {}} onRemove={() => {}} onUpdate={() => {}} /> : <SponsorsSection />}</section><section className="mt-10"><div className="mb-4"><h3 className="text-xl font-bold text-white">Products</h3><p className="text-xs text-white/40">Products and items available from this channel</p></div><ProductsGrid /></section><div className="mt-12 mb-20"><h3 className="text-xl font-bold text-white mb-6">Your Channel Season Pass</h3><ViewerSeasonalPass currentTier={12} maxTier={20} /></div><AnimatePresence>{selectedCard && <StreamerCardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />}</AnimatePresence></div></div></div><EditModeToolbar isEditMode={isEditMode} saving={saving} onSave={saveEdit} onCancel={cancelEdit} onEnterEdit={enterEditMode} /></div>
    {activeTab && typeof document !== 'undefined' && createPortal(<AnimatePresence><motion.div key="streaming-home-overlay" className="fixed inset-0 z-[99999] pointer-events-none"><motion.section role="dialog" aria-modal="true" aria-label={`${activeTabLabel} overlay`} initial={activeTab === 'games' || activeTab === 'cards' ? { x: '-100%' } : { y: '100%' }} animate={{ x: 0, y: 0 }} exit={activeTab === 'games' || activeTab === 'cards' ? { x: '-100%' } : { y: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }} className={activeTab === 'games' || activeTab === 'cards' ? `absolute left-0 top-0 bottom-0 ${overlayFullscreen ? 'right-0' : 'w-[80vw]'} overflow-hidden border-r border-white/15 bg-slate-950/82 backdrop-blur-xl shadow-[24px_0_80px_rgba(0,0,0,0.55)] pointer-events-auto` : `absolute left-0 bottom-0 ${overlayFullscreen ? 'right-0 h-screen' : 'w-[75vw] h-[40vh] min-h-[300px] max-h-[560px]'} overflow-hidden border-t border-white/15 bg-slate-950/82 backdrop-blur-xl shadow-[0_-24px_80px_rgba(0,0,0,0.55)] pointer-events-auto`}><div className="h-full w-full p-5 md:p-7 flex flex-col overflow-hidden">{activeTab !== 'cards' && <div className="flex items-center justify-between gap-4 mb-4 shrink-0"><div><div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">Streamer Profile</div><h2 className="text-2xl font-bold text-white">{activeTabLabel}</h2></div><button type="button" onClick={() => setOverlayFullscreen((value) => !value)} className="w-9 h-9 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white">{overlayFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button></div>}<div className="flex-1 min-h-0 overflow-hidden">{renderOverlayContent()}</div></div></motion.section></motion.div></AnimatePresence>, document.body)}
  </GlassPageFrame>;
}
