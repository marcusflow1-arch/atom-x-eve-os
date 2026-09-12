import React, { useState } from 'react';
import { ChevronRight, ExternalLink, Plus, Target, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CreateFarmRouteModal from '@/components/farm/CreateFarmRouteModal';

const DIFFICULTY_COLORS = {
  easy: 'text-green-300/65 border-green-300/15',
  medium: 'text-yellow-200/65 border-yellow-200/15',
  hard: 'text-orange-200/65 border-orange-200/15',
  extreme: 'text-red-200/65 border-red-200/15',
};

export default function FarmingZone({ game, clan }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const goToPublicFarm = () => navigate(`/farm?gameId=${game.id}`, { state: { from: 'clan', clanId: clan.id, activeZone: 'farming' } });

  const { data: farmRoutes = [], isLoading } = useQuery({
    queryKey: ['farmRoutes', game?.id, clan?.id],
    queryFn: async () => {
      if (!game?.id || !clan?.id) return [];
      try {
        const result = await base44.functions.invoke('getFarmRoutes', { gameId: game.id, clanId: clan.id });
        return result?.data?.routes || result?.routes || [];
      } catch {
        const routes = await base44.entities.FarmRoute.filter({ clan_id: clan.id, game_id: game.id }, '-created_date', 150);
        return routes || [];
      }
    },
    enabled: !!game?.id && !!clan?.id,
    refetchInterval: 10000,
  });

  return <div className="flex h-full min-h-0">
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28">Resource operations</div><h4 className="mt-1 text-sm font-semibold text-white/82">Farming Board</h4><p className="mt-1 text-[9px] text-white/25">Routes, materials and strategies for this game—including resources used to upgrade achievement cards.</p></div>
        <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="h-8 gap-2 border-white/[0.07] bg-white/[0.025] text-[10px] text-white/48 hover:bg-white/[0.06] hover:text-white"><Plus className="h-3.5 w-3.5" />Add Route</Button><Button size="sm" variant="ghost" onClick={goToPublicFarm} className="h-8 gap-2 text-[10px] text-cyan-100/50 hover:bg-cyan-100/[0.04] hover:text-cyan-100/75"><ExternalLink className="h-3.5 w-3.5" />Farm Hub</Button></div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {isLoading && <div className="col-span-full py-12 text-center text-xs text-white/28">Loading farming plans…</div>}
          {!isLoading && farmRoutes.map((item) => {
            const expanded = expandedId === item.id;
            return <button type="button" key={item.id} onClick={() => setExpandedId(expanded ? null : item.id)} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 text-left transition hover:border-amber-100/10 hover:bg-white/[0.035]">
              <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100/[0.055] text-amber-100/55"><Target className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><strong className="truncate text-xs font-semibold text-white/78">{item.title}</strong><ChevronRight className={`ml-auto h-3.5 w-3.5 text-white/25 transition ${expanded ? 'rotate-90' : ''}`} /></div><p className="mt-1 line-clamp-2 text-[10px] leading-5 text-white/35">{item.description || 'No route description.'}</p></div></div>
              <div className="mt-3 flex flex-wrap gap-1.5"><Badge variant="outline" className="border-white/[0.06] text-[8px] text-white/32">{item.route_type || item.type || 'Resource'}</Badge>{item.difficulty && <Badge variant="outline" className={`text-[8px] ${DIFFICULTY_COLORS[item.difficulty] || 'border-white/[0.06] text-white/32'}`}>{item.difficulty}</Badge>}<Badge variant="outline" className="border-white/[0.06] text-[8px] text-white/30">By {item.author_name || item.authorName || 'Clan member'}</Badge></div>
              {expanded && <div className="mt-4 space-y-3 border-t border-white/[0.05] pt-3">{item.video_url && <div className="flex items-center gap-2 text-[9px] text-blue-200/50"><Video className="h-3 w-3" /><a href={item.video_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="truncate hover:underline">{item.video_url}</a></div>}{item.tactics && <div><div className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/28">Farming strategy</div><p className="mt-1 whitespace-pre-wrap text-[10px] leading-5 text-white/42">{item.tactics}</p></div>}</div>}
            </button>;
          })}
          {!isLoading && !farmRoutes.length && <div className="col-span-full rounded-2xl border border-dashed border-white/[0.07] py-14 text-center"><Target className="mx-auto h-8 w-8 text-white/12" /><p className="mt-3 text-xs text-white/30">No farming routes for this game yet.</p><p className="mt-1 text-[9px] text-white/20">Document the first resource route or farming strategy for your clan.</p></div>}
        </div>
      </ScrollArea>
    </section>
    <aside className="w-72 shrink-0 border-l border-white/[0.055]"><ZoneChatPanel clanId={clan?.id} gameId={game?.id} zoneId="farming" title="Farming Comms" /></aside>
    <CreateFarmRouteModal open={showCreate} onClose={() => setShowCreate(false)} gameId={game?.id} clanId={clan?.id} onCreated={() => queryClient.invalidateQueries({ queryKey: ['farmRoutes', game?.id, clan?.id] })} />
  </div>;
}
