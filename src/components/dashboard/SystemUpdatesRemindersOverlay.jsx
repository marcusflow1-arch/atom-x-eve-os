import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bell, CalendarDays, CheckCircle, ChevronRight, Clock3, Info, Settings, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const fallbackUpdates = [
  { id: 'u1', date: 'Recent', title: 'Luna Dashboard improvements', detail: 'Dashboard interaction, overlay layering, and navigation improvements are available.' },
  { id: 'u2', date: 'Recent', title: 'AI Avatar systems', detail: 'Avatar intelligence, progression, memory, and scheduling systems continue to expand.' },
];

function normalizeUpdate(item, index) {
  return { ...item, id: item.id || `update-${index}`, date: item.created_date ? new Date(item.created_date).toLocaleDateString() : (item.date || 'Recent'), detail: item.full_content || item.detail || item.description || item.release_notes || 'No additional details available.' };
}

export default function SystemUpdatesRemindersOverlay({ mode = 'updates', onClose }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (mode === 'reminders' && user?.id) {
          const rows = await base44.entities.UserEvent.filter({ user_id: user.id }, 'start_time', 300);
          if (cancelled) return;
          const now = Date.now();
          setReminders((rows || []).filter((event) => event.status !== 'cancelled' && new Date(event.start_time).getTime() >= now && ((event.reminders || []).length > 0 || event.event_type === 'reminder')).sort((a,b) => new Date(a.start_time)-new Date(b.start_time)));
        } else if (mode === 'updates') {
          const rows = await base44.entities.PlatformUpdate.filter({ published: true }, '-created_date', 100).catch(() => []);
          if (!cancelled) setUpdates(Array.isArray(rows) ? rows.map(normalizeUpdate) : []);
        }
      } catch (error) { console.warn('[Dashboard Overlay] load failed', error); }
    };
    load();
    const refresh = () => load();
    window.addEventListener('atom:calendar-data-changed', refresh);
    const unsubscribe = mode === 'reminders' ? base44.entities.UserEvent?.subscribe?.(refresh) : undefined;
    return () => { cancelled = true; window.removeEventListener('atom:calendar-data-changed', refresh); unsubscribe?.(); };
  }, [mode, user?.id]);

  const items = useMemo(() => mode === 'reminders' ? reminders.map((event) => ({
    ...event, date: new Date(event.start_time).toLocaleDateString(), detail: event.description || `${(event.event_type || 'event').replaceAll('_',' ')} · ${new Date(event.start_time).toLocaleString()}`,
  })) : (updates.length ? updates : fallbackUpdates), [mode, reminders, updates]);

  useEffect(() => { if (!items.some((item) => String(item.id) === String(selectedId))) setSelectedId(items[0]?.id || null); }, [items, selectedId]);
  useEffect(() => { const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); } }; window.addEventListener('keydown', key, true); return () => window.removeEventListener('keydown', key, true); }, [onClose]);

  const selected = items.find((item) => String(item.id) === String(selectedId)) || null;
  if (typeof document === 'undefined') return null;

  return createPortal(<AnimatePresence><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[29000] bg-black/65 backdrop-blur-2xl pointer-events-auto" onClick={onClose}><motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{duration:.3,ease:[.22,1,.36,1]}} onClick={(e) => e.stopPropagation()} className="absolute bottom-0 right-0 top-0 flex w-full max-w-[780px] flex-col border-l border-white/[0.06] bg-[#060a10]/98 shadow-[-30px_0_90px_rgba(0,0,0,.6)]">
    <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-white/[0.06] px-6"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05] text-cyan-100/60">{mode === 'reminders' ? <Bell className="h-4 w-4" /> : <Settings className="h-4 w-4" />}</div><div><div className="text-[8px] font-bold uppercase tracking-[0.22em] text-white/25">Luna Dashboard</div><h2 className="text-sm font-semibold text-white/82">{mode === 'reminders' ? 'Reminders' : 'System Updates'}</h2></div></div><button onClick={onClose} className="grid h-9 w-9 place-items-center text-white/30 hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button></header>
    <div className="flex min-h-0 flex-1"><section className="w-[43%] min-w-[280px] overflow-y-auto border-r border-white/[0.05] p-4" style={{scrollbarWidth:'none'}}>{items.length ? items.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`mb-1 flex w-full items-start gap-3 px-3 py-3 text-left transition ${String(item.id)===String(selectedId) ? 'bg-white/[0.055] text-white' : 'text-white/48 hover:bg-white/[0.025] hover:text-white/75'}`}><span className="mt-0.5">{mode === 'reminders' ? <Bell className="h-3.5 w-3.5 text-amber-200/55" /> : item.update_type === 'required' ? <AlertCircle className="h-3.5 w-3.5 text-rose-200/55" /> : <Info className="h-3.5 w-3.5 text-cyan-200/45" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold">{item.title}</span><span className="mt-1 block truncate text-[8px] text-white/22">{item.date}{mode === 'reminders' ? ` · ${new Date(item.start_time).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}` : ''}</span></span><ChevronRight className="mt-1 h-3 w-3 text-white/15" /></button>) : <div className="py-20 text-center text-[10px] text-white/20">No {mode === 'reminders' ? 'reminders scheduled' : 'updates available'}.</div>}</section><section className="min-w-0 flex-1 overflow-y-auto p-7" style={{scrollbarWidth:'none'}}>{selected ? <motion.div key={selected.id} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}}><div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.18em] text-white/22"><Clock3 className="h-3 w-3" /> {selected.date}</div><h3 className="mt-4 text-2xl font-semibold tracking-tight text-white/88">{selected.title}</h3>{mode === 'reminders' && <div className="mt-3 flex flex-wrap gap-2">{(selected.reminders || []).map((reminder,index) => <span key={index} className="bg-amber-200/[0.05] px-2.5 py-1.5 text-[8px] text-amber-100/50"><Bell className="mr-1 inline h-2.5 w-2.5" />{reminder.time_before === 0 ? 'At start' : `${reminder.time_before} min before`}</span>)}</div>}<p className="mt-5 whitespace-pre-wrap text-xs leading-6 text-white/45">{selected.detail || selected.description}</p>{mode === 'reminders' && <button type="button" onClick={() => { onClose?.(); window.dispatchEvent(new Event('openAtomCalendar')); }} className="mt-6 inline-flex h-9 items-center gap-2 bg-cyan-100 px-3 text-[8px] font-black uppercase tracking-wider text-slate-950 hover:bg-white"><CalendarDays className="h-3 w-3" /> Open Calendar</button>}<div className="mt-8 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-[8px] uppercase tracking-wider text-white/20"><CheckCircle className="h-3 w-3 text-cyan-100/40" /> Connected to {mode === 'reminders' ? 'UserEvent calendar reminders' : 'platform updates'}</div></motion.div> : <div className="grid h-full place-items-center text-[10px] text-white/18">Select an item</div>}</section></div>
  </motion.div></motion.div></AnimatePresence>, document.body);
}
