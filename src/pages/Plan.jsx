import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock3, Home, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { createPageUrl } from '@/utils';

const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function addDays(value, n) { const d = new Date(value); d.setDate(d.getDate()+n); return d; }
function startOfDay(value) { const d = new Date(value); d.setHours(0,0,0,0); return d; }
function endOfDay(value) { const d = new Date(value); d.setHours(23,59,59,999); return d; }
function key(value) { const d = new Date(value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function grid(cursor) { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const start = addDays(first, -first.getDay()); return Array.from({length:42},(_,i)=>addDays(start,i)); }

export default function Plan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [occurrences, setOccurrences] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const days = useMemo(() => grid(cursor), [cursor]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await base44.functions.invoke('calendarAgent', { action: 'getState', payload: { range_start: startOfDay(days[0]).toISOString(), range_end: endOfDay(days[41]).toISOString() } });
      const data = response?.data || response || {};
      setOccurrences(Array.isArray(data.occurrences) ? data.occurrences : []);
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } finally { setLoading(false); }
  }, [user?.id, days[0]?.getTime(), days[41]?.getTime()]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const refresh = () => load(); window.addEventListener('atom:calendar-data-changed', refresh); return () => window.removeEventListener('atom:calendar-data-changed', refresh); }, [load]);

  const byDate = useMemo(() => { const map = new Map(); occurrences.forEach((event) => { const k = key(event.occurrence_start || event.start_time); if (!map.has(k)) map.set(k, []); map.get(k).push(event); }); return map; }, [occurrences]);
  const selectedEvents = byDate.get(key(selected)) || [];
  const selectedTasks = tasks.filter((task) => task.due_date && key(task.due_date) === key(selected) && task.status !== 'cancelled');

  return <div className="min-h-screen w-full bg-[#05080d] p-6 text-white">
    <div className="mx-auto max-w-6xl pt-16">
      <header className="mb-6 flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-cyan-200/[0.07] text-cyan-100/65"><CalendarIcon className="h-4 w-4" /></div><div><div className="text-[8px] font-bold uppercase tracking-[0.22em] text-cyan-200/40">Atom XE Schedule</div><h1 className="text-xl font-semibold">Plan</h1></div></div><div className="flex gap-2"><button onClick={() => window.dispatchEvent(new Event('openAtomCalendar'))} className="flex h-9 items-center gap-2 bg-cyan-100 px-3 text-[9px] font-black uppercase tracking-wider text-slate-950"><Sparkles className="h-3.5 w-3.5" /> Open Calendar</button><button onClick={() => navigate(createPageUrl('LunaTemplate'))} className="grid h-9 w-9 place-items-center bg-white/[0.045] text-white/45 hover:text-white"><Home className="h-4 w-4" /></button></div></header>
      <div className="grid gap-px bg-white/[0.05] lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="bg-[#070b11] p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white/80">{cursor.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2><div className="flex items-center gap-1"><button onClick={() => setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))} className="grid h-8 w-8 place-items-center text-white/30 hover:bg-white/[0.05] hover:text-white"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => { setCursor(new Date(today.getFullYear(),today.getMonth(),1)); setSelected(today); }} className="h-8 px-3 text-[8px] font-bold uppercase tracking-wider text-white/35 hover:bg-white/[0.05] hover:text-white">Today</button><button onClick={() => setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))} className="grid h-8 w-8 place-items-center text-white/30 hover:bg-white/[0.05] hover:text-white"><ChevronRight className="h-4 w-4" /></button></div></div><div className="grid grid-cols-7 border-b border-white/[0.05] pb-2">{WEEKDAYS.map((name)=><div key={name} className="px-2 text-[8px] font-bold uppercase tracking-[0.16em] text-white/20">{name}</div>)}</div><div className="grid grid-cols-7 grid-rows-6 border-l border-t border-white/[0.04]">{days.map((day)=>{const list=byDate.get(key(day))||[];const inMonth=day.getMonth()===cursor.getMonth();const active=key(day)===key(selected);const isToday=key(day)===key(today);return <button key={key(day)} onClick={()=>setSelected(day)} className={`relative min-h-[96px] border-b border-r border-white/[0.04] p-2 text-left hover:bg-white/[0.025] ${!inMonth?'opacity-35':''} ${active?'bg-cyan-200/[0.03]':''}`}><span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${isToday?'bg-cyan-100 font-bold text-slate-950':'text-white/45'}`}>{day.getDate()}</span><div className="mt-1 space-y-1">{list.slice(0,2).map((event)=><div key={event.occurrence_key||event.id} className="truncate bg-white/[0.025] px-1.5 py-1 text-[8px] text-white/45">{event.title}</div>)}{list.length>2&&<div className="text-[8px] text-white/18">+{list.length-2}</div>}</div></button>})}</div>{loading&&<div className="mt-3 text-[8px] uppercase tracking-wider text-white/18">Syncing…</div>}</section>
        <aside className="bg-[#060a10] p-5"><div className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/22">Selected</div><h3 className="mt-1 text-xl font-semibold text-white/80">{selected.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</h3><div className="mt-5 space-y-1">{selectedEvents.length?selectedEvents.map((event)=><div key={event.occurrence_key||event.id} className="bg-white/[0.025] p-3"><div className="text-[11px] font-medium text-white/65">{event.title}</div><div className="mt-1 flex items-center gap-1 text-[8px] text-white/22"><Clock3 className="h-2.5 w-2.5" />{new Date(event.occurrence_start||event.start_time).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</div></div>):<div className="py-6 text-[10px] text-white/20">No scheduled events.</div>}</div>{selectedTasks.length>0&&<div className="mt-5 border-t border-white/[0.05] pt-4"><div className="mb-2 text-[8px] font-bold uppercase tracking-wider text-white/20">Tasks</div>{selectedTasks.map((task)=><div key={task.id} className="mb-1 bg-white/[0.02] px-3 py-2 text-[10px] text-white/40">{task.title}</div>)}</div>}<button onClick={() => window.dispatchEvent(new Event('openAtomCalendar'))} className="mt-6 flex h-9 w-full items-center justify-center gap-2 bg-white/[0.05] text-[8px] font-bold uppercase tracking-wider text-white/45 hover:bg-white/[0.08] hover:text-white"><Plus className="h-3 w-3" /> Edit this day</button></aside>
      </div>
    </div>
  </div>;
}
