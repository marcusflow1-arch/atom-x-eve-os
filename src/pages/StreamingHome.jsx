import React, { useState } from 'react';
import { Play, Pause, Gamepad2, ChevronLeft, ChevronRight, Save, Pencil, MessageSquare, WifiOff, X, Volume2, Settings, Maximize, Mic, Plus, Trash2, Upload, Image as ImageIcon, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { format, addDays, startOfWeek, subDays, isToday, getDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import SponsorsSection from '@/components/streaming/profile/SponsorsSection';
import ProductsGrid from '@/components/streaming/profile/ProductsGrid';
import ViewerSeasonalPass from '@/components/streaming/ViewerSeasonalPass';
import StreamerCardDetailModal from '@/components/streaming/StreamerCardDetailModal';
import { useAuth } from '@/components/auth/AuthContext';
import BottomQuickBar from '@/components/streaming/BottomQuickBar';
import StreamPlayerBox from '@/components/streaming/StreamPlayerBox';
import StreamChatBox from '@/components/streaming/StreamChatBox';

// Helper for schedule data
const getScheduleData = (date) => {
    // In a real app, fetch from DB
    return null; 
};

export default function StreamingHome() {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false); // Default to offline for home page
  const [activeTab, setActiveTab] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [scheduleBaseDate, setScheduleBaseDate] = useState(new Date());

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);

  // Edit State
  const [profileName, setProfileName] = useState(user?.full_name || user?.username || "My Channel");
  const [profilePersonality, setProfilePersonality] = useState("Competitive • Strategic");
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar_url);
  const [scheduleData, setScheduleData] = useState({}); // { 'YYYY-MM-DD': { time: '...', title: '...' } }
  const [editingScheduleDay, setEditingScheduleDay] = useState(null); // Date object
  const [scheduleForm, setScheduleForm] = useState({ time: '', title: '', game: '', isGiveaway: false });

  const handleClearSchedule = (date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      setScheduleData(prev => {
          const newState = { ...prev };
          delete newState[dateKey];
          return newState;
      });
  };
  const [galleryImages, setGalleryImages] = useState(Array.from({ length: 8 }).map((_, i) => ({ id: i, url: `https://source.unsplash.com/random/800x600?gaming,setup&sig=${i}` })));
  const [myGames, setMyGames] = useState(['Valorant', 'Apex Legends', 'League of Legends', 'Overwatch 2', 'Minecraft', 'Destiny 2', 'Elden Ring', 'Cyberpunk 2077']);
  const [showGamePicker, setShowGamePicker] = useState(false);

  // Fetch Library Games
  const { data: libraryGames = [] } = useQuery({
    queryKey: ['libraryGames'],
    queryFn: () => base44.entities.Game.list(),
  });

  // User Data
  const displayName = profileName; 
  
  // Schedule Logic
  const startDate = startOfWeek(scheduleBaseDate, { weekStartsOn: 1 });
  const scheduleDays = Array.from({ length: 14 }).map((_, i) => addDays(startDate, i));
  const endDate = scheduleDays[13];
  const dateRangeString = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

  const handlePrevTwoWeeks = () => setScheduleBaseDate(prev => subDays(prev, 14));
  const handleNextTwoWeeks = () => setScheduleBaseDate(prev => addDays(prev, 14));
  const handleToday = () => setScheduleBaseDate(new Date());

  const toggleLiveStatus = () => setIsLive(!isLive);

  const handleSaveProfile = () => {
      setIsEditingProfile(false);
      // Logic to save to backend would go here
  };

  const handleAvatarUpload = () => {
      // Mock upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
              const url = URL.createObjectURL(file);
              setProfileAvatar(url);
          }
      };
      input.click();
  };

  const handleScheduleClick = (date) => {
      if (!isEditingProfile) return;
      const dateKey = format(date, 'yyyy-MM-dd');
      setEditingScheduleDay(date);
      setScheduleForm(scheduleData[dateKey] || { time: '', title: '', game: '', isGiveaway: false });
  };

  const saveScheduleDay = () => {
      if (!editingScheduleDay) return;
      const dateKey = format(editingScheduleDay, 'yyyy-MM-dd');
      setScheduleData(prev => ({
          ...prev,
          [dateKey]: scheduleForm
      }));
      setEditingScheduleDay(null);
  };

  const handleGalleryUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
              const url = URL.createObjectURL(file);
              setGalleryImages(prev => [...prev, { id: Date.now(), url }]);
          }
      };
      input.click();
  };

  const handleRemoveGalleryImage = (id) => {
      setGalleryImages(prev => prev.filter(img => img.id !== id));
  };

  const handleAddGame = (gameTitle) => {
      if (!myGames.includes(gameTitle)) {
          setMyGames(prev => [...prev, gameTitle]);
      }
      setShowGamePicker(false);
  };

  const handleRemoveGame = (gameTitle) => {
      setMyGames(prev => prev.filter(g => g !== gameTitle));
  };

  return (
    <div className="w-full min-h-screen pt-20 pb-24 px-4 md:px-8">
      <div className="mx-auto max-w-none w-full flex flex-col gap-8">
        
        {/* Top Section: Video & Chat */}
        <div className="grid grid-cols-12 gap-4 h-[520px] md:h-[680px]">
            {/* Stream Box (Reusable) */}
            <StreamPlayerBox 
                isLive={isLive} 
                onToggleLive={toggleLiveStatus}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                volume={volume}
                onVolumeChange={setVolume}
            />

            {/* Chat Box (Reusable) */}
            <StreamChatBox isLive={isLive} />
        </div>

        {/* Profile Info & Content (Duplicated layout from StreamerRightPane) */}
        <div className="flex flex-col">
            {/* Streamer Info Bar */}
            <div className="w-full px-2 py-4 flex flex-col md:flex-row items-center justify-between gap-6 relative">
              
              {/* Left: Avatar + Identity */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                    <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/10 bg-black">
                    {profileAvatar ? (
                        <img src={profileAvatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                            {displayName.charAt(0)}
                        </div>
                    )}
                    </div>
                    {isEditingProfile && (
                        <div 
                            onClick={handleAvatarUpload}
                            className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors z-10"
                        >
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col">
                  {isEditingProfile ? (
                      <div className="space-y-1">
                          <Input 
                            value={profileName} 
                            onChange={(e) => setProfileName(e.target.value)}
                            className="h-8 bg-black/40 border-white/20 text-white font-bold"
                            placeholder="Streamer Name"
                          />
                          <Input 
                            value={profilePersonality} 
                            onChange={(e) => setProfilePersonality(e.target.value)}
                            className="h-6 text-xs bg-black/40 border-white/20 text-white/70"
                            placeholder="Personality Tags"
                          />
                      </div>
                  ) : (
                      <>
                        <h2 className="text-xl font-bold text-white tracking-wide">{displayName}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">{profilePersonality}</span>
                            {isLive && <Badge className="bg-red-500 text-white text-[10px] h-4 px-1">LIVE</Badge>}
                        </div>
                      </>
                  )}
                </div>
              </div>

              {/* Center: Controls & Navigation */}
              <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2">
                 <div className="flex items-center gap-2 mb-1">
                    <Gamepad2 className="w-5 h-5 text-white/50" />
                 </div>
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

              {/* Right: Actions */}
              <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-full w-10 h-10 ${isEditingProfile ? 'text-cyan-400 bg-cyan-400/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                    title={isEditingProfile ? "Save Profile" : "Edit Profile"}
                >
                    {isEditingProfile ? <Save className="w-5 h-5" /> : <Pencil className="w-4 h-4" />}
                </Button>

                <div className="text-right hidden sm:block">
                    <div className="text-xs text-white/40 uppercase font-bold">Total Views</div>
                    <div className="text-lg font-mono font-bold text-white">42.5K</div>
                </div>
              </div>
            </div>

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
                        <div className="w-full select-none pt-4 bg-white/5 rounded-2xl p-6 border border-white/10 relative">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    Streaming Schedule 
                                    <span className="text-white/40 text-sm font-normal ml-2">{dateRangeString}</span>
                                    {isEditingProfile && <Badge className="bg-white text-black text-[10px] ml-2">EDITING</Badge>}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Button onClick={handlePrevTwoWeeks} variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronLeft className="w-4 h-4" /></Button>
                                    <Button onClick={handleToday} variant="outline" className="h-8 px-4 rounded-lg bg-white/5 border-white/10 hover:bg-white/10 text-xs font-semibold">Today</Button>
                                    <Button onClick={handleNextTwoWeeks} variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronRight className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}><X className="w-4 h-4" /></Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
                                {scheduleDays.map((date, i) => {
                                    const isCurrentDay = isToday(date);
                                    const dateKey = format(date, 'yyyy-MM-dd');
                                    const dayName = format(date, 'EEE');
                                    const dayNumber = format(date, 'd');
                                    const dayData = scheduleData[dateKey];
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            className={`bg-[#0f1419] p-2 min-h-[140px] flex flex-col items-center relative group hover:bg-[#1a1f2e] transition-colors 
                                                ${isCurrentDay ? 'bg-white/[0.03]' : ''} 
                                            `}
                                        >
                                            <div className="w-full flex justify-between items-start mb-2 px-1">
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{dayName}</span>
                                                <span className={`text-sm font-bold ${isCurrentDay ? 'text-cyan-400' : 'text-white/60'}`}>{dayNumber}</span>
                                            </div>
                                            
                                            {dayData ? (
                                                <div className="w-full bg-white/5 rounded p-2 border border-white/5 text-center relative z-0">
                                                    <div className="text-[10px] text-cyan-300 font-bold mb-1">{dayData.time}</div>
                                                    <div className="text-xs text-white leading-tight font-medium break-words mb-1">{dayData.title}</div>
                                                    {dayData.game && <div className="text-[9px] text-white/60 mb-1 italic">{dayData.game}</div>}
                                                    {dayData.isGiveaway && <Badge className="text-[8px] h-4 px-1 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">GIVEAWAY</Badge>}
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center">
                                                    {isCurrentDay && !isEditingProfile && <span className="text-[10px] text-white/20 italic">No stream</span>}
                                                </div>
                                            )}

                                            {isCurrentDay && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none box-border border-b-2 border-cyan-500/50" />}
                                            
                                            {/* Edit Controls */}
                                            {isEditingProfile && (
                                                <>
                                                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleScheduleClick(date); }}
                                                            className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg pointer-events-auto"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <div className="absolute top-1 right-1 z-10">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleClearSchedule(date); }}
                                                            className="p-1 rounded-full bg-black/60 text-white/40 hover:text-red-400 hover:bg-black/80 transition-colors"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-center text-white/30 text-xs mt-4">Double-click content to collapse • Timezone is localized</p>
                        </div>
                        )}

                        {/* Schedule Edit Modal */}
                        <Dialog open={!!editingScheduleDay} onOpenChange={(open) => !open && setEditingScheduleDay(null)}>
                            <DialogContent className="bg-[#1a1f2e] border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle>Edit Schedule: {editingScheduleDay && format(editingScheduleDay, 'MMMM do, yyyy')}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/60">Time</label>
                                        <Input 
                                            value={scheduleForm.time}
                                            onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
                                            placeholder="e.g. 7:00 PM EST"
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/60">Activity / Title</label>
                                        <Input 
                                            value={scheduleForm.title}
                                            onChange={(e) => setScheduleForm({...scheduleForm, title: e.target.value})}
                                            placeholder="e.g. Ranked Climb"
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/60">Game</label>
                                        <Input 
                                            value={scheduleForm.game}
                                            onChange={(e) => setScheduleForm({...scheduleForm, game: e.target.value})}
                                            placeholder="e.g. Valorant"
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <input 
                                            type="checkbox"
                                            id="giveaway"
                                            checked={scheduleForm.isGiveaway}
                                            onChange={(e) => setScheduleForm({...scheduleForm, isGiveaway: e.target.checked})}
                                            className="w-4 h-4 rounded border-white/10 bg-black/20 text-cyan-500 focus:ring-cyan-500/50"
                                        />
                                        <label htmlFor="giveaway" className="text-sm font-medium text-white/80 cursor-pointer">Doing a Giveaway?</label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setEditingScheduleDay(null)}>Cancel</Button>
                                    <Button onClick={saveScheduleDay} className="bg-white text-black hover:bg-gray-200">Save</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        
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
                
                            {/* Cards Grid */}
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
                                {isEditingProfile && (
                                    <>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all pointer-events-auto"
                                                onClick={(e) => { e.stopPropagation(); /* Mock edit action */ }}
                                            >
                                                <Plus className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                        <button 
                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500/80 hover:text-white text-white/60 flex items-center justify-center transition-colors pointer-events-auto opacity-0 group-hover:opacity-100"
                                            onClick={(e) => { e.stopPropagation(); /* Mock delete action */ }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </>
                                )}
                                </div>
                            ))}
                            </div>
                        </div>
                        )}
                        
                        {activeTab === 'gallery' && (
                            <div className="w-full select-none pt-4 bg-white/5 rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        Gallery
                                        {isEditingProfile && <Badge className="bg-white text-black text-[10px]">EDITING</Badge>}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {isEditingProfile && (
                                            <Button size="sm" className="bg-white text-black hover:bg-slate-200">
                                                <Upload className="w-3 h-3 mr-2" /> Upload
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}><X className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                    {isEditingProfile && (
                                        <div 
                                            onClick={handleGalleryUpload}
                                            className="aspect-video w-[280px] flex-shrink-0 bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2">
                                                <Upload className="w-5 h-5 text-white/60" />
                                            </div>
                                            <span className="text-xs font-bold text-white/40">Upload Image</span>
                                        </div>
                                    )}
                                    {galleryImages.map((img) => (
                                        <div key={img.id} className="aspect-video w-[280px] flex-shrink-0 bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all cursor-pointer group relative">
                                            <img src={img.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                {isEditingProfile ? (
                                                    <>
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <button 
                                                                onClick={handleGalleryUpload}
                                                                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all pointer-events-auto"
                                                            >
                                                                <Plus className="w-5 h-5 text-white" />
                                                            </button>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveGalleryImage(img.id); }}
                                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-500/80 hover:text-white text-white/60 flex items-center justify-center transition-colors pointer-events-auto"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-white font-bold text-sm">View Image</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'games' && (
                            <div className="w-full select-none pt-4 bg-white/5 rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        Games Played
                                        {isEditingProfile && <Badge className="bg-white text-black text-[10px]">EDITING</Badge>}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {isEditingProfile && (
                                            <Button size="sm" className="bg-white text-black hover:bg-slate-200">
                                                <Plus className="w-3 h-3 mr-2" /> Add Game
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}><X className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                    {isEditingProfile && (
                                        <div 
                                            onClick={() => setShowGamePicker(true)}
                                            className="w-[200px] flex-shrink-0 bg-white/5 border-2 border-dashed border-white/10 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 min-h-[80px]"
                                        >
                                            <Plus className="w-6 h-6 text-white/40 mb-2" />
                                            <span className="text-xs font-bold text-white/40">Add Game from Library</span>
                                        </div>
                                    )}
                                    {myGames.map((game, i) => (
                                        <div key={game} className="w-[200px] flex-shrink-0 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer group relative">
                                            <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden flex-shrink-0">
                                                <img src={`https://source.unsplash.com/random/100x100?game,${game}&sig=${i}`} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-white truncate">{game}</div>
                                                <div className="text-xs text-white/40 truncate">FPS • Action</div>
                                            </div>
                                            {isEditingProfile && (
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        className="text-red-400 hover:text-red-300 bg-black/50 rounded-full p-1"
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveGame(game); }}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Game Picker Modal */}
                                <Dialog open={showGamePicker} onOpenChange={setShowGamePicker}>
                                    <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                        <DialogHeader>
                                            <DialogTitle>Add Game from Library</DialogTitle>
                                        </DialogHeader>
                                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-4">
                                            {libraryGames.map(game => (
                                                <div 
                                                    key={game.id} 
                                                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/10 cursor-pointer border border-transparent hover:border-white/20 transition-all"
                                                    onClick={() => handleAddGame(game.title)}
                                                >
                                                    <div className="w-full aspect-[3/4] rounded-md overflow-hidden bg-black/20">
                                                        {game.cover_image ? (
                                                            <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-center font-medium text-white/80 line-clamp-2">{game.title}</span>
                                                </div>
                                            ))}
                                            {/* Mock Games if library is empty */}
                                            {libraryGames.length === 0 && ['Call of Duty', 'Fortnite', 'Rocket League', 'Genshin Impact'].map(g => (
                                                <div 
                                                    key={g} 
                                                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/10 cursor-pointer border border-transparent hover:border-white/20 transition-all"
                                                    onClick={() => handleAddGame(g)}
                                                >
                                                    <div className="w-full aspect-[3/4] rounded-md overflow-hidden bg-black/20">
                                                        <img src={`https://source.unsplash.com/random/200x300?game,${g}`} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-xs text-center font-medium text-white/80 line-clamp-2">{g}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sponsors */}
            <SponsorsSection />

            {/* Products */}
            <ProductsGrid />

            {/* Seasonal Pass (New Skill Tree UI) */}
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
      
      <BottomQuickBar />
    </div>
  );
}