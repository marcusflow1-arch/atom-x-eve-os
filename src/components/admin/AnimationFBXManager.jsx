import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Film, Loader2, Tag, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AnimationFBXManager() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  
  // Track specific item being deleted for targeted loading spinner
  const [deletingId, setDeletingId] = useState(null);

  const [newAnimation, setNewAnimation] = useState({
    name: '',
    description: '',
    animation_type: 'idle',
    is_loopable: true,
    tags: ''
  });

  const { data: animations = [], isLoading } = useQuery({
    queryKey: ['animationFBX'],
    queryFn: () => base44.entities.AnimationFBX.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AnimationFBX.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animationFBX'] });
      setNewAnimation({ name: '', description: '', animation_type: 'idle', is_loopable: true, tags: '' });
    },
    onError: (err) => alert(`Failed to create animation entry: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AnimationFBX.delete(id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['animationFBX'] });
        setDeletingId(null);
    },
    onError: (err) => {
        alert(`Failed to delete: ${err.message}`);
        setDeletingId(null);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.fbx')) {
      alert('Please upload a valid .fbx file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await createMutation.mutateAsync({
        name: newAnimation.name || file.name.replace(/\.fbx$/i, ''),
        description: newAnimation.description,
        file_url: file_url,
        animation_type: newAnimation.animation_type,
        is_loopable: newAnimation.is_loopable,
        tags: newAnimation.tags ? newAnimation.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message || 'Unknown error'}.`);
    } finally {
      setUploading(false);
      // Reset file input value to allow re-uploading same file if needed
      e.target.value = null;
    }
  };

  const deleteAnimation = (id) => {
    if (confirm('Are you sure you want to delete this animation? This cannot be undone.')) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  const animationTypeColors = {
    idle: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    walk: 'bg-green-500/20 text-green-400 border-green-500/30',
    run: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    jump: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    attack: 'bg-red-500/20 text-red-400 border-red-500/30',
    swing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    dance: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    emote: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    other: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Film className="w-6 h-6 text-purple-500" />
            FBX Animation Library
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload raw animation files to be targeted by the Player Controller.
          </p>
        </div>
        <Badge variant="outline" className="text-slate-400 border-slate-700">
          {animations.length} Animations
        </Badge>
      </div>

      {/* Upload Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8 shadow-sm">
        <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-purple-400" /> Upload New Animation
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            placeholder="Animation Name (e.g. 'Sword Slash 1')"
            value={newAnimation.name}
            onChange={(e) => setNewAnimation({ ...newAnimation, name: e.target.value })}
            className="bg-slate-900 border-slate-700 focus:border-purple-500"
          />
          <select
            value={newAnimation.animation_type}
            onChange={(e) => setNewAnimation({ ...newAnimation, animation_type: e.target.value })}
            className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="idle">Idle</option>
            <option value="walk">Walk</option>
            <option value="run">Run</option>
            <option value="jump">Jump</option>
            <option value="attack">Attack</option>
            <option value="swing">Swing</option>
            <option value="dance">Dance</option>
            <option value="emote">Emote</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex items-start gap-2 mb-2 p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-200">
                <strong>Note:</strong> Selecting "Idle" here is just for organization. 
                To make this the default animation, you must update your <code>PlayerController</code> script.
            </p>
        </div>

        <Textarea
          placeholder="Description (optional)..."
          value={newAnimation.description}
          onChange={(e) => setNewAnimation({ ...newAnimation, description: e.target.value })}
          className="bg-slate-900 border-slate-700 mb-4 h-20"
        />

        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
                placeholder="Tags (comma separated)"
                value={newAnimation.tags}
                onChange={(e) => setNewAnimation({ ...newAnimation, tags: e.target.value })}
                className="bg-slate-900 border-slate-700 pl-9"
            />
          </div>
          
          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-md border border-slate-700">
            <span className="text-sm text-slate-300 font-medium">Loopable?</span>
            <Switch
              checked={newAnimation.is_loopable}
              onCheckedChange={(checked) => setNewAnimation({ ...newAnimation, is_loopable: checked })}
            />
          </div>
        </div>

        <label className="relative cursor-pointer block">
          <input
            type="file"
            accept=".fbx"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button 
            disabled={uploading}
            className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-md font-medium shadow-lg shadow-purple-900/20"
            asChild
          >
            <span>
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading & Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Select FBX File to Upload
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {/* Animations Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading animation library...
        </div>
      ) : animations.length === 0 ? (
        <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium text-slate-400">No animations yet</p>
          <p className="text-sm">Upload an FBX file to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {animations.map((anim) => (
              <motion.div
                key={anim.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden group hover:border-purple-500/50 transition-all shadow-md hover:shadow-xl"
              >
                {/* Animation Preview Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-purple-900/10 to-slate-950 relative flex items-center justify-center border-b border-slate-700/50">
                  <div className="text-center group-hover:scale-105 transition-transform duration-300">
                    <Film className="w-12 h-12 text-purple-500/40 mx-auto mb-2" />
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold opacity-70">
                        {anim.animation_type}
                    </p>
                  </div>
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge className={`${animationTypeColors[anim.animation_type]} backdrop-blur-sm shadow-sm`}>
                      {anim.animation_type}
                    </Badge>
                  </div>
                  
                  {/* Loop Badge */}
                  {anim.is_loopable && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-black/40 text-green-400 border-green-500/30 backdrop-blur-sm text-[10px]">
                        Loop
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white truncate pr-2" title={anim.name}>
                        {anim.name}
                    </h4>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-slate-500 hover:text-red-400 hover:bg-red-500/10 -mt-1 -mr-2"
                      onClick={() => deleteAnimation(anim.id)}
                      disabled={deletingId === anim.id}
                    >
                      {deletingId === anim.id ? (
                        <Loader2 className="w-3 h-3 animate-spin"/>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <p className="text-slate-400 text-xs mb-3 line-clamp-2 h-8">
                    {anim.description || <span className="italic opacity-50">No description provided</span>}
                  </p>
                  
                  {/* Tags */}
                  {anim.tags && anim.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
                      {anim.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-300 rounded border border-slate-700">
                          #{tag}
                        </span>
                      ))}
                      {anim.tags.length > 3 && <span className="text-[10px] text-slate-500">+{anim.tags.length - 3}</span>}
                    </div>
                  ) : (
                    <div className="h-6 mb-4" /> 
                  )}

                  <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center">
                    <a 
                      href={anim.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1"
                    >
                      Download FBX
                    </a>
                    <span className="text-[10px] text-slate-500">
                        {new Date(anim.created_date || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}