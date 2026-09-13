import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar as CalendarIcon, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import SystemUpdatesRemindersOverlay from './SystemUpdatesRemindersOverlay';

export default function DateTimeTile({ onClick, onCalendarClick = () => {} }) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [currentReminderIdx, setCurrentReminderIdx] = useState(0);
  const [currentUpdateIdx, setCurrentUpdateIdx] = useState(0);
  const [overlayMode, setOverlayMode] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const now = new Date();
      const [scheduleResponse, platformUpdates] = await Promise.all([
        base44.functions.invoke('calendarAgent', { action: 'getState', payload: { range_start: now.toISOString(), range_end: new Date(now.getTime() + 90 * 86400000).toISOString() } }),
        base44.entities.PlatformUpdate.filter({ published: true }, '-created_date', 12).catch(() => []),
      ]);
      const schedule = scheduleResponse?.data || scheduleResponse || {};
      const liveReminders = (Array.isArray(schedule.occurrences) ? schedule.occurrences : [])
        .filter((event) => event.status !== 'cancelled' && ((event.reminders || []).length > 0 || event.event_type === 'reminder'))
        .sort((a,b) => new Date(a.occurrence_start || a.start_time) - new Date(b.occurrence_start || b.start_time));
      setReminders(liveReminders);
      setUpdates(Array.isArray(platformUpdates) ? platformUpdates : []);
    } catch (error) {
      console.warn('[DateTimeTile] calendar preview failed', error);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('atom:calendar-data-changed', refresh);
    const unsubscribe = base44.entities.UserEvent?.subscribe?.(refresh);
    return () => { window.removeEventListener('atom:calendar-data-changed', refresh); unsubscribe?.(); };
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    const reminderTimer = window.setInterval(() => setCurrentReminderIdx((prev) => reminders.length ? (prev + 1) % reminders.length : 0), 5000);
    const updateTimer = window.setInterval(() => setCurrentUpdateIdx((prev) => updates.length ? (prev + 1) % updates.length : 0), 5000);
    return () => { window.clearInterval(timer); window.clearInterval(reminderTimer); window.clearInterval(updateTimer); };
  }, [reminders.length, updates.length]);

  const timeString = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateString = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const reminder = reminders[currentReminderIdx] || null;
  const update = updates[currentUpdateIdx] || null;
  const reminderLabel = reminder ? `${reminder.title}${reminder.occurrence_start ? ` · ${new Date(reminder.occurrence_start).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : ''}` : 'No reminders scheduled';
  const updateLabel = update ? (update.title || update.version || 'Platform update') : 'System current';

  return (
    <>
      <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-[0_8px_32px_rgba(0,0,0,.2)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.035] to-transparent" />
        <div className="relative flex h-full items-center gap-4 px-4">
          <button onClick={(e) => { e.stopPropagation(); onCalendarClick(); }} className="group grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-white/[0.035] transition hover:bg-cyan-200/[0.08]" title="Open calendar"><CalendarIcon className="h-5 w-5 text-white/70 transition group-hover:text-cyan-100" /></button>
          <div className="flex h-full min-w-0 flex-1 flex-col justify-center py-2">
            <div className="mb-1 flex w-full items-center justify-between"><div className="mr-2 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/65">{dateString}</div><button onClick={(e) => { e.stopPropagation(); onClick?.(); }} className="grid h-7 w-7 shrink-0 place-items-center border border-cyan-200/15 bg-cyan-200/[0.05] text-cyan-100/55 transition hover:bg-cyan-200/[0.1] hover:text-cyan-100" title="Dashboard updates"><Settings className="h-3.5 w-3.5" /></button></div>
            <div className="flex w-full items-center gap-4"><div className="shrink-0 text-4xl font-black leading-none tracking-tighter text-white">{timeString}</div><div className="flex h-10 min-w-0 flex-1 items-stretch gap-3 overflow-hidden border-l border-white/[0.07] pl-4">
              <button type="button" onClick={(e) => { e.stopPropagation(); setOverlayMode((value) => value === 'reminders' ? null : 'reminders'); }} className="group flex min-w-0 flex-1 flex-col justify-center text-left"><div className="mb-1 flex items-center gap-1"><Bell className="h-3 w-3 text-amber-300/75" /><span className="truncate text-[9px] font-bold uppercase tracking-wider text-amber-200/55">{reminders.length} Reminder{reminders.length === 1 ? '' : 's'}</span></div><div className="relative h-5 w-full overflow-hidden"><AnimatePresence mode="wait"><motion.div key={reminder?.id || 'none'} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="absolute inset-0 truncate text-[11px] font-medium text-white/68 group-hover:text-white">{reminderLabel}</motion.div></AnimatePresence></div></button>
              <div className="w-px shrink-0 self-stretch bg-white/[0.07]" />
              <button type="button" onClick={(e) => { e.stopPropagation(); setOverlayMode((value) => value === 'updates' ? null : 'updates'); }} className="group flex min-w-0 flex-1 flex-col justify-center text-left"><div className="mb-1 flex items-center gap-1"><Settings className="h-3 w-3 text-cyan-200/60" /><span className="truncate text-[9px] font-bold uppercase tracking-wider text-cyan-200/50">System Updates</span></div><div className="relative h-5 w-full overflow-hidden"><AnimatePresence mode="wait"><motion.div key={update?.id || 'none'} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="absolute inset-0 truncate text-[11px] font-medium text-white/62 group-hover:text-white">{updateLabel}</motion.div></AnimatePresence></div></button>
            </div></div>
          </div>
        </div>
      </div>
      {overlayMode && <SystemUpdatesRemindersOverlay mode={overlayMode} onClose={() => setOverlayMode(null)} />}
    </>
  );
}
