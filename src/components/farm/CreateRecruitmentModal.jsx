import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CreateRecruitmentModal({ open, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('looking_for_members');

  const handleSubmit = () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    onCreated?.({
      id: `rec-${Date.now()}`,
      title: title.trim(),
      author: 'You',
      time: 'Just now',
      replies: 0,
      upvotes: 1,
      isFriend: false,
      active: true,
      type,
      description: description.trim(),
    });
    toast.success('Recruitment thread created!');
    setTitle(''); setDescription(''); setType('looking_for_members');
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-[#0f1419] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> New Recruitment Thread</h3>
            <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-white/10">
                  <SelectItem value="looking_for_members">Looking for Members</SelectItem>
                  <SelectItem value="looking_for_guild">Looking for Guild</SelectItem>
                  <SelectItem value="looking_for_group">Looking for Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Top 10 Guild Recruiting - NA Server" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Requirements, schedule, what you're looking for..." rows={4} className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <div className="p-6 border-t border-white/10 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="text-white/60">Cancel</Button>
            <Button onClick={handleSubmit} disabled={!title.trim()} className="bg-blue-600 hover:bg-blue-500 text-white">Post</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}