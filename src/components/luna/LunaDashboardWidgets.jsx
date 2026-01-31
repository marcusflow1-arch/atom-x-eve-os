import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLayoutEdit } from '@/components/layout/LayoutEditContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Settings, Grid, Bot, Crown, Trophy, Target, Layers } from 'lucide-react';
import AvatarProgressionBox from '@/components/avatar/AvatarProgressionBox';
import { ConsoleTile, LegendaryTile, LeaderboardTile } from '@/components/dashboard/Tiles';

const DEFAULT_LAYOUT = ['live_stream', 'stats_dropdown', 'top_attributes', 'quick_access', 'game_banner', 'main_grid'];

const LiveStreamWidget = ({ showLive }) => (
  <AnimatePresence>
    {showLive && (
      <motion.div
        initial={{ opacity: 0, height: 0, mb: 0 }}
        animate={{ opacity: 1, height: 'auto', mb: 24 }}
        exit={{ opacity: 0, height: 0, mb: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full flex gap-6 overflow-hidden h-[340px] md:h-[380px] lg:h-[420px]"
      >
        {/* Streamy Box */}
        <div className="basis-[75%] h-full bg-black/40 rounded-2xl border border-white/10 overflow-hidden relative group">
          <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                  <span className="text-white/40">Stream Offline</span>
              </div>
          </div>
          {/* Mock Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-3">
                  <button className="text-white hover:text-cyan-400"><Play className="w-5 h-5 fill-current" /></button>
                  <span className="text-white text-sm">00:00 / 00:00</span>
              </div>
              <button className="text-white hover:text-cyan-400"><Settings className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Chat Box */}
        <div className="basis-[25%] h-full bg-black/40 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <span className="text-white font-bold text-sm">Stream Chat</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              <div className="text-xs text-white/60">Welcome to the chat!</div>
              <div className="flex gap-2">
                  <span className="text-cyan-400 text-xs font-bold">Bot:</span>
                  <span className="text-white text-xs">Stream starting soon...</span>
              </div>
          </div>
          <div className="p-3 border-t border-white/10 bg-white/5">
              <input 
                  type="text" 
                  placeholder="Send a message..." 
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const StatsDropdownWidget = ({ showStats }) => (
  <AnimatePresence>
    {showStats && (
      <motion.div
        initial={{ opacity: 0, height: 0, mb: 0 }}
        animate={{ opacity: 1, height: 'auto', mb: 24 }}
        exit={{ opacity: 0, height: 0, mb: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full overflow-hidden"
        style={{ paddingLeft: '440px' }}
      >
        <div className="bg-black/40 rounded-2xl border border-white/10 p-4 mr-8">
          <AvatarProgressionBox />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const TopAttributesWidget = ({ equippedItems, handleBoxClick }) => (
  <div className="flex gap-12 mb-6 items-start">
    {/* Aspects */}
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Aspects</h2>
      <div className="relative w-40 h-4">
        <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
      </div>
      <div className="flex gap-3">
        {[1,2,3].map((i)=> (
          <div key={i} className="w-[60px] h-[60px] rounded-full border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
        ))}
      </div>
    </div>

    {/* Artifacts */}
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Artifacts</h2>
      <div className="relative w-52 h-4">
        <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
      </div>
      <div className="flex gap-3">
        {[1,2,3,4,5].map((i)=> (
          <div key={i} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
        ))}
      </div>
    </div>

    {/* Genre */}
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Genre</h2>
      <div className="relative w-40 h-4">
        <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
      </div>
      <div className="flex gap-3">
        {[1,2].map((i)=> (
          <div key={i} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const QuickAccessWidget = ({ setShowStats, navigate, createPageUrl }) => (
  <div style={{ paddingLeft: '440px' }} className="mb-6">
    <div className="flex gap-4">
      {/* Stats */}
      <ConsoleTile
        onClick={() => setShowStats((v) => !v)}
        className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
      >
        <Grid className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
        <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Stats</span>
      </ConsoleTile>

      {/* Skill Tree */}
      <ConsoleTile
        onClick={() => navigate(createPageUrl('GenreMastery'))}
        className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
      >
        <Bot className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
        <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Skill Tree</span>
      </ConsoleTile>

      {/* Season Pass */}
      <ConsoleTile
        onClick={() => navigate(createPageUrl('SeasonalPass'))}
        className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
      >
        <Crown className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
        <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Season Pass</span>
      </ConsoleTile>

      {/* Achievements */}
      <ConsoleTile
        onClick={() => navigate(createPageUrl('Achievements'))}
        className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
      >
        <Trophy className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 10px rgba(255, 215, 0, 0.6))' }} strokeWidth={1.5} />
        <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Achievements</span>
      </ConsoleTile>

      {/* Leaderboard */}
      <ConsoleTile
        onClick={() => navigate(createPageUrl('Leaderboard'))}
        className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
      >
        <Target className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
        <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Leaderboard</span>
      </ConsoleTile>
    </div>
  </div>
);

const GameBannerWidget = ({ navigate, createPageUrl }) => (
  <div style={{ paddingLeft: '440px' }} className="mb-6">
    <LegendaryTile
      onClick={() => navigate(createPageUrl('Store'))}
      className="w-full h-48 relative overflow-hidden"
    >
      <video
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/15b006cdb_Plasma-Water.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 via-[#080808]/20 to-transparent" />
      <div className="absolute bottom-4 left-6 z-10">
        <h3 className="text-white text-2xl font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Game Banner</h3>
      </div>
    </LegendaryTile>
  </div>
);

const MainGridWidget = ({ navigate, createPageUrl }) => (
  <div className="flex-1 flex gap-6 min-h-0">
    {/* Leaderboard Tile - Left */}
    <LeaderboardTile />

    {/* Right Side - 2x2 Grid */}
    <div className="flex-1 flex flex-col gap-6">
      {/* App Shortcuts */}
      <div className="flex gap-6 flex-1">
        {/* Settings */}
        <ConsoleTile
          onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=settings')}
          className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-3"
        >
          <Settings className="w-16 h-16 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
          <span className="text-[#CCCCCC] text-lg font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Settings</span>
        </ConsoleTile>

        {/* My Games & Apps */}
        <ConsoleTile
          onClick={() => navigate(createPageUrl('Store') + '?subview=library')}
          className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-3"
        >
          <Layers className="w-16 h-16 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
          <span className="text-[#CCCCCC] text-lg font-sans text-center relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>My games & apps</span>
        </ConsoleTile>
      </div>
    </div>
  </div>
);

export default function LunaDashboardWidgets({ 
  showLive, showStats, navigate, createPageUrl, 
  setShowStats, equippedItems, handleBoxClick 
}) {
  const { isEditing, loadLayout, updatePendingLayout } = useLayoutEdit();
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);

  useEffect(() => {
    loadLayout('luna_dashboard', DEFAULT_LAYOUT).then(setLayout);
  }, []);

  useEffect(() => {
    if (isEditing) {
      updatePendingLayout('luna_dashboard', layout);
    }
  }, [layout, isEditing]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(layout);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setLayout(items);
  };

  const renderWidget = (id) => {
    switch(id) {
      case 'live_stream': return <LiveStreamWidget showLive={showLive} />;
      case 'stats_dropdown': return <StatsDropdownWidget showStats={showStats} />;
      case 'top_attributes': return <TopAttributesWidget equippedItems={equippedItems} handleBoxClick={handleBoxClick} />;
      case 'quick_access': return <QuickAccessWidget setShowStats={setShowStats} navigate={navigate} createPageUrl={createPageUrl} />;
      case 'game_banner': return <GameBannerWidget navigate={navigate} createPageUrl={createPageUrl} />;
      case 'main_grid': return <MainGridWidget navigate={navigate} createPageUrl={createPageUrl} />;
      default: return null;
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="dashboard-widgets">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-6">
             {layout.map((id, index) => (
               <Draggable key={id} draggableId={id} index={index} isDragDisabled={!isEditing}>
                 {(provided, snapshot) => (
                   <div
                     ref={provided.innerRef}
                     {...provided.draggableProps}
                     {...provided.dragHandleProps}
                     className={`relative transition-all duration-200 ${isEditing ? 'border border-dashed border-white/20 rounded-xl p-2 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10 cursor-move' : ''}`}
                     style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.8 : 1,
                        zIndex: snapshot.isDragging ? 100 : 'auto'
                     }}
                   >
                     {/* Drag Handle Overlay */}
                     {isEditing && (
                       <div className="absolute -top-3 -right-2 px-2 py-1 bg-cyan-900/80 rounded text-[10px] text-cyan-200 z-50 pointer-events-none border border-cyan-500/30 uppercase tracking-widest shadow-lg backdrop-blur-md">
                         {id.replace('_', ' ')}
                       </div>
                     )}
                     {renderWidget(id)}
                   </div>
                 )}
               </Draggable>
             ))}
             {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}