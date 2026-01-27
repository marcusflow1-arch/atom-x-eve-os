import React, { useState } from 'react';
import { Play, Pause, Gamepad2, ChevronLeft, ChevronRight, Save, Pencil, MessageSquare, WifiOff, X, Volume2, Settings, Maximize, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { format, addDays, startOfWeek, subDays, isToday } from 'date-fns';

import SponsorsSection from '@/components/streaming/profile/SponsorsSection';
import ProductsGrid from '@/components/streaming/profile/ProductsGrid';
import ViewerSeasonalPass from '@/components/streaming/ViewerSeasonalPass';
import StreamerCardDetailModal from '@/components/streaming/StreamerCardDetailModal';
import { useAuth } from '@/components/auth/AuthContext';
import BottomQuickBar from '@/components/streaming/BottomQuickBar';

export default function StreamingHome() {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false); // Default to offline for home page
  const [activeTab, setActiveTab] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [scheduleBaseDate, setScheduleBaseDate] = useState(new Date());
  const [isEditingProfile, setIsEditingProfile] = useState(false); // Kept for header edit, but sections handle their own
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);

  // User Data (Fallback if auth not ready)
  const displayName = user?.full_name || user?.username || "My Channel";
  const avatar = user?.avatar_url;

  // Schedule Logic
  const startDate = startOfWeek(scheduleBaseDate, { weekStartsOn: 1 });
  const scheduleDays = Array.from({ length: 14 }).map((_, i) => addDays(startDate, i));
  const endDate = scheduleDays[13];
  const dateRangeString = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

  const handlePrevTwoWeeks = () => setScheduleBaseDate(prev => subDays(prev, 14));
  const handleNextTwoWeeks = () => setScheduleBaseDate(prev => addDays(prev, 14));
  const handleToday = () => setScheduleBaseDate(new Date());

  const toggleLiveStatus = () => setIsLive(!isLive);

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
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/10 bg-black">
                  {avatar ? (
                    <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                        {displayName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-white tracking-wide">{displayName}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50 font-medium uppercase tracking-wider">My Channel</span>
                    {isLive && <Badge className="bg-red-500 text-white text-[10px] h-4 px-1">LIVE</Badge>}
                  </div>
                </div>
              </div>

              {/* Center: Controls & Navigation */}
              <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2">
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

              {/* Right: Actions */}
              <div className="flex items-center gap-4">
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
                    >
                        {/* Tab Contents (Simplified for brevity, same structure as RightPane) */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white capitalize">{activeTab} Manager</h3>
                                <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}><X className="w-4 h-4" /></Button>
                            </div>
                            <div className="h-40 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl text-white/30">
                                {activeTab === 'schedule' && "Schedule Editor Placeholder"}
                                {activeTab === 'cards' && "Card Collection Manager Placeholder"}
                                {activeTab === 'gallery' && "Gallery Uploads Placeholder"}
                                {activeTab === 'games' && "Game Library Manager Placeholder"}
                            </div>
                        </div>
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