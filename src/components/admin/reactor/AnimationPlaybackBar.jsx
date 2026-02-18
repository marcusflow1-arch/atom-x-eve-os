import React, { useRef, useState } from 'react';
import { Play, Pause, SkipBack, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';

export default function AnimationPlaybackBar({
  isPlaying, onTogglePlay, animTime, onScrub, animName, animDuration,
  onAnimationUploaded, animations = [], onSelectAnimation,
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadAnim = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      // Create an AnimationFBX record
      const name = file.name.replace(/\.\w+$/, '');
      await base44.entities.AnimationFBX.create({
        name,
        file_url,
        animation_type: 'attack',
        is_loopable: false,
      });
      onAnimationUploaded?.(file_url, name);
      showSuccess(`Animation "${name}" uploaded`);
    } catch (err) {
      showError(err, 'Upload Animation');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const formatTime = (normalized, duration) => {
    if (!duration) return '0.00s';
    const secs = (normalized * duration).toFixed(2);
    return `${secs}s`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 border-t border-slate-800">
      {/* Transport controls */}
      <Button size="icon" variant="ghost" onClick={() => onScrub(0)} className="h-7 w-7 text-slate-400 hover:text-white" title="Reset">
        <SkipBack className="w-3.5 h-3.5" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onTogglePlay} className={`h-7 w-7 ${isPlaying ? 'text-green-400' : 'text-slate-400'} hover:text-white`}>
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </Button>

      {/* Scrub bar */}
      <div className="flex-1 relative group">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={animTime || 0}
          onChange={(e) => onScrub(parseFloat(e.target.value))}
          className="w-full h-1.5 appearance-none bg-slate-700 rounded-full cursor-pointer accent-cyan-500"
          style={{
            background: `linear-gradient(to right, #22d3ee ${(animTime || 0) * 100}%, #334155 ${(animTime || 0) * 100}%)`,
          }}
        />
        {/* Playhead time tooltip */}
        <div
          className="absolute -top-5 text-[8px] bg-slate-800 text-cyan-300 px-1 py-0.5 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${(animTime || 0) * 100}%`, transform: 'translateX(-50%)' }}
        >
          {formatTime(animTime || 0, animDuration)}
        </div>
      </div>

      {/* Time display */}
      <span className="text-[9px] text-slate-500 font-mono min-w-[60px] text-right">
        {formatTime(animTime || 0, animDuration)} / {animDuration?.toFixed(2) || '0.00'}s
      </span>

      {/* Animation selector dropdown */}
      <select
        value={animName || ''}
        onChange={(e) => {
          const anim = animations.find(a => a.name === e.target.value);
          if (anim?.file_url) onSelectAnimation?.(anim);
        }}
        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-white max-w-[140px]"
        title="Select animation to preview"
      >
        <option value="">Embedded Anim</option>
        {animations.map(a => (
          <option key={a.id} value={a.name}>{a.name}</option>
        ))}
      </select>

      {/* Upload animation button */}
      <input ref={fileRef} type="file" accept=".fbx,.glb,.gltf" onChange={handleUploadAnim} className="hidden" />
      <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-7 w-7 text-slate-400 hover:text-cyan-400" title="Upload FBX animation">
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
      </Button>

      {/* Current anim name */}
      {animName && (
        <Badge className="bg-slate-800 text-slate-400 text-[8px] border border-slate-700 max-w-[100px] truncate">
          {animName}
        </Badge>
      )}
    </div>
  );
}