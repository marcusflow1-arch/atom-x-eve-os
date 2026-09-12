import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Compass, MapPin, Plus, Search } from 'lucide-react';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';

const invoke = async (action, data) => {
  const result = await base44.functions.invoke('clanOperations', { action, data });
  const payload = result?.data || result;
  if (payload?.success === false) throw new Error(payload.error || 'Exploration request failed');
  return payload;
};

export default function ExplorationOperations({ game, clan }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ location_name: '', location_type: 'discovery', coordinates: '', description: '', tags: '' });

  const { data: intel = [], isLoading } = useQuery({
    queryKey: ['clanExplorationIntel', clan?.id, game?.id],
    queryFn: async () => {
      const payload = await invoke('list_exploration', { clanId: clan.id, gameId: game.id });
      return payload.intel || [];
    },
    enabled: !!clan?.id && !!game?.id,
    refetchInterval: 10000,
  });

  const create = useMutation({
    mutationFn: () => invoke('create_exploration', {
      clanId: clan.id,
      gameId: game.id,
      intel: { ...draft, tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean) },
    }),
    onSuccess: () => {
      setDraft({ location_name: '', location_type: 'discovery', coordinates: '', description: '', tags: '' });
      setCreating(false);
      queryClient.invalidateQueries({ queryKey: ['clanExplorationIntel', clan.id, game.id] });
    },
  });

  const visible = intel.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [item.location_name, item.title, item.description, item.coordinates, ...(item.tags || [])].some((value) => String(value || '').toLowerCase().includes(q));
  });

  return <div className="flex h-full min-h-0">
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <div><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28">Scout intelligence</div><h4 className="mt-1 text-sm font-semibold text-white/82">Discovered Locations</h4></div>
        <label className="ml-auto flex h-9 w-64 items-center gap-2 rounded-xl border border-white/[0.055] bg-black/10 px-3"><Search className="h-3.5 w-3.5 text-white/28" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search discoveries" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/22" /></label>
        <button type="button" onClick={() => setCreating((value) => !value)} className="flex h-9 items-center gap-2 rounded-xl bg-cyan-100/[0.075] px-3 text-[10px] font-semibold text-cyan-100/65 hover:bg-cyan-100/[0.12]"><Plus className="h-3.5 w-3.5" />Reveal Location</button>
      </header>

      {creating && <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-white/[0.055] bg-white/[0.018] p-4">
        <input value={draft.location_name} onChange={(e) => setDraft({ ...draft, location_name: e.target.value })} placeholder="Location name" className="h-9 rounded-xl border border-white/[0.06] bg-black/10 px-3 text-xs text-white outline-none" />
        <select value={draft.location_type} onChange={(e) => setDraft({ ...draft, location_type: e.target.value })} className="h-9 rounded-xl border border-white/[0.06] bg-[#20262e] px-3 text-xs text-white/65 outline-none"><option value="discovery">Hidden location</option><option value="resource">Resource location</option><option value="boss">Boss / encounter</option><option value="route">Route / shortcut</option><option value="safe_zone">Safe zone</option><option value="secret">Secret</option></select>
        <input value={draft.coordinates} onChange={(e) => setDraft({ ...draft, coordinates: e.target.value })} placeholder="Coordinates, map sector or directions" className="h-9 rounded-xl border border-white/[0.06] bg-black/10 px-3 text-xs text-white outline-none" />
        <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="Tags, comma separated" className="h-9 rounded-xl border border-white/[0.06] bg-black/10 px-3 text-xs text-white outline-none" />
        <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What did you find? How do clan members reach it?" className="col-span-2 min-h-20 resize-none rounded-xl border border-white/[0.06] bg-black/10 p-3 text-xs text-white outline-none" />
        <div className="col-span-2 flex justify-end gap-2"><button type="button" onClick={() => setCreating(false)} className="rounded-lg px-3 py-2 text-[10px] text-white/35">Cancel</button><button type="button" disabled={!draft.location_name.trim() || create.isPending} onClick={() => create.mutate()} className="rounded-lg bg-cyan-100/[0.08] px-4 py-2 text-[10px] font-semibold text-cyan-100/65 disabled:opacity-30">Publish Intel</button></div>
      </div>}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? <div className="p-10 text-center text-xs text-white/28">Loading scout data…</div> : visible.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <article key={item.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"><div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.045] text-cyan-100/50">{item.location_type === 'route' ? <Compass className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}</div><div className="min-w-0"><h5 className="truncate text-xs font-semibold text-white/78">{item.location_name || item.title}</h5><div className="mt-1 text-[8px] uppercase tracking-wider text-white/28">{item.location_type || 'discovery'}{item.verified ? ' · verified' : ''}</div></div></div><p className="mt-3 line-clamp-4 text-[10px] leading-5 text-white/40">{item.description || 'No field notes were added.'}</p>{item.coordinates && <div className="mt-3 rounded-lg bg-black/10 px-2.5 py-2 text-[9px] text-cyan-100/45">{item.coordinates}</div>}<div className="mt-3 flex flex-wrap gap-1">{(item.tags || []).slice(0, 6).map((tag) => <span key={tag} className="rounded bg-white/[0.04] px-1.5 py-1 text-[8px] text-white/32">#{tag}</span>)}</div></article>)}</div> : <div className="grid h-full min-h-52 place-items-center text-center"><div><MapPin className="mx-auto h-8 w-8 text-white/12" /><p className="mt-3 text-xs text-white/32">No locations revealed yet.</p><p className="mt-1 text-[9px] text-white/20">Scout the game and publish the first discovery.</p></div></div>}
      </div>
    </section>
    <aside className="w-72 shrink-0 border-l border-white/[0.055]"><ZoneChatPanel clanId={clan?.id} gameId={game?.id} zoneId="exploration" title="Exploration Comms" /></aside>
  </div>;
}
