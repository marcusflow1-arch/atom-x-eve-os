import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, CircleDot, Cylinder, Square, Upload, Plus, Loader2, Lightbulb, Package, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/error/ErrorToast';

export default function EngineToolbar({ sceneApi }) {
  const [uploading, setUploading] = useState(false);
  const [packUploading, setPackUploading] = useState(false);

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

  const handleUploadPack = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Check size
      if (file.size > 500 * 1024 * 1024) {
          showError("File is too large (>500MB) for browser processing.");
          return;
      }

      setPackUploading(true);
      try {
          showSuccess(`Analyzing ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`);
          
          // 1. Load ZIP Client-Side (Avoids backend memory limits for 400MB files)
          const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
          const zip = await JSZip.loadAsync(file);
          
          // 2. Scan for best map candidate
          let bestCandidate = null;
          let maxScore = -1;
          
          const files = [];
          zip.forEach((path, entry) => {
              if (!entry.dir) files.push({ path, entry });
          });
          
          for (const { path, entry } of files) {
              const lower = path.toLowerCase();
              // Skip MacOS junk
              if (lower.includes('__macosx') || lower.includes('.ds_store')) continue;
              
              const is3D = lower.endsWith('.fbx') || lower.endsWith('.glb') || lower.endsWith('.gltf') || lower.endsWith('.obj');
              
              if (is3D) {
                  let score = 0;
                  const sizeMB = entry._data.uncompressedSize / 1024 / 1024;
                  
                  // Size Factor (Maps are big)
                  score += Math.min(sizeMB, 100); 
                  
                  // Keyword Factor
                  if (lower.includes('demo') && lower.includes('map')) score += 150;
                  else if (lower.includes('overview')) score += 120;
                  else if (lower.includes('map')) score += 80;
                  else if (lower.includes('level')) score += 80;
                  else if (lower.includes('scene')) score += 60;
                  else if (lower.includes('environment')) score += 50;
                  else if (lower.includes('merged')) score += 40;
                  
                  // Source folder preference
                  if (lower.includes('source') || lower.includes('src')) score += 30;
                  
                  if (score > maxScore) {
                      maxScore = score;
                      bestCandidate = { path, entry, score };
                  }
              }
          }
          
          if (!bestCandidate) {
              throw new Error("No 3D map file (FBX/GLB) found. If this is a raw Unreal project, please export the level as FBX first.");
          }
          
          showSuccess(`Found map: ${bestCandidate.path}. Extracting...`);
          
          // 3. Extract ONLY the map file
          const blob = await bestCandidate.entry.async('blob');
          const ext = bestCandidate.path.split('.').pop();
          const extractFile = new File([blob], `Room4_Constructed.${ext}`, { type: 'application/octet-stream' });
          
          // 4. Upload extracted map
          showSuccess(`Uploading map (${(extractFile.size / 1024 / 1024).toFixed(1)} MB)...`);
          const { file_url } = await base44.integrations.Core.UploadFile({ file: extractFile });
          
          // 5. Create Entity
          await base44.entities.Model3D.create({
              name: "Room 4",
              description: `Constructed from ${file.name} (Source: ${bestCandidate.path})`,
              file_url: file_url,
              file_type: ext,
              category: 'environment',
              is_bundle: false, // It's a single merged map now
              use_mesh_collision: true,
              tags: ['room4', 'constructed', 'environment'],
              player_spawn: { x: 0, y: 1, z: 0 }
          });
          
          showSuccess("Room 4 successfully constructed!");
          
      } catch (err) {
          console.error(err);
          showError('Failed to build environment: ' + err.message);
      }
      setPackUploading(false);
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

      {/* Upload Environment Pack */}
      <label className="flex items-center justify-center gap-2 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer transition-colors">
        <input type="file" accept=".zip,.rar" onChange={handleUploadPack} className="hidden" />
        {packUploading ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /> : <Package className="w-4 h-4 text-emerald-400" />}
        <span className="text-emerald-300 text-xs font-medium">Construct Room 4</span>
      </label>

      <div className="mt-2 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
        <div className="flex items-center gap-1.5 mb-1">
          <Lightbulb className="w-3 h-3 text-cyan-400" />
          <span className="text-cyan-400 text-[9px] font-bold">TIP</span>
        </div>
        <p className="text-slate-500 text-[9px] leading-relaxed">
          Use "Build Environment" to upload a ZIP pack. I will auto-construct "Room 4" from the main scene file inside.
        </p>
      </div>
    </div>
  );
}