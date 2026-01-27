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
  const [isEditingTabs, setIsEditingTabs] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);

  // Edit State
  const [profileName, setProfileName] = useState(user?.full_name || user?.username || "My Channel");
  const [profilePersonality, setProfilePersonality] = useState("Competitive • Strategic");
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar_url);
  const [scheduleData, setScheduleData] = useState({}); // { 'YYYY-MM-DD': { time: '...', title: '...' } }
  const [editingScheduleDay, setEditingScheduleDay] = useState(null); // Date object
  const [scheduleForm, setScheduleForm] = useState({ time: '', title: '' });
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
      if (!isEditingTabs) return;
      const dateKey = format(date, 'yyyy-MM-dd');
      setEditingScheduleDay(date);
      setScheduleForm(scheduleData[dateKey] || { time: '', title: '' });
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
      <div className="mx-auto max-w-7xl flex flex-col gap-8">
        
        {/* Top Section: Video & Chat */}
        <div className="flex gap-4 flex-col lg:flex-row">
            {/* Stream Box (Liquid Glass) */}
            <div 
                className="flex-[3] rounded-3xl overflow-hidden min-h-[400px] lg:min-h-[520px] relative group border border-white/10 shadow-2xl"
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                }}
            >
                {isLive ? (
                    <div className="w-full h-full relative">
                         {/* Mock Live Stream Content */}
                         <img src="https://source.unsplash.com/random/1280x720?gaming" className="w-full h-full object-cover" />
                         
                         {/* Overlay Gradient */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                         {/* Top Status */}
                         <div className="absolute top-6 left-6 flex items-center gap-3">
                            <div className="bg-red-600 px-3 py-1 rounded text-white text-xs font-bold uppercase animate-pulse shadow-lg shadow-red-600/20">
                                LIVE
                            </div>
                            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded text-white text-xs font-medium flex items-center gap-2 border border-white/10">
                                <MessageSquare className="w-3 h-3 text-white/60" />
                                1.2k Viewers
                            </div>
                         </div>

                         {/* Center Play Button (On Hover) */}
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center pointer-events-auto hover:bg-white/20 hover:scale-110 transition-all"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                            </button>
                         </div>

                         {/* Bottom Controls */}
                         <div className="absolute bottom-0 left-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {/* Stream Info */}
                            <div className="mb-4">
                                <h3 className="font-bold text-xl text-white drop-shadow-md">My Awesome Stream Title</h3>
                                <p className="text-sm text-cyan-400 font-medium">Playing: Valorant</p>
                            </div>

                            {/* Control Bar */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-cyan-400 transition-colors">
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    </button>
                                    
                                    <div className="flex items-center gap-2 group/vol">
                                        <Volume2 className="w-5 h-5 text-white" />
                                        <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                                            <div className="w-20 h-1 bg-white/30 rounded-full ml-2 relative cursor-pointer">
                                                <div className="absolute left-0 top-0 bottom-0 bg-white rounded-full" style={{ width: `${volume}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-white/60 font-mono">
                                        <span className="text-red-500">●</span> 02:14:35
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button className="text-white/70 hover:text-white transition-colors" title="Settings">
                                        <Settings className="w-5 h-5" />
                                    </button>
                                    <button className="text-white/70 hover:text-white transition-colors" title="Fullscreen">
                                        <Maximize className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                         </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                            <WifiOff className="w-8 h-8 text-white/40" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Currently Offline</h2>
                        <p className="text-white/40 max-w-md">
                            You are not streaming right now. Go live to interact with your audience!
                        </p>
                        <Button 
                            className="mt-6 bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-600/20"
                            onClick={toggleLiveStatus}
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Start Test Stream
                        </Button>
                    </div>
                )}
            </div>

            {/* Chat Box (Liquid Glass) */}
            <div 
                className="flex-[2] h-[400px] lg:h-[520px] rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl"
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                }}
            >
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <span className="text-white font-bold text-sm flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-cyan-400" /> Stream Chat
                    </span>
                    {isLive ? (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Online</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offline</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 relative scrollbar-hide">
                    {isLive ? (
                        <>
                            <div className="text-center py-4">
                                <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Welcome to the chat</p>
                            </div>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex gap-3 items-start animate-in slide-in-from-bottom-2 fade-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex-shrink-0 overflow-hidden p-0.5">
                                        <img src={`https://source.unsplash.com/random/100x100?face&sig=${i}`} className="w-full h-full object-cover rounded-full" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer">Viewer_{i + 1}</span>
                                            {i % 3 === 0 && <Badge className="bg-purple-500/20 text-purple-300 text-[8px] h-4 px-1 border-0">SUB</Badge>}
                                            <span className="text-[10px] text-white/20">{format(new Date(), 'h:mm a')}</span>
                                        </div>
                                        <p className="text-sm text-white/80 leading-snug mt-0.5 font-medium shadow-black drop-shadow-sm">
                                            This is a simulated chat message! loving the stream!
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <MessageSquare className="w-6 h-6 opacity-40" />
                            </div>
                            <p className="text-sm font-medium">Chat is offline</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/10 bg-white/[0.02]">
                    <div className="relative">
                        <input 
                            disabled={!isLive}
                            placeholder={isLive ? "Send a message..." : "Chat is disabled when offline"}
                            className="w-full h-11 rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-white/20"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white" disabled={!isLive}>
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
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
                    <button 
                        onClick={() => setIsEditingTabs(!isEditingTabs)}
                        className={`p-1 rounded-full transition-all ${isEditingTabs ? 'bg-white text-black' : 'text-white/30 hover:text-white'}`}
                        title="Edit Sections"
                    >
                        <Settings className="w-3 h-3" />
                    </button>
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
                                    {isEditingTabs && <Badge className="bg-white text-black text-[10px] ml-2">EDITING</Badge>}
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
                                            onClick={() => handleScheduleClick(date)}
                                            className={`bg-[#0f1419] p-2 min-h-[140px] flex flex-col items-center relative group hover:bg-[#1a1f2e] transition-colors 
                                                ${isCurrentDay ? 'bg-white/[0.03]' : ''} 
                                                ${isEditingTabs ? 'cursor-pointer hover:bg-white/5' : ''}
                                            `}
                                        >
                                            <div className="w-full flex justify-between items-start mb-2 px-1">
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{dayName}</span>
                                                <span className={`text-sm font-bold ${isCurrentDay ? 'text-cyan-400' : 'text-white/60'}`}>{dayNumber}</span>
                                            </div>
                                            
                                            {dayData ? (
                                                <div className="w-full bg-white/5 rounded p-2 border border-white/5 text-center">
                                                    <div className="text-[10px] text-cyan-300 font-bold mb-1">{dayData.time}</div>
                                                    <div className="text-xs text-white leading-tight font-medium break-words">{dayData.title}</div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center">
                                                    {isCurrentDay && !isEditingTabs && <span className="text-[10px] text-white/20 italic">No stream</span>}
                                                </div>
                                            )}

                                            {isCurrentDay && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none box-border border-b-2 border-cyan-500/50" />}
                                            
                                            {/* Edit Overlay */}
                                            {isEditingTabs && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[1px]">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Pencil className="w-4 h-4 text-white/80" />
                                                        <span className="text-[9px] text-white/60 font-medium">Edit Day</span>
                                                    </div>
                                                </div>
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
                                        {isEditingTabs && <Badge className="bg-white text-black text-[10px]">EDITING</Badge>}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {isEditingTabs && (
                                            <Button size="sm" className="bg-white text-black hover:bg-slate-200">
                                                <Upload className="w-3 h-3 mr-2" /> Upload
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}><X className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                    {isEditingTabs && (
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
                                                {isEditingTabs ? (
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            variant="destructive" 
                                                            size="icon" 
                                                            className="rounded-full h-8 w-8"
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveGalleryImage(img.id); }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="secondary" size="icon" className="rounded-full h-8 w-8" onClick={handleGalleryUpload}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    </div>
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
                                        {isEditingTabs && <Badge className="bg-white text-black text-[10px]">EDITING</Badge>}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {isEditingTabs && (
                                            <Button size="sm" className="bg-white text-black hover:bg-slate-200">
                                                <Plus className="w-3 h-3 mr-2" /> Add Game
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}><X className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                    {isEditingTabs && (
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
                                            {isEditingTabs && (
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