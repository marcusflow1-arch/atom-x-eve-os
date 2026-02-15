import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, FileText, Target, Tag, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';

export default function CreateFarmRouteModal({ open, onClose, gameId, clanId, onCreated }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tactics, setTactics] = useState('');
  const [routeType, setRouteType] = useState('resource');
  const [difficulty, setDifficulty] = useState('medium');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      await base44.entities.FarmRoute.create({
        game_id: gameId,
        clan_id: clanId,
        title: title.trim(),
        description: description.trim(),
        video_url: videoUrl.trim(),
        tactics: tactics.trim(),
        route_type: routeType,
        difficulty,
        author_id: user?.id,
        author_name: user?.full_name || user?.email?.split('@')[0] || 'Unknown',
      });
      toast.success('Farm route created!');
      onCreated?.();
      onClose();
      setTitle(''); setDescription(''); setVideoUrl(''); setTactics('');
    } catch (e) {
      toast.error('Failed to create route');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-[#0f1419] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Add Farm Route</h3>
            <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><FileText className="w-3 h-3" /> Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Best Crystal Farming Spot" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><FileText className="w-3 h-3" /> Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the farm route, what to expect, drops, etc." rows={3} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><Video className="w-3 h-3" /> Video Link</label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><Target className="w-3 h-3" /> Tactics & Strategy</label>
              <Textarea value={tactics} onChange={(e) => setTactics(e.target.value)} placeholder="Step-by-step tactics, required gear, recommended team comp..." rows={4} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><Tag className="w-3 h-3" /> Route Type</label>
                <Select value={routeType} onValueChange={setRouteType}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/10">
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="boss">Boss</SelectItem>
                    <SelectItem value="xp">XP Grind</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                    <SelectItem value="speedrun">Speedrun</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Difficulty</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/10">
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="extreme">Extreme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-white/10 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="text-white/60">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()} className="bg-blue-600 hover:bg-blue-500 text-white">
              {saving ? 'Saving...' : 'Create Route'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}