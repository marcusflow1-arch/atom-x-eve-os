import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { addDays, format, isToday, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, Gamepad2, X, User, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SponsorsSection from '@/components/streaming/profile/SponsorsSection';
import ProductsGrid from '@/components/streaming/profile/ProductsGrid';
import ViewerSeasonPass from '@/components/streaming/profile/ViewerSeasonPass';
import StreamPlayerBox from '@/components/streaming/StreamPlayerBox';
import StreamChatBox from '@/components/streaming/StreamChatBox';

export default function StreamerProfilePanel({ streamer }) {
  const name = streamer?.name || 'Streamer';
  const avatar = streamer?.avatar;
  const tagline = streamer?.tagline || 'COMPETITIVE • STRATEGIC';

  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [scheduleBaseDate, setScheduleBaseDate] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  const startDate = useMemo(() => startOfWeek(scheduleBaseDate, { weekStartsOn: 1 }), [scheduleBaseDate]);
  const scheduleDays = useMemo(() => Array.from({ length: 14 }).map((_, i) => addDays(startDate, i)), [startDate]);
  const endDate = scheduleDays[13];
  const dateRangeString = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

  return (
    <div className="w-full min-w-0 flex flex-col gap-8">
      {/* Top: Player + Chat */}
      {/* Keep the top edge anchored while extending the player/chat downward by ~35%. */}
      <div className="flex gap-4 h-[460px] md:h-[515px] lg:h-[570px]">
        <div className="basis-[85%] min-w-0 h-full">
          <StreamPlayerBox isLive={isLive} onToggleLive={() => setIsLive(!isLive)} isPlaying={!false} onTogglePlay={() => {}} volume={70} onVolumeChange={() => {}} />
        </div>
        <div className="basis-[15%] h-full">
          <StreamChatBox isLive={isLive} />
        </div>
      </div>

      {/* Header Bar */}
      <div className="w-full py-4 flex items-center relative border-b border-white/10 min-h-[80px]">
        {/* Left: Streamer Info */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/10 bg-black flex-shrink-0">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                {name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white tracking-wide truncate">{name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest truncate">PERSONALITY</span>
              {isLive && <Badge className="bg-red-500 text-white text-[10px] h-4 px-1">LIVE</Badge>}
            </div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="w-full flex justify-center">
          <div className="flex items-center gap-8">
            {['Schedule','Cards','Gallery','Games'].map((t) => {
              const id = t.toLowerCase();
              const isActive = activeTab === id;
              return (
                <button 
                  key={id} 
                  onClick={() => setActiveTab(isActive ? null : id)}
                  className={`text-sm font-medium transition-all relative py-2 ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}`}
                >
                  {t}
                  {isActive && <motion.div layoutId="activeTabStreamerPanel" className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4 z-10">
          <button className="text-white/40 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
          </button>
          <Button className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-bold text-xs">
            Subscribe
          </Button>
          <div className="hidden sm:flex items-center gap-1 text-white/60 text-xs font-bold">
             <User className="w-3 h-3" /> 1.2K
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      {activeTab === 'schedule' && (
        <div className="w-full select-none pt-4 bg-white/5 rounded-2xl p-6 border border-white/10" onDoubleClick={() => setActiveTab(null)}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              Streaming Schedule <span className="text-white/40 text-sm font-normal ml-2">{dateRangeString}</span>
            </h3>
            <div className="flex items-center gap-2">
              <Button onClick={() => setScheduleBaseDate(d => addDays(d, -14))} variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronLeft className="w-4 h-4" /></Button>
              <Button onClick={() => setScheduleBaseDate(new Date())} variant="outline" className="h-8 px-4 rounded-lg bg-white/5 border-white/10 hover:bg-white/10 text-xs font-semibold">Today</Button>
              <Button onClick={() => setScheduleBaseDate(d => addDays(d, 14))} variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronRight className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}><X className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {scheduleDays.map((date, i) => {
              const isCurrentDay = isToday(date);
              const dayName = format(date, 'EEE');
              const dayNumber = format(date, 'd');
              return (
                <div key={i} className={`bg-[#0f1419] p-2 min-h-[120px] flex flex-col items-center relative group hover:bg-[#1a1f2e] transition-colors ${isCurrentDay ? 'bg-white/[0.03]' : ''}`}>
                  <div className="w-full flex justify-between items-start mb-2 px-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{dayName}</span>
                    <span className={`text-sm font-bold ${isCurrentDay ? 'text-cyan-400' : 'text-white/60'}`}>{dayNumber}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    {isCurrentDay && <span className="text-[10px] text-white/20 italic">No stream</span>}
                  </div>
                  {isCurrentDay && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none box-border border-b-2 border-cyan-500/50" />}
                </div>
              );
            })}
          </div>

          <p className="text-center text-white/30 text-xs mt-4">Double-click content to collapse • Timezone is localized</p>
        </div>
      )}

      {activeTab === 'cards' && (
        <div className="w-full select-none pt-4 bg-white/5 rounded-2xl p-6 border border-white/10" onDoubleClick={() => setActiveTab(null)}>
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">Stream Collection</h3>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20">Season 0</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="group relative aspect-[3/4] rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:scale-105 hover:border-white/30 hover:shadow-lg hover:shadow-cyan-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
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
        <div className="w-full select-none pt-4 bg-white/5 rounded-2xl p-6 border border-white/10" onDoubleClick={() => setActiveTab(null)}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">Gallery</h3>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video w-[260px] flex-shrink-0 bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all cursor-pointer">
                <img src={`https://source.unsplash.com/random/800x600?gaming,setup&sig=${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'games' && (
        <div className="w-full select-none pt-4 bg-white/5 rounded-2xl p-6 border border-white/10" onDoubleClick={() => setActiveTab(null)}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold text-lg flex items-center gap-2"><Gamepad2 className="w-4 h-4 text-cyan-400" /> Games Played</h3>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab(null)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="flex gap-3 flex-wrap">
            {['Valorant','Apex Legends','League of Legends','Overwatch 2','Minecraft','Destiny 2','Elden Ring','Cyberpunk 2077'].map((g, i) => (
              <div key={g} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm flex items-center gap-2 hover:bg-white/10">
                <div className="w-6 h-6 rounded-md overflow-hidden bg-black/30">
                  <img src={`https://source.unsplash.com/random/60x60?game,${g}&sig=${i}`} className="w-full h-full object-cover" />
                </div>
                {g}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sponsors, Products, Season Pass */}
      <SponsorsSection allowEditing={false} />
      <ProductsGrid allowEditing={false} />
      <div className="w-full mt-12 mb-20">
        <h3 className="text-xl font-bold text-white mb-6">Your Channel Season Pass</h3>
        <ViewerSeasonPass />
      </div>
    </div>
  );
}