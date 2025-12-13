import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Gamepad2, Users, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CalendarOverlay({ onClose, currentUserId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'gaming_session',
    game: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const userEvents = await base44.entities.UserEvent.filter({
        user_id: currentUserId
      });
      setEvents(userEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.start_time) return;

    try {
      await base44.entities.UserEvent.create({
        user_id: currentUserId,
        ...newEvent,
        start_time: new Date(newEvent.start_time).toISOString(),
        end_time: newEvent.end_time ? new Date(newEvent.end_time).toISOString() : null
      });
      
      setNewEvent({
        title: '',
        description: '',
        event_type: 'gaming_session',
        game: '',
        start_time: '',
        end_time: ''
      });
      setShowEventForm(false);
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const deleteEvent = async (eventId) => {
    if (!confirm('Delete this event?')) return;
    
    try {
      await base44.entities.UserEvent.delete(eventId);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getEventsForDate = (day) => {
    if (!day) return [];
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    return events.filter(event => new Date(event.start_time).toDateString() === dateStr);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Calendar</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Calendar Controls */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <h3 className="text-xl font-bold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-bold text-white/40 uppercase py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isToday = day && new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              
              return (
                <div
                  key={index}
                  onClick={() => day && setSelectedDate(day)}
                  className={`aspect-square rounded-lg border transition-all cursor-pointer ${
                    day
                      ? isToday
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-transparent'
                  }`}
                >
                  {day && (
                    <div className="p-2 h-full flex flex-col">
                      <span className="text-white text-sm font-semibold">{day}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex-1 flex items-end">
                          <div className="flex gap-1">
                            {dayEvents.slice(0, 3).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events Panel */}
        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              {selectedDate ? `Events for ${monthNames[currentDate.getMonth()]} ${selectedDate}` : 'All Events'}
            </h3>
            <button
              onClick={() => setShowEventForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(selectedDate ? getEventsForDate(selectedDate) : events).map(event => (
              <div key={event.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{event.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-white/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {event.game && (
                      <span className="text-xs text-blue-400 flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3" />
                        {event.game}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Event Form Modal */}
        <AnimatePresence>
          {showEventForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowEventForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-slate-800 rounded-xl p-6 space-y-4"
              >
                <h3 className="text-xl font-bold text-white">Create Event</h3>
                
                <input
                  type="text"
                  placeholder="Event Title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
                
                <textarea
                  placeholder="Description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 h-20 resize-none"
                />
                
                <input
                  type="text"
                  placeholder="Game (optional)"
                  value={newEvent.game}
                  onChange={(e) => setNewEvent({...newEvent, game: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="datetime-local"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent({...newEvent, start_time: e.target.value})}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="datetime-local"
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent({...newEvent, end_time: e.target.value})}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEventForm(false)}
                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createEvent}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}