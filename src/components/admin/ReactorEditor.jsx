import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Zap, Plus, Trash2, Save, Loader2, ChevronLeft, ChevronRight, Sparkles, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import ReactorViewport from './reactor/ReactorViewport';
import ReactorBoneSelector from './reactor/ReactorBoneSelector';
import ReactorPropertiesPanel from './reactor/ReactorPropertiesPanel';
import SequencerTimeline from './reactor/SequencerTimeline';
import FXUploadManager from './reactor/FXUploadManager';
import AnimationPlaybackBar from './reactor/AnimationPlaybackBar';
import ReactorBridge from './reactor/ReactorBridge';

const DEFAULT_REACTOR = {
  bone_name: '', animation_name: '', trigger_time: 0.5, trigger_end_time: 0.6,
  trigger_type: 'on_custom_frame', collider_type: 'sphere', collider_radius: 1.5,
  collider_offset: { x: 0, y: 0, z: 0 }, base_damage: 50, scaled_damage_per_level: 5,
  damage_type: 'physical', critical_chance: 0.1, critical_multiplier: 2.0,
  xp_reward: 20, knockback_force: 0, status_effect: 'none', status_duration: 0,
  fx_id: '', fx_name: '', cooldown: 0, is_active: true,
};

export default function ReactorEditor() {
  const queryClient = useQueryClient();
  const viewportRef = useRef(null);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [selectedBone, setSelectedBone] = useState(null);
  const [editingReactor, setEditingReactor] = useState(null);
  const [selectedReactorId, setSelectedReactorId] = useState(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [rightTab, setRightTab] = useState('properties');

  // Animation playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [animTime, setAnimTime] = useState(0);
  const [animName, setAnimName] = useState(null);
  const [animDuration, setAnimDuration] = useState(0);
  const [animationUrl, setAnimationUrl] = useState(null);

  // FX drag state
  const [activeFXDrag, setActiveFXDrag] = useState(null);

  // FX timeline blocks (independent FX events on the timeline, not tied 1:1 to reactors)
  const [fxBlocks, setFxBlocks] = useState([]);
  const [selectedFXBlockId, setSelectedFXBlockId] = useState(null);
  let fxBlockCounter = useRef(0);

  // Live scene models from Luna viewer
  const [sceneModels, setSceneModels] = useState([]);
  const [liveSync, setLiveSync] = useState(true); // sync editor → Luna viewer

  // Listen for scene models from the Luna 3D viewer
  useEffect(() => {
    const unsub = ReactorBridge.on('sceneModelsUpdated', ({ models }) => {
      setSceneModels(models);
    });
    // Also check if already populated
    const existing = ReactorBridge.getState().sceneModels;
    if (existing?.length) setSceneModels(existing);
    return unsub;
  }, []);

  // Fetch data (must be before hooks that reference their results)
  const { data: models = [] } = useQuery({
    queryKey: ['models3d-reactor'],
    queryFn: () => base44.entities.Model3D.list('-created_date', 50),
  });

  const { data: animations = [] } = useQuery({
    queryKey: ['animations-reactor'],
    queryFn: () => base44.entities.AnimationFBX.list('-created_date', 200),
  });

  const { data: reactors = [] } = useQuery({
    queryKey: ['damage-reactors', selectedModelId],
    queryFn: () => selectedModelId
      ? base44.entities.DamageReactor.filter({ character_model_id: selectedModelId }, '-created_date', 100)
      : [],
    enabled: !!selectedModelId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DamageReactor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reactors', selectedModelId] });
      setEditingReactor(null);
      showSuccess('Reactor created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DamageReactor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reactors', selectedModelId] });
      showSuccess('Reactor updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DamageReactor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reactors', selectedModelId] });
      setSelectedReactorId(null);
      setEditingReactor(null);
      showSuccess('Reactor deleted');
    },
  });

  // Resolve selected model from scene models first, then fall back to DB models
  const selectedModel = sceneModels.find(m => m.id === selectedModelId) || models.find(m => m.id === selectedModelId);

  // Sync editor state → Luna viewer via bridge
  useEffect(() => {
    if (!liveSync || !selectedModelId) return;
    ReactorBridge.setActiveModel(selectedModelId, selectedModel?.name);
  }, [selectedModelId, selectedModel?.name, liveSync]);

  useEffect(() => {
    if (!liveSync) return;
    ReactorBridge.setReactors(reactors);
  }, [reactors, liveSync]);

  useEffect(() => {
    if (!liveSync) return;
    ReactorBridge.setPlayState(isPlaying);
  }, [isPlaying, liveSync]);

  useEffect(() => {
    if (!liveSync) return;
    ReactorBridge.setAnimTime(animTime);

    // Check damage reactors
    const firingReactor = reactors.find(r =>
      animTime >= (r.trigger_time || 0) && animTime <= (r.trigger_end_time || r.trigger_time + 0.1)
    );

    // Check FX blocks
    const activeFX = fxBlocks.find(fx =>
      animTime >= (fx.start_time || 0) && animTime <= (fx.start_time || 0) + (fx.duration_norm || 0.1)
    );

    if (firingReactor) {
      ReactorBridge.fireReactor(firingReactor.id, firingReactor.bone_name, firingReactor.damage_type, firingReactor.fx_name);
    } else if (activeFX) {
      ReactorBridge.fireReactor(activeFX._id, activeFX.bone || '', '', activeFX.fx_name);
    } else {
      ReactorBridge.clearFiring();
    }

    // Broadcast active FX blocks for viewport preview
    ReactorBridge.emit('fxBlocksState', {
      activeFXBlocks: fxBlocks.filter(fx =>
        animTime >= (fx.start_time || 0) && animTime <= (fx.start_time || 0) + (fx.duration_norm || 0.1)
      ),
      allFXBlocks: fxBlocks,
      animTime,
    });
  }, [animTime, reactors, fxBlocks, liveSync]);

  useEffect(() => {
    if (!liveSync || !animationUrl) return;
    ReactorBridge.setPreviewAnimation(animationUrl, animName);
  }, [animationUrl, animName, liveSync]);

  // Bone click from viewport (click-to-select)
  const handleBoneClick = useCallback((bone) => {
    setSelectedBone(bone);
    if (editingReactor) {
      setEditingReactor(prev => ({ ...prev, bone_name: bone }));
    }
  }, [editingReactor]);

  // FX drop on bone from viewport click
  const handleFXDropOnBone = useCallback((boneName, fx) => {
    if (editingReactor) {
      setEditingReactor(prev => ({ ...prev, bone_name: boneName, fx_id: fx.id, fx_name: fx.name }));
      showSuccess(`FX "${fx.name}" → ${boneName}`);
    } else {
      // Auto-create a new reactor with this FX on this bone
      setEditingReactor({
        ...DEFAULT_REACTOR,
        character_model_id: selectedModelId,
        character_name: selectedModel?.name || '',
        bone_name: boneName,
        fx_id: fx.id,
        fx_name: fx.name,
      });
      setSelectedBone(boneName);
      setRightTab('properties');
      showSuccess(`New reactor on ${boneName} with FX "${fx.name}"`);
    }
    setActiveFXDrag(null);
  }, [editingReactor, selectedModelId, selectedModel]);

  const handleAddReactor = () => {
    if (!selectedBone) { showError('Click a bone in the 3D viewport first'); return; }
    // Pre-fill trigger_time to current scrub position
    setEditingReactor({
      ...DEFAULT_REACTOR,
      character_model_id: selectedModelId,
      character_name: selectedModel?.name || '',
      bone_name: selectedBone,
      trigger_time: Math.round(animTime * 100) / 100,
      trigger_end_time: Math.min(1, Math.round((animTime + 0.1) * 100) / 100),
    });
    setRightTab('properties');
  };

  const handleSaveReactor = () => {
    if (!editingReactor?.bone_name || !editingReactor?.animation_name) {
      showError('Bone and animation are required');
      return;
    }
    if (editingReactor.id) {
      const { id, created_date, updated_date, created_by, ...data } = editingReactor;
      updateMutation.mutate({ id, data });
    } else {
      createMutation.mutate(editingReactor);
    }
  };

  const handleSelectReactor = (r) => {
    setSelectedReactorId(r.id);
    setEditingReactor({ ...r });
    setSelectedBone(r.bone_name);
    setRightTab('properties');
  };

  // FX panel: click to assign to current reactor
  const handleSelectFX = (fx) => {
    if (editingReactor) {
      setEditingReactor({ ...editingReactor, fx_id: fx.id, fx_name: fx.name });
      setRightTab('properties');
      showSuccess(`FX "${fx.name}" assigned`);
    } else {
      // Start FX drag mode — next bone click in viewport will assign
      setActiveFXDrag(fx);
      showSuccess(`Click a bone in the viewport to place "${fx.name}"`);
    }
  };

  // FX drag start
  const handleStartDragFX = (fx) => {
    setActiveFXDrag(fx);
  };

  // Cancel FX drag on escape
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeFXDrag) {
        setActiveFXDrag(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFXDrag]);

  // Animation callbacks
  const handleAnimLoaded = useCallback((duration, name) => {
    setAnimDuration(duration);
    setAnimName(name);
    setAnimTime(0);
  }, []);

  const handleAnimTimeChange = useCallback((t) => {
    setAnimTime(t);
  }, []);

  const handleScrub = (t) => {
    setAnimTime(t);
    setIsPlaying(false);
  };

  // Timeline: drag reactor bar edges or body to update trigger times
  const handleUpdateReactorTime = useCallback((reactorId, newStart, newEnd) => {
    // Update locally in editingReactor if it matches
    if (editingReactor?.id === reactorId) {
      setEditingReactor(prev => ({ ...prev, trigger_time: newStart, trigger_end_time: newEnd }));
    }
    // Persist to DB
    updateMutation.mutate({ id: reactorId, data: { trigger_time: newStart, trigger_end_time: newEnd } });
  }, [editingReactor, updateMutation]);

  // Timeline: FX dropped at a specific time → create an FX block on the FX track
  const handleDropFXAtTime = useCallback((fx, normalizedTime) => {
    const bone = selectedBone || editingReactor?.bone_name || '';
    const fxDurNorm = Math.min((fx.duration || 0.5) / (animDuration || 3), 0.25); // normalize FX duration
    const startTime = Math.round(normalizedTime * 100) / 100;

    fxBlockCounter.current += 1;
    const newBlock = {
      _id: `fxb_${Date.now()}_${fxBlockCounter.current}`,
      fx_id: fx.id,
      fx_name: fx.name,
      effect_type: fx.effect_type || 'burst',
      color: fx.color || '#ff8800',
      start_time: startTime,
      duration_norm: Math.round(fxDurNorm * 100) / 100,
      bone: bone,
      is_looping: fx.is_looping || false,
      linked_reactor_id: null,
    };

    setFxBlocks(prev => [...prev, newBlock]);
    setSelectedFXBlockId(newBlock._id);
    setActiveFXDrag(null);
    showSuccess(`FX "${fx.name}" placed at ${startTime.toFixed(2)}`);
  }, [selectedBone, editingReactor, animDuration]);

  // Update an FX block's properties (move, resize)
  const handleUpdateFXBlock = useCallback((blockId, updates) => {
    setFxBlocks(prev => prev.map(b => b._id === blockId ? { ...b, ...updates } : b));
  }, []);

  // Remove an FX block
  const handleRemoveFXBlock = useCallback((blockId) => {
    setFxBlocks(prev => prev.filter(b => b._id !== blockId));
    if (selectedFXBlockId === blockId) setSelectedFXBlockId(null);
  }, [selectedFXBlockId]);

  // Select an FX block
  const handleSelectFXBlock = useCallback((block) => {
    setSelectedFXBlockId(block._id);
  }, []);

  const handleSelectAnimation = (anim) => {
    setAnimationUrl(anim.file_url);
    setAnimName(anim.name);
    // Also set on editing reactor if one is active
    if (editingReactor) {
      setEditingReactor(prev => ({ ...prev, animation_name: anim.name, animation_id: anim.id }));
    }
  };

  const handleAnimationUploaded = (url, name) => {
    queryClient.invalidateQueries({ queryKey: ['animations-reactor'] });
    setAnimationUrl(url);
    setAnimName(name);
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Damage Reactor Editor</h2>
            <p className="text-slate-500 text-[10px]">Click bones in viewport • Play/pause/scrub animation • Drag FX to bones</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Primary model picker: Luna 3D Viewer scene models */}
          <select
            value={selectedModelId || ''}
            onChange={(e) => {
              setSelectedModelId(e.target.value || null);
              setSelectedBone(null);
              setEditingReactor(null);
              setAnimationUrl(null);
              setAnimName(null);
              setAnimTime(0);
              setIsPlaying(false);
            }}
            className="bg-emerald-900/40 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs text-emerald-300 min-w-[220px]"
            title="Select a model from the live Luna 3D Viewer"
          >
            <option value="">{sceneModels.length > 0 ? '⚡ Select from Luna 3D Viewer...' : '⏳ Open Luna Dashboard to load scene models...'}</option>
            {sceneModels.map(sm => (
              <option key={sm.id} value={sm.id}>🎮 {sm.name} ({sm.type})</option>
            ))}
            {/* Fallback: DB models not in scene */}
            {models.filter(m => !sceneModels.some(sm => sm.id === m.id)).length > 0 && (
              <option disabled>── DB Models (not in scene) ──</option>
            )}
            {models.filter(m => !sceneModels.some(sm => sm.id === m.id)).map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.file_type})</option>
            ))}
          </select>
          {sceneModels.length > 0 && (
            <Badge className="bg-emerald-500/20 text-emerald-300 text-[8px] border border-emerald-500/30">
              {sceneModels.length} in scene
            </Badge>
          )}
          {sceneModels.length === 0 && (
            <Badge className="bg-amber-500/20 text-amber-300 text-[8px] border border-amber-500/30 animate-pulse">
              No scene — open Luna Dashboard
            </Badge>
          )}
          <Badge variant="outline" className="text-slate-400 text-[9px]">{reactors.length} reactors</Badge>
          {/* Live Sync Toggle */}
          <button
            onClick={() => setLiveSync(!liveSync)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
              liveSync
                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title="Sync changes live to Luna Dashboard 3D viewer"
          >
            <Monitor className="w-3 h-3" />
            {liveSync ? 'Luna Sync ON' : 'Luna Sync OFF'}
          </button>
          {activeFXDrag && (
            <Badge className="bg-amber-500/20 text-amber-300 text-[9px] border border-amber-500/30 animate-pulse">
              FX: {activeFXDrag.name} — click bone to place
              <button onClick={() => setActiveFXDrag(null)} className="ml-1 text-amber-400 hover:text-white">×</button>
            </Badge>
          )}
        </div>
      </div>

      {!selectedModelId ? (
        <div className="flex items-center justify-center py-24 text-slate-600">
          <div className="text-center">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">
              {sceneModels.length > 0
                ? 'Select a model from the Luna 3D Viewer above'
                : 'Open the Luna Dashboard to load 3D models into the scene'}
            </p>
            <p className="text-xs mt-1">
              {sceneModels.length > 0
                ? `${sceneModels.length} model${sceneModels.length > 1 ? 's' : ''} detected in the live viewer`
                : 'Models in the 3D viewer will automatically appear in the dropdown'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          {/* LEFT PANEL: Bone Selector */}
          <div className={`border-r border-slate-800 transition-all flex flex-col ${leftCollapsed ? 'w-8' : 'w-56'}`}>
            <button onClick={() => setLeftCollapsed(!leftCollapsed)} className="p-1.5 border-b border-slate-800 text-slate-500 hover:text-white flex items-center justify-center">
              {leftCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
            {!leftCollapsed && (
              <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'thin' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rig Bones</span>
                </div>
                <ReactorBoneSelector
                  selectedBone={selectedBone}
                  onSelect={handleBoneClick}
                  rigBones={viewportRef.current?.getBones?.() || []}
                />
                {selectedBone && (
                  <Button size="sm" onClick={handleAddReactor} className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white h-7 text-[10px]">
                    <Plus className="w-3 h-3 mr-1" /> Add Reactor @ {animTime.toFixed(2)}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* CENTER: Viewport + Playback + Timeline */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* 3D Viewport */}
            <div className="flex-1">
              <ReactorViewport
                ref={viewportRef}
                modelUrl={selectedModel?.file_url}
                selectedBone={selectedBone}
                reactors={reactors}
                onBoneClick={handleBoneClick}
                animationUrl={animationUrl}
                isPlaying={isPlaying}
                animTime={animTime}
                onAnimTimeChange={handleAnimTimeChange}
                onAnimLoaded={handleAnimLoaded}
                activeFXDrag={activeFXDrag}
                onFXDropOnBone={handleFXDropOnBone}
              />
            </div>

            {/* Animation selector bar (compact) */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border-t border-slate-800">
              <select
                value={animName || ''}
                onChange={(e) => {
                  const anim = animations.find(a => a.name === e.target.value);
                  if (anim?.file_url) handleSelectAnimation(anim);
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-white max-w-[180px]"
                title="Select animation"
              >
                <option value="">Embedded Anim</option>
                {animations.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
              <AnimationPlaybackBar
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                animTime={animTime}
                onScrub={handleScrub}
                animName={animName}
                animDuration={animDuration}
                onAnimationUploaded={handleAnimationUploaded}
                animations={animations}
                onSelectAnimation={handleSelectAnimation}
              />
            </div>

            {/* Sequencer Timeline */}
            <div className="border-t border-slate-800 bg-slate-950" style={{ height: '220px' }}>
              <SequencerTimeline
                reactors={reactors}
                fxBlocks={fxBlocks}
                selectedReactorId={selectedReactorId}
                selectedFXBlockId={selectedFXBlockId}
                onSelectReactor={handleSelectReactor}
                onSelectFXBlock={handleSelectFXBlock}
                animTime={animTime}
                animDuration={animDuration}
                animName={animName}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onScrub={handleScrub}
                onUpdateReactorTime={handleUpdateReactorTime}
                onUpdateFXBlock={handleUpdateFXBlock}
                onRemoveFXBlock={handleRemoveFXBlock}
                onDropFXAtTime={handleDropFXAtTime}
                activeFXDrag={activeFXDrag}
              />
            </div>
          </div>

          {/* RIGHT PANEL: Properties / FX */}
          <div className={`border-l border-slate-800 transition-all flex flex-col ${rightCollapsed ? 'w-8' : 'w-72'}`}>
            <div className="flex items-center border-b border-slate-800">
              <button onClick={() => setRightCollapsed(!rightCollapsed)} className="p-1.5 text-slate-500 hover:text-white">
                {rightCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {!rightCollapsed && (
                <div className="flex gap-0.5 px-1">
                  <button onClick={() => setRightTab('properties')} className={`px-2.5 py-1.5 text-[10px] font-bold rounded-t-lg ${rightTab === 'properties' ? 'text-white bg-slate-800' : 'text-slate-500'}`}>
                    Properties
                  </button>
                  <button onClick={() => setRightTab('fx')} className={`px-2.5 py-1.5 text-[10px] font-bold rounded-t-lg ${rightTab === 'fx' ? 'text-white bg-slate-800' : 'text-slate-500'}`}>
                    FX Effects
                  </button>
                </div>
              )}
            </div>
            {!rightCollapsed && (
              <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'thin' }}>
                {rightTab === 'properties' ? (
                  editingReactor ? (
                    <div className="space-y-3">
                      {/* Animation selector */}
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">Animation</label>
                        <select
                          value={editingReactor.animation_name || ''}
                          onChange={(e) => {
                            const anim = animations.find(a => a.name === e.target.value);
                            setEditingReactor({ ...editingReactor, animation_name: e.target.value, animation_id: anim?.id || '' });
                            if (anim?.file_url) handleSelectAnimation(anim);
                          }}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                          <option value="">Select animation...</option>
                          {animations.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                        </select>
                      </div>

                      {/* Set trigger from playhead */}
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setEditingReactor({ ...editingReactor, trigger_time: Math.round(animTime * 100) / 100 })} className="flex-1 h-6 text-[9px]">
                          Set Start → {animTime.toFixed(2)}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingReactor({ ...editingReactor, trigger_end_time: Math.round(animTime * 100) / 100 })} className="flex-1 h-6 text-[9px]">
                          Set End → {animTime.toFixed(2)}
                        </Button>
                      </div>

                      {/* FX display */}
                      {editingReactor.fx_name && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-300 text-[10px] font-bold">{editingReactor.fx_name}</span>
                          <button onClick={() => setEditingReactor({ ...editingReactor, fx_id: '', fx_name: '' })} className="ml-auto text-slate-500 hover:text-red-400 text-[9px]">×</button>
                        </div>
                      )}

                      <ReactorPropertiesPanel reactor={editingReactor} onChange={setEditingReactor} />

                      {/* Save / Delete */}
                      <div className="flex gap-2 pt-2 border-t border-slate-700">
                        <Button size="sm" onClick={handleSaveReactor} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white h-7 text-[10px]">
                          {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" /> Save</>}
                        </Button>
                        {editingReactor.id && (
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(editingReactor.id)} className="text-red-400 hover:text-red-300 h-7 text-[10px]">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-600 text-xs">
                      <p>Click a bone in the 3D viewport</p>
                      <p className="mt-1">then "Add Reactor" or select one from the timeline</p>
                    </div>
                  )
                ) : (
                  <FXUploadManager onSelectFX={handleSelectFX} onStartDragFX={handleStartDragFX} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}