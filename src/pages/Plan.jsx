import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  isSameMonth, isSameDay, format,
} from 'date-fns';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Plan() {
  const navigate = useNavigate();
  const today = new Date();
  const [cursor, setCursor] = useState(startOfMonth(today));
  const [selected, setSelected] = useState(today);

  const start = startOfWeek(startOfMonth(cursor));
  const end = endOfWeek(endOfMonth(cursor));
  const days = [];
  let d = start;
  while (d <= end) { days.push(d); d = addDays(d, 1); }

  const monthLabel = format(cursor, 'MMMM yyyy');

  return (
    <div className="min-h-screen w-full p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-cyan-300" />
            <h1 className="text-2xl font-bold tracking-wide">Plan</h1>
          </div>
          <button
            onClick={() => navigate(createPageUrl('LunaTemplate'))}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-all"
          >
            <Home className="w-4 h-4" /> Luna Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Calendar */}
          <div
            className="rounded-3xl p-5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{monthLabel}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCursor(startOfMonth(addDays(startOfMonth(cursor), -1)))}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setCursor(startOfMonth(today)); setSelected(today); }}
                  className="px-3 h-8 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium"
                >
                  Today
                </button>
                <button
                  onClick={() => setCursor(startOfMonth(addDays(endOfMonth(cursor), 1)))}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-[11px] font-semibold uppercase tracking-wider text-white/40">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const inMonth = isSameMonth(day, cursor);
                const isToday = isSameDay(day, today);
                const isSelected = isSameDay(day, selected);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelected(day)}
                    className={`aspect-square rounded-xl text-sm transition-all ${
                      isSelected
                        ? 'bg-cyan-500/30 border border-cyan-400/50 text-white'
                        : isToday
                        ? 'bg-white/10 border border-white/20 text-white'
                        : inMonth
                        ? 'text-white/80 hover:bg-white/10'
                        : 'text-white/25'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day panel */}
          <div
            className="rounded-3xl p-5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)' }}
          >
            <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Selected</p>
            <h3 className="text-xl font-semibold mb-4">{format(selected, 'EEEE, MMM d')}</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-white/70">No events scheduled for this day.</p>
              </div>
              <p className="text-xs text-white/40">
                Your planner is ready. Add reminders and goals from the Luna Dashboard calendar to see them here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}