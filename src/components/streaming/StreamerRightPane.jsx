import React from 'react';
import { Gamepad2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StreamerRightPane({ streamer }) {
  const name = streamer?.name || 'Streamer';

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
      <div className="mt-6 flex flex-col gap-6">
        {/* Streamer Info Bar */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left: Avatar + Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-lg">
              {streamer?.avatar ? (
                <img src={streamer.avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10" />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-white tracking-wide">{name}</h2>
              <span className="text-sm text-white/60 font-medium">Chill • Creative • Supportive</span>
            </div>
          </div>

          {/* Center: Controls & Navigation */}
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white/70" />
            </div>
            
            <div className="flex items-center bg-black/20 rounded-full p-1 border border-white/5">
              <button className="px-5 py-2 rounded-full text-sm font-semibold bg-white/10 text-white shadow-sm transition-all hover:bg-white/20">
                Schedule
              </button>
              <button className="px-5 py-2 rounded-full text-sm font-semibold text-white/50 hover:text-white transition-all">
                Cards
              </button>
            </div>
          </div>

          {/* Right: Actions & Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-white/60">
               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               <span className="font-mono text-sm">1,245 Watching</span>
            </div>
            
            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/10 bg-white/5 hover:bg-white/10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Button>
              <Button className="rounded-full px-6 font-bold bg-white text-black hover:bg-slate-200">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Cards Content (Full Width) */}
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
      </div>
    </div>
  );
}