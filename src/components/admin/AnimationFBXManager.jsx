import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Play, Check, X, Film, Loader2, Tag } from 'lucide-react';
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
  const [newAnimation, setNewAnimation] = useState({
    name: '',
    description: '',
    animation_type: 'idle',
    is_loopable: true,
    tags: '',
    keybind: ''
  });

  const { data: animations = [], isLoading } = useQuery({
    queryKey: ['animationFBX'],
    queryFn: () => base44.entities.AnimationFBX.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AnimationFBX.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animationFBX'] });
      setNewAnimation({ name: '', description: '', animation_type: 'idle', is_loopable: true, tags: '', keybind: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AnimationFBX.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animationFBX'] }),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.fbx')) {
      alert('Please upload an FBX file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await createMutation.mutateAsync({
        name: newAnimation.name || file.name.replace('.fbx', ''),
        description: newAnimation.description,
        file_url: file_url,
        animation_type: newAnimation.animation_type,
        is_loopable: newAnimation.is_loopable,
        tags: newAnimation.tags ? newAnimation.tags.split(',').map(t => t.trim()) : [],
        keybind: newAnimation.keybind || null
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteAnimation = (id) => {
    if (confirm('Are you sure you want to delete this animation?')) {
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Film className="w-6 h-6 text-purple-500" />
            FBX Animation Files
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload and manage FBX animation files for 3D models
          </p>
        </div>
        <Badge variant="outline" className="text-slate-400">
          {animations.length} Animations
        </Badge>
      </div>

      {/* Upload Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
        <h3 className="font-semibold mb-4">Upload New Animation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            placeholder="Animation name"
            value={newAnimation.name}
            onChange={(e) => setNewAnimation({ ...newAnimation, name: e.target.value })}
            className="bg-slate-900 border-slate-700"
          />
          <select
            value={newAnimation.animation_type}
            onChange={(e) => setNewAnimation({ ...newAnimation, animation_type: e.target.value })}
            className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
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
        <Textarea
          placeholder="Animation description..."
          value={newAnimation.description}
          onChange={(e) => setNewAnimation({ ...newAnimation, description: e.target.value })}
          className="bg-slate-900 border-slate-700 mb-4"
        />
        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder="Tags (comma separated)"
            value={newAnimation.tags}
            onChange={(e) => setNewAnimation({ ...newAnimation, tags: e.target.value })}
            className="bg-slate-900 border-slate-700 flex-1"
          />
          <Input
            placeholder="Keybind (e.g., W, Space, 1)"
            value={newAnimation.keybind}
            onChange={(e) => setNewAnimation({ ...newAnimation, keybind: e.target.value.toUpperCase() })}
            className="bg-slate-900 border-slate-700 w-48"
            maxLength={10}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Loopable:</span>
            <Switch
              checked={newAnimation.is_loopable}
              onCheckedChange={(checked) => setNewAnimation({ ...newAnimation, is_loopable: checked })}
            />
          </div>
        </div>
        <label className="relative cursor-pointer">
          <input
            type="file"
            accept=".fbx"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button 
            disabled={uploading}
            className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
            asChild
          >
            <span>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload FBX File
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {/* Animations List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading animations...
        </div>
      ) : animations.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No animations uploaded yet</p>
          <p className="text-sm">Upload your first FBX animation above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {animations.map((anim) => (
              <motion.div
                key={anim.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden group"
              >
                {/* Animation Preview Area */}
                <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-slate-900 relative flex items-center justify-center">
                  <div className="text-center">
                    <Film className="w-16 h-16 text-purple-400 mx-auto mb-2 opacity-60" />
                    <p className="text-slate-400 text-xs uppercase tracking-wider">{anim.animation_type}</p>
                  </div>
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge className={animationTypeColors[anim.animation_type]}>
                      {anim.animation_type}
                    </Badge>
                  </div>
                  
                  {/* Keybind Badge */}
                  {anim.keybind && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-black/50 text-yellow-400 border-yellow-500/30 font-mono">
                        {anim.keybind}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Loopable Badge */}
                  {anim.is_loopable && !anim.keybind && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-black/50 text-green-400 border-green-500/30">
                        Loop
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h4 className="font-semibold truncate mb-1">{anim.name}</h4>
                  {anim.description && (
                    <p className="text-slate-400 text-xs mb-2 line-clamp-2">{anim.description}</p>
                  )}
                  
                  {/* Keybind Info */}
                  {anim.keybind && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-slate-400 text-xs">Keybind:</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-mono text-xs">
                        {anim.keybind}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {anim.tags && anim.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {anim.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] bg-slate-900/50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <a 
                      href={anim.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Download FBX
                    </a>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => deleteAnimation(anim.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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