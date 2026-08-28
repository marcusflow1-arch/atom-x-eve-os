import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format, addDays, startOfWeek, subDays, isToday } from 'date-fns';

export default function ScheduleSection({ 
  isEditMode, 
  scheduleData = {}, 
  onUpdateSchedule,
  onClose 
}) {
  const [scheduleBaseDate, setScheduleBaseDate] = useState(new Date());
  const [editingDay, setEditingDay] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ time: '', title: '', game: '', isGiveaway: false });

  const startDate = startOfWeek(scheduleBaseDate, { weekStartsOn: 1 });
  const scheduleDays = Array.from({ length: 14 }).map((_, i) => addDays(startDate, i));
  const endDate = scheduleDays[13];
  const dateRangeString = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

  const handleScheduleClick = (date) => {
    if (!isEditMode) return;
    const dateKey = format(date, 'yyyy-MM-dd');
    setEditingDay(date);
    setScheduleForm(scheduleData[dateKey] || { time: '', title: '', game: '', isGiveaway: false });
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

  return (
    <div className="w-full select-none pt-4 bg-white/5 rounded-2xl p-6 border border-white/10 relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          Streaming Schedule
          <span className="text-white/40 text-sm font-normal ml-2">{dateRangeString}</span>
          {isEditMode && <Badge className="bg-white text-black text-[10px] ml-2">EDITING</Badge>}
        </h3>
        <div className="flex items-center gap-2">
          <Button onClick={() => setScheduleBaseDate(prev => subDays(prev, 14))} variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronLeft className="w-4 h-4" /></Button>
          <Button onClick={() => setScheduleBaseDate(new Date())} variant="outline" className="h-8 px-4 rounded-lg bg-white/5 border-white/10 hover:bg-white/10 text-xs font-semibold">Today</Button>
          <Button onClick={() => setScheduleBaseDate(prev => addDays(prev, 14))} variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
        {scheduleDays.map((date, i) => {
          const isCurrentDay = isToday(date);
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayData = scheduleData[dateKey];

          return (
            <div
              key={i}
              className={`bg-[#0f1419] p-2 min-h-[140px] flex flex-col items-center relative group hover:bg-[#1a1f2e] transition-colors ${isCurrentDay ? 'bg-white/[0.03]' : ''}`}
            >
              <div className="w-full flex justify-between items-start mb-2 px-1">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{format(date, 'EEE')}</span>
                <span className={`text-sm font-bold ${isCurrentDay ? 'text-cyan-400' : 'text-white/60'}`}>{format(date, 'd')}</span>
              </div>

              {dayData ? (
                <div className="w-full bg-white/5 rounded p-2 border border-white/5 text-center relative z-0">
                  <div className="text-[10px] text-cyan-300 font-bold mb-1">{dayData.time}</div>
                  <div className="text-xs text-white leading-tight font-medium break-words mb-1">{dayData.title}</div>
                  {dayData.game && <div className="text-[9px] text-white/60 mb-1 italic">{dayData.game}</div>}
                  {dayData.isGiveaway && <Badge className="text-[8px] h-4 px-1 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">GIVEAWAY</Badge>}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  {isCurrentDay && !isEditMode && <span className="text-[10px] text-white/20 italic">No stream</span>}
                </div>
              )}

              {isCurrentDay && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none box-border border-b-2 border-cyan-500/50" />}

              {isEditMode && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleScheduleClick(date); }}
                      className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg pointer-events-auto"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute top-1 right-1 z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleClearDay(date); }}
                      className="p-1 rounded-full bg-black/60 text-white/40 hover:text-red-400 hover:bg-black/80 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-white/30 text-xs mt-4">Double-click content to collapse • Timezone is localized</p>

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
    </div>
  );
}