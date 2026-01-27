import React, { useState } from 'react';
import { Gamepad2, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StreamerRightPane({ streamer }) {
  const name = streamer?.name || 'Streamer';
  const [activeTab, setActiveTab] = useState('schedule');

  return (
    <div className="w-full">
      {/* Top row: Stream video + Live chat */}
      <div className="flex gap-4">
        {/* Stream box (bigger) */}
        <div className="flex-[3] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <div className="h-[520px] w-full relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 to-slate-800/20" />
            <div className="relative flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                <Play className="w-7 h-7 text-white/80" />
              </div>
              <p className="text-white/60 text-sm">Live stream preview</p>
            </div>
          </div>
        </div>

        {/* Live chat (smaller) */}
        <div className="flex-[2] h-[520px] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-white/80 text-sm font-semibold">Live Chat</span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">1.2k watching</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
          <div className="p-3 border-t border-white/10">
            <div className="h-9 w-full rounded-xl bg-white/10 border border-white/15" />
          </div>
        </div>
      </div>

      {/* Bottom: Profile Info Bar & Content */}
      <div className="mt-4 flex flex-col">
        {/* Streamer Info Bar - Clean Strip */}
        <div className="w-full px-2 py-4 flex flex-col md:flex-row items-center justify-between gap-6 relative">
          
          {/* Left: Avatar + Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/10">
              {streamer?.avatar ? (
                <img src={streamer.avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10" />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-white tracking-wide">{name}</h2>
              <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Follow</span>
            </div>
          </div>

          {/* Center: Controls & Navigation */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
             <Gamepad2 className="w-5 h-5 text-white/50 mb-1" />
             <div className="flex items-center gap-8 text-sm font-medium">
                <button 
                  onClick={() => setActiveTab('schedule')}
                  className={`pb-1 px-1 transition-colors border-b-2 ${activeTab === 'schedule' ? 'text-white border-white' : 'text-white/50 border-transparent hover:text-white'}`}
                >
                  Schedule
                </button>
                <button 
                  onClick={() => setActiveTab('cards')}
                  className={`pb-1 px-1 transition-colors border-b-2 ${activeTab === 'cards' ? 'text-white border-white' : 'text-white/50 border-transparent hover:text-white'}`}
                >
                  Cards
                </button>
             </div>
          </div>

          {/* Right: Actions & Stats */}
          <div className="flex items-center gap-4">
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

        {/* Tab Content */}
        {activeTab === 'schedule' ? (
           <div className="w-full">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">Streaming Schedule <span className="text-white/40 text-sm font-normal ml-2">Jan 26 - Feb 8, 2026</span></h3>
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronLeft className="w-4 h-4" /></Button>
                   <Button variant="outline" className="h-8 px-4 rounded-lg bg-white/5 border-white/10 hover:bg-white/10 text-xs font-semibold">Today</Button>
                   <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronRight className="w-4 h-4" /></Button>
                </div>
             </div>

             <div className="grid grid-cols-7 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={day} className="bg-[#0f1419] p-4 min-h-[140px] flex flex-col items-center gap-2 relative group hover:bg-[#1a1f2e] transition-colors">
                     <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{day}</span>
                     <span className={`text-xl font-bold ${i === 0 ? 'text-cyan-400' : 'text-white'}`}>{26 + i}</span>
                     {i === 0 && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />}
                  </div>
                ))}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={`${day}-2`} className="bg-[#0f1419] p-4 min-h-[140px] flex flex-col items-center gap-2 relative group hover:bg-[#1a1f2e] transition-colors">
                     <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{day}</span>
                     <span className="text-xl font-bold text-white">{2 + i}</span>
                  </div>
                ))}
             </div>
             <p className="text-center text-white/30 text-xs mt-4">Timezone is localized • Viewers see your schedule in their own timezone</p>
           </div>
        ) : (
           <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
             <div className="flex items-center justify-between mb-6">
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
   
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {Array.from({ length: 10 }).map((_, i) => (
                 <div key={i} className="group relative aspect-[3/4] rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-white/30 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer">
                   <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                   <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                   
                   <div className="absolute top-3 left-3">
                     <Badge className="bg-black/40 backdrop-blur-md border-white/10 text-[10px] h-5">Common</Badge>
                   </div>
                   
                   <div className="absolute bottom-3 left-3 right-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                     <div className="text-sm font-bold text-white">Item Name {i+1}</div>
                     <div className="text-[10px] text-white/60">Unlockable Reward</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}
      </div>
    </div>
  );
}