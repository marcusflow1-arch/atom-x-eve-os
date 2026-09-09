import { useState } from 'react';
import { Box, Play } from 'lucide-react';
import YBotPlayerViewer from '@/components/3d/YBotPlayerViewer';

export default function AchievementDemonstration({ achievement }) {
  const [requests, setRequests] = useState(0);
  if (!achievement) return <div className="flex h-full items-center justify-center text-sm text-white/30">Select an achievement card to open its demonstration.</div>;
  return <div className="grid h-full min-h-0 grid-cols-2 gap-4 pt-4">
    <div className="relative min-h-0 overflow-hidden border border-white/10 bg-black/30"><video key={achievement.id} controls muted loop className="h-full w-full object-cover" aria-label={`${achievement.name} video demonstration`}><source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" /></video><span className="absolute left-3 top-3 flex items-center gap-1 bg-black/65 px-2 py-1 text-[9px] uppercase tracking-wider text-white/70"><Play className="h-3 w-3" /> Demonstration</span></div>
    <div className="grid min-h-0 grid-cols-[1fr_38%] gap-4"><div className="overflow-y-auto"><div className="text-[9px] uppercase tracking-widest text-cyan-300/60">Achievement details</div><h4 className="mt-1 text-lg font-bold text-white">{achievement.name}</h4><p className="mt-2 text-xs leading-5 text-white/55">{achievement.description}</p><div className="mt-4 grid grid-cols-3 gap-2">{Object.entries(achievement.stats).map(([key, value]) => <div key={key} className="border border-white/10 bg-white/[0.03] p-2"><div className="text-[8px] uppercase text-white/30">{key}</div><div className="mt-1 text-sm font-bold text-white">{value}</div></div>)}</div></div>
      <button type="button" onClick={() => setRequests((value) => value + 1)} className="relative min-h-0 overflow-hidden border border-white/10 bg-cyan-300/[0.04]" aria-label="Run Y-bot achievement demonstration"><YBotPlayerViewer className="h-full w-full" /><span className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1 bg-black/60 px-2 py-1 text-[8px] uppercase tracking-wider text-white/70"><Box className="h-3 w-3" /> Run demo {requests ? `· ${requests}` : ''}</span></button>
    </div>
  </div>;
}