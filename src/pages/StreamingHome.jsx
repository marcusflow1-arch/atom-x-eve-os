import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import ChannelProfilePage from '@/components/streaming/hub/ChannelProfilePage';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2, Sparkles, X } from 'lucide-react';

import { useAuth } from '@/components/auth/AuthContext';
import useCreatorEditMode from '@/components/streaming/hooks/useCreatorEditMode';
import EditModeToolbar from '@/components/streaming/creator/EditModeToolbar';
import ProfileInfoBar from '@/components/streaming/creator/ProfileInfoBar';
import ScheduleSection from '@/components/streaming/creator/ScheduleSection';
import GallerySection from '@/components/streaming/creator/GallerySection';
import GamesSection from '@/components/streaming/creator/GamesSection';
import AchievementsOverlay from '@/components/streaming/achievements/AchievementsOverlay';
import SponsorEditor from '@/components/streaming/creator/SponsorEditor';
import SponsorsSection from '@/components/streaming/profile/SponsorsSection';
import ProductsGrid from '@/components/streaming/profile/ProductsGrid';
import ViewerSeasonalPass from '@/components/streaming/ViewerSeasonalPass';
import PlayerAchievementCollection from '@/components/streaming/collection/PlayerAchievementCollection';
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

const ACHIEVEMENT_TYPES = ['All', 'Abilities', 'Equipment', 'Companion'];
const RARITY_STYLES = {
  Common: { glow: 'rgba(148,163,184,.22)', edge: 'rgba(226,232,240,.38)', accent: '#cbd5e1' },
  Rare: { glow: 'rgba(59,130,246,.34)', edge: 'rgba(96,165,250,.72)', accent: '#93c5fd' },
  Epic: { glow: 'rgba(168,85,247,.38)', edge: 'rgba(216,180,254,.76)', accent: '#d8b4fe' },
  Legendary: { glow: 'rgba(245,158,11,.42)', edge: 'rgba(253,186,116,.86)', accent: '#fdba74' },
};

export default function StreamingHome() {
  const [params] = useSearchParams();
  const streamerId = params.get('streamerId');
  return streamerId ? <ChannelProfilePage key={streamerId} streamerId={streamerId} streamId={params.get('streamId')} source={params.get('source')} /> : <OwnChannelHome />;
}

function OwnChannelHome() {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const galleryAnchorRef = useRef(null);
  const [activeTab, setActiveTab] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();
  const [overlayFullscreen, setOverlayFullscreen] = useState(false);
  const [achievementType, setAchievementType] = useState('All');
  const [showGameAchievements, setShowGameAchievements] = useState(false);
  const [hoveredAchievement, setHoveredAchievement] = useState(null);
  const [achievementTilt, setAchievementTilt] = useState({ x: 0, y: 0 });

  const { saving, isEditMode, activeProfile, activeLayout, activeSponsors, enterEditMode, cancelEdit, saveEdit, updateEditProfile, updateEditLayout, addEditSponsor, removeEditSponsor, updateEditSponsor } = useCreatorEditMode(user?.id);
  const scheduleData = activeLayout?.schedule_data || {};
  const galleryImages = activeLayout?.gallery_images || [];
  const pinnedGames = activeLayout?.pinned_games || [];
  const streamingGame = CARD_GAMES.find((game) => game.id === (activeLayout?.current_game_id || activeProfile?.current_game_id)) || CARD_GAMES[0];

  useEffect(() => {
    if (!activeTab && !showGameAchievements) return;
    const handleEscape = (event) => {
      if (event.key === 'Escape' && activeTab !== 'gallery') {
        setActiveTab(null);
        setOverlayFullscreen(false);
        setShowGameAchievements(false);
        setHoveredAchievement(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeTab, showGameAchievements]);

  useEffect(() => setOverlayFullscreen(false), [activeTab]);

  const activeTabLabel = activeTab ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : '';
  const gameAchievementItems = CARD_LIBRARY[streamingGame.id] || [];
  const filteredAchievementItems = useMemo(() => gameAchievementItems.filter((name, index) => {
    const type = ['Abilities', 'Equipment', 'Companion'][index % 3];
    return achievementType === 'All' || achievementType === type;
  }), [gameAchievementItems, achievementType]);

  const closeOverlay = () => { setActiveTab(null); setOverlayFullscreen(false); };
  const openTab = (tab) => { setActiveTab(activeTab === tab ? null : tab); setOverlayFullscreen(false); };
  const handleAchievementPointerMove = (event, cardKey) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setHoveredAchievement(cardKey);
    setAchievementTilt({ x: (0.5 - py) * 10, y: (px - 0.5) * 13 });
  };
  const handleAchievementPointerLeave = () => { setHoveredAchievement(null); setAchievementTilt({ x: 0, y: 0 }); };
  const getAchievementMeta = (name, index, gameId = streamingGame.id) => {
    const rarity = index % 5 === 0 ? 'Legendary' : index % 3 === 0 ? 'Epic' : index % 2 === 0 ? 'Rare' : 'Common';
    const type = ['Abilities', 'Equipment', 'Companion'][index % 3];
    const game = CARD_GAMES.find((item) => item.id === gameId) || streamingGame;
    return { name, rarity, type, game, id: `${gameId}-achievement-${name}-${index}` };
  };

  const renderAchievementCardFace = (meta) => {
    const style = RARITY_STYLES[meta.rarity];
    const hovered = hoveredAchievement === meta.id;
    return (
      <div className="relative w-[140px] aspect-[3/4] shrink-0" style={{ perspective: '1100px' }}>
        <motion.div
          animate={{ rotateX: hovered ? achievementTilt.x : 0, rotateY: hovered ? achievementTilt.y : 0, y: hovered ? -6 : 0, scale: hovered ? 1.035 : 1 }}
          transition={{ type: 'spring', stiffness: 250, damping: 23 }}
          className="absolute inset-0 overflow-hidden border bg-slate-950/90 shadow-[0_18px_42px_rgba(0,0,0,.42)]"
          style={{ borderColor: hovered ? style.edge : 'rgba(255,255,255,.14)', boxShadow: hovered ? `0 18px 46px ${style.glow}, 0 0 32px ${style.glow}, inset 0 0 22px ${style.glow}` : `0 0 18px ${style.glow}` }}
        >
          <div className="absolute -inset-8 opacity-90" style={{ background: `radial-gradient(circle at 72% 20%, ${style.glow}, transparent 36%), linear-gradient(145deg, rgba(255,255,255,.09), transparent 28%, rgba(124,58,237,.12) 75%, rgba(15,23,42,.95))` }} />
          <div className="absolute inset-[3px] border border-white/[0.07] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[55%] overflow-hidden">
            <img src={meta.game.image} alt="" className="w-full h-full object-cover opacity-75 mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/10 to-slate-950" />
          </div>
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            <span className="px-1.5 py-0.5 text-[7px] uppercase tracking-[0.16em] font-bold border bg-black/45" style={{ color: style.accent, borderColor: style.edge }}>{meta.rarity}</span>
            <Sparkles className="w-3 h-3" style={{ color: style.accent }} />
          </div>
          <div className="absolute left-2.5 right-2.5 bottom-2.5">
            <div className="text-[7px] uppercase tracking-[0.18em] text-white/35 mb-0.5 truncate">{meta.game.name}</div>
            <div className="text-[13px] font-extrabold text-white leading-tight truncate">{meta.name}</div>
            <div className="mt-1.5 h-px bg-gradient-to-r from-white/30 via-white/10 to-transparent" />
            <div className="text-[7px] uppercase tracking-wider text-white/30 mt-1">Collectible achievement</div>
          </div>
          {hovered && <motion.div initial={{ x: '-120%', opacity: 0 }} animate={{ x: '120%', opacity: [0, .7, 0] }} transition={{ duration: .9, ease: 'easeInOut' }} className="absolute top-0 bottom-0 w-8 -skew-x-12 bg-gradient-to-r from-transparent via-white/85 to-transparent blur-[2px] pointer-events-none" />}
        </motion.div>
      </div>
    );
  };

  const renderGameAchievementOverlay = () => (
    <motion.div
      initial={{ y: '-100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '-100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      role="dialog"
      aria-label={`${streamingGame.name} game achievement cards`}
      className="absolute left-0 top-0 z-50 flex h-1/2 w-1/4 flex-col overflow-hidden border border-blue-300/25 bg-slate-950/70 shadow-[0_24px_80px_rgba(0,0,0,.55)] backdrop-blur-xl"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 px-8 pt-3">
        {ACHIEVEMENT_TYPES.map((type) => (
          <button key={type} type="button" onClick={() => setAchievementType(type)} className={`relative shrink-0 pb-1.5 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap transition-colors ${achievementType === type ? 'text-white' : 'text-white/40 hover:text-white/75'}`}>
            {type}
            <span className={`absolute left-0 right-0 bottom-0 h-px bg-cyan-200 transition-opacity ${achievementType === type ? 'opacity-100 shadow-[0_0_10px_rgba(165,243,252,.7)]' : 'opacity-0'}`} />
          </button>
        ))}
        <button type="button" onClick={() => setShowGameAchievements(false)} className="absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/55 hover:text-white" aria-label="Close achievement cards"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="flex shrink-0 justify-center py-2.5">
        <div className="h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
      </div>
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden scrollbar-hide px-4 pb-3">
        <div className="h-full min-w-max flex items-center gap-5 pr-2">
          {filteredAchievementItems.map((name, index) => {
            const meta = getAchievementMeta(name, index);
            return (
              <button key={meta.id} type="button" onMouseMove={(event) => handleAchievementPointerMove(event, meta.id)} onMouseLeave={handleAchievementPointerLeave} className="h-full text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60">
                {renderAchievementCardFace(meta)}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  const renderOverlayContent = () => {
    if (activeTab === 'schedule') return <ScheduleSection isEditMode={isEditMode} scheduleData={scheduleData} onUpdateSchedule={(data) => updateEditLayout('schedule_data', data)} onClose={closeOverlay} />;
    if (activeTab === 'games') return <GamesSection isEditMode={isEditMode} pinnedGames={pinnedGames} onUpdateGames={(games) => updateEditLayout('pinned_games', games)} onClose={closeOverlay} />;
    if (activeTab === 'achievements') return <AchievementsOverlay onClose={closeOverlay} />;
    return null;
  };

  return <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
    <SideAccessMenu />
    <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]"><div className="flex-1 relative h-full overflow-y-auto pl-6"><div className="w-full min-h-full pt-20 pb-24 px-4 md:px-8 relative"><div className="mx-auto max-w-none w-full flex flex-col gap-8 relative z-20"><div className="grid grid-cols-12 gap-4 h-[420px] md:h-[480px] lg:h-[520px]"><div className="col-span-12 lg:col-span-9 xl:col-span-10 flex flex-col min-h-0"><div className="h-14 shrink-0 flex items-center gap-3 px-1 md:px-2"><div className="w-12 h-12 shrink-0 overflow-hidden border border-white/15 bg-slate-900/70 shadow-lg"><img src={streamingGame.image} alt={`${streamingGame.name} game`} className="w-full h-full object-cover" /></div><div className="min-w-0 flex items-center gap-4"><div className="min-w-0"><div className="text-[9px] uppercase tracking-[0.25em] text-white/35">Now Streaming</div><div className="text-base md:text-lg font-bold text-white truncate">{streamingGame.name}</div></div><button type="button" onClick={() => setShowGameAchievements((value) => !value)} className="text-sm md:text-base font-semibold underline underline-offset-4 decoration-cyan-300/60 text-white hover:text-cyan-200 whitespace-nowrap">Game Achievements, Cards</button></div></div><div className="relative flex-1 min-h-0"><StreamPlayerBox isLive={isLive} onToggleLive={() => setIsLive(!isLive)} isPlaying={isPlaying} onTogglePlay={() => setIsPlaying(!isPlaying)} volume={volume} onVolumeChange={setVolume} /><AnimatePresence>{showGameAchievements && renderGameAchievementOverlay()}</AnimatePresence></div></div><div className="col-span-12 lg:col-span-3 xl:col-span-2 order-first lg:order-none h-full"><StreamChatBox isLive={isLive} /></div></div><div ref={galleryAnchorRef}><ProfileInfoBar activeProfile={activeProfile || { display_name: user?.full_name || user?.username || 'My Channel' }} isEditMode={isEditMode} isLive={isLive} updateEditProfile={updateEditProfile} activeTab={activeTab} setActiveTab={openTab} onEnterEdit={enterEditMode} /></div><div className="w-full h-px bg-white/10 mb-8" /><section><div className="mb-4"><h3 className="text-xl font-bold text-white">Sponsors</h3><p className="text-xs text-white/40">Official channel sponsors and partnerships</p></div>{isEditMode ? <SponsorEditor isEditMode sponsors={activeSponsors} onAdd={addEditSponsor} onRemove={removeEditSponsor} onUpdate={updateEditSponsor} /> : activeSponsors.length ? <SponsorEditor isEditMode={false} sponsors={activeSponsors} onAdd={() => {}} onRemove={() => {}} onUpdate={() => {}} /> : <SponsorsSection />}</section><section className="mt-10"><ProductsGrid /></section><div className="mt-12 mb-20"><h3 className="text-xl font-bold text-white mb-6">Your Channel Season Pass</h3><ViewerSeasonalPass currentTier={12} maxTier={20} /></div></div></div></div><EditModeToolbar isEditMode={isEditMode} saving={saving} onSave={saveEdit} onCancel={cancelEdit} onEnterEdit={enterEditMode} /></div>
    {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {activeTab === 'gallery' && <GallerySection
          key="gallery-console"
          isEditMode={isEditMode}
          galleryImages={galleryImages}
          onUpdateImages={(images) => updateEditLayout('gallery_images', images)}
          onClose={closeOverlay}
          user={user}
          channelId={activeProfile?.user_id || user?.id}
          anchorRef={galleryAnchorRef}
        />}
      </AnimatePresence>,
      document.body
    )}
    {typeof document !== 'undefined' && createPortal(<AnimatePresence>{activeTab === 'cards' && <PlayerAchievementCollection user={user} onClose={closeOverlay} />}</AnimatePresence>, document.body)}
    {activeTab && !['gallery', 'cards'].includes(activeTab) && typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        <motion.div key="streaming-home-overlay" className="fixed inset-0 z-[99999] pointer-events-none">
          <motion.section role="dialog" aria-modal="true" aria-label={`${activeTabLabel} overlay`} initial={activeTab === 'games' || activeTab === 'cards' || activeTab === 'achievements' ? { x: '-100%' } : { y: '100%' }} animate={{ x: 0, y: 0 }} exit={activeTab === 'games' || activeTab === 'cards' || activeTab === 'achievements' ? { x: '-100%' } : { y: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }} className={activeTab === 'games' || activeTab === 'cards' || activeTab === 'achievements' ? `absolute left-0 top-0 bottom-0 ${overlayFullscreen ? 'right-0' : 'w-[80vw]'} bg-slate-950/82 backdrop-blur-xl pointer-events-auto ${activeTab === 'achievements' ? "overflow-visible border-r-0 shadow-[28px_0_60px_-18px_rgba(2,8,23,0.95)] after:content-[''] after:absolute after:inset-y-0 after:right-0 after:w-28 after:translate-x-full after:bg-gradient-to-r after:from-slate-950/75 after:via-slate-950/30 after:to-transparent after:pointer-events-none" : 'overflow-hidden border-r border-white/15 shadow-[24px_0_80px_rgba(0,0,0,0.55)]'}` : `absolute left-0 bottom-0 ${overlayFullscreen ? 'right-0 h-screen' : 'w-[75vw] h-[40vh] min-h-[300px] max-h-[560px]'} overflow-hidden border-t border-white/15 bg-slate-950/82 backdrop-blur-xl shadow-[0_-24px_80px_rgba(0,0,0,0.55)] pointer-events-auto`}><div className={`h-full w-full flex flex-col overflow-hidden ${activeTab === 'achievements' ? 'p-0' : 'p-5 md:p-7'}`}>{activeTab !== 'cards' && activeTab !== 'achievements' && <div className="flex items-center justify-between gap-4 mb-4 shrink-0"><div><div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">Streamer Profile</div><h2 className="text-2xl font-bold text-white">{activeTabLabel}</h2></div><button type="button" onClick={() => setOverlayFullscreen((value) => !value)} className="w-9 h-9 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white">{overlayFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button></div>}<div className="flex-1 min-h-0 overflow-hidden">{renderOverlayContent()}</div></div></motion.section>
        </motion.div>
      </AnimatePresence>,
      document.body
    )}
  </GlassPageFrame>;
}
