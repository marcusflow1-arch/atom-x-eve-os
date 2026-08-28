import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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

export default function StreamingHome() {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();

  const {
    saving,
    isEditMode,
    activeProfile,
    activeLayout,
    activeSponsors,
    enterEditMode,
    cancelEdit,
    saveEdit,
    updateEditProfile,
    updateEditLayout,
    addEditSponsor,
    removeEditSponsor,
    updateEditSponsor
  } = useCreatorEditMode(user?.id);

  const scheduleData = activeLayout?.schedule_data || {};
  const galleryImages = activeLayout?.gallery_images || [];
  const pinnedGames = activeLayout?.pinned_games || [];

  useEffect(() => {
    if (!activeTab) return;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setActiveTab(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeTab]);

  const renderOverlayContent = () => {
    if (activeTab === 'schedule') return <ScheduleSection isEditMode={isEditMode} scheduleData={scheduleData} onUpdateSchedule={(data) => updateEditLayout('schedule_data', data)} onClose={() => setActiveTab(null)} />;
    if (activeTab === 'gallery') return <GallerySection isEditMode={isEditMode} galleryImages={galleryImages} onUpdateImages={(imgs) => updateEditLayout('gallery_images', imgs)} onClose={() => setActiveTab(null)} />;
    if (activeTab === 'games') return <GamesSection isEditMode={isEditMode} pinnedGames={pinnedGames} onUpdateGames={(games) => updateEditLayout('pinned_games', games)} onClose={() => setActiveTab(null)} />;
    if (activeTab === 'cards') {
      return (
        <div className="w-full h-full min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1 shrink-0">
            <div className="flex items-center gap-3"><h3 className="text-lg font-bold text-white">Stream Collection</h3><Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20">Season 0</Badge></div>
            <div className="flex gap-2 items-center">
              {['All', 'Powers', 'Equipment', 'Companions'].map((filter, i) => <button key={filter} className={`px-4 py-1.5 text-xs font-semibold transition-all border ${i === 0 ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}>{filter}</button>)}
              <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)} aria-label="Close cards overlay"><X className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 overflow-y-auto pr-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} onClick={() => setSelectedCard({ name: `Item Name ${i + 1}`, id: i })} className="group relative aspect-[3/4] border border-white/10 bg-white/5 overflow-hidden transition-all hover:scale-[1.03] hover:border-white/30 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                <div className="absolute top-1.5 left-1.5"><Badge className="bg-black/40 backdrop-blur-md border-white/10 text-[8px] h-4 px-1">Common</Badge></div>
                <div className="absolute bottom-2 left-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all"><div className="text-xs font-bold text-white truncate">Item {i + 1}</div></div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const activeTabLabel = activeTab ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : '';

  return (
    <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
      <SideAccessMenu />
      <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]">
        <div className="flex-1 relative h-full overflow-y-auto pl-6">
          <div className="w-full min-h-full pt-20 pb-24 px-4 md:px-8 relative">
            <AnimatePresence>
              {isEditMode && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none z-10" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />}
            </AnimatePresence>

            <div className="mx-auto max-w-none w-full flex flex-col gap-8 relative z-20">
              <div className="grid grid-cols-12 gap-4 h-[420px] md:h-[480px] lg:h-[520px]">
                <div className="col-span-12 lg:col-span-9 xl:col-span-10"><div className={`h-full transition-all ${isEditMode ? 'ring-1 ring-cyan-500/20 rounded-xl' : ''}`}><StreamPlayerBox isLive={isLive} onToggleLive={() => setIsLive(!isLive)} isPlaying={isPlaying} onTogglePlay={() => setIsPlaying(!isPlaying)} volume={volume} onVolumeChange={setVolume} /></div></div>
                <div className={`col-span-12 lg:col-span-3 xl:col-span-2 order-first lg:order-none h-full transition-all ${isEditMode ? 'ring-1 ring-cyan-500/20 rounded-xl' : ''}`}><StreamChatBox isLive={isLive} /></div>
              </div>

              <div className="flex flex-col">
                <ProfileInfoBar activeProfile={activeProfile || { display_name: user?.full_name || user?.username || 'My Channel' }} isEditMode={isEditMode} isLive={isLive} updateEditProfile={updateEditProfile} activeTab={activeTab} setActiveTab={setActiveTab} onEnterEdit={enterEditMode} />
                <div className="w-full h-px bg-white/10 mb-8" />

                <section className="w-full">
                  <div className="mb-4"><h3 className="text-xl font-bold text-white">Sponsors</h3><p className="text-xs text-white/40">Official channel sponsors and partnerships</p></div>
                  {isEditMode ? <SponsorEditor isEditMode={isEditMode} sponsors={activeSponsors} onAdd={addEditSponsor} onRemove={removeEditSponsor} onUpdate={updateEditSponsor} /> : activeSponsors.length > 0 ? <SponsorEditor isEditMode={false} sponsors={activeSponsors} onAdd={() => {}} onRemove={() => {}} onUpdate={() => {}} /> : <SponsorsSection />}
                </section>

                <section className="w-full mt-10">
                  <div className="mb-4"><h3 className="text-xl font-bold text-white">Products</h3><p className="text-xs text-white/40">Products and items available from this channel</p></div>
                  <ProductsGrid />
                </section>

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
          <motion.div key="streaming-home-overlay" className="fixed inset-0 z-[99999]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close overlay" onClick={() => setActiveTab(null)} className="absolute inset-0 w-full h-full bg-black/35 backdrop-blur-md" />
            <motion.section role="dialog" aria-modal="true" aria-label={`${activeTabLabel} overlay`} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }} className="absolute left-0 right-0 bottom-0 h-[40vh] min-h-[280px] max-h-[520px] overflow-hidden border-t border-white/15 bg-slate-950/80 backdrop-blur-xl shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">
              <div className="h-full w-full p-5 md:p-7 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-4 mb-4 shrink-0"><div><div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">Streamer Profile</div><h2 className="text-2xl font-bold text-white">{activeTabLabel}</h2></div><button type="button" onClick={() => setActiveTab(null)} className="w-9 h-9 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors" aria-label="Close"><X className="w-4 h-4" /></button></div>
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
