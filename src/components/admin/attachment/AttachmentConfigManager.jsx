import React, { useState, useMemo } from 'react';
import { Save, Trash2, Plus, Copy, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/components/error/ErrorToast';

/**
 * AttachmentConfigManager — Save & load per-animation attachment configurations.
 * 
 * When the user positions an object in the 3D editor at a specific animation frame,
 * they can save that as an AttachmentConfig record. At runtime, the system looks up
 * which config matches the current animation and applies the correct transforms.
 */
export default function AttachmentConfigManager({ 
  currentObject, 
  currentAnimation, 
  animTime, 
  characterId, 
  characterName,
  onLoadConfig 
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: configs = [] } = useQuery({
    queryKey: ['attachment-configs', characterId],
    queryFn: () => characterId 
      ? base44.entities.AttachmentConfig.filter({ model_id: characterId }, '-updated_date', 100)
      : [],
    enabled: !!characterId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.AttachmentConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachment-configs', characterId] });
      setSaving(false);
      showSuccess('Attachment config saved');
    },
    onError: () => setSaving(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AttachmentConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachment-configs', characterId] });
      showSuccess('Config deleted');
    },
  });

  const handleSaveCurrentAsConfig = () => {
    if (!currentObject) { showError('Select an object first'); return; }
    if (!currentAnimation) { showError('Play an animation first'); return; }
    
    setSaving(true);
    saveMutation.mutate({
      model_id: characterId,
      model_name: characterName || '',
      object_label: currentObject.label || 'Object',
      object_url: currentObject.url || '',
      object_type: currentObject.type === 'effect' ? 'effect' : 'weapon',
      bone_name: currentObject.bone || '',
      animation_name: currentAnimation,
      is_default: false,
      position: currentObject.position || { x: 0, y: 0, z: 0 },
      rotation: currentObject.rotation || { x: 0, y: 0, z: 0 },
      scale: currentObject.scale || 50,
      trigger_time: Math.round(animTime * 100) / 100,
      is_active: true,
    });
  };

  const handleSaveAsDefault = () => {
    if (!currentObject) { showError('Select an object first'); return; }
    
    setSaving(true);
    saveMutation.mutate({
      model_id: characterId,
      model_name: characterName || '',
      object_label: currentObject.label || 'Object',
      object_url: currentObject.url || '',
      object_type: currentObject.type === 'effect' ? 'effect' : 'weapon',
      bone_name: currentObject.bone || '',
      animation_name: '*',
      is_default: true,
      position: currentObject.position || { x: 0, y: 0, z: 0 },
      rotation: currentObject.rotation || { x: 0, y: 0, z: 0 },
      scale: currentObject.scale || 50,
      trigger_time: 0,
      is_active: true,
    });
  };

  // Group configs by object label
  const grouped = useMemo(() => {
    const map = {};
    configs.forEach(c => {
      const key = c.object_label || 'Unknown';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [configs]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Settings className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Attachment Configs</span>
        <Badge variant="outline" className="text-[8px] text-slate-500">{configs.length} saved</Badge>
      </div>

      {/* Save buttons */}
      {currentObject && (
        <div className="flex gap-1.5">
          <Button 
            size="sm" 
            onClick={handleSaveCurrentAsConfig}
            disabled={saving || !currentAnimation}
            className="flex-1 h-7 text-[9px] bg-green-600/80 hover:bg-green-600 gap-1"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save for "{currentAnimation || '?'}"
          </Button>
          <Button 
            size="sm" 
            onClick={handleSaveAsDefault}
            disabled={saving}
            className="h-7 text-[9px] bg-amber-600/80 hover:bg-amber-600 gap-1"
          >
            <Copy className="w-3 h-3" /> Default
          </Button>
        </div>
      )}

      {/* Saved configs list */}
      <div className="space-y-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {Object.entries(grouped).map(([label, items]) => (
          <div key={label}>
            <span className="text-[9px] text-cyan-400 font-bold">{label}</span>
            <div className="space-y-0.5 mt-1">
              {items.map(cfg => (
                <div 
                  key={cfg.id}
                  className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer group"
                  onClick={() => onLoadConfig?.(cfg)}
                >
                  <Badge className={`text-[7px] h-3.5 px-1 ${cfg.is_default ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-700 text-slate-400'}`}>
                    {cfg.is_default ? 'DEFAULT' : cfg.animation_name}
                  </Badge>
                  {cfg.trigger_time > 0 && (
                    <span className="text-[8px] text-slate-500">@{cfg.trigger_time}s</span>
                  )}
                  <span className="text-[8px] text-slate-600 flex-1 truncate">{cfg.bone_name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(cfg.id); }}
                    className="text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {configs.length === 0 && (
          <p className="text-[9px] text-slate-600 text-center py-2">
            No saved configs yet. Position an object, then save it for the current animation.
          </p>
        )}
      </div>
    </div>
  );
}