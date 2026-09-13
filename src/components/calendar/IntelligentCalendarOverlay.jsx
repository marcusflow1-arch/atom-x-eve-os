import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, Bot, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3,
  LayoutList, ListChecks, Loader2, Plus, Sparkles, StickyNote, Trash2, X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DayPlanningView from './DayPlanningView';
import AIEventCreator from './AIEventCreator';

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const EVENT_ACCENTS = {
  gaming_session: 'bg-cyan-300/70', raid: 'bg-rose-300/70', tournament: 'bg-amber-300/70', meeting: 'bg-violet-300/70',
  reminder: 'bg-yellow-200/75', clan: 'bg-emerald-300/70', story: 'bg-fuchsia-300/70', task: 'bg-blue-300/70', personal: 'bg-white/55', life: 'bg-white/55',
};

function dateKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function startOfDay(value) { const d = new Date(value); d.setHours(0,0,0,0); return d; }
function endOfDay(value) { const d = new Date(value); d.setHours(23,59,59,999); return d; }
function addDays(value, count) { const d = new Date(value); d.setDate(d.getDate()+count); return d; }
function monthGrid(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}
function weekDays(cursor) {
  const start = startOfDay(addDays(cursor, -cursor.getDay()));
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}
function rangeFor(view, cursor, selected) {
  if (view === 'month') {
    const days = monthGrid(cursor); return { start: startOfDay(days[0]), end: endOfDay(days[41]) };
  }
  if (view === 'week') {
    const days = weekDays(selected || cursor); return { start: startOfDay(days[0]), end: endOfDay(days[6]) };
  }
  return { start: startOfDay(selected || cursor), end: endOfDay(selected || cursor) };
}
function eventStart(event) { return new Date(event.occurrence_start || event.start_time); }
function eventEnd(event) { return new Date(event.occurrence_end || event.end_time || event.occurrence_start || event.start_time); }
function formatTime(value) { return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function eventAccent(type) { return EVENT_ACCENTS[type] || EVENT_ACCENTS.personal; }

function EventPill({ event, compact = false, onClick }) {
  const start = eventStart(event);
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick?.(event); }} className={`flex w-full items-center gap-2 overflow-hidden text-left transition hover:bg-white/[0.05] ${compact ? 'px-1.5 py-1' : 'px-2 py-1.5'}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${eventAccent(event.event_type)}`} />
      <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-white/65">{event.title}</span>
      {!event.all_day && <span className="shrink-0 text-[8px] text-white/22">{formatTime(start)}</span>}
      {(event.reminders || []).length > 0 && <Bell className="h-2.5 w-2.5 shrink-0 text-amber-200/35" />}
    </button>
  );
}

export default function IntelligentCalendarOverlay({ onClose, currentUserId }) {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [activeRail, setActiveRail] = useState('events');
  const [events, setEvents] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreator, setShowCreator] = useState(false);
  const [creatorMode, setCreatorMode] = useState('manual');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [quickTask, setQuickTask] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [savingQuick, setSavingQuick] = useState(false);

  const visibleRange = useMemo(() => rangeFor(viewMode, cursor, selectedDate), [viewMode, cursor, selectedDate]);

  const loadData = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true); setError('');
    try {
      const response = await base44.functions.invoke('calendarAgent', {
        action: 'getState',
        payload: { range_start: visibleRange.start.toISOString(), range_end: visibleRange.end.toISOString() },
      });
      const data = response?.data || response || {};
      if (data.error) throw new Error(data.error);
      setEvents(Array.isArray(data.events) ? data.events : []);
      setOccurrences(Array.isArray(data.occurrences) ? data.occurrences : []);
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setNotes(Array.isArray(data.notes) ? data.notes : []);
    } catch (e) {
      console.error('[Calendar] load failed', e);
      setError(e?.message || 'Calendar data could not be loaded.');
    } finally { setLoading(false); }
  }, [currentUserId, visibleRange.start.getTime(), visibleRange.end.getTime()]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const refresh = () => loadData();
    window.addEventListener('atom:calendar-data-changed', refresh);
    const unsubs = ['UserEvent','UserTask','UserNote'].map((entity) => base44.entities[entity]?.subscribe?.(refresh)).filter(Boolean);
    return () => { window.removeEventListener('atom:calendar-data-changed', refresh); unsubs.forEach((fn) => fn?.()); };
  }, [loadData]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const key = (event) => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', key, true);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', key, true); };
  }, [onClose]);

  const byDate = useMemo(() => {
    const map = new Map();
    occurrences.forEach((event) => {
      const key = dateKey(event.occurrence_start || event.start_time);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    for (const list of map.values()) list.sort((a,b) => eventStart(a)-eventStart(b));
    return map;
  }, [occurrences]);

  const upcoming = useMemo(() => occurrences.filter((event) => eventStart(event) >= new Date()).sort((a,b) => eventStart(a)-eventStart(b)).slice(0, 10), [occurrences]);
  const reminderCount = useMemo(() => events.filter((event) => event.status !== 'cancelled' && ((event.reminders || []).length || event.event_type === 'reminder') && new Date(event.start_time) >= new Date()).length, [events]);

  const goPrevious = () => {
    if (viewMode === 'month') setCursor((d) => new Date(d.getFullYear(), d.getMonth()-1, 1));
    else if (viewMode === 'week') { const next = addDays(selectedDate, -7); setSelectedDate(next); setCursor(next); }
    else { const next = addDays(selectedDate, -1); setSelectedDate(next); setCursor(next); }
  };
  const goNext = () => {
    if (viewMode === 'month') setCursor((d) => new Date(d.getFullYear(), d.getMonth()+1, 1));
    else if (viewMode === 'week') { const next = addDays(selectedDate, 7); setSelectedDate(next); setCursor(next); }
    else { const next = addDays(selectedDate, 1); setSelectedDate(next); setCursor(next); }
  };
  const goToday = () => { const now = new Date(); setCursor(now); setSelectedDate(now); };
  const openDate = (date) => { setSelectedDate(date); setCursor(date); setViewMode('day'); };
  const openCreator = (mode) => { setCreatorMode(mode); setShowCreator(true); };

  const deleteEvent = async (event) => {
    const id = event.parent_event_id || event.id;
    if (!id) return;
    try {
      await base44.functions.invoke('calendarAgent', { action: 'deleteEvent', payload: { id } });
      setSelectedEvent(null); window.dispatchEvent(new Event('atom:calendar-data-changed'));
    } catch (e) { setError(e?.message || 'Event could not be removed.'); }
  };

  const toggleTask = async (task) => {
    try {
      await base44.functions.invoke('calendarAgent', { action: 'toggleTask', payload: { id: task.id } });
      window.dispatchEvent(new Event('atom:calendar-data-changed'));
    } catch (e) { setError(e?.message || 'Task could not be updated.'); }
  };

  const addQuickTask = async () => {
    if (!quickTask.trim()) return;
    setSavingQuick(true);
    try {
      await base44.functions.invoke('calendarAgent', { action: 'createTask', payload: { title: quickTask.trim(), due_date: endOfDay(selectedDate).toISOString(), priority: 'medium' } });
      setQuickTask(''); window.dispatchEvent(new Event('atom:calendar-data-changed'));
    } finally { setSavingQuick(false); }
  };

  const addQuickNote = async () => {
    if (!quickNote.trim()) return;
    setSavingQuick(true);
    try {
      await base44.functions.invoke('calendarAgent', { action: 'createNote', payload: { content: quickNote.trim(), tags: ['calendar'] } });
      setQuickNote(''); window.dispatchEvent(new Event('atom:calendar-data-changed'));
    } finally { setSavingQuick(false); }
  };

  const gridDays = useMemo(() => monthGrid(cursor), [cursor]);
  const sevenDays = useMemo(() => weekDays(selectedDate), [selectedDate]);
  const heading = viewMode === 'month'
    ? cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : viewMode === 'week'
      ? `${sevenDays[0].toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${sevenDays[6].toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}`
      : selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (typeof document === 'undefined') return null;

  const overlay = (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }} className="fixed inset-0 z-[30000] isolate h-[100dvh] w-screen overflow-hidden bg-[#04070c] text-white pointer-events-auto" role="dialog" aria-modal="true" aria-label="Luna Calendar">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,.07),transparent_34%),radial-gradient(circle_at_15%_90%,rgba(99,102,241,.06),transparent_36%)]" />
      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.055] px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.05] text-cyan-100/65"><CalendarDays className="h-4 w-4" /></div>
            <div className="min-w-0"><div className="text-[8px] font-black uppercase tracking-[0.28em] text-cyan-200/40">Luna Schedule</div><h1 className="truncate text-xl font-semibold tracking-tight text-white/92">{heading}</h1></div>
            <div className="hidden h-7 w-px bg-white/[0.07] md:block" />
            <div className="hidden items-center gap-1 md:flex"><button type="button" onClick={goPrevious} className="grid h-8 w-8 place-items-center text-white/30 hover:bg-white/[0.05] hover:text-white"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={goToday} className="h-8 px-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/38 hover:bg-white/[0.05] hover:text-white">Today</button><button type="button" onClick={goNext} className="grid h-8 w-8 place-items-center text-white/30 hover:bg-white/[0.05] hover:text-white"><ChevronRight className="h-4 w-4" /></button></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden bg-white/[0.025] p-1 sm:flex">{['month','week','day'].map((mode) => <button key={mode} type="button" onClick={() => setViewMode(mode)} className={`px-3 py-2 text-[8px] font-bold uppercase tracking-[0.16em] transition ${viewMode === mode ? 'bg-white/[0.08] text-cyan-100' : 'text-white/25 hover:text-white/60'}`}>{mode}</button>)}</div>
            <button type="button" onClick={() => openCreator('manual')} className="hidden h-9 items-center gap-2 bg-white/[0.055] px-3 text-[9px] font-bold uppercase tracking-wider text-white/58 transition hover:bg-white/[0.1] hover:text-white sm:flex"><Plus className="h-3.5 w-3.5" /> Create</button>
            <button type="button" onClick={() => openCreator('ai')} className="flex h-9 items-center gap-2 bg-cyan-200 px-3 text-[9px] font-black uppercase tracking-wider text-slate-950 transition hover:bg-white"><Sparkles className="h-3.5 w-3.5" /> AI Agent</button>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center text-white/30 hover:bg-white/[0.05] hover:text-white" aria-label="Close calendar"><X className="h-4 w-4" /></button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-[68px] shrink-0 flex-col items-center border-r border-white/[0.05] py-4 sm:flex">
            {[['events',CalendarDays],['tasks',ListChecks],['notes',StickyNote]].map(([id,Icon]) => <button key={id} type="button" title={id} onClick={() => setActiveRail(id)} className={`mb-2 grid h-11 w-11 place-items-center transition ${activeRail === id ? 'bg-cyan-200/[0.08] text-cyan-100/75' : 'text-white/22 hover:bg-white/[0.04] hover:text-white/60'}`}><Icon className="h-4 w-4" /></button>)}
            <div className="flex-1" />
            <div className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-white/[0.035] text-[9px] font-bold text-amber-100/60" title={`${reminderCount} active reminders`}><Bell className="h-3.5 w-3.5" /></div>
          </aside>

          <main className="relative min-w-0 flex-1 overflow-hidden">
            {loading && <div className="absolute inset-0 z-20 grid place-items-center bg-[#05080d]/65 backdrop-blur-sm"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30"><Loader2 className="h-4 w-4 animate-spin text-cyan-200/55" /> Syncing schedule</div></div>}
            {error && <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2 border border-rose-200/10 bg-rose-200/[0.05] px-3 py-2 text-[9px] text-rose-100/65">{error}</div>}

            {viewMode === 'month' && (
              <div className="flex h-full min-h-0 flex-col p-3 md:p-5">
                <div className="grid shrink-0 grid-cols-7 border-b border-white/[0.05] pb-2">{DAY_NAMES.map((name) => <div key={name} className="px-2 text-[8px] font-bold uppercase tracking-[0.16em] text-white/22">{name}</div>)}</div>
                <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 border-l border-t border-white/[0.04]">
                  {gridDays.map((date) => {
                    const key = dateKey(date); const list = byDate.get(key) || []; const today = key === dateKey(new Date()); const inMonth = date.getMonth() === cursor.getMonth(); const selected = key === dateKey(selectedDate);
                    return <button key={key} type="button" onClick={() => openDate(date)} className={`group relative min-h-0 overflow-hidden border-b border-r border-white/[0.04] p-1.5 text-left transition hover:bg-white/[0.025] ${!inMonth ? 'bg-black/10 opacity-45' : ''} ${selected ? 'bg-cyan-200/[0.035]' : ''}`}><div className="mb-1 flex items-center justify-between"><span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold ${today ? 'bg-cyan-100 text-slate-950' : 'text-white/45'}`}>{date.getDate()}</span>{list.length > 3 && <span className="text-[8px] text-white/20">+{list.length-3}</span>}</div><div className="space-y-px">{list.slice(0,3).map((event) => <EventPill key={event.occurrence_key || `${event.id}-${event.occurrence_start}`} event={event} compact onClick={(item) => { setSelectedEvent(item); setActiveRail('events'); }} />)}</div></button>;
                  })}
                </div>
              </div>
            )}

            {viewMode === 'week' && (
              <div className="flex h-full min-h-0 flex-col p-3 md:p-5">
                <div className="grid min-h-0 flex-1 grid-cols-7 border-l border-t border-white/[0.04]">{sevenDays.map((date) => { const list = byDate.get(dateKey(date)) || []; const today = dateKey(date) === dateKey(new Date()); return <section key={dateKey(date)} className="min-w-0 overflow-y-auto border-b border-r border-white/[0.04]" style={{scrollbarWidth:'none'}}><button type="button" onClick={() => openDate(date)} className="sticky top-0 z-10 flex w-full flex-col items-center border-b border-white/[0.04] bg-[#05080d]/95 py-3 backdrop-blur-xl"><span className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/25">{DAY_NAMES[date.getDay()]}</span><span className={`mt-1 grid h-8 w-8 place-items-center rounded-full text-sm ${today ? 'bg-cyan-100 font-bold text-slate-950' : 'text-white/70'}`}>{date.getDate()}</span></button><div className="space-y-1 p-2">{list.length ? list.map((event) => <div key={event.occurrence_key || event.id} className="border border-white/[0.05] bg-white/[0.018]"><EventPill event={event} onClick={(item) => { setSelectedEvent(item); setActiveRail('events'); }} /><div className="px-2 pb-2 text-[8px] leading-3 text-white/22">{event.description || (event.event_type || 'event').replaceAll('_',' ')}</div></div>) : <button type="button" onClick={() => { setSelectedDate(date); openCreator('manual'); }} className="mt-4 w-full py-6 text-[9px] text-white/15 hover:bg-white/[0.02] hover:text-white/40">+ Add</button>}</div></section>; })}</div>
              </div>
            )}

            {viewMode === 'day' && <DayPlanningView date={selectedDate} events={byDate.get(dateKey(selectedDate)) || []} tasks={tasks.filter((task) => task.due_date && dateKey(task.due_date) === dateKey(selectedDate) && task.status !== 'cancelled')} onAddEvent={() => openCreator('manual')} onAiAssist={() => openCreator('ai')} onEventClick={(item) => { setSelectedEvent(item); setActiveRail('events'); }} />}
          </main>

          <aside className="hidden w-[330px] shrink-0 flex-col border-l border-white/[0.05] bg-[#060a10]/78 lg:flex">
            <div className="border-b border-white/[0.05] p-4">
              <button type="button" onClick={() => openCreator('ai')} className="group w-full bg-[linear-gradient(135deg,rgba(34,211,238,.06),rgba(99,102,241,.035))] p-4 text-left transition hover:bg-white/[0.045]"><div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-cyan-200/45"><Bot className="h-3.5 w-3.5" /> AI Schedule Agent</div><div className="mt-2 text-sm font-semibold text-white/75">Describe the day, week, or month.</div><p className="mt-1 text-[10px] leading-4 text-white/28">It checks your schedule, creates events and tasks, and connects reminders automatically.</p><div className="mt-3 text-[9px] font-bold uppercase tracking-wider text-cyan-100/55 group-hover:text-cyan-100">Plan with AI →</div></button>
            </div>

            <div className="flex items-center gap-1 border-b border-white/[0.05] p-2">{[['events','Schedule'],['tasks','Tasks'],['notes','Notes']].map(([id,label]) => <button key={id} type="button" onClick={() => setActiveRail(id)} className={`flex-1 px-2 py-2 text-[8px] font-bold uppercase tracking-[0.14em] transition ${activeRail === id ? 'bg-white/[0.06] text-white/72' : 'text-white/22 hover:text-white/50'}`}>{label}</button>)}</div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
              {activeRail === 'events' && <>
                {selectedEvent ? <div className="mb-5 border-b border-white/[0.06] pb-5"><button type="button" onClick={() => setSelectedEvent(null)} className="mb-3 text-[8px] font-bold uppercase tracking-wider text-white/25 hover:text-white/60">← Upcoming</button><div className="flex items-start gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${eventAccent(selectedEvent.event_type)}`} /><div className="min-w-0 flex-1"><h3 className="text-base font-semibold text-white/85">{selectedEvent.title}</h3><div className="mt-1 text-[9px] text-white/30">{eventStart(selectedEvent).toLocaleString()} – {formatTime(eventEnd(selectedEvent))}</div>{selectedEvent.description && <p className="mt-3 text-[10px] leading-5 text-white/42">{selectedEvent.description}</p>}<div className="mt-3 flex flex-wrap gap-1.5">{(selectedEvent.reminders || []).map((r,i) => <span key={i} className="bg-amber-200/[0.05] px-2 py-1 text-[8px] text-amber-100/50"><Bell className="mr-1 inline h-2.5 w-2.5" />{r.time_before === 0 ? 'At start' : `${r.time_before}m before`}</span>)}</div><button type="button" onClick={() => deleteEvent(selectedEvent)} className="mt-4 inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-rose-200/35 hover:text-rose-100"><Trash2 className="h-3 w-3" /> Remove event</button></div></div></div> : null}
                <div className="mb-3 flex items-center justify-between"><div className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/24">Upcoming</div><div className="text-[8px] text-amber-100/35">{reminderCount} reminders</div></div>
                <div className="space-y-1">{upcoming.length ? upcoming.map((event) => <button key={event.occurrence_key || event.id} type="button" onClick={() => setSelectedEvent(event)} className="w-full px-2 py-3 text-left transition hover:bg-white/[0.03]"><div className="flex items-start gap-2.5"><span className={`mt-1 h-1.5 w-1.5 rounded-full ${eventAccent(event.event_type)}`} /><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-medium text-white/65">{event.title}</div><div className="mt-1 text-[8px] text-white/22">{eventStart(event).toLocaleDateString()} · {formatTime(eventStart(event))}{event.game ? ` · ${event.game}` : ''}</div></div>{(event.reminders||[]).length > 0 && <Bell className="h-3 w-3 text-amber-100/30" />}</div></button>) : <div className="py-10 text-center text-[10px] text-white/18">Nothing scheduled in this view.</div>}</div>
              </>}

              {activeRail === 'tasks' && <><div className="mb-4 flex gap-1.5"><input value={quickTask} onChange={(e) => setQuickTask(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addQuickTask(); }} placeholder="Add a task…" className="h-9 min-w-0 flex-1 bg-white/[0.035] px-2.5 text-[10px] text-white/65 outline-none placeholder:text-white/18" /><button type="button" disabled={!quickTask.trim() || savingQuick} onClick={addQuickTask} className="grid h-9 w-9 place-items-center bg-white/[0.055] text-white/45 hover:text-white disabled:opacity-25"><Plus className="h-3.5 w-3.5" /></button></div><div className="space-y-1">{tasks.filter((task) => task.status !== 'cancelled').map((task) => <button key={task.id} type="button" onClick={() => toggleTask(task)} className="flex w-full items-start gap-2.5 px-2 py-2.5 text-left hover:bg-white/[0.03]"><span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center border ${task.status === 'completed' ? 'border-emerald-200/25 bg-emerald-200/[0.08] text-emerald-100/60' : 'border-white/12 text-transparent'}`}>{task.status === 'completed' && <Check className="h-2.5 w-2.5" />}</span><span className="min-w-0 flex-1"><span className={`block text-[10px] ${task.status === 'completed' ? 'text-white/25 line-through' : 'text-white/62'}`}>{task.title}</span><span className="mt-1 block text-[8px] text-white/18">{task.due_date ? `Due ${new Date(task.due_date).toLocaleString()}` : task.priority || 'medium'}</span></span></button>)}</div></>}

              {activeRail === 'notes' && <><div className="mb-4"><textarea value={quickNote} onChange={(e) => setQuickNote(e.target.value)} placeholder="Write a calendar note…" className="h-20 w-full resize-none bg-white/[0.035] p-2.5 text-[10px] leading-4 text-white/62 outline-none placeholder:text-white/18" /><button type="button" disabled={!quickNote.trim() || savingQuick} onClick={addQuickNote} className="mt-1.5 h-8 w-full bg-white/[0.055] text-[8px] font-bold uppercase tracking-wider text-white/42 hover:bg-white/[0.08] hover:text-white disabled:opacity-25">Save note</button></div><div className="space-y-2">{notes.map((note) => <div key={note.id} className="bg-white/[0.025] p-3"><p className="text-[10px] leading-5 text-white/48 whitespace-pre-wrap">{note.content}</p>{note.tags?.length > 0 && <div className="mt-2 text-[8px] text-white/18">{note.tags.map((tag) => `#${tag}`).join(' ')}</div>}</div>)}</div></>}
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>{showCreator && <AIEventCreator mode={creatorMode} selectedDate={selectedDate} planningScope={viewMode} rangeStart={visibleRange.start.toISOString()} rangeEnd={visibleRange.end.toISOString()} onClose={() => setShowCreator(false)} onSuccess={() => { setShowCreator(false); loadData(); }} />}</AnimatePresence>
    </motion.div>
  );

  return createPortal(overlay, document.body);
}
