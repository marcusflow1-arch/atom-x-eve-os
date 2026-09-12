import React, { useState } from 'react';
import { Brain, ChevronLeft, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';
import StrategyUpload from '@/components/clan/strategy/StrategyUpload';
import StrategyCard from '@/components/clan/strategy/StrategyCard';
import { useAuth } from '@/components/auth/AuthContext';

export default function StrategyZone({ game, clan }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('list');
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  const { data: membership } = useQuery({
    queryKey: ['tacticsMembership', clan?.id, user?.id],
    queryFn: async () => {
      const rows = await base44.entities.ClanMember.filter({ clan_id: clan.id, user_id: user.id });
      return rows?.[0] || null;
    },
    enabled: !!clan?.id && !!user?.id,
  });
  const canSetVisibility = ['leader', 'officer'].includes(membership?.role);

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['strategies', game?.id, clan?.id],
    queryFn: async () => {
      if (!game?.id || !clan?.id) return [];
      const rows = await base44.entities.Strategy.filter({ game_id: game.id, clan_id: clan.id }, '-created_date', 100);
      return rows?.data || rows || [];
    },
    enabled: !!game?.id && !!clan?.id,
    refetchInterval: 10000,
  });

  const handleCreated = () => {
    setMode('list');
    queryClient.invalidateQueries({ queryKey: ['strategies', game?.id, clan?.id] });
  };

  return <div className="flex h-full min-h-0">
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          {mode !== 'list' && <Button size="sm" variant="ghost" onClick={() => { setMode('list'); setSelectedStrategy(null); }} className="gap-1 text-white/40 hover:text-white"><ChevronLeft className="h-4 w-4" />Back</Button>}
          <div><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28">Planning & coordination</div><h4 className="mt-1 flex items-center gap-2 text-sm font-semibold text-white/82"><Brain className="h-4 w-4 text-violet-200/55" />{mode === 'create' ? 'New Tactic' : mode === 'detail' ? selectedStrategy?.title : 'Tactics Board'}</h4></div>
          <Badge variant="outline" className="border-white/[0.06] text-[9px] text-white/32">{strategies.length}</Badge>
        </div>
        {mode === 'list' && <Button size="sm" variant="outline" onClick={() => setMode('create')} className="h-8 gap-2 border-white/[0.07] bg-white/[0.025] text-[10px] text-white/50 hover:bg-white/[0.06] hover:text-white"><Plus className="h-3.5 w-3.5" />Post Tactic</Button>}
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-5">
          {mode === 'create' && <StrategyUpload clanId={clan.id} gameId={game.id} canSetVisibility={canSetVisibility} onCreated={handleCreated} />}
          {mode === 'detail' && selectedStrategy && <div className="mx-auto max-w-3xl space-y-6">
            <div><h2 className="text-xl font-semibold text-white/90">{selectedStrategy.title}</h2>{selectedStrategy.summary && <p className="mt-2 text-xs leading-5 text-white/42">{selectedStrategy.summary}</p>}<div className="mt-3 flex gap-2"><Badge className="border-0 bg-violet-200/[0.08] text-violet-100/60">Tactic</Badge><Badge className="border-0 bg-white/[0.045] text-white/38">{(selectedStrategy.visibility || 'clan').toUpperCase()}</Badge></div></div>
            {!!selectedStrategy.steps?.length && <div><div className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">Execution steps</div><ol className="space-y-2">{selectedStrategy.steps.map((step, index) => <li key={index} className="flex gap-3 rounded-xl border border-white/[0.055] bg-white/[0.025] p-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-200/[0.08] text-[9px] text-violet-100/60">{index + 1}</span><span className="text-xs leading-5 text-white/55">{step}</span></li>)}</ol></div>}
            {!!selectedStrategy.media_urls?.length && <div><div className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">Reference media</div><div className="grid grid-cols-2 gap-3">{selectedStrategy.media_urls.map((url, index) => /\.(mp4|webm|ogg)$/i.test(url) ? <video key={index} src={url} controls className="w-full rounded-xl border border-white/[0.06]" /> : <img key={index} src={url} alt="" className="aspect-video w-full rounded-xl border border-white/[0.06] object-cover" />)}</div></div>}
            {!!selectedStrategy.voice_urls?.length && <div><div className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">Voice notes</div><div className="space-y-2">{selectedStrategy.voice_urls.map((url, index) => <audio key={index} src={url} controls className="w-full" />)}</div></div>}
          </div>}
          {mode === 'list' && <div className="grid gap-3 md:grid-cols-2">{isLoading ? <div className="col-span-full py-12 text-center text-xs text-white/30">Loading tactics…</div> : strategies.length ? strategies.map((strategy) => <button type="button" key={strategy.id} onClick={() => { setSelectedStrategy(strategy); setMode('detail'); }} className="text-left"><StrategyCard s={strategy} /></button>) : <div className="col-span-full rounded-2xl border border-dashed border-white/[0.07] py-14 text-center"><Brain className="mx-auto h-8 w-8 text-white/12" /><p className="mt-3 text-xs text-white/30">No tactics posted yet.</p><p className="mt-1 text-[9px] text-white/20">Use this board for farming plans, boss strategies, meetings and coordinated game plans.</p></div>}</div>}
        </div>
      </ScrollArea>
    </section>
    <aside className="w-72 shrink-0 border-l border-white/[0.055]"><ZoneChatPanel clanId={clan?.id} gameId={game?.id} zoneId="strategy" title="Tactics Comms" /></aside>
  </div>;
}
