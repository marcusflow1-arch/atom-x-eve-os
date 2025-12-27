import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Brain, AlertCircle } from 'lucide-react';

export default function DayPlanningView({ date, events, tasks, onAddEvent }) {
  // Generate time slots 6 AM to 12 AM
  const timeSlots = Array.from({ length: 19 }, (_, i) => i + 6);

  const getEventStyle = (event) => {
    const start = new Date(event.start_time);
    const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 60*60*1000);
    
    // Simple positioning calculation (assuming view starts at 6am)
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const duration = Math.max(endHour - startHour, 0.5); // Min 30 mins
    
    const top = (startHour - 6) * 60; // 60px per hour
    const height = duration * 60;

    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950/20">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <div className="text-white/60 text-sm">
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div className="flex gap-2">
          {/* AI Insight Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <Brain className="w-3 h-3 text-indigo-400" />
            <span className="text-xs text-indigo-200">You usually play RPGs around 8 PM</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="relative min-h-[1140px] w-full">
          {/* Grid Lines */}
          {timeSlots.map(hour => (
            <div key={hour} className="absolute w-full border-t border-white/5 flex items-start" style={{ top: `${(hour - 6) * 60}px`, height: '60px' }}>
              <span className="text-[10px] text-white/20 w-12 text-right pr-3 -mt-2">
                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
              </span>
            </div>
          ))}

          {/* Events */}
          <div className="absolute top-0 left-12 right-4 bottom-0">
            {events.map(ev => {
              const style = getEventStyle(ev);
              // Only render if within range (simplification)
              if (parseInt(style.top) < 0) return null;

              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute left-0 right-0 rounded-lg border p-3 overflow-hidden backdrop-blur-md ${
                    ev.event_type === 'gaming_session' ? 'bg-cyan-500/10 border-cyan-500/30' :
                    ev.event_type === 'meeting' ? 'bg-purple-500/10 border-purple-500/30' :
                    'bg-white/5 border-white/10'
                  }`}
                  style={style}
                >
                  <div className="font-medium text-sm text-white/90">{ev.title}</div>
                  <div className="text-xs text-white/50 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ev.start_time).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                  </div>
                </motion.div>
              );
            })}

            {/* Empty Slot Highlight (Click to add) */}
            <div 
              className="absolute w-full h-12 hover:bg-white/5 cursor-pointer flex items-center justify-center group transition-colors"
              style={{ top: '240px' }} // Example position 10am
              onClick={onAddEvent}
            >
              <span className="text-xs text-white/0 group-hover:text-white/40 transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Event
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}