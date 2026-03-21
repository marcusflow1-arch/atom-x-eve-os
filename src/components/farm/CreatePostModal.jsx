import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ChevronDown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TOPICS } from './FarmTopicSelector';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const POST_TYPES = [
  { id: 'discussion', label: 'General Discussion' },
  { id: 'help', label: 'Request for Help' },
  { id: 'tip', label: 'Helpful Tip / Guide' },
  { id: 'question', label: 'Question' },
  { id: 'bug', label: 'Bug Report' },
];

export default function CreatePostModal({ open, onClose, topic, gameTitle, gameId, onCreated }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(topic || 'achievements');
  const [postType, setPostType] = useState('discussion');

  useEffect(() => {
    if (topic) setSelectedTopic(topic);
  }, [topic]);

  const createPostMutation = useMutation({
    mutationFn: (newPost) => base44.entities.Post.create(newPost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Posted successfully!');
      setTitle(''); setContent('');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create post');
    }
  });

  const handleSubmit = () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!content.trim()) { toast.error('Content is required'); return; }
    
    // Admin check for Events
    if (selectedTopic === 'events' && user?.role !== 'admin') {
      toast.error('Only Admins can post Events.');
      return;
    }

    createPostMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      community: selectedTopic,
      type: postType,
      game_title: gameTitle || '',
    });

    onCreated?.({ 
      title: title.trim(), 
      content: content.trim(), 
      topic: selectedTopic,
      type: postType 
    });
  };

  if (!open) return null;

  const currentTopicLabel = TOPICS.find(t => t.id === selectedTopic)?.label || 'General';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-[#0f1419] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#161b22]">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" /> 
                New Post
              </h3>
              <p className="text-xs text-white/40 mt-0.5">Share with the community</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            
            {/* Topic & Type Selection Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider pl-1">Topic / Subpage</label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-xs">
                    <SelectValue placeholder="Select Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPICS.map(t => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <t.icon className={`w-3 h-3 ${t.color}`} />
                          <span>{t.label}</span>
                          {t.id === 'events' && <Lock className="w-3 h-3 ml-auto text-white/20" />}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider pl-1">Post Type</label>
                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-xs">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id} className="text-xs">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider pl-1">Title</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder={selectedTopic === 'help' ? "What do you need help with?" : "Give your post a clear title..."}
                className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 transition-colors" 
              />
            </div>

            {/* Content Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider pl-1">Content</label>
              <Textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Share your thoughts, details, or questions..." 
                rows={6} 
                className="bg-white/5 border-white/10 text-white resize-none focus:border-cyan-500/50 transition-colors" 
              />
            </div>

            {/* Admin Warning for Events */}
            {selectedTopic === 'events' && user?.role !== 'admin' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2 items-start">
                <Lock className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-200/80 leading-relaxed">
                  Posting to <strong>Events</strong> is restricted to Administrators and Developers. Please select another topic or contact an admin.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#161b22] border-t border-white/10 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/5">Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!title.trim() || !content.trim() || (selectedTopic === 'events' && user?.role !== 'admin')} 
              className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
            >
              Create Post
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}