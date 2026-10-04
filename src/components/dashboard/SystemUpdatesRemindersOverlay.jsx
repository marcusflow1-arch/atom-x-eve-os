import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Bell, CalendarDays, CheckCircle, ChevronRight, Clock3, Info, Settings, X } from 'lucide-react';
import SocialNotifications from '@/components/social/SocialNotifications';
import useDashboardStatusFeeds from './useDashboardStatusFeeds';

const dateLabel = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString() : 'Recent';
export default function SystemUpdatesRemindersOverlay({ mode = 'updates', initialItemId = null, onClose }) {
  const data = useDashboardStatusFeeds();
  const items = data.feeds[mode] || data.updates;
  const [selectedId, setSelectedId] = useState(initialItemId);
  const reducedMotion = useReducedMotion();
  const title = mode === 'updates' ? 'System Updates' : mode === 'reminders' ? 'Reminders' : 'Notifications & reminders';
  useEffect(() => {
    if (!items.some(item => item.id === selectedId)) setSelectedId(items[0]?.id || null);
  }, [items, selectedId]);
  useEffect(() => {
    const key = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose?.(); }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [onClose]);
  const selected = items.find(item => item.id === selectedId) || null;
  const date = item => dateLabel(item.type === 'reminder' ? item.raw.occurrence_start || item.raw.start_time : item.created);
  if (typeof document === 'undefined') return null;

  return createPortal(<AnimatePresence>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[190000] bg-black/65 backdrop-blur-2xl pointer-events-auto" onClick={onClose}>
      <motion.div initial={{ x: reducedMotion ? 0 : '100%' }} animate={{ x: 0 }} exit={{ x: reducedMotion ? 0 : '100%' }}
        transition={{ duration: reducedMotion ? 0 : .3, ease: [.22, 1, .36, 1] }}
        onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}
        onKeyDown={event => {
          if (event.key !== 'Tab') return;
          const focusable = [...event.currentTarget.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]')];
          const first = focusable[0], last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        className={`absolute bottom-0 right-0 top-0 flex w-full max-w-[780px] flex-col ${mode === 'updates' ? 'border-l border-white/[0.025] bg-transparent shadow-none' : 'border-l border-white/[0.06] bg-[#060a10]/98 shadow-[-30px_0_90px_rgba(0,0,0,.6)]'}`}>
        <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-white/[0.06] px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05] text-cyan-100/60">{mode === 'updates' ? <Settings className="h-4 w-4" /> : <Bell className="h-4 w-4" />}</div>
            <div><div className="text-[8px] font-bold uppercase tracking-[0.22em] text-white/25">Luna Dashboard</div><h2 className="text-sm font-semibold text-white/82">{title}</h2></div>
          </div>
          <button type="button" aria-label="Close status feed" autoFocus onClick={onClose} className="grid h-9 w-9 place-items-center text-white/50 hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button>
        </header>
        {data.errors[mode] && <p role="alert" className="border-b border-white/[0.06] px-6 py-3 text-xs text-amber-100/80">Some items could not load. <button className="underline" onClick={() => data.retry(mode)}>Retry</button></p>}
        <div className="flex min-h-0 flex-1">
          <section aria-label="Feed items" className="w-[43%] min-w-[180px] overflow-y-auto border-r border-white/[0.05] p-4" style={{ scrollbarWidth: 'none' }}>
            {data.loading[mode] && !items.length ? <p role="status" className="py-10 text-xs text-white/50">Loading…</p>
              : items.length ? items.map(item => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} aria-pressed={item.id === selectedId}
                className={`mb-1 flex w-full items-start gap-3 px-3 py-3 text-left transition ${item.id === selectedId ? 'bg-white/[0.055] text-white' : 'text-white/48 hover:bg-white/[0.025] hover:text-white/75'}`}>
                <span className="mt-0.5">{item.type !== 'update' ? <Bell className="h-3.5 w-3.5 text-amber-200/55" />
                  : item.raw.update_type === 'required' ? <AlertCircle className="h-3.5 w-3.5 text-rose-200/55" /> : <Info className="h-3.5 w-3.5 text-cyan-200/45" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold">{item.title}</span><span className="mt-1 block truncate text-[8px] text-white/40">{date(item)}{item.type === 'reminder' ? ' · Reminder' : ''}</span></span>
                <ChevronRight className="mt-1 h-3 w-3 text-white/15" />
              </button>) : <div className="py-20 text-center text-xs text-white/45">{data.signedIn ? 'You’re all caught up.' : 'Sign in to see your feed.'}</div>}
          </section>
          <section aria-label="Selected feed item" className="min-w-0 flex-1 overflow-y-auto p-7" style={{ scrollbarWidth: 'none' }}>
            {selected ? <motion.div key={selected.id} initial={{ opacity: 0, x: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, x: 0 }}>
              {selected.type === 'social' ? <SocialNotifications onlyId={selected.sourceId} hideHeading /> : <>
                <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.18em] text-white/40"><Clock3 className="h-3 w-3" />{date(selected)}</div>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white/88">{selected.title}</h3>
                {selected.type === 'reminder' && <div className="mt-3 flex flex-wrap gap-2">{(selected.raw.reminders || []).map((reminder, index) =>
                  <span key={index} className="bg-amber-200/[0.05] px-2.5 py-1.5 text-[8px] text-amber-100/60"><Bell className="mr-1 inline h-2.5 w-2.5" />{reminder.time_before === 0 ? 'At start' : `${reminder.time_before} min before`}</span>)}</div>}
                <p className="mt-5 whitespace-pre-wrap text-xs leading-6 text-white/60">{selected.raw.full_content || selected.raw.detail || selected.raw.description || selected.raw.release_notes || selected.detail}</p>
                {selected.type === 'reminder' && <button type="button" onClick={() => { onClose?.(); window.dispatchEvent(new Event('openAtomCalendar')); }}
                  className="mt-6 inline-flex h-9 items-center gap-2 bg-cyan-100 px-3 text-[8px] font-black uppercase tracking-wider text-slate-950 hover:bg-white"><CalendarDays className="h-3 w-3" />Open Calendar</button>}
                <div className="mt-8 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-[8px] uppercase tracking-wider text-white/30"><CheckCircle className="h-3 w-3 text-cyan-100/40" />Connected to {selected.type === 'reminder' ? 'calendar reminders' : 'platform updates'}</div>
              </>}
            </motion.div> : <div className="grid h-full place-items-center text-xs text-white/40">Select an item</div>}
          </section>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>, document.body);
}
