import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Loader2, Sparkles, Search, Eye, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const EFFECT_TYPES = ['projectile', 'burst', 'aura', 'beam', 'trail', 'impact'];
const EFFECT_COLORS = {
  projectile: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  burst: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  aura: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  beam: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  trail: 'text-green-400 bg-green-500/10 border-green-500/20',
  impact: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function FXUploadManager({ onSelectFX }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const textureRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [newFX, setNewFX] = useState({
    name: '', effect_type: 'burst', duration: 1.0, is_looping: false, scale: 1.0, color: '#ffffff', bone_attachment: ''
  });
  const [pendingFileUrl, setPendingFileUrl] = useState('');
  const [pendingTextureUrl, setPendingTextureUrl] = useState('');

  const { data: fxList = [], isLoading } = useQuery({
    queryKey: ['reactor-fx'],
    queryFn: () => base44.entities.ReactorFX.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ReactorFX.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactor-fx'] });
      setNewFX({ name: '', effect_type: 'burst', duration: 1.0, is_looping: false, scale: 1.0, color: '#ffffff', bone_attachment: '' });
      setPendingFileUrl('');
      setPendingTextureUrl('');
      showSuccess('FX effect created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ReactorFX.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reactor-fx'] }); showSuccess('FX deleted'); },
  });

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPendingFileUrl(file_url);
      const ext = file.name.split('.').pop().toLowerCase();
      if (!newFX.name) setNewFX(prev => ({ ...prev, name: file.name.replace(/\.\w+$/, '') }));
    } catch (err) { showError(err); }
    setUploading(false);
  };

  const handleUploadTexture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPendingTextureUrl(file_url);
    } catch (err) { showError(err); }
    setUploading(false);
  };

  const handleCreate = () => {
    if (!newFX.name) { showError('Name is required'); return; }
    createMutation.mutate({
      ...newFX,
      file_url: pendingFileUrl,
      file_type: pendingFileUrl ? (pendingFileUrl.includes('.fbx') ? 'fbx' : 'glb') : 'particle_json',
      texture_url: pendingTextureUrl,
    });
  };

  const filtered = fxList.filter(fx => !search || fx.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* Upload form */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
        <h4 className="text-white font-bold text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> Create New FX Effect
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Effect Name" value={newFX.name} onChange={(e) => setNewFX({ ...newFX, name: e.target.value })} className="bg-slate-900/50 border-slate-700 h-8 text-xs" />
          <select value={newFX.effect_type} onChange={(e) => setNewFX({ ...newFX, effect_type: e.target.value })} className="bg-slate-900/50 border border-slate-700 rounded-lg px-2 text-xs text-white h-8">
            {EFFECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[8px] text-slate-500 block mb-0.5">Duration (s)</label>
            <Input type="number" value={newFX.duration} onChange={(e) => setNewFX({ ...newFX, duration: parseFloat(e.target.value) || 1 })} className="bg-slate-900/50 border-slate-700 h-7 text-xs" step={0.1} />
          </div>
          <div>
            <label className="text-[8px] text-slate-500 block mb-0.5">Scale</label>
            <Input type="number" value={newFX.scale} onChange={(e) => setNewFX({ ...newFX, scale: parseFloat(e.target.value) || 1 })} className="bg-slate-900/50 border-slate-700 h-7 text-xs" step={0.1} />
          </div>
          <div>
            <label className="text-[8px] text-slate-500 block mb-0.5">Color</label>
            <input type="color" value={newFX.color} onChange={(e) => setNewFX({ ...newFX, color: e.target.value })} className="w-full h-7 rounded bg-slate-900 border border-slate-700 cursor-pointer" />
          </div>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".fbx,.glb,.gltf,.json" onChange={handleUploadFile} className="hidden" />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs h-7 flex-1">
            {pendingFileUrl ? '✓ FBX/GLB Uploaded' : <><Upload className="w-3 h-3 mr-1" /> FBX / GLB</>}
          </Button>
          <input ref={textureRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleUploadTexture} className="hidden" />
          <Button size="sm" variant="outline" onClick={() => textureRef.current?.click()} disabled={uploading} className="text-xs h-7 flex-1">
            {pendingTextureUrl ? '✓ Texture Uploaded' : <><Palette className="w-3 h-3 mr-1" /> Texture</>}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" checked={newFX.is_looping} onChange={(e) => setNewFX({ ...newFX, is_looping: e.target.checked })} className="rounded" />
            Looping
          </label>
          <div className="flex-1" />
          <Button size="sm" onClick={handleCreate} disabled={!newFX.name || createMutation.isPending} className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs">
            {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sparkles className="w-3 h-3 mr-1" /> Create FX</>}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <Input placeholder="Search effects..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-slate-900/50 border-slate-700 pl-8 h-8 text-xs" />
      </div>

      {/* FX List */}
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-slate-600 text-xs">No FX effects yet</div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {filtered.map(fx => (
            <div key={fx.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer hover:bg-white/[0.03] ${EFFECT_COLORS[fx.effect_type] || 'border-slate-700'}`}
              onClick={() => onSelectFX?.(fx)}>
              <div className="w-6 h-6 rounded-full" style={{ background: fx.color || '#fff', opacity: 0.6 }} />
              <div className="flex-1 min-w-0">
                <span className="text-white text-xs font-bold truncate block">{fx.name}</span>
                <span className="text-slate-500 text-[9px]">{fx.effect_type} • {fx.duration}s{fx.is_looping ? ' • loop' : ''}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(fx.id); }} className="h-6 w-6 text-red-400/50 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}