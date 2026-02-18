import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, CircleDot, Cylinder, Square, Upload, Plus, Loader2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/error/ErrorToast';

export default function EngineToolbar({ sceneApi }) {
  const [uploading, setUploading] = useState(false);

  const handleAddPrimitive = (type) => {
    if (sceneApi?.addPrimitive) sceneApi.addPrimitive(type);
  };

  const handleUploadModel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (sceneApi?.addModel) await sceneApi.addModel(file_url);
      showSuccess('Model added to scene');
    } catch (err) {
      showError('Failed to load model: ' + (err?.message || 'Unknown'));
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/10" style={{
      background: 'rgba(100, 120, 140, 0.08)',
      backdropFilter: 'blur(20px)',
    }}>
      <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Add to Scene</span>

      <div className="grid grid-cols-2 gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => handleAddPrimitive('cube')} className="h-12 flex-col gap-1 bg-white/5 border border-white/10 hover:bg-white/10">
          <Box className="w-4 h-4 text-blue-400" />
          <span className="text-[9px] text-white/60">Cube</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleAddPrimitive('sphere')} className="h-12 flex-col gap-1 bg-white/5 border border-white/10 hover:bg-white/10">
          <CircleDot className="w-4 h-4 text-green-400" />
          <span className="text-[9px] text-white/60">Sphere</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleAddPrimitive('cylinder')} className="h-12 flex-col gap-1 bg-white/5 border border-white/10 hover:bg-white/10">
          <Cylinder className="w-4 h-4 text-purple-400" />
          <span className="text-[9px] text-white/60">Cylinder</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleAddPrimitive('plane')} className="h-12 flex-col gap-1 bg-white/5 border border-white/10 hover:bg-white/10">
          <Square className="w-4 h-4 text-yellow-400" />
          <span className="text-[9px] text-white/60">Plane</span>
        </Button>
      </div>

      {/* Upload Model */}
      <label className="flex items-center justify-center gap-2 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 cursor-pointer transition-colors">
        <input type="file" accept=".glb,.gltf,.fbx" onChange={handleUploadModel} className="hidden" />
        {uploading ? <Loader2 className="w-4 h-4 text-orange-400 animate-spin" /> : <Upload className="w-4 h-4 text-orange-400" />}
        <span className="text-orange-300 text-xs font-medium">Import Model</span>
      </label>

      <div className="mt-2 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
        <div className="flex items-center gap-1.5 mb-1">
          <Lightbulb className="w-3 h-3 text-cyan-400" />
          <span className="text-cyan-400 text-[9px] font-bold">TIP</span>
        </div>
        <p className="text-slate-500 text-[9px] leading-relaxed">
          Upload .glb, .gltf, or .fbx models. Knowledge from Game Study feeds into how scenes are structured here.
        </p>
      </div>
    </div>
  );
}