import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { CalendarDays, Clock, Gamepad2, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const invoke = async (action, data) => {
  const result = await base44.functions.invoke('clanOperations', { action, data });
  const payload = result?.data || result;
  if (payload?.success === false) throw new Error(payload.error || 'Clan event request failed');
  return payload;
};

export default function ClanSchedulePage({ clan }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', eventType: 'meeting', startTime: '', maxParticipants: 20, game: '' });

  const { data: state, isLoading } = useQuery({
    queryKey: ['clanAdminState', clan?.id],
    queryFn: () => invoke('admin_state', { clanId: clan.id }),
    enabled: !!clan?.id,
    refetchInterval: 15000,
  });
  const events = useMemo(() => [...(state?.events || [])].sort((a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0)), [state?.events]);

  const createEvent = useMutation({
    mutationFn: () => invoke('create_event', { clanId: clan.id, event: newEvent }),
    onSuccess: () => {
      setIsCreateOpen(false);
      setNewEvent({ title: '', description: '', eventType: 'meeting', startTime: '', maxParticipants: 20, game: '' });
      queryClient.invalidateQueries({ queryKey: ['clanAdminState', clan.id] });
    },
  });

  const joinEvent = useMutation({
    mutationFn: (eventId) => invoke('join_event', { clanId: clan.id, eventId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clanAdminState', clan.id] }),
  });

  const now = Date.now();
  const upcoming = events.filter((event) => new Date(event.startTime || 0).getTime() >= now);
  const past = events.filter((event) => new Date(event.startTime || 0).getTime() < now).slice(-8).reverse();

  const EventRow = ({ event }) => {
    const participants = event.participants || [];
    const joined = participants.includes(user?.id);
    const full = participants.length >= Number(event.maxParticipants || 9999);
    return <div className="grid grid-cols-[56px_minmax(0,1fr)_130px_110px] items-center gap-4 border-b border-white/[0.045] px-4 py-3 last:border-0 hover:bg-white/[0.025]">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.045] text-cyan-100/50"><CalendarDays className="h-4 w-4" /></div>
      <div className="min-w-0"><div className="flex items-center gap-2"><strong className="truncate text-xs font-semibold text-white/78">{event.title}</strong><span className="rounded bg-white/[0.045] px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-white/35">{event.eventType || 'event'}</span></div><div className="mt-1 flex gap-3 text-[9px] text-white/30"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.startTime ? new Date(event.startTime).toLocaleString() : 'Unscheduled'}</span>{event.game && <span className="flex items-center gap-1"><Gamepad2 className="h-3 w-3" />{event.game}</span>}</div></div>
      <div className="flex items-center gap-1 text-[10px] text-white/38"><Users className="h-3 w-3" />{participants.length}/{event.maxParticipants || '∞'} joined</div>
      <div className="text-right">{joined ? <span className="text-[10px] text-emerald-200/55">Joined</span> : <button type="button" disabled={full || joinEvent.isPending} onClick={() => joinEvent.mutate(event.id)} className="rounded-lg bg-white/[0.055] px-3 py-1.5 text-[9px] text-white/55 hover:bg-white/[0.09] disabled:opacity-30">{full ? 'Full' : 'Join'}</button>}</div>
    </div>;
  };

  return (
    <div className="h-full overflow-y-auto p-5 md:p-7">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between"><div><div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Schedule & attendance</div><h3 className="mt-1 text-lg font-semibold text-white/90">Clan Events</h3><p className="mt-1 text-xs text-white/38">Schedule meetings, farming sessions, raids, tournaments and other clan operations.</p></div><Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-white/[0.08] text-white hover:bg-white/[0.12]"><Plus className="h-4 w-4" />Create Event</Button></div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025]"><div className="border-b border-white/[0.055] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">Upcoming · {upcoming.length}</div>{isLoading ? <div className="p-10 text-center text-xs text-white/30">Loading events…</div> : upcoming.length ? upcoming.map((event) => <EventRow key={event.id} event={event} />) : <div className="p-10 text-center text-xs text-white/28">Nothing scheduled yet.</div>}</section>
        {past.length > 0 && <section className="mt-4 overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.018] opacity-70"><div className="border-b border-white/[0.045] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">Recent history</div>{past.map((event) => <EventRow key={event.id} event={event} />)}</section>}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-white/10 bg-[#20262e] text-white">
          <DialogHeader><DialogTitle>Create clan event</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <Input placeholder="Event title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="border-white/10 bg-black/10" />
            <Select value={newEvent.eventType} onValueChange={(value) => setNewEvent({ ...newEvent, eventType: value })}><SelectTrigger className="border-white/10 bg-black/10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="meeting">Meeting</SelectItem><SelectItem value="farming">Farming</SelectItem><SelectItem value="raid">Raid</SelectItem><SelectItem value="pvp">PvP</SelectItem><SelectItem value="tournament">Tournament</SelectItem><SelectItem value="casual">Casual</SelectItem></SelectContent></Select>
            <Input type="datetime-local" value={newEvent.startTime} onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })} className="border-white/10 bg-black/10" />
            <div className="grid grid-cols-2 gap-3"><Input placeholder="Game (optional)" value={newEvent.game} onChange={(e) => setNewEvent({ ...newEvent, game: e.target.value })} className="border-white/10 bg-black/10" /><Input type="number" min="1" value={newEvent.maxParticipants} onChange={(e) => setNewEvent({ ...newEvent, maxParticipants: Number(e.target.value) || 20 })} className="border-white/10 bg-black/10" /></div>
            <Input placeholder="Description / objective" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} className="border-white/10 bg-black/10" />
          </div>
          <DialogFooter><Button onClick={() => createEvent.mutate()} disabled={!newEvent.title.trim() || !newEvent.startTime || createEvent.isPending}>Create Event</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
