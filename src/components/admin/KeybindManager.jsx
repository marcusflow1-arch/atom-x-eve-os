import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Loader2, Save, Film, Layers, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AnimationBehaviorControls from './AnimationBehaviorControls';

export default function KeybindManager() {
  const queryClient = useQueryClient();
  const [selectedModelId, setSelectedModelId] = useState('');
  const [capturingKey, setCapturingKey] = useState(false);
  const [newKeybind, setNewKeybind] = useState({ key: '', label: '', animationSequence: [] });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Fetch models
  const { data: models = [] } = useQuery({
    queryKey: ['keybind-models'],
    queryFn: () => base44.entities.Model3D.list(),
  });

  // Fetch animations (with folders)
  const { data: animations = [] } = useQuery({
    queryKey: ['keybind-animations'],
    queryFn: () => base44.entities.AnimationFBX.list('name'),
  });

  // Fetch existing keybinds
  const { data: keybinds = [], isLoading: keybindsLoading } = useQuery({
    queryKey: ['animationKeybinds'],
    queryFn: () => base44.entities.AnimationKeybind.list('-created_date'),
  });

  // Filtered keybinds for selected model
  const filteredKeybinds = useMemo(() => {
    if (!selectedModelId) return keybinds;
    return keybinds.filter(kb => kb.modelId === selectedModelId);
  }, [keybinds, selectedModelId]);

  // Group animations by folder
  const animationsByFolder = useMemo(() => {
    const groups = { '': [] };
    animations.forEach(a => {
      const folder = a.folder || '';
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push(a);
    });
    return groups;
  }, [animations]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AnimationKeybind.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animationKeybinds'] });
      setNewKeybind({ key: '', label: '', animationSequence: [] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AnimationKeybind.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animationKeybinds'] });
      setEditingId(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AnimationKeybind.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animationKeybinds'] }),
  });

  const handleKeyCapture = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const keyCode = e.code; // e.g. "Space", "KeyC", "ShiftLeft"
    if (editingId && editData) {
      setEditData({ ...editData, key: keyCode });
    } else {
      setNewKeybind(prev => ({ ...prev, key: keyCode }));
    }
    setCapturingKey(false);
  };

  // All animation names for "specific return" dropdown
  const allAnimationNames = useMemo(() => animations.map(a => a.name), [animations]);

  // Validation: check for conflicts
  const validateKeybind = (data, existingKeybinds, currentId = null) => {
    const errors = [];
    if (!data) return errors;
    const playbackType = data.playbackType || 'tap';

    // Check for two Hold keybinds on the same key
    if (playbackType === 'hold') {
      const conflicting = existingKeybinds.find(kb =>
        kb.id !== currentId &&
        kb.key === data.key &&
        kb.modelId === (data.modelId || selectedModelId) &&
        (kb.playbackType || 'tap') === 'hold'
      );
      if (conflicting) {
        errors.push(`Another Hold keybind already uses key "${data.key}" on this model (${conflicting.label || conflicting.key}).`);
      }
    }

    // Check for Hold + Tap conflict on same key
    if (playbackType === 'hold' || playbackType === 'tap') {
      const conflicting = existingKeybinds.find(kb =>
        kb.id !== currentId &&
        kb.key === data.key &&
        kb.modelId === (data.modelId || selectedModelId) &&
        (kb.playbackType || 'tap') !== playbackType
      );
      if (conflicting) {
        errors.push(`Key "${data.key}" has a ${conflicting.playbackType || 'tap'} keybind — mixing Hold and Tap on the same key can cause conflicts.`);
      }
    }

    return errors;
  };

  const addAnimationToSequence = (anim, isEdit = false) => {
    const entry = {
      animationId: anim.id,
      animationName: anim.name,
      fileUrl: anim.file_url,
      loop: false,
      movementBehavior: 'in_place',
      snapBehavior: 'maintain_end',
      returnState: 'idle',
      returnAnimationName: '',
    };
    if (isEdit && editData) {
      setEditData({ ...editData, animationSequence: [...editData.animationSequence, entry] });
    } else {
      setNewKeybind(prev => ({ ...prev, animationSequence: [...prev.animationSequence, entry] }));
    }
  };

  const removeFromSequence = (index, isEdit = false) => {
    if (isEdit && editData) {
      const seq = [...editData.animationSequence];
      seq.splice(index, 1);
      setEditData({ ...editData, animationSequence: seq });
    } else {
      const seq = [...newKeybind.animationSequence];
      seq.splice(index, 1);
      setNewKeybind({ ...newKeybind, animationSequence: seq });
    }
  };

  const moveInSequence = (index, direction, isEdit = false) => {
    const target = isEdit ? editData : newKeybind;
    const seq = [...target.animationSequence];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= seq.length) return;
    [seq[index], seq[newIndex]] = [seq[newIndex], seq[index]];
    if (isEdit) {
      setEditData({ ...editData, animationSequence: seq });
    } else {
      setNewKeybind({ ...newKeybind, animationSequence: seq });
    }
  };

  const toggleLoop = (index, isEdit = false) => {
    const target = isEdit ? editData : newKeybind;
    const seq = [...target.animationSequence];
    seq[index] = { ...seq[index], loop: !seq[index].loop };
    if (isEdit) {
      setEditData({ ...editData, animationSequence: seq });
    } else {
      setNewKeybind({ ...newKeybind, animationSequence: seq });
    }
  };

  const handleSaveNew = () => {
    if (!selectedModelId || !newKeybind.key || newKeybind.animationSequence.length === 0) return;
    const model = models.find(m => m.id === selectedModelId);
    createMutation.mutate({
      modelId: selectedModelId,
      modelName: model?.name || 'Unknown',
      key: newKeybind.key,
      label: newKeybind.label || newKeybind.key,
      animationSequence: newKeybind.animationSequence,
    });
  };

  const handleSaveEdit = () => {
    if (!editData || !editingId) return;
    updateMutation.mutate({ id: editingId, data: editData });
  };

  const startEdit = (kb) => {
    setEditingId(kb.id);
    setEditData({ key: kb.key, label: kb.label, animationSequence: [...kb.animationSequence] });
  };

  const selectedModel = models.find(m => m.id === selectedModelId);

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Keyboard className="w-6 h-6 text-cyan-500" />
            Keybind Manager
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Assign animation sequences to keyboard inputs per model. Animations play once in order — no auto-play, no looping unless explicitly set.
          </p>
        </div>
        <Badge variant="outline" className="text-slate-400 border-slate-700">
          {keybinds.length} Keybinds
        </Badge>
      </div>

      {/* Model Selector */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select Model</label>
        <select
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">— All Models —</option>
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.name} ({m.file_type})</option>
          ))}
        </select>
      </div>

      {/* New Keybind Creator */}
      {selectedModelId && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Create New Keybind for {selectedModel?.name}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Label */}
            <Input
              placeholder="Label (e.g. Jump Combo)"
              value={newKeybind.label}
              onChange={(e) => setNewKeybind({ ...newKeybind, label: e.target.value })}
              className="bg-slate-900 border-slate-700"
            />

            {/* Key Capture */}
            <div className="relative">
              {capturingKey && !editingId ? (
                <div
                  className="w-full bg-cyan-900/30 border-2 border-cyan-500 text-cyan-300 rounded-lg px-4 py-2 text-sm text-center animate-pulse cursor-pointer"
                  tabIndex={0}
                  autoFocus
                  onKeyDown={handleKeyCapture}
                  onBlur={() => setCapturingKey(false)}
                >
                  Press any key...
                </div>
              ) : (
                <button
                  onClick={() => setCapturingKey(true)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm text-left hover:border-cyan-500/50 transition-colors"
                >
                  {newKeybind.key ? (
                    <span className="flex items-center gap-2">
                      <kbd className="px-2 py-0.5 bg-slate-700 rounded text-cyan-300 text-xs font-mono">{newKeybind.key}</kbd>
                      <span className="text-slate-400 text-xs">Click to change</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">Click to assign key...</span>
                  )}
                </button>
              )}
            </div>

            {/* Save button */}
            <Button
              onClick={handleSaveNew}
              disabled={!newKeybind.key || newKeybind.animationSequence.length === 0 || createMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Keybind
            </Button>
          </div>

          {/* Animation Sequence Builder */}
          <SequenceBuilder
            sequence={newKeybind.animationSequence}
            animationsByFolder={animationsByFolder}
            onAdd={(anim) => addAnimationToSequence(anim, false)}
            onRemove={(i) => removeFromSequence(i, false)}
            onMove={(i, d) => moveInSequence(i, d, false)}
            onToggleLoop={(i) => toggleLoop(i, false)}
          />
        </div>
      )}

      {/* Existing Keybinds */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
          {selectedModelId ? `Keybinds for ${selectedModel?.name}` : 'All Keybinds'}
        </h3>

        {keybindsLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          </div>
        ) : filteredKeybinds.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
            <Keyboard className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No keybinds configured yet</p>
            <p className="text-sm">Select a model above and create your first keybind</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredKeybinds.map(kb => (
              <KeybindCard
                key={kb.id}
                kb={kb}
                isEditing={editingId === kb.id}
                editData={editData}
                capturingKey={capturingKey && editingId === kb.id}
                onStartEdit={() => startEdit(kb)}
                onCancelEdit={() => { setEditingId(null); setEditData(null); }}
                onSaveEdit={handleSaveEdit}
                onDelete={() => deleteMutation.mutate(kb.id)}
                onStartCapture={() => { setEditingId(kb.id); setEditData(editData || { key: kb.key, label: kb.label, animationSequence: [...kb.animationSequence] }); setCapturingKey(true); }}
                onKeyCapture={handleKeyCapture}
                onStopCapture={() => setCapturingKey(false)}
                setEditData={setEditData}
                animationsByFolder={animationsByFolder}
                onAddAnim={(anim) => addAnimationToSequence(anim, true)}
                onRemoveAnim={(i) => removeFromSequence(i, true)}
                onMoveAnim={(i, d) => moveInSequence(i, d, true)}
                onToggleLoop={(i) => toggleLoop(i, true)}
                isSaving={updateMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function KeybindCard({ kb, isEditing, editData, capturingKey, onStartEdit, onCancelEdit, onSaveEdit, onDelete, onStartCapture, onKeyCapture, onStopCapture, setEditData, animationsByFolder, onAddAnim, onRemoveAnim, onMoveAnim, onToggleLoop, isSaving }) {
  return (
    <div className={`bg-slate-800/50 border rounded-xl overflow-hidden transition-colors ${isEditing ? 'border-cyan-500/50' : 'border-slate-700'}`}>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <kbd className="px-3 py-1.5 bg-slate-700 rounded-lg text-cyan-300 text-sm font-mono border border-slate-600">
            {isEditing ? editData?.key || kb.key : kb.key}
          </kbd>
          <div>
            <div className="text-white font-semibold">{isEditing ? editData?.label || kb.label : kb.label || kb.key}</div>
            <div className="text-slate-400 text-xs">{kb.modelName} · {kb.animationSequence?.length || 0} animation(s)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Sequence preview badges */}
          <div className="flex gap-1 mr-4">
            {(isEditing ? editData?.animationSequence : kb.animationSequence)?.map((a, i) => (
              <Badge key={i} variant="outline" className="text-[10px] border-slate-600 text-slate-300">
                {i + 1}. {a.animationName}
              </Badge>
            ))}
          </div>
          {isEditing ? (
            <>
              <Button size="sm" onClick={onSaveEdit} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={onStartEdit}>Edit</Button>
              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={onDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Edit mode expanded */}
      <AnimatePresence>
        {isEditing && editData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-700 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Label"
                  value={editData.label}
                  onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                  className="bg-slate-900 border-slate-700"
                />
                {capturingKey ? (
                  <div
                    className="w-full bg-cyan-900/30 border-2 border-cyan-500 text-cyan-300 rounded-lg px-4 py-2 text-sm text-center animate-pulse cursor-pointer"
                    tabIndex={0}
                    autoFocus
                    onKeyDown={onKeyCapture}
                    onBlur={onStopCapture}
                  >
                    Press any key...
                  </div>
                ) : (
                  <button
                    onClick={onStartCapture}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm text-left hover:border-cyan-500/50 transition-colors"
                  >
                    <kbd className="px-2 py-0.5 bg-slate-700 rounded text-cyan-300 text-xs font-mono">{editData.key}</kbd>
                    <span className="text-slate-400 text-xs ml-2">Click to rebind</span>
                  </button>
                )}
              </div>

              <SequenceBuilder
                sequence={editData.animationSequence}
                animationsByFolder={animationsByFolder}
                onAdd={onAddAnim}
                onRemove={onRemoveAnim}
                onMove={onMoveAnim}
                onToggleLoop={onToggleLoop}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SequenceBuilder({ sequence, animationsByFolder, onAdd, onRemove, onMove, onToggleLoop }) {
  const [showPicker, setShowPicker] = useState(false);
  const [expandedFolder, setExpandedFolder] = useState(null);

  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
        Animation Sequence ({sequence.length} clip{sequence.length !== 1 ? 's' : ''})
      </label>

      {/* Current sequence */}
      {sequence.length > 0 && (
        <div className="space-y-2 mb-4">
          {sequence.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2">
              <span className="text-cyan-400 font-mono text-xs w-6 text-center">{i + 1}</span>
              <Film className="w-4 h-4 text-slate-500" />
              <span className="text-white text-sm flex-1 truncate">{entry.animationName}</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>Loop</span>
                <Switch checked={entry.loop} onCheckedChange={() => onToggleLoop(i)} />
              </div>
              <button onClick={() => onMove(i, -1)} disabled={i === 0} className="p-1 text-slate-500 hover:text-white disabled:opacity-30">
                <ChevronUp className="w-3 h-3" />
              </button>
              <button onClick={() => onMove(i, 1)} disabled={i === sequence.length - 1} className="p-1 text-slate-500 hover:text-white disabled:opacity-30">
                <ChevronDown className="w-3 h-3" />
              </button>
              <button onClick={() => onRemove(i)} className="p-1 text-red-400 hover:text-red-300">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add animation button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="w-full border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg py-3 text-slate-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-2 text-sm"
      >
        <Plus className="w-4 h-4" />
        Add Animation to Sequence
      </button>

      {/* Animation Picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-h-64 overflow-y-auto">
              {Object.entries(animationsByFolder).map(([folder, anims]) => (
                <div key={folder || '__unsorted'}>
                  {folder && (
                    <button
                      onClick={() => setExpandedFolder(expandedFolder === folder ? null : folder)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <Layers className="w-3 h-3" />
                      {folder}
                      <span className="text-slate-600 ml-auto">{anims.length}</span>
                    </button>
                  )}
                  {(!folder || expandedFolder === folder) && anims.map(anim => (
                    <button
                      key={anim.id}
                      onClick={() => { onAdd(anim); setShowPicker(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-white transition-colors border-b border-slate-800/50 last:border-0"
                    >
                      <Film className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="flex-1 text-left truncate">{anim.name}</span>
                      <Badge className="text-[10px] bg-slate-700 text-slate-300">{anim.animation_type}</Badge>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}