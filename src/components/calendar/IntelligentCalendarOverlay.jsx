import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  Clock, Gamepad2, Users, Trash2, CheckCircle2, StickyNote, 
  Bot, Sparkles, LayoutList, AlignLeft
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DayPlanningView from './DayPlanningView';
import AIEventCreator from './AIEventCreator';

export default function IntelligentCalendarOverlay({ onClose, currentUserId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'day' | 'week'
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'tasks' | 'notes'
  
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreator, setShowCreator] = useState(false);
  const [creatorMode, setCreatorMode] = useState('manual'); // 'manual' | 'ai'

  useEffect(() => {
    loadData();
  }, [currentDate, currentUserId]);

  const loadData = async () => {
    try {
      // Load events for the month (plus padding for weeks)
      // In a real app we'd filter by date range, here filtering all for simplicity or assume limit
      const userEvents = await base44.entities.UserEvent.filter({ user_id: currentUserId });
      setEvents(userEvents);

      const userTasks = await base44.entities.UserTask.filter({ user_id: currentUserId });
      setTasks(userTasks);

      const userNotes = await base44.entities.UserNote.filter({ user_id: currentUserId });
      setNotes(userNotes);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setViewMode('day');
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-8"
    >
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" 
        onClick={onClose}
      />

      {/* Main Container - Liquid Glass Style */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-7xl bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex"
        style={{
          height: 'calc(100vh - 160px)',
          boxShadow: '0 0 80px -20px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05)'
        }}
      >
        {/* Left Rail */}
        <div className="w-20 flex-shrink-0 border-r border-white/5 flex flex-col items-center py-8 gap-6 bg-white/5">
          <button 
            onClick={() => setActiveTab('events')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'events' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title="Events"
          >
            <CalendarIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'tasks' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title="Tasks"
          >
            <CheckCircle2 className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'notes' ? 'bg-amber-500/20 text-amber-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            title="Notes"
          >
            <StickyNote className="w-6 h-6" />
          </button>
          
          <div className="flex-1" />
          
          <button 
            onClick={() => setViewMode(viewMode === 'day' ? 'month' : 'day')}
            className="p-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
            title="Toggle Day/Month View"
          >
            {viewMode === 'day' ? <LayoutList className="w-6 h-6" /> : <AlignLeft className="w-6 h-6" />}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-20 flex items-center justify-between px-8 border-b border-white/5">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-light text-white tracking-wide">
                {viewMode === 'day' ? 'Day Planner' : 'Calendar'}
              </h2>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-1 rounded-full hover:bg-white/5 text-white/60 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg text-white/80 font-medium min-w-[140px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-1 rounded-full hover:bg-white/5 text-white/60 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setShowCreator(true); setCreatorMode('manual'); }}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
              <button 
                onClick={() => { setShowCreator(true); setCreatorMode('ai'); }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-cyan-300 text-sm font-medium transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              >
                <Sparkles className="w-4 h-4" />
                AI Assist
              </button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden relative">
            {viewMode === 'month' ? (
              <div className="absolute inset-0 p-8 flex flex-col">
                <div className="grid grid-cols-7 mb-4">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-white/30 text-sm font-medium uppercase tracking-widest">{day}</div>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-4">
                  {getDaysInMonth().map((date, i) => {
                    const isToday = date && new Date().toDateString() === date.toDateString();
                    const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();
                    const dayEvents = date ? events.filter(e => new Date(e.start_time).toDateString() === date.toDateString()) : [];

                    return (
                      <div 
                        key={i}
                        onClick={() => date && handleDateClick(date)}
                        className={`relative rounded-2xl border transition-all duration-200 group ${
                          !date ? 'border-transparent' : 
                          isSelected ? 'bg-white/10 border-white/20' : 
                          isToday ? 'bg-cyan-500/10 border-cyan-500/30' : 
                          'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                        }`}
                      >
                        {date && (
                          <div className="absolute inset-0 p-3 flex flex-col">
                            <span className={`text-sm font-medium ${isToday ? 'text-cyan-400' : 'text-white/60'}`}>
                              {date.getDate()}
                            </span>
                            
                            <div className="mt-2 flex-1 flex flex-col gap-1 overflow-hidden">
                              {dayEvents.slice(0, 3).map(ev => (
                                <div key={ev.id} className="w-full text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/80 truncate border border-white/5 flex items-center gap-1">
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    ev.event_type === 'gaming_session' ? 'bg-cyan-400' :
                                    ev.event_type === 'meeting' ? 'bg-purple-400' :
                                    'bg-slate-400'
                                  }`} />
                                  {ev.title}
                                </div>
                              ))}
                              {dayEvents.length > 3 && (
                                <span className="text-[10px] text-white/30 pl-1">+{dayEvents.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <DayPlanningView 
                date={selectedDate} 
                events={events.filter(e => new Date(e.start_time).toDateString() === selectedDate.toDateString())}
                tasks={tasks}
                onAddEvent={() => { setShowCreator(true); setCreatorMode('manual'); }}
                onAiAssist={() => { setShowCreator(true); setCreatorMode('ai'); }}
              />
            )}
          </div>
        </div>

        {/* Right Context Panel (Task/Notes or AI Sidebar) */}
        <div className="w-80 border-l border-white/5 bg-black/20 p-6 flex flex-col gap-6">
          {activeTab === 'events' && (
            <>
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Upcoming
                </h3>
                <div className="space-y-3">
                  {events
                    .filter(e => new Date(e.start_time) >= new Date())
                    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                    .slice(0, 5)
                    .map(ev => (
                      <div key={ev.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-white text-sm font-medium">{ev.title}</span>
                          <span className="text-[10px] text-white/40">{new Date(ev.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/40">
                          <span className="capitalize">{ev.event_type.replace('_', ' ')}</span>
                          {ev.game && <span>• {ev.game}</span>}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}

          {activeTab === 'tasks' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Tasks
                </h3>
                <button className="p-1 hover:bg-white/10 rounded"><Plus className="w-4 h-4 text-white/60" /></button>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className={`mt-1 w-4 h-4 rounded border ${task.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500' : 'border-white/20'}`} />
                    <div className="flex-1">
                      <p className="text-sm text-white/80">{task.title}</p>
                      {task.priority === 'high' && <span className="text-[10px] text-red-400">High Priority</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* AI Creator Modal / Overlay */}
        <AnimatePresence>
          {showCreator && (
            <AIEventCreator 
              mode={creatorMode} 
              selectedDate={selectedDate}
              onClose={() => setShowCreator(false)}
              onSuccess={() => {
                setShowCreator(false);
                loadData();
              }}
              currentUserId={currentUserId}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}