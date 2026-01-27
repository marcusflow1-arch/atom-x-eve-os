import React, { useState } from 'react';
import { Play, Gamepad2, ChevronLeft, ChevronRight, Save, Pencil, MessageSquare, WifiOff, X } from 'lucide-react';
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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
            {/* Stream Box */}
            <div className="flex-[3] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden min-h-[400px] lg:min-h-[520px] relative group">
                {isLive ? (
                    <div className="w-full h-full bg-black relative">
                         {/* Mock Live Stream Content */}
                         <img src="https://source.unsplash.com/random/1280x720?gaming" className="w-full h-full object-cover opacity-80" />
                         <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded text-white text-xs font-bold uppercase animate-pulse">
                            LIVE
                         </div>
                         <div className="absolute bottom-4 left-4 text-white drop-shadow-md">
                            <h3 className="font-bold text-lg">My Awesome Stream Title</h3>
                            <p className="text-sm opacity-80">Playing: Valorant</p>
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
                            className="mt-6 bg-red-600 hover:bg-red-700 text-white border-none"
                            onClick={toggleLiveStatus}
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Start Test Stream
                        </Button>
                    </div>
                )}
            </div>

            {/* Chat Box */}
            <div className="flex-[2] h-[400px] lg:h-[520px] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <span className="text-white/80 text-sm font-semibold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Stream Chat
                    </span>
                    {isLive ? (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Online</Badge>
                    ) : (
                        <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">Offline</Badge>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                    {isLive ? (
                        <>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex gap-3 items-start animate-in slide-in-from-bottom-2 fade-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex-shrink-0 overflow-hidden">
                                        <img src={`https://source.unsplash.com/random/100x100?face&sig=${i}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-cyan-400">Viewer_{i + 1}</span>
                                            <span className="text-[10px] text-white/30">{format(new Date(), 'h:mm a')}</span>
                                        </div>
                                        <p className="text-sm text-white/80 leading-snug mt-0.5">
                                            This is a simulated chat message! loving the stream!
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                            <p>Chat is offline</p>
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-white/10 bg-white/5">
                    <div className="relative">
                        <input 
                            disabled={!isLive}
                            placeholder={isLive ? "Send a message..." : "Chat is disabled when offline"}
                            className="w-full h-10 rounded-xl bg-black/20 border border-white/10 px-4 text-sm text-white focus:outline-none focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
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
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-full w-10 h-10 ${isEditingProfile ? 'text-cyan-400 bg-cyan-400/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
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
            <SponsorsSection isEditing={isEditingProfile} />

            {/* Products */}
            <ProductsGrid isEditing={isEditingProfile} />

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