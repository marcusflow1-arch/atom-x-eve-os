import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Clock, Calendar, Repeat, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIEventCreator({ mode, selectedDate, onClose, onSuccess, currentUserId }) {
  const [step, setStep] = useState(mode === 'ai' ? 'prompt' : 'form');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'gaming_session',
    start_time: selectedDate ? selectedDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    end_time: '',
    recurrence: 'none'
  });

  const handleAiAnalyze = async () => {
    if (!aiPrompt.trim()) return;
    setIsProcessing(true);
    
    // Simulate AI processing for now
    setTimeout(() => {
      // Mock parsing logic
      const isGame = aiPrompt.toLowerCase().includes('game') || aiPrompt.toLowerCase().includes('play');
      const isMeeting = aiPrompt.toLowerCase().includes('meet') || aiPrompt.toLowerCase().includes('work');
      
      setFormData({
        ...formData,
        title: aiPrompt, // In real AI, would extract intent
        description: 'AI Generated from: ' + aiPrompt,
        event_type: isGame ? 'gaming_session' : isMeeting ? 'meeting' : 'personal',
      });
      setStep('form');
      setIsProcessing(false);
    }, 1500);
  };

  const handleSubmit = async () => {
    try {
      await base44.entities.UserEvent.create({
        user_id: currentUserId,
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
        source: mode === 'ai' ? 'ai' : 'user'
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            {mode === 'ai' ? <Sparkles className="w-5 h-5 text-cyan-400" /> : <Calendar className="w-5 h-5 text-white" />}
            <h3 className="text-xl font-bold text-white">
              {mode === 'ai' ? 'AI Assistant' : 'New Event'}
            </h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
        </div>

        <div className="p-8">
          {step === 'prompt' ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                  <Bot className="w-8 h-8 text-cyan-400" />
                </div>
                <h4 className="text-lg font-medium text-white">How can I help you schedule?</h4>
                <p className="text-white/40 text-sm">Describe your event naturally. I'll handle the details.</p>
              </div>

              <div className="relative">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. 'Raid night with the clan next Friday at 8 PM' or 'Doctor appointment tomorrow morning'"
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none resize-none transition-all"
                />
                <button
                  onClick={handleAiAnalyze}
                  disabled={!aiPrompt.trim() || isProcessing}
                  className="absolute bottom-4 right-4 p-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="flex justify-center">
                <button onClick={() => setStep('form')} className="text-xs text-white/30 hover:text-white transition-colors">
                  Skip to manual entry
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Form View */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1.5 block">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none"
                    placeholder="Event Title"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1.5 block">Type</label>
                  <select
                    value={formData.event_type}
                    onChange={e => setFormData({...formData, event_type: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none appearance-none"
                  >
                    <option value="gaming_session">Gaming Session</option>
                    <option value="raid">Raid</option>
                    <option value="tournament">Tournament</option>
                    <option value="personal">Personal Life</option>
                    <option value="meeting">Meeting</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1.5 block">Recurrence</label>
                  <select
                    value={formData.recurrence}
                    onChange={e => setFormData({...formData, recurrence: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none appearance-none"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1.5 block">Start</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1.5 block">End</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={e => setFormData({...formData, end_time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1.5 block">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none resize-none"
                    placeholder="Add details, notes, or links..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors"
                >
                  Create Event
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}