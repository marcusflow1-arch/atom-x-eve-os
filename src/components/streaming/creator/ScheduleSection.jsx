import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Maximize2, Minimize2, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format, addDays, startOfWeek, subDays, isToday } from 'date-fns';
import { channelScheduleCalendar } from '../channel/channelHomeModel';

const EMPTY_DAY = { time: '', title: '', game: '', isGiveaway: false };

// Calendar console that blends into the streaming box itself, like the Games overlay:
// a full-width glass panel portalled into the stream player container.
export default function ScheduleSection({ isEditMode, scheduleData = {}, scheduledStreams = [], initialDate, onUpdateSchedule, onClose }) {
  const [scheduleBaseDate, setScheduleBaseDate] = useState(() => initialDate ? new Date(initialDate) : new Date());
  const calendarData = isEditMode ? scheduleData : channelScheduleCalendar(scheduleData, scheduledStreams);
  const [editingDay, setEditingDay] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(EMPTY_DAY);
  const [fullscreen, setFullscreen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    setPortalTarget(document.querySelector('[data-stream-player-box="true"]'));
    const observer = new MutationObserver(() => setPortalTarget(document.querySelector('[data-stream-player-box="true"]')));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!fullscreen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [fullscreen]);

  const startDate = startOfWeek(scheduleBaseDate, { weekStartsOn: 1 });
  const scheduleDays = Array.from({ length: 14 }).map((_, i) => addDays(startDate, i));
  const endDate = scheduleDays[13];
  const dateRangeString = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  const scheduledCount = scheduleDays.filter((date) => calendarData[format(date, 'yyyy-MM-dd')]).length;

  const handleScheduleClick = (date) => {
    if (!isEditMode) return;
    setEditingDay(date);
    setScheduleForm(scheduleData[format(date, 'yyyy-MM-dd')] || EMPTY_DAY);
  };

  const saveScheduleDay = () => {
    if (!editingDay) return;
    const dateKey = format(editingDay, 'yyyy-MM-dd');
    onUpdateSchedule({ ...scheduleData, [dateKey]: scheduleForm });
    setEditingDay(null);
  };

  const handleClearDay = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const newData = { ...scheduleData };
    delete newData[dateKey];
    onUpdateSchedule(newData);
  };

  const headerNode = (
    <div className="flex items-center justify-between gap-3 shrink-0 pb-2">
      <div className="min-w-0 flex items-center gap-3">
        <CalendarDays className="w-[18px] h-[18px] text-cyan-300/80 shrink-0" />
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.3em] text-cyan-300/60">Stream Schedule</div>
          <h3 className="text-base md:text-lg font-bold text-white truncate">What I'm playing &amp; when</h3>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:block text-xs font-semibold text-white/45 mr-1">{dateRangeString}</span>
        <button type="button" onClick={() => setScheduleBaseDate((prev) => subDays(prev, 14))} className="h-7 w-7 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/[0.13] text-white/70 hover:text-white" aria-label="Previous two weeks"><ChevronLeft className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => setScheduleBaseDate(new Date())} className="h-7 px-3 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/[0.13] text-[11px] font-semibold text-white/70 hover:text-white">Today</button>
        <button type="button" onClick={() => setScheduleBaseDate((prev) => addDays(prev, 14))} className="h-7 w-7 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/[0.13] text-white/70 hover:text-white" aria-label="Next two weeks"><ChevronRight className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => setFullscreen((value) => !value)} className="h-7 w-7 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/[0.13] text-white/70 hover:text-white" aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>
          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        {onClose && <button type="button" onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/[0.13] text-white/70 hover:text-white" aria-label="Close schedule"><X className="w-3.5 h-3.5" /></button>}
      </div>
    </div>
  );

  const calendarNode = (
    <div className="flex-1 min-h-0 grid grid-cols-7 grid-rows-2 gap-px rounded-lg overflow-hidden border border-white/10 bg-white/[0.06]">
      {scheduleDays.map((date, i) => {
        const isCurrentDay = isToday(date);
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayData = calendarData[dateKey];
        return (
          <div
            key={i}
            className={`relative flex flex-col min-h-0 p-2 transition-colors group/cell ${isCurrentDay ? 'bg-cyan-400/[0.07]' : 'bg-[#0f1419] hover:bg-[#1a1f2e]'}`}
          >
            {isCurrentDay && <div className="absolute inset-0 box-border rounded-[3px] border border-cyan-300/60 pointer-events-none shadow-[0_0_16px_rgba(103,232,249,.18)]" />}
            <div className="flex items-baseline justify-between mb-1.5 shrink-0">
              <span className={`text-[9px] font-bold uppercase tracking-[0.14em] ${isCurrentDay ? 'text-cyan-200' : 'text-white/40'}`}>{format(date, 'EEE')}</span>
              <span className={`text-sm font-bold ${isCurrentDay ? 'text-cyan-300' : 'text-white/60'}`}>{format(date, 'd')}</span>
            </div>
            <div className="flex-1 min-h-0 flex flex-col justify-center">
              {dayData ? (
                <div className="w-full rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-center">
                  <div className="text-[10px] font-bold text-cyan-300 mb-0.5">{dayData.time}</div>
                  <div className="text-[11px] font-semibold text-white leading-tight line-clamp-2">{dayData.title}</div>
                  {dayData.game && <div className="text-[9px] text-white/55 mt-0.5 truncate italic">{dayData.game}</div>}
                  {dayData.isGiveaway && <Badge className="text-[8px] h-4 px-1 mt-1 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">GIVEAWAY</Badge>}
                </div>
              ) : (
                <div className="text-center">{isCurrentDay && !isEditMode && <span className="text-[10px] text-white/25 italic">No stream</span>}</div>
              )}
            </div>
            {isEditMode && (
              <>
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleScheduleClick(date); }}
                    className="w-7 h-7 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg pointer-events-auto"
                    aria-label={`Schedule stream on ${format(date, 'MMMM do')}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {dayData && (
                  <div className="absolute top-1 right-1 z-10">
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleClearDay(date); }} className="p-1 rounded-full bg-black/60 text-white/40 hover:text-red-400 hover:bg-black/80 transition-colors" aria-label={`Clear ${format(date, 'MMMM do')}`}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  const footerNode = (
    <div className="flex shrink-0 items-center justify-between pt-2">
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/30">{scheduledCount} scheduled stream{scheduledCount === 1 ? '' : 's'} these two weeks</span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/25">{isEditMode ? 'Click a day to schedule' : 'Times shown in your local timezone'}</span>
    </div>
  );

  const editDialog = (
    <Dialog open={!!editingDay} onOpenChange={(open) => !open && setEditingDay(null)}>
      <DialogContent className="bg-[#1a1f2e] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Edit Schedule: {editingDay && format(editingDay, 'MMMM do, yyyy')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Time</label>
            <Input value={scheduleForm.time} onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })} placeholder="e.g. 7:00 PM EST" className="bg-black/20 border-white/10 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Activity / Title</label>
            <Input value={scheduleForm.title} onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })} placeholder="e.g. Ranked Climb" className="bg-black/20 border-white/10 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Game</label>
            <Input value={scheduleForm.game} onChange={(e) => setScheduleForm({ ...scheduleForm, game: e.target.value })} placeholder="e.g. Valorant" className="bg-black/20 border-white/10 text-white" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="giveaway" checked={scheduleForm.isGiveaway} onChange={(e) => setScheduleForm({ ...scheduleForm, isGiveaway: e.target.checked })} className="w-4 h-4 rounded border-white/10 bg-black/20 text-cyan-500 focus:ring-cyan-500/50" />
            <label htmlFor="giveaway" className="text-sm font-medium text-white/80 cursor-pointer">Doing a Giveaway?</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setEditingDay(null)}>Cancel</Button>
          <Button onClick={saveScheduleDay} className="bg-white text-black hover:bg-gray-200">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const hideShellStyle = <style>{`body:has([data-schedule-overlay="true"]) > div.fixed.inset-0 > section { visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }`}</style>;

  if (fullscreen) {
    return createPortal(
      <div data-schedule-overlay="true" role="dialog" aria-label="Stream schedule" className="fixed inset-0 z-[100001] flex flex-col overflow-hidden bg-slate-950/96 backdrop-blur-xl text-white px-6 py-5">
        {hideShellStyle}
        {headerNode}
        <div className="flex-1 min-h-0 py-3">{calendarNode}</div>
        {footerNode}
        {editDialog}
      </div>,
      document.body
    );
  }

  const content = (
    <>
      {hideShellStyle}
      <motion.div
        data-schedule-overlay="true"
        role="dialog"
        aria-label="Stream schedule"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        className="absolute inset-0 z-[100000] flex flex-col overflow-hidden rounded-xl px-5 py-4 text-white"
        style={{
          background: 'linear-gradient(180deg, rgba(2,6,23,.95), rgba(2,6,23,.88) 60%, rgba(2,6,23,.8))',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          boxShadow: '0 24px 70px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.06)',
        }}
      >
        {headerNode}
        <div className="flex-1 min-h-0 pt-2">{calendarNode}</div>
        {footerNode}
        {editDialog}
      </motion.div>
    </>
  );

  if (portalTarget) return createPortal(content, portalTarget);
  return null;
}
