import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, Clock3, Plus } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, index) => index);

function startOfEvent(event) { return new Date(event.occurrence_start || event.start_time); }
function endOfEvent(event) {
  const start = startOfEvent(event);
  const end = new Date(event.occurrence_end || event.end_time || start.getTime() + 60 * 60 * 1000);
  return Number.isNaN(end.getTime()) ? new Date(start.getTime() + 60 * 60 * 1000) : end;
}
function eventStyle(event) {
  const start = startOfEvent(event);
  const end = endOfEvent(event);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const durationMinutes = Math.max(25, (end.getTime() - start.getTime()) / 60000);
  return { top: `${startMinutes}px`, height: `${durationMinutes}px` };
}

export default function DayPlanningView({ date, events = [], tasks = [], onAddEvent, onAiAssist, onEventClick }) {
  return (
    <div className="absolute inset-0 flex min-h-0 flex-col bg-[#05080d]">
      <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-white/[0.05] px-4 md:px-6">
        <div><div className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/22">Day plan</div><div className="mt-0.5 text-sm font-semibold text-white/65">{date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div></div>
        <div className="flex gap-1.5"><button type="button" onClick={onAiAssist} className="flex h-8 items-center gap-2 bg-cyan-200/[0.07] px-3 text-[8px] font-bold uppercase tracking-wider text-cyan-100/60 hover:bg-cyan-200/[0.11] hover:text-cyan-100"><Brain className="h-3.5 w-3.5" /> AI plan</button><button type="button" onClick={onAddEvent} className="flex h-8 items-center gap-2 bg-white/[0.045] px-3 text-[8px] font-bold uppercase tracking-wider text-white/45 hover:bg-white/[0.08] hover:text-white"><Plus className="h-3.5 w-3.5" /> Event</button></div>
      </div>

      {tasks.length > 0 && <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/[0.04] px-4 py-2" style={{scrollbarWidth:'none'}}><span className="mr-1 flex shrink-0 items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-white/22"><CheckCircle2 className="h-3 w-3" /> Tasks</span>{tasks.map((task) => <span key={task.id} className="shrink-0 bg-white/[0.025] px-2.5 py-1.5 text-[9px] text-white/42">{task.title}</span>)}</div>}

      <div className="min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="relative min-h-[1440px] w-full">
          {HOURS.map((hour) => <div key={hour} className="absolute left-0 right-0 border-t border-white/[0.04]" style={{ top: `${hour * 60}px`, height: '60px' }}><span className="absolute -top-2 left-2 w-12 text-right text-[8px] text-white/16">{new Date(2020,0,1,hour).toLocaleTimeString([], { hour: 'numeric' })}</span></div>)}
          <div className="absolute bottom-0 left-[62px] right-4 top-0">
            {events.map((event) => <motion.button key={event.occurrence_key || event.id} type="button" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} onClick={() => onEventClick?.(event)} className="absolute left-0 right-0 overflow-hidden border-l-2 border-cyan-200/35 bg-cyan-200/[0.045] px-3 py-2 text-left transition hover:bg-cyan-200/[0.075]" style={eventStyle(event)}><div className="truncate text-[10px] font-semibold text-white/72">{event.title}</div><div className="mt-1 flex items-center gap-1 text-[8px] text-white/28"><Clock3 className="h-2.5 w-2.5" /> {startOfEvent(event).toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}</div>{event.description && <div className="mt-1 line-clamp-2 text-[8px] leading-3 text-white/20">{event.description}</div>}</motion.button>)}
            <button type="button" onClick={onAddEvent} className="absolute left-0 right-0 top-[720px] h-10 text-[8px] text-white/0 transition hover:bg-white/[0.02] hover:text-white/25"><Plus className="mr-1 inline h-2.5 w-2.5" /> Add event</button>
          </div>
        </div>
      </div>
    </div>
  );
}
