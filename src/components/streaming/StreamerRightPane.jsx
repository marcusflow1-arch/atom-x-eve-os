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

      {/* Bottom: profile tile + cards section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* Profile tile */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-white/15">
              {streamer?.avatar ? (
                <img src={streamer.avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold truncate">{name}</div>
              <div className="text-xs text-white/50 truncate">Personality: Variety</div>
            </div>
          </div>

          {/* Center icon + follow */}
          <div className="flex flex-col items-center justify-center mt-4">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white/80" />
            </div>
            <Button className="mt-3 h-8 px-4 text-xs">Follow</Button>
          </div>

          {/* Two small dropdowns */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Select>
              <SelectTrigger className="h-9 rounded-xl bg-white/10 border-white/15 text-xs text-white/80">
                <SelectValue placeholder="Schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisweek">This week</SelectItem>
                <SelectItem value="next2">Next 2 weeks</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-9 rounded-xl bg-white/10 border-white/15 text-xs text-white/80">
                <SelectValue placeholder="Cards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="powers">Powers</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="companion">Companion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Decorative lines with center circle */}
          <div className="relative mt-5">
            <div className="h-px bg-white/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-black/40 border border-white/20" />
            </div>
            <div className="absolute inset-x-6 top-0 translate-y-[-8px] h-px bg-white/30" />
          </div>
        </div>

        {/* Cards section */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
          <div className="flex flex-wrap items-center gap-3 mb-3 text-white/80 text-sm font-semibold">
            <span className="text-white/90">Game Title</span>
            <span className="opacity-50">•</span>
            <span>Collectible</span>
            <span className="opacity-50">•</span>
            <span>Achievements</span>
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2 mb-4">
            {['Powers', 'Equipment', 'Companion'].map((t) => (
              <Button key={t} variant="outline" className="h-8 px-3 rounded-xl text-xs">
                {t}
              </Button>
            ))}
          </div>

          {/* Placeholder cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl border border-white/10 bg-white/5">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-700/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}