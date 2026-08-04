import React, { useState } from 'react';
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

  // --- Creator Edit Mode System ---
  const {
    loading,
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

  // Derived data from layout config (uses edit state when editing, persisted when viewing)
  const scheduleData = activeLayout?.schedule_data || {};
  const galleryImages = activeLayout?.gallery_images || [];
  const pinnedGames = activeLayout?.pinned_games || [];

  return (
    <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
      <SideAccessMenu />
      <div className="h-screen w-full flex relative overflow-hidden bg-[#0f1419]">
        <div className="flex-1 relative h-full overflow-y-auto pl-6">
          <div className="w-full min-h-full pt-20 pb-24 px-4 md:px-8 relative">

        {/* Edit Mode Grid Overlay */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />
          )}
        </AnimatePresence>

        <div className="mx-auto max-w-none w-full flex flex-col gap-8 relative z-20">

          {/* Top Section: Video & Chat */}
          <div className="grid grid-cols-12 gap-4 h-[420px] md:h-[480px] lg:h-[520px]">
            {/* Stream Box */}
            <div className="col-span-12 lg:col-span-9 xl:col-span-10">
              <div className={`h-full transition-all ${isEditMode ? 'ring-1 ring-cyan-500/20 rounded-xl' : ''}`}>
                <StreamPlayerBox
                  isLive={isLive}
                  onToggleLive={() => setIsLive(!isLive)}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  volume={volume}
                  onVolumeChange={setVolume}
                />
              </div>
            </div>

            {/* Chat Box */}
            <div className={`col-span-12 lg:col-span-3 xl:col-span-2 order-first lg:order-none h-full transition-all ${isEditMode ? 'ring-1 ring-cyan-500/20 rounded-xl' : ''}`}>
              <StreamChatBox isLive={isLive} />
            </div>
          </div>

          {/* Profile Info & Content */}
          <div className="flex flex-col">
            <ProfileInfoBar
              activeProfile={activeProfile || { display_name: user?.full_name || user?.username || 'My Channel' }}
              isEditMode={isEditMode}
              isLive={isLive}
              updateEditProfile={updateEditProfile}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onEnterEdit={enterEditMode}
            />

            <div className="w-full h-px bg-white/10 mb-6" />

            {/* Collapsible Tabs */}
            <AnimatePresence>
              {activeTab && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="w-full overflow-hidden mb-8"
                  onDoubleClick={() => setActiveTab(null)}
                >
                  {activeTab === 'schedule' && (
                    <ScheduleSection
                      isEditMode={isEditMode}
                      scheduleData={scheduleData}
                      onUpdateSchedule={(data) => updateEditLayout('schedule_data', data)}
                      onClose={() => setActiveTab(null)}
                    />
                  )}

                  {activeTab === 'cards' && (
                    <div className="w-full select-none pt-4 bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-white">Stream Collection</h3>
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20">Season 0</Badge>
                        </div>
                        <div className="flex gap-2">
                          {['All', 'Powers', 'Equipment', 'Companions'].map((filter, i) => (
                            <button key={filter} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${i === 0 ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                              {filter}
                            </button>
                          ))}
                          <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={i}
                            onClick={() => setSelectedCard({ name: `Item Name ${i + 1}`, id: i })}
                            className="group relative aspect-[3/4] rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:scale-105 hover:border-white/30 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute top-1.5 left-1.5">
                              <Badge className="bg-black/40 backdrop-blur-md border-white/10 text-[8px] h-4 px-1">Common</Badge>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                              <div className="text-xs font-bold text-white truncate">Item {i + 1}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'gallery' && (
                    <GallerySection
                      isEditMode={isEditMode}
                      galleryImages={galleryImages}
                      onUpdateImages={(imgs) => updateEditLayout('gallery_images', imgs)}
                      onClose={() => setActiveTab(null)}
                    />
                  )}

                  {activeTab === 'games' && (
                    <GamesSection
                      isEditMode={isEditMode}
                      pinnedGames={pinnedGames}
                      onUpdateGames={(games) => updateEditLayout('pinned_games', games)}
                      onClose={() => setActiveTab(null)}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sponsors - Edit mode uses SponsorEditor, view mode uses existing SponsorsSection */}
            {isEditMode ? (
              <SponsorEditor
                isEditMode={isEditMode}
                sponsors={activeSponsors}
                onAdd={addEditSponsor}
                onRemove={removeEditSponsor}
                onUpdate={updateEditSponsor}
              />
            ) : (
              activeSponsors.length > 0 ? (
                <SponsorEditor
                  isEditMode={false}
                  sponsors={activeSponsors}
                  onAdd={() => {}}
                  onRemove={() => {}}
                  onUpdate={() => {}}
                />
              ) : (
                <SponsorsSection />
              )
            )}

            {/* Products */}
            <ProductsGrid />

            {/* Seasonal Pass */}
            <div className="w-full mt-12 mb-20">
              <h3 className="text-xl font-bold text-white mb-6">Your Channel Season Pass</h3>
              <ViewerSeasonalPass currentTier={12} maxTier={20} />
            </div>
          </div>

          {/* Card Modal */}
          <AnimatePresence>
            {selectedCard && (
              <StreamerCardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
            )}
          </AnimatePresence>
        </div>

          </div>
        </div>

        {/* Edit Mode Toolbar */}
        <EditModeToolbar
          isEditMode={isEditMode}
          saving={saving}
          onSave={saveEdit}
          onCancel={cancelEdit}
          onEnterEdit={enterEditMode}
        />
      </div>
    </GlassPageFrame>
  );
}