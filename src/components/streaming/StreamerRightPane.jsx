import React, { useState } from 'react';
import { Gamepad2, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import StreamerCardDetailModal from './StreamerCardDetailModal';
import { addDays, subDays, startOfWeek, format, isSameDay, isToday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SponsorsSection from './profile/SponsorsSection';
import ProductsGrid from './profile/ProductsGrid';
import ViewerSeasonalPass from './ViewerSeasonalPass';
import { Pencil, Save, Plus, Upload, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ScheduleEditModal from './modals/ScheduleEditModal';

export default function StreamerRightPane({ streamer, allowEditing = true }) {
  const name = streamer?.name || 'Streamer';
  const [activeTab, setActiveTab] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [scheduleBaseDate, setScheduleBaseDate] = useState(new Date());
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Schedule State
  const [scheduleEvents, setScheduleEvents] = useState({});
  const [editingScheduleDate, setEditingScheduleDate] = useState(null);
  
  // Gallery State
  const [galleryItems, setGalleryItems] = useState(
    Array.from({ length: 8 }).map((_, i) => ({
      id: `init-${i}`,
      url: `https://source.unsplash.com/random/800x600?gaming,setup&sig=${i}`,
      type: 'image'
    }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleScheduleSave = (data) => {
    if (editingScheduleDate) {
      const dateKey = format(editingScheduleDate, 'yyyy-MM-dd');
      setScheduleEvents(prev => ({
        ...prev,
        [dateKey]: data
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setGalleryItems(prev => [
        ...prev,
        {
          id: `new-${Date.now()}`,
          url: file_url,
          type: file.type.startsWith('video') ? 'video' : 'image'
        }
      ]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeGalleryItem = (id) => {
    setGalleryItems(prev => prev.filter(item => item.id !== id));
  };

  const galleryScrollRef = React.useRef(null);

  React.useEffect(() => {
    const el = galleryScrollRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [activeTab]);

  // Calculate the 14 days to show, starting from the Monday of the current base date's week
  const startDate = startOfWeek(scheduleBaseDate, { weekStartsOn: 1 }); // Monday start
  const scheduleDays = Array.from({ length: 14 }).map((_, i) => addDays(startDate, i));

  const handlePrevTwoWeeks = () => setScheduleBaseDate(prev => subDays(prev, 14));
  const handleNextTwoWeeks = () => setScheduleBaseDate(prev => addDays(prev, 14));
  const handleToday = () => setScheduleBaseDate(new Date());

  const endDate = scheduleDays[13];
  const dateRangeString = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

  return (
    <div className="w-full">
      {/* Top row: Stream video + Live chat */}
      <div className="flex gap-0 flex-col lg:flex-row relative">
        {/* Stream box (bigger) — blends into page */}
        <div className="flex-[3] rounded-3xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.02) 100%)',
          }}
        >
          {/* Soft inner edge glow instead of hard border */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
            boxShadow: 'inset 0 0 30px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)',
          }} />
          <div className="h-[520px] w-full relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-transparent to-slate-800/10" />
            <div className="relative flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                <Play className="w-7 h-7 text-white/80" />
              </div>
              <p className="text-white/60 text-sm">Live stream preview</p>
            </div>
          </div>
          {/* Fade right edge into gap */}
          <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-[#0f1419] to-transparent pointer-events-none hidden lg:block" />
        </div>

        {/* Subtle vertical blend between the two panels */}
        <div className="hidden lg:block w-px relative z-10">
          <div className="absolute inset-y-[10%] w-px" style={{
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)',
          }} />
        </div>

        {/* Live chat (smaller) — blends into page */}
        <div className="flex-[2] h-[520px] rounded-3xl overflow-hidden flex flex-col relative"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)',
          }}
        >
          {/* Soft inner edge glow */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
            boxShadow: 'inset 0 0 30px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)',
          }} />
          {/* Fade left edge from gap */}
          <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-[#0f1419] to-transparent pointer-events-none hidden lg:block z-10" />

          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between relative z-20">
            <span className="text-white/80 text-sm font-semibold">Live Chat</span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">1.2k watching</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 relative z-20">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10" />
                <div>
                  <div className="text-xs text-white/60 font-semibold">User{i + 1}</div>
                  <div className="text-sm text-white/80">This is a sample message {i + 1}.</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/[0.06] relative z-20">
            <div className="h-9 w-full rounded-xl bg-white/[0.06] border border-white/[0.08]" />
          </div>
        </div>
      </div>

      {/* Card Details Modal */}
      <AnimatePresence>
        {selectedCard && (
            <StreamerCardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
        )}
      </AnimatePresence>

      {/* Schedule Edit Modal */}
      <ScheduleEditModal 
        isOpen={!!editingScheduleDate} 
        onClose={() => setEditingScheduleDate(null)} 
        date={editingScheduleDate}
        initialData={editingScheduleDate ? scheduleEvents[format(editingScheduleDate, 'yyyy-MM-dd')] : null}
        onSave={handleScheduleSave}
      />

      {/* Bottom: Profile Info Bar & Content */}
      <div className="mt-4 flex flex-col">
        {/* Streamer Info Bar - Clean Strip */}
        <div className="w-full px-2 py-4 flex flex-col md:flex-row items-center justify-between gap-6 relative">
          
          {/* Left: Avatar + Identity */}
          <div className="flex items-center gap-4">
            <div className="relative group">
                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/10">
                {streamer?.avatar ? (
                    <img src={streamer.avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-white/10" />
                )}
                </div>
                {/* Simplified Edit Mode for Viewer component - likely read only but keeping consistent prop just in case */}
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-white tracking-wide">{name}</h2>
              <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Personality</span>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mt-0.5">Competitive • Strategic</span>
            </div>
          </div>

          {/* Center: Controls & Navigation */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
             <Gamepad2 className="w-5 h-5 text-white/50 mb-1" />
             <div className="flex items-center gap-8 text-sm font-medium">
                <button 
                  onClick={() => setActiveTab(activeTab === 'schedule' ? null : 'schedule')}
                  className={`pb-1 px-1 transition-colors border-b-2 ${activeTab === 'schedule' ? 'text-white border-white' : 'text-white/50 border-transparent hover:text-white'}`}
                >
                  Schedule
                </button>
                <button 
                  onClick={() => setActiveTab(activeTab === 'cards' ? null : 'cards')}
                  className={`pb-1 px-1 transition-colors border-b-2 ${activeTab === 'cards' ? 'text-white border-white' : 'text-white/50 border-transparent hover:text-white'}`}
                >
                  Cards
                </button>
                <button 
                  onClick={() => setActiveTab(activeTab === 'gallery' ? null : 'gallery')}
                  className={`pb-1 px-1 transition-colors border-b-2 ${activeTab === 'gallery' ? 'text-white border-white' : 'text-white/50 border-transparent hover:text-white'}`}
                >
                  Gallery
                </button>
                <button 
                  onClick={() => setActiveTab(activeTab === 'games' ? null : 'games')}
                  className={`pb-1 px-1 transition-colors border-b-2 ${activeTab === 'games' ? 'text-white border-white' : 'text-white/50 border-transparent hover:text-white'}`}
                >
                  Games
                </button>
             </div>
          </div>

          {/* Right: Actions & Stats */}
          <div className="flex items-center gap-4">
            {allowEditing && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-full w-10 h-10 ${isEditingProfile ? 'text-cyan-400 bg-cyan-400/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    title={isEditingProfile ? "Save Profile" : "Edit Profile"}
                >
                    {isEditingProfile ? <Save className="w-5 h-5" /> : <Pencil className="w-4 h-4" />}
                </Button>
            )}

            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 text-white/70 hover:text-white hover:bg-white/10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </Button>
            
            <Button className="rounded-full px-6 bg-white text-black font-bold hover:bg-slate-200">
                Subscribe
            </Button>
            
            <div className="flex items-center gap-1.5 text-white/60 ml-2">
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
               <span className="font-mono text-sm font-semibold">1.2K</span>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="w-full h-px bg-white/10 mb-6" />

        {/* Tab Content - Collapsible */}
        <AnimatePresence>
            {activeTab && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, y: 20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="w-full overflow-hidden"
                    onDoubleClick={() => setActiveTab(null)}
                >
                    {activeTab === 'schedule' && (
                    <div className="w-full select-none pt-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold text-lg">Streaming Schedule <span className="text-white/40 text-sm font-normal ml-2">{dateRangeString}</span></h3>
                            <div className="flex items-center gap-2">
                            <Button onClick={handlePrevTwoWeeks} variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronLeft className="w-4 h-4" /></Button>
                            <Button onClick={handleToday} variant="outline" className="h-8 px-4 rounded-lg bg-white/5 border-white/10 hover:bg-white/10 text-xs font-semibold">Today</Button>
                            <Button onClick={handleNextTwoWeeks} variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronRight className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
                            {scheduleDays.map((date, i) => {
                                const isCurrentDay = isToday(date);
                                const dayName = format(date, 'EEE');
                                const dayNumber = format(date, 'd');
                                const dateKey = format(date, 'yyyy-MM-dd');
                                const eventData = scheduleEvents[dateKey];
                                
                                return (
                                    <div key={i} className={`bg-[#0f1419] p-2 min-h-[140px] flex flex-col items-center gap-1 relative group hover:bg-[#1a1f2e] transition-colors ${isCurrentDay ? 'bg-white/[0.03]' : ''}`}>
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{dayName}</span>
                                        <span className={`text-xl font-bold ${isCurrentDay ? 'text-cyan-400' : 'text-white'}`}>{dayNumber}</span>
                                        
                                        {/* Event Data Display */}
                                        {eventData && (
                                            <div className="w-full mt-2 flex flex-col gap-1">
                                                {eventData.timeRange && (
                                                    <Badge variant="outline" className="w-full justify-center text-[10px] h-5 border-cyan-500/30 text-cyan-400 bg-cyan-500/5 px-1 truncate">
                                                        {eventData.timeRange}
                                                    </Badge>
                                                )}
                                                {eventData.game && (
                                                    <div className="text-[10px] text-white/80 font-medium text-center truncate px-1">
                                                        {eventData.game}
                                                    </div>
                                                )}
                                                {eventData.notes && (
                                                    <div className="text-[9px] text-white/50 text-center line-clamp-2 leading-tight px-1">
                                                        {eventData.notes}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isCurrentDay && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none box-border border-b-2 border-cyan-500/50" />}
                                        
                                        {/* Edit Button Overlay */}
                                        {isEditingProfile && allowEditing && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                                <button 
                                                    onClick={() => setEditingScheduleDate(date)}
                                                    className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-center text-white/30 text-xs mt-4">Double-click content to collapse • Timezone is localized</p>
                    </div>
                    )}
                    
                    {activeTab === 'cards' && (
                    <div className="w-full select-none pt-4">
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
                            </div>
                        </div>
            
                        {/* 50% smaller cards (increased grid columns) */}
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div 
                                key={i} 
                                onClick={(e) => { e.stopPropagation(); setSelectedCard({ name: `Item Name ${i+1}`, id: i }); }}
                                className="group relative aspect-[3/4] rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:scale-105 hover:border-white/30 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
                            >
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            
                            <div className="absolute top-1.5 left-1.5">
                                <Badge className="bg-black/40 backdrop-blur-md border-white/10 text-[8px] h-4 px-1">Common</Badge>
                            </div>
                            
                            <div className="absolute bottom-2 left-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                <div className="text-xs font-bold text-white truncate">Item {i+1}</div>
                            </div>
                            </div>
                        ))}
                        </div>
                        <p className="text-center text-white/30 text-xs mt-6">Double-click content to collapse</p>
                    </div>
                    )}
                    
                    {activeTab === 'gallery' && (
                        <div className="w-full select-none pt-4">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-bold text-lg">Gallery</h3>
                                {isEditingProfile && allowEditing && (
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileUpload} 
                                        className="hidden" 
                                        accept="image/*,video/*"
                                    />
                                )}
                            </div>
                            
                            {/* Horizontal Scroll Container */}
                            <div 
                                ref={galleryScrollRef}
                                className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide px-2 items-center"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {galleryItems.map((item) => (
                                    <div key={item.id} className="flex-shrink-0 w-64 aspect-video bg-white/5 rounded-xl border border-white/10 overflow-visible hover:border-white/20 transition-all cursor-pointer group relative">
                                        <div className="w-full h-full overflow-hidden rounded-xl relative">
                                            {item.type === 'video' ? (
                                                <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <img src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            )}
                                            
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <span className="text-white font-bold text-sm">View</span>
                                            </div>
                                        </div>
                                        
                                        {/* Delete Button - Top Right "Sitting on the line" */}
                                        {isEditingProfile && allowEditing && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeGalleryItem(item.id);
                                                }}
                                                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#0f1419] border border-white/20 text-red-400 hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 flex items-center justify-center transition-all z-20 shadow-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* Add New Button */}
                                {isEditingProfile && allowEditing && (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-shrink-0 w-64 aspect-video bg-white/5 rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-visible"
                                    >
                                        {isUploading ? (
                                            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
                                                    <Plus className="w-6 h-6 text-white/60 group-hover:text-cyan-400" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-center text-white/30 text-xs mt-2">Scroll to view more • Double-click content to collapse</p>
                        </div>
                    )}
                    
                    {activeTab === 'games' && (
                        <div className="w-full select-none pt-4">
                            <h3 className="text-white font-bold text-lg mb-6">Games Played</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {['Valorant', 'Apex Legends', 'League of Legends', 'Overwatch 2', 'Minecraft', 'Destiny 2', 'Elden Ring', 'Cyberpunk 2077'].map((game, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer">
                                        <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden">
                                            <img src={`https://source.unsplash.com/random/100x100?game,${game}&sig=${i}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{game}</div>
                                            <div className="text-xs text-white/40">FPS • Action</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-center text-white/30 text-xs mt-6">Double-click content to collapse</p>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Sponsors & Partners Section */}
        <SponsorsSection isEditing={isEditingProfile} allowEditing={allowEditing} />

        {/* Products & Events Grid */}
        <ProductsGrid isEditing={isEditingProfile} allowEditing={allowEditing} />

        {/* Seasonal Pass Section */}
        <div className="w-full mt-12 mb-20">
            <h3 className="text-xl font-bold text-white mb-6">Allure Streaming Seasonal Pass</h3>
            <ViewerSeasonalPass streamerId="current" />
        </div>

      </div>
    </div>
  );
}