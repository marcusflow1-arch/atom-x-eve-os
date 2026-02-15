import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CreateVoiceRoomModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [maxUsers, setMaxUsers] = useState('4');
  const [tag, setTag] = useState('Casual');

  const handleCreate = () => {
    if (!name.trim()) { toast.error('Room name is required'); return; }
    onCreated?.({
      id: `vr-${Date.now()}`,
      name: name.trim(),
      users: 1,
      max: parseInt(maxUsers),
      tags: [tag],
      isClan: false,
      active: true,
    });
    toast.success(`Voice room "${name.trim()}" created!`);
    setName(''); setMaxUsers('4'); setTag('Casual');
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-[#0f1419] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Mic className="w-5 h-5 text-green-400" /> Create Voice Room</h3>
            <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Room Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Boss Strategy Planning" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Max Users</label>
                <Select value={maxUsers} onValueChange={setMaxUsers}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/10">
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Tag</label>
                <Select value={tag} onValueChange={setTag}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/10">
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Serious">Serious</SelectItem>
                    <SelectItem value="Help">Help</SelectItem>
                    <SelectItem value="High Level">High Level</SelectItem>
                    <SelectItem value="Spoilers">Spoilers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-white/10 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="text-white/60">Cancel</Button>
            <Button onClick={handleCreate} disabled={!name.trim()} className="bg-green-600 hover:bg-green-500 text-white">Create Room</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}