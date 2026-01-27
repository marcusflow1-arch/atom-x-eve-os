import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export default function ScheduleEditModal({ isOpen, onClose, date, initialData, onSave }) {
  const [formData, setFormData] = useState({
    timeRange: '',
    game: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
        setFormData({ timeRange: '', game: '', notes: '' });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1f2e] border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Schedule for {date ? format(date, 'MMM d, yyyy') : ''}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-white/70">Time Range</label>
            <Input
              value={formData.timeRange}
              onChange={(e) => setFormData({ ...formData, timeRange: e.target.value })}
              placeholder="e.g. 7 p.m. to 12 p.m."
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-white/70">Game</label>
            <Input
              value={formData.game}
              onChange={(e) => setFormData({ ...formData, game: e.target.value })}
              placeholder="e.g. Valorant"
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-white/70">Activity / Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Doing giveaways, ranked climb..."
              className="bg-black/20 border-white/10 text-white min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5 text-white">Cancel</Button>
          <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}