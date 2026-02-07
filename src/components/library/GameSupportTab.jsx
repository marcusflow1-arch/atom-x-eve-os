import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Bug, MessageSquare, Send, CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';

const MOCK_TICKETS = [
  { id: 'T-001', title: 'Game crashes on loading screen', status: 'open', priority: 'high', date: '2 days ago' },
  { id: 'T-002', title: 'Missing inventory items after update', status: 'in_progress', priority: 'medium', date: '5 days ago' },
  { id: 'T-003', title: 'Audio not working in cutscenes', status: 'resolved', priority: 'low', date: '1 week ago' },
];

export default function GameSupportTab({ game }) {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'bug' });

  const handleSubmit = () => {
    if (!form.title) return;
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setShowForm(false); setForm({ title: '', description: '', category: 'bug' }); }, 2000);
  };

  const statusStyles = {
    open: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
    in_progress: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    resolved: 'border-green-500/30 text-green-400 bg-green-500/10',
  };

  const priorityStyles = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-white/40',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          Support Center
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30">
          <Bug className="w-4 h-4 mr-2" />
          {showForm ? 'Cancel' : 'New Ticket'}
        </Button>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h4 className="text-white font-bold text-lg">Ticket Submitted!</h4>
              <p className="text-white/50 text-sm">We'll get back to you as soon as possible.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-white/60 text-sm mb-1 block">Category</label>
                <div className="flex gap-2">
                  {[{ id: 'bug', label: 'Bug Report', icon: Bug }, { id: 'help', label: 'Help', icon: HelpCircle }, { id: 'feedback', label: 'Feedback', icon: MessageSquare }].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setForm({ ...form, category: c.id })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        form.category === c.id ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <c.icon className="w-3.5 h-3.5" />{c.label}
                    </button>
                  ))}
                </div>
              </div>
              <Input placeholder="Title (e.g., Game crashes on startup)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              <Textarea placeholder="Describe your issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-28" />
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-500"><Send className="w-4 h-4 mr-2" />Submit Ticket</Button>
            </>
          )}
        </motion.div>
      )}

      {/* Existing Tickets */}
      <div>
        <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Your Tickets</h4>
        <div className="space-y-2">
          {MOCK_TICKETS.map((ticket) => (
            <div key={ticket.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
              <div className="flex-shrink-0">
                {ticket.priority === 'high' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                 ticket.priority === 'medium' ? <Clock className="w-5 h-5 text-yellow-400" /> :
                 <HelpCircle className="w-5 h-5 text-white/40" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs font-mono">{ticket.id}</span>
                  <Badge variant="outline" className={`text-[10px] h-4 ${statusStyles[ticket.status]}`}>{ticket.status.replace('_', ' ')}</Badge>
                </div>
                <h4 className="text-white font-medium text-sm mt-1 group-hover:text-cyan-400 transition-colors">{ticket.title}</h4>
                <span className="text-white/30 text-xs">{ticket.date}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40" />
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
        <h4 className="text-white font-bold mb-3">Frequently Asked Questions</h4>
        <div className="space-y-3">
          {['How do I reset my progress?', 'Where can I find my save files?', 'How to report another player?'].map((q, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-all group">
              <span className="text-white/60 text-sm group-hover:text-white transition-colors">{q}</span>
              <ChevronRight className="w-4 h-4 text-white/20" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}