import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CalendarDays, CheckCircle, ChevronDown, ChevronRight, Clock, Info, Settings, X, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const fallbackReminders = [
  { id: 'r1', date: 'Today', title: 'Raid at 8:00 PM tonight', detail: 'Scheduled gaming reminder.' },
  { id: 'r2', date: 'Today', title: 'Collect daily rewards', detail: 'Daily rewards are available.' },
  { id: 'r3', date: 'Upcoming', title: 'Check out new game release', detail: 'A new release is available to explore.' },
  { id: 'r4', date: 'Tomorrow', title: 'Clan meeting tomorrow', detail: 'Your clan meeting is scheduled for tomorrow.' },
];

function FadedDivider({ vertical = false }) {
  return <div className={vertical ? 'w-px h-full shrink-0 bg-gradient-to-b from-transparent via-white/30 to-transparent' : 'h-px w-full bg-gradient-to-r from-transparent via-white/35 to-transparent'} />;
}

export default function SystemUpdatesRemindersOverlay({ mode = 'updates', onClose }) {
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState({});
  const { data: updates = [] } = useQuery({ queryKey: ['platform-updates-reminder-overlay'], queryFn: () => base44.entities.PlatformUpdate.filter({ published: true }), staleTime: 60000 });

  const items = useMemo(() => mode === 'reminders' ? fallbackReminders : updates.map((u, i) => ({ ...u, id: u.id || `update-${i}`, date: u.created_date ? new Date(u.created_date).toLocaleDateString() : 'Recent', detail: u.full_content || u.description || 'No additional details available.' })), [mode, updates]);

  useEffect(() => { if (items.length && !selected) setSelected(items[0]); }, [items, selected]);
  useEffect(() => { const onKey = e => { if (e.key === 'Escape') onClose?.(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);

  const grouped = useMemo(() => items.reduce((acc, item) => { const key = item.date || 'Recent'; (acc[key] ||= []).push(item); return acc; }, {}), [items]);

  return <AnimatePresence>
    <motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'tween', duration: 0.34, ease: [0.22, 1, 0.36, 1] }} className="fixed z-[80] right-0 top-[112px] bottom-[48px] w-[calc(100vw-420px)] min-w-[760px] max-w-[calc(100vw-420px)] overflow-hidden pointer-events-auto" style={{ background: 'rgba(8,12,18,.84)', backdropFilter: 'blur(30px) saturate(135%)', WebkitBackdropFilter: 'blur(30px) saturate(135%)', boxShadow: '-24px 0 60px rgba(0,0,0,.28)' }} role="dialog" aria-modal="true">
      <div className="h-full flex flex-col">
        <header className="h-[68px] shrink-0 flex items-center justify-between px-7">
          <div className="flex items-center gap-3"><div className="w-8 h-8 flex items-center justify-center text-cyan-300/80">{mode === 'reminders' ? <Bell className="w-4 h-4"/> : <Settings className="w-4 h-4"/>}</div><div><div className="text-white/85 text-sm font-semibold tracking-wider uppercase">{mode === 'reminders' ? 'Reminders' : 'System Updates'}</div><div className="text-white/25 text-[9px] uppercase tracking-[.18em]">Luna Dashboard</div></div></div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/35 hover:text-white/80 transition-colors" aria-label="Close"><X className="w-4 h-4"/></button>
        </header>
        <FadedDivider />
        <div className="flex-1 min-h-0 flex">
          <section className="w-[42%] min-w-[300px] overflow-y-auto px-7 py-5" style={{ scrollbarWidth: 'none' }}>
            {Object.entries(grouped).map(([date, group]) => <div key={date} className="mb-5">
              <button onClick={() => setExpanded(v => ({ ...v, [date]: !v[date] }))} className="w-full flex items-center justify-between py-2 text-left text-white/40 hover:text-white/70 transition-colors"><span className="flex items-center gap-2 text-[9px] uppercase tracking-[.18em]"><CalendarDays className="w-3 h-3"/>{date}</span><ChevronDown className={`w-3 h-3 transition-transform ${expanded[date] ? 'rotate-180' : ''}`}/></button>
              <div className="mt-1 space-y-0.5">{group.map(item => <motion.button layout key={item.id} onClick={() => setSelected(item)} className={`w-full text-left py-3 px-1 flex gap-3 transition-colors ${selected?.id === item.id ? 'text-white' : 'text-white/50 hover:text-white/80'}`}><span className="pt-0.5 text-cyan-300/60">{mode === 'reminders' ? <Bell className="w-3.5 h-3.5"/> : item.update_type === 'required' ? <AlertCircle className="w-3.5 h-3.5 text-red-300/70"/> : <Info className="w-3.5 h-3.5"/>}</span><span className="min-w-0 flex-1"><span className="block text-[11px] font-medium truncate">{item.title}</span><span className="block text-[9px] text-white/25 truncate mt-1">{item.description || item.detail}</span></span><ChevronRight className="w-3 h-3 mt-1 text-white/15"/></motion.button>)}</div>
            </div>)}
            {!items.length && <div className="py-20 text-center text-white/25 text-xs">{mode === 'reminders' ? 'No reminders' : 'No available updates'}</div>}
          </section>
          <FadedDivider vertical />
          <section className="flex-1 min-w-0 overflow-y-auto px-9 py-7" style={{ scrollbarWidth: 'none' }}>
            <AnimatePresence mode="wait">{selected ? <motion.div key={selected.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="max-w-3xl">
              <div className="flex items-center gap-2 text-white/25 text-[9px] uppercase tracking-[.18em] mb-5"><Clock className="w-3 h-3"/>{selected.date || 'Recent'}</div>
              <h2 className="text-white text-2xl font-semibold tracking-tight mb-4">{selected.title}</h2>
              <p className="text-white/50 text-sm leading-7 whitespace-pre-wrap">{selected.detail || selected.description || 'No additional details available.'}</p>
              {selected.version && <div className="mt-6 text-[10px] font-mono text-white/25">Version {selected.version}</div>}
              <div className="mt-8 pt-5 border-t border-white/[.07] flex items-center gap-2 text-white/25 text-[9px] uppercase tracking-wider"><CheckCircle className="w-3 h-3 text-cyan-300/50"/> Selected {mode === 'reminders' ? 'reminder' : 'update'}</div>
            </motion.div> : <div className="h-full flex items-center justify-center text-white/20 text-xs">Select an item</div>}</AnimatePresence>
          </section>
        </div>
      </div>
    </motion.div>
  </AnimatePresence>;
}
