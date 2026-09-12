import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mic, Plus, Target, Users } from 'lucide-react';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';
import { useAuth } from '@/components/auth/AuthContext';

const invoke = async (action, data) => {
  const result = await base44.functions.invoke('clanOperations', { action, data });
  const payload = result?.data || result;
  if (payload?.success === false) throw new Error(payload.error || 'Party request failed');
  return payload;
};

export default function PartyOperations({ clanId, gameId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ goal: '', context: 'general', maxSize: 4, micRequired: false, assignmentId: 'none' });

  const { data: assignments = [] } = useQuery({
    queryKey: ['partyAssignments', clanId, gameId],
    queryFn: () => base44.entities.ClanAssignment.filter({ clanId, targetId: gameId, status: 'pending' }, '-created_date', 100),
    enabled: !!clanId && !!gameId,
  });

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ['clanParties', clanId, gameId],
    queryFn: () => base44.entities.Party.filter({ clanId, gameId, status: { $ne: 'completed' } }, '-created_date', 100),
    enabled: !!clanId && !!gameId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!clanId || !gameId) return undefined;
    const unsub = base44.entities.Party.subscribe((event) => {
      if (event.data?.clanId === clanId && event.data?.gameId === gameId) queryClient.invalidateQueries({ queryKey: ['clanParties', clanId, gameId] });
    });
    return () => { try { unsub?.(); } catch (_) {} };
  }, [clanId, gameId, queryClient]);

  const createParty = useMutation({
    mutationFn: () => invoke('create_party', {
      clanId,
      gameId,
      party: {
        goal: draft.goal.trim(),
        context: draft.context,
        maxSize: Number(draft.maxSize),
        micRequired: draft.micRequired,
        assignmentId: draft.assignmentId === 'none' ? null : draft.assignmentId,
      },
    }),
    onSuccess: () => {
      setCreating(false);
      setDraft({ goal: '', context: 'general', maxSize: 4, micRequired: false, assignmentId: 'none' });
      queryClient.invalidateQueries({ queryKey: ['clanParties', clanId, gameId] });
    },
  });

  const joinParty = useMutation({
    mutationFn: async (partyId) => {
      const result = await base44.functions.invoke('managePartyMembership', { action: 'join', partyId });
      const payload = result?.data || result;
      if (payload?.success === false || payload?.error) throw new Error(payload.error || 'Could not join party');
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clanParties', clanId, gameId] }),
  });

  return <div className="flex h-full min-h-0">
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <div><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28">Squad operations</div><h4 className="mt-1 text-sm font-semibold text-white/82">Party Formation</h4></div>
        <button type="button" onClick={() => setCreating((value) => !value)} className="ml-auto flex h-9 items-center gap-2 rounded-xl bg-cyan-100/[0.075] px-3 text-[10px] font-semibold text-cyan-100/65 hover:bg-cyan-100/[0.12]"><Plus className="h-3.5 w-3.5" />Create Party</button>
      </header>

      {creating && <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-white/[0.055] bg-white/[0.018] p-4">
        <input value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value })} placeholder="Party goal — e.g. Farm upgrade materials" className="col-span-2 h-9 rounded-xl border border-white/[0.06] bg-black/10 px-3 text-xs text-white outline-none" />
        <select value={draft.context} onChange={(e) => setDraft({ ...draft, context: e.target.value })} className="h-9 rounded-xl border border-white/[0.06] bg-[#20262e] px-3 text-xs text-white/65 outline-none"><option value="general">General</option><option value="farming">Farming</option><option value="exploration">Exploration</option><option value="raid">Raid</option><option value="pvp">PvP</option><option value="achievement">Achievement</option></select>
        <select value={draft.assignmentId} onChange={(e) => setDraft({ ...draft, assignmentId: e.target.value })} className="h-9 rounded-xl border border-white/[0.06] bg-[#20262e] px-3 text-xs text-white/65 outline-none"><option value="none">No linked task</option>{assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.targetName || assignment.title}</option>)}</select>
        <label className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.06] bg-black/10 px-3 text-[10px] text-white/40">Max players<input type="number" min="2" max="12" value={draft.maxSize} onChange={(e) => setDraft({ ...draft, maxSize: Math.max(2, Math.min(12, Number(e.target.value) || 4)) })} className="ml-auto w-16 bg-transparent text-right text-xs text-white outline-none" /></label>
        <button type="button" onClick={() => setDraft({ ...draft, micRequired: !draft.micRequired })} className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-[10px] ${draft.micRequired ? 'border-cyan-100/15 bg-cyan-100/[0.07] text-cyan-100/65' : 'border-white/[0.06] bg-black/10 text-white/35'}`}><Mic className="h-3.5 w-3.5" />Microphone {draft.micRequired ? 'required' : 'optional'}</button>
        <div className="col-span-2 flex justify-end gap-2"><button type="button" onClick={() => setCreating(false)} className="rounded-lg px-3 py-2 text-[10px] text-white/35">Cancel</button><button type="button" disabled={!draft.goal.trim() || createParty.isPending} onClick={() => createParty.mutate()} className="rounded-lg bg-cyan-100/[0.08] px-4 py-2 text-[10px] font-semibold text-cyan-100/65 disabled:opacity-30">Post Party</button></div>
      </div>}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? <div className="p-10 text-center text-xs text-white/28">Loading parties…</div> : parties.length ? <div className="grid gap-3 lg:grid-cols-2">{parties.map((party) => {
          const members = Array.isArray(party.members) ? party.members : [];
          const joined = members.includes(user?.id);
          const full = members.length >= Number(party.maxSize || 4);
          const assignment = assignments.find((row) => row.id === party.assignmentId);
          return <article key={party.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.045] text-cyan-100/50"><Users className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h5 className="truncate text-xs font-semibold text-white/80">{party.goal}</h5><span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[8px] capitalize text-white/32">{party.context || party.description || 'general'}</span></div><p className="mt-1 text-[9px] text-white/28">{members.length}/{party.maxSize || 4} players · {party.micRequired ? 'Mic required' : 'Mic optional'}</p></div></div>{assignment && <div className="mt-3 flex items-center gap-2 rounded-lg bg-black/10 px-2.5 py-2 text-[9px] text-white/38"><Target className="h-3 w-3 text-amber-100/45" />{assignment.targetName || assignment.title}</div>}<div className="mt-4 flex items-center justify-between"><div className="flex -space-x-1">{members.slice(0, 6).map((memberId, index) => <div key={memberId} className="grid h-7 w-7 place-items-center rounded-full border border-[#20262e] bg-white/[0.07] text-[8px] text-white/45">{index + 1}</div>)}</div>{joined ? <span className="text-[9px] text-emerald-200/55">Joined</span> : <button type="button" disabled={full || joinParty.isPending} onClick={() => joinParty.mutate(party.id)} className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-[9px] text-white/55 hover:bg-white/[0.1] disabled:opacity-30">{full ? 'Full' : 'Join Party'}</button>}</div></article>;
        })}</div> : <div className="grid h-full min-h-52 place-items-center text-center"><div><Users className="mx-auto h-8 w-8 text-white/12" /><p className="mt-3 text-xs text-white/32">No active parties for this game.</p><p className="mt-1 text-[9px] text-white/20">Create a squad for a farming run, raid, discovery or clan objective.</p></div></div>}
      </div>
    </section>
    <aside className="w-72 shrink-0 border-l border-white/[0.055]"><ZoneChatPanel clanId={clanId} gameId={gameId} zoneId="party" title="Party Chat" /></aside>
  </div>;
}
