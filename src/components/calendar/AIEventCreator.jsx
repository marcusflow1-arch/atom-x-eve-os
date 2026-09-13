import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, CalendarDays, Check, Clock3, ListChecks, Loader2, Send, Sparkles, StickyNote, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function toLocalInput(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return new Date(safe.getTime() - safe.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function timezoneName() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'; } catch { return 'local'; }
}

const TYPE_OPTIONS = [
  ['gaming_session', 'Gaming'], ['raid', 'Raid'], ['tournament', 'Tournament'], ['meeting', 'Meeting'],
  ['personal', 'Personal'], ['life', 'Life'], ['clan', 'Clan'], ['story', 'Story'], ['reminder', 'Reminder'], ['task', 'Task'],
];

const REMINDER_OPTIONS = [
  ['none', 'No reminder'], ['0', 'At start'], ['10', '10 min before'], ['30', '30 min before'], ['60', '1 hour before'], ['1440', '1 day before'],
];

function PreviewGroup({ icon: Icon, label, items = [], render }) {
  if (!items.length) return null;
  return (
    <section className="border-t border-white/[0.06] pt-4 first:border-0 first:pt-0">
      <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30"><Icon className="h-3.5 w-3.5 text-cyan-200/55" /> {label} · {items.length}</div>
      <div className="space-y-1.5">{items.map(render)}</div>
    </section>
  );
}

export default function AIEventCreator({ mode = 'manual', selectedDate, planningScope = 'day', rangeStart, rangeEnd, onClose, onSuccess }) {
  const [step, setStep] = useState(mode === 'ai' ? 'prompt' : 'manual');
  const [aiPrompt, setAiPrompt] = useState('');
  const [scope, setScope] = useState(['day','week','month'].includes(planningScope) ? planningScope : 'day');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [runId, setRunId] = useState(null);
  const [plan, setPlan] = useState(null);

  const anchorDate = useMemo(() => selectedDate instanceof Date ? selectedDate : new Date(selectedDate || Date.now()), [selectedDate]);
  const defaultStart = new Date(anchorDate);
  if (defaultStart.getHours() === 0 && defaultStart.getMinutes() === 0) defaultStart.setHours(18, 0, 0, 0);

  const [formData, setFormData] = useState({
    title: '', description: '', event_type: 'gaming_session', start_time: toLocalInput(defaultStart), end_time: '',
    recurrence: 'none', reminder: '30', all_day: false, game: '',
  });

  const analyze = async () => {
    if (!aiPrompt.trim()) return;
    setBusy(true); setError(''); setPlan(null); setRunId(null);
    try {
      const response = await base44.functions.invoke('calendarAgent', {
        action: 'aiPlan',
        payload: {
          prompt: aiPrompt.trim(), scope, anchor: anchorDate.toISOString(),
          range_start: rangeStart || undefined, range_end: rangeEnd || undefined,
          timezone: timezoneName(), timezone_offset_minutes: new Date().getTimezoneOffset(),
        },
      });
      const data = response?.data || response || {};
      if (data.error) throw new Error(data.error);
      setRunId(data.run_id);
      setPlan(data.plan || null);
      setStep('preview');
    } catch (e) {
      setError(e?.message || 'The calendar agent could not build this schedule.');
    } finally { setBusy(false); }
  };

  const applyPlan = async () => {
    if (!runId) return;
    setBusy(true); setError('');
    try {
      const response = await base44.functions.invoke('calendarAgent', { action: 'applyPlan', payload: { run_id: runId } });
      const data = response?.data || response || {};
      if (data.error) throw new Error(data.error);
      window.dispatchEvent(new Event('atom:calendar-data-changed'));
      onSuccess?.(data);
    } catch (e) {
      setError(e?.message || 'The schedule could not be applied.');
    } finally { setBusy(false); }
  };

  const createManual = async () => {
    if (!formData.title.trim() || !formData.start_time) return;
    setBusy(true); setError('');
    try {
      const reminderValue = formData.reminder === 'none' ? [] : [{ time_before: Number(formData.reminder), type: 'notification' }];
      const payload = {
        title: formData.title.trim(), description: formData.description.trim(), event_type: formData.event_type,
        game: formData.game.trim(), start_time: new Date(formData.start_time).toISOString(),
        ...(formData.end_time ? { end_time: new Date(formData.end_time).toISOString() } : {}),
        recurrence: formData.recurrence, reminders: reminderValue, all_day: formData.all_day,
        timezone: timezoneName(), source: 'user',
      };
      const response = await base44.functions.invoke('calendarAgent', { action: 'createEvent', payload });
      const data = response?.data || response || {};
      if (data.error) throw new Error(data.error);
      window.dispatchEvent(new Event('atom:calendar-data-changed'));
      onSuccess?.(data);
    } catch (e) {
      setError(e?.message || 'The event could not be created.');
    } finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[80] grid place-items-center bg-[#020509]/80 p-4 backdrop-blur-2xl md:p-8" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .985 }} onClick={(e) => e.stopPropagation()} className="flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden border border-white/[0.08] bg-[#080d14]/98 shadow-[0_30px_120px_rgba(0,0,0,.65)]">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.06] px-5 md:px-6">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-cyan-300/[0.07] text-cyan-100/70">{mode === 'ai' ? <Bot className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}</div><div><div className="text-[8px] font-bold uppercase tracking-[0.22em] text-cyan-200/45">{mode === 'ai' ? 'Luna Schedule Agent' : 'Calendar'}</div><h3 className="text-base font-semibold text-white/90">{mode === 'ai' ? 'Build my schedule' : 'Create event'}</h3></div></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center text-white/30 transition hover:bg-white/[0.05] hover:text-white" aria-label="Close creator"><X className="h-4 w-4" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-7" style={{ scrollbarWidth: 'none' }}>
          {step === 'prompt' && (
            <div className="mx-auto max-w-2xl">
              <div className="mb-5 flex items-end justify-between gap-4"><div><div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25">Natural language scheduling</div><h4 className="mt-1 text-2xl font-semibold tracking-tight text-white">Tell me what the day should look like.</h4><p className="mt-2 max-w-xl text-xs leading-5 text-white/35">I can create one event or build an entire day, week, or month. I check your existing schedule first and keep reminders connected to the events I add.</p></div></div>
              <div className="mb-4 flex gap-1 bg-white/[0.025] p-1">{['day','week','month'].map((value) => <button key={value} type="button" onClick={() => setScope(value)} className={`flex-1 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.16em] transition ${scope === value ? 'bg-white/[0.08] text-cyan-100' : 'text-white/28 hover:text-white/60'}`}>{value}</button>)}</div>
              <div className="relative border border-white/[0.08] bg-black/20 p-1 focus-within:border-cyan-200/20">
                <textarea autoFocus value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder={scope === 'day' ? 'Tomorrow: gym at 9, work on Atom XE from 11 to 3, remind me to call my lawyer at 4, and game at 8.' : scope === 'week' ? 'Plan my week: work weekdays, welding Tuesday and Thursday evening, clan raid Friday at 8, and keep Sunday open.' : 'Set my month up with recurring workouts Monday/Wednesday/Friday, bills on the 1st, and a reminder to review my goals every Sunday.'} className="h-40 w-full resize-none bg-transparent p-4 pr-14 text-sm leading-6 text-white/80 outline-none placeholder:text-white/18" />
                <button type="button" onClick={analyze} disabled={!aiPrompt.trim() || busy} className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center bg-cyan-200 text-slate-950 transition hover:bg-white disabled:opacity-30">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[9px] text-white/24"><span className="bg-white/[0.025] px-2.5 py-1.5">Events</span><span className="bg-white/[0.025] px-2.5 py-1.5">Tasks</span><span className="bg-white/[0.025] px-2.5 py-1.5">Recurring routines</span><span className="bg-white/[0.025] px-2.5 py-1.5">Connected reminders</span></div>
            </div>
          )}

          {step === 'preview' && plan && (
            <div className="mx-auto max-w-2xl">
              <div className="mb-5 border-b border-white/[0.06] pb-5"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-200/45"><Sparkles className="h-3.5 w-3.5" /> Agent preview</div><h4 className="mt-2 text-xl font-semibold text-white/90">{plan.summary || 'Schedule ready to apply.'}</h4><p className="mt-2 text-[10px] text-white/28">Nothing is written until you choose Apply schedule.</p></div>
              <div className="space-y-5">
                <PreviewGroup icon={CalendarDays} label="Events" items={plan.events || []} render={(event, index) => <div key={`${event.title}-${index}`} className="flex items-start justify-between gap-4 bg-white/[0.025] px-3.5 py-3"><div className="min-w-0"><div className="text-xs font-medium text-white/78">{event.title}</div><div className="mt-1 text-[9px] text-white/28">{new Date(event.start_time).toLocaleString()} · {(event.event_type || 'event').replaceAll('_',' ')}</div></div>{event.reminders?.length ? <span className="shrink-0 text-[8px] uppercase tracking-wider text-amber-200/50">Reminder</span> : null}</div>} />
                <PreviewGroup icon={ListChecks} label="Tasks" items={plan.tasks || []} render={(task, index) => <div key={`${task.title}-${index}`} className="bg-white/[0.025] px-3.5 py-3"><div className="text-xs font-medium text-white/75">{task.title}</div>{task.due_date && <div className="mt-1 text-[9px] text-white/28">Due {new Date(task.due_date).toLocaleString()}</div>}</div>} />
                <PreviewGroup icon={StickyNote} label="Notes" items={plan.notes || []} render={(note, index) => <div key={index} className="bg-white/[0.025] px-3.5 py-3 text-[10px] leading-5 text-white/50">{note.content}</div>} />
                {!(plan.events?.length || plan.tasks?.length || plan.notes?.length) && <div className="py-10 text-center text-xs text-white/30">The agent did not find anything concrete to schedule. Try adding times, dates, or tasks.</div>}
              </div>
              <div className="mt-6 flex gap-2 border-t border-white/[0.06] pt-5"><button type="button" onClick={() => setStep('prompt')} disabled={busy} className="h-11 flex-1 bg-white/[0.04] text-[10px] font-bold uppercase tracking-wider text-white/50 hover:bg-white/[0.07] hover:text-white">Edit request</button><button type="button" onClick={applyPlan} disabled={busy || !(plan.events?.length || plan.tasks?.length || plan.notes?.length)} className="h-11 flex-[1.4] bg-cyan-100 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950 hover:bg-white disabled:opacity-30">{busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5" /> Apply schedule</span>}</button></div>
            </div>
          )}

          {step === 'manual' && (
            <div className="mx-auto max-w-2xl space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2"><span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.16em] text-white/25">Title</span><input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="h-11 w-full border border-white/[0.08] bg-white/[0.025] px-3 text-sm text-white outline-none focus:border-cyan-200/20" placeholder="What is happening?" /></label>
                <label><span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.16em] text-white/25">Type</span><select value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value, reminder: e.target.value === 'reminder' && formData.reminder === 'none' ? '0' : formData.reminder })} className="h-11 w-full border border-white/[0.08] bg-[#0b1119] px-3 text-xs text-white/70 outline-none">{TYPE_OPTIONS.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label><span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.16em] text-white/25">Game / context</span><input value={formData.game} onChange={(e) => setFormData({ ...formData, game: e.target.value })} className="h-11 w-full border border-white/[0.08] bg-white/[0.025] px-3 text-xs text-white/70 outline-none" placeholder="Optional" /></label>
                <label><span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.16em] text-white/25">Starts</span><input type="datetime-local" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="h-11 w-full border border-white/[0.08] bg-[#0b1119] px-3 text-xs text-white/70 outline-none" /></label>
                <label><span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.16em] text-white/25">Ends</span><input type="datetime-local" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="h-11 w-full border border-white/[0.08] bg-[#0b1119] px-3 text-xs text-white/70 outline-none" /></label>
                <label><span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.16em] text-white/25">Repeats</span><select value={formData.recurrence} onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })} className="h-11 w-full border border-white/[0.08] bg-[#0b1119] px-3 text-xs text-white/70 outline-none"><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
                <label><span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.16em] text-white/25">Reminder</span><select value={formData.reminder} onChange={(e) => setFormData({ ...formData, reminder: e.target.value })} className="h-11 w-full border border-white/[0.08] bg-[#0b1119] px-3 text-xs text-white/70 outline-none">{REMINDER_OPTIONS.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="md:col-span-2"><span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.16em] text-white/25">Details</span><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-24 w-full resize-none border border-white/[0.08] bg-white/[0.025] p-3 text-xs leading-5 text-white/70 outline-none" placeholder="Notes, location, party details…" /></label>
              </div>
              <div className="flex gap-2 border-t border-white/[0.06] pt-5"><button type="button" onClick={onClose} className="h-11 flex-1 bg-white/[0.04] text-[10px] font-bold uppercase tracking-wider text-white/45 hover:bg-white/[0.07]">Cancel</button><button type="button" onClick={createManual} disabled={busy || !formData.title.trim() || !formData.start_time} className="h-11 flex-[1.4] bg-white text-[10px] font-black uppercase tracking-[0.14em] text-black hover:bg-cyan-100 disabled:opacity-30">{busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : <span className="inline-flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Add to calendar</span>}</button></div>
            </div>
          )}

          {error && <div className="mx-auto mt-5 max-w-2xl border border-rose-300/10 bg-rose-300/[0.04] px-3 py-2 text-[10px] text-rose-100/60">{error}</div>}
        </div>
      </motion.div>
    </motion.div>
  );
}
