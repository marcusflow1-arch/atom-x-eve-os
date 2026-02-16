import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Film, Loader2, Tag, AlertCircle, FolderPlus, Folder, FolderOpen, ChevronRight, X, Pencil, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

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

export default function AnimationFBXManager() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null); // null = "All", "" = "Unsorted", string = folder name
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [movingAnimId, setMovingAnimId] = useState(null);

  const [newAnimation, setNewAnimation] = useState({
    name: '',
    description: '',
    animation_type: 'idle',
    is_loopable: true,
    tags: '',
    folder: ''
  });

  const { data: animations = [], isLoading } = useQuery({
    queryKey: ['animationFBX'],
    queryFn: () => base44.entities.AnimationFBX.list('-created_date'),
  });

  // Load persisted folders from database
  const { data: folderRecords = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['animationFolders'],
    queryFn: () => base44.entities.AnimationFolder.list('name'),
  });

  // Merge: persisted folder names + any folder names on animations (for safety)
  const folders = useMemo(() => {
    const folderSet = new Set();
    folderRecords.forEach(f => folderSet.add(f.name));
    animations.forEach(a => {
      if (a.folder) folderSet.add(a.folder);
    });
    return Array.from(folderSet).sort();
  }, [animations, folderRecords]);

  // Filter animations by active folder
  const filteredAnimations = useMemo(() => {
    if (activeFolder === null) return animations; // "All"
    if (activeFolder === '') return animations.filter(a => !a.folder); // "Unsorted"
    return animations.filter(a => a.folder === activeFolder);
  }, [animations, activeFolder]);

  const unsortedCount = animations.filter(a => !a.folder).length;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AnimationFBX.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animationFBX'] });
      setNewAnimation({ name: '', description: '', animation_type: 'idle', is_loopable: true, tags: '', folder: activeFolder && activeFolder !== '' ? activeFolder : '' });
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AnimationFBX.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animationFBX'] });
      setMovingAnimId(null);
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(f => f.name.toLowerCase().endsWith('.fbx'));
    if (validFiles.length === 0) { alert('Please upload valid .fbx files'); return; }

    if (validFiles.length < files.length) {
      if (!confirm(`Found ${files.length - validFiles.length} invalid files. Continue uploading ${validFiles.length} valid .fbx files?`)) {
        e.target.value = null;
        return;
      }
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    // Default to active folder if viewing one
    const targetFolder = (activeFolder !== null && activeFolder !== '') ? activeFolder : newAnimation.folder;

    try {
      for (const file of validFiles) {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          const entryName = (validFiles.length > 1 || !newAnimation.name)
            ? file.name.replace(/\.fbx$/i, '')
            : newAnimation.name;

          await createMutation.mutateAsync({
            name: entryName,
            description: newAnimation.description,
            file_url,
            animation_type: newAnimation.animation_type,
            is_loopable: newAnimation.is_loopable,
            tags: newAnimation.tags ? newAnimation.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            folder: targetFolder
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          failCount++;
        }
      }
      if (failCount > 0) alert(`Upload complete. Success: ${successCount}, Failed: ${failCount}`);
    } catch (error) {
      alert(`Batch upload process failed: ${error.message || 'Unknown error'}.`);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const deleteAnimation = (id) => {
    if (confirm('Are you sure you want to delete this animation?')) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  const createFolderMutation = useMutation({
    mutationFn: (data) => base44.entities.AnimationFolder.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animationFolders'] }),
  });

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    if (folders.includes(name)) { alert('A folder with that name already exists.'); return; }
    // Persist the folder to the database
    await createFolderMutation.mutateAsync({ name });
    setActiveFolder(name);
    setNewFolderName('');
    setShowNewFolder(false);
    setNewAnimation(prev => ({ ...prev, folder: name }));
  };

  const handleRenameFolder = async (oldName) => {
    const newName = renameValue.trim();
    if (!newName || newName === oldName) { setRenamingFolder(null); return; }
    if (folders.includes(newName)) { alert('A folder with that name already exists.'); return; }

    // Rename all animations in this folder
    const animsInFolder = animations.filter(a => a.folder === oldName);
    for (const anim of animsInFolder) {
      await base44.entities.AnimationFBX.update(anim.id, { folder: newName });
    }
    // Update the folder record itself
    const folderRecord = folderRecords.find(f => f.name === oldName);
    if (folderRecord) {
      await base44.entities.AnimationFolder.update(folderRecord.id, { name: newName });
    }
    queryClient.invalidateQueries({ queryKey: ['animationFBX'] });
    queryClient.invalidateQueries({ queryKey: ['animationFolders'] });
    if (activeFolder === oldName) setActiveFolder(newName);
    setRenamingFolder(null);
  };

  const handleDeleteFolder = async (folderName) => {
    const animsInFolder = animations.filter(a => a.folder === folderName);
    if (!confirm(`Move ${animsInFolder.length} animation(s) to Unsorted and delete folder "${folderName}"?`)) return;

    // Move animations to unsorted
    for (const anim of animsInFolder) {
      await base44.entities.AnimationFBX.update(anim.id, { folder: '' });
    }
    // Delete the folder record
    const folderRecord = folderRecords.find(f => f.name === folderName);
    if (folderRecord) {
      await base44.entities.AnimationFolder.delete(folderRecord.id);
    }
    queryClient.invalidateQueries({ queryKey: ['animationFBX'] });
    queryClient.invalidateQueries({ queryKey: ['animationFolders'] });
    if (activeFolder === folderName) setActiveFolder(null);
  };

  const handleMoveToFolder = async (animId, targetFolder) => {
    await updateMutation.mutateAsync({ id: animId, data: { folder: targetFolder } });
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

      <div className="flex gap-6">
        {/* Folder Sidebar */}
        <div className="w-56 flex-shrink-0 space-y-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Folders</span>
            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-purple-400 transition-colors"
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {/* New Folder Input */}
          <AnimatePresence>
            {showNewFolder && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex gap-1 mb-2">
                  <Input
                    placeholder="Folder name..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    className="bg-slate-800 border-slate-700 h-8 text-xs"
                    autoFocus
                  />
                  <Button size="sm" className="h-8 px-2 bg-purple-600 hover:bg-purple-700" onClick={handleCreateFolder}>
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* All Animations */}
          <button
            onClick={() => setActiveFolder(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFolder === null ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Film className="w-4 h-4" />
            <span className="flex-1 text-left">All</span>
            <span className="text-xs opacity-60">{animations.length}</span>
          </button>

          {/* Unsorted */}
          <button
            onClick={() => setActiveFolder('')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFolder === '' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span className="flex-1 text-left">Unsorted</span>
            <span className="text-xs opacity-60">{unsortedCount}</span>
          </button>

          {/* Divider */}
          {folders.length > 0 && <div className="border-t border-slate-700/50 my-2" />}

          {/* Folder List */}
          {folders.map(f => {
            const count = animations.filter(a => a.folder === f).length;
            const isActive = activeFolder === f;
            const isRenaming = renamingFolder === f;

            return (
              <div key={f} className="group relative">
                {isRenaming ? (
                  <div className="flex gap-1">
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameFolder(f); if (e.key === 'Escape') setRenamingFolder(null); }}
                      className="bg-slate-800 border-slate-700 h-8 text-xs"
                      autoFocus
                    />
                    <Button size="sm" className="h-8 px-2 bg-purple-600 hover:bg-purple-700" onClick={() => handleRenameFolder(f)}>
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveFolder(f)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    {isActive ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                    <span className="flex-1 text-left truncate">{f}</span>
                    <span className="text-xs opacity-60">{count}</span>
                  </button>
                )}

                {/* Folder actions on hover */}
                {!isRenaming && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingFolder(f); setRenameValue(f); }}
                      className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white"
                      title="Rename"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f); }}
                      className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
                      title="Delete folder"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          {activeFolder !== null && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <button onClick={() => setActiveFolder(null)} className="text-slate-400 hover:text-white transition-colors">All</button>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-white font-medium">{activeFolder === '' ? 'Unsorted' : activeFolder}</span>
              <span className="text-slate-600">({filteredAnimations.length})</span>
            </div>
          )}

          {/* Upload Section */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8 shadow-sm">
            <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-400" /> Upload New Animation
              {activeFolder && activeFolder !== '' && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 ml-2">
                  → {activeFolder}
                </Badge>
              )}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              {/* Folder selector — only show if not inside a folder */}
              {(activeFolder === null || activeFolder === '') && (
                <select
                  value={newAnimation.folder}
                  onChange={(e) => setNewAnimation({ ...newAnimation, folder: e.target.value })}
                  className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">No Folder (Unsorted)</option>
                  {folders.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              )}
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
              <input type="file" accept=".fbx" multiple onChange={handleFileUpload} className="hidden" disabled={uploading} />
              <Button disabled={uploading} className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-md font-medium shadow-lg shadow-purple-900/20" asChild>
                <span>
                  {uploading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading & Processing...</>
                  ) : (
                    <><Upload className="w-5 h-5 mr-2" /> Select FBX File(s) to Upload</>
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
          ) : filteredAnimations.length === 0 ? (
            <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
              <Film className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium text-slate-400">
                {activeFolder ? `No animations in "${activeFolder === '' ? 'Unsorted' : activeFolder}"` : 'No animations yet'}
              </p>
              <p className="text-sm">Upload an FBX file to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredAnimations.map((anim) => (
                  <motion.div
                    key={anim.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden group hover:border-purple-500/50 transition-all shadow-md hover:shadow-xl"
                  >
                    {/* Animation Preview */}
                    <div className="aspect-video bg-gradient-to-br from-purple-900/10 to-slate-950 relative flex items-center justify-center border-b border-slate-700/50">
                      <div className="text-center group-hover:scale-105 transition-transform duration-300">
                        <Film className="w-12 h-12 text-purple-500/40 mx-auto mb-2" />
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold opacity-70">{anim.animation_type}</p>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className={`${animationTypeColors[anim.animation_type]} backdrop-blur-sm shadow-sm`}>{anim.animation_type}</Badge>
                      </div>
                      {anim.is_loopable && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="bg-black/40 text-green-400 border-green-500/30 backdrop-blur-sm text-[10px]">Loop</Badge>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white truncate pr-2" title={anim.name}>{anim.name}</h4>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-500 hover:text-red-400 hover:bg-red-500/10 -mt-1 -mr-2" onClick={() => deleteAnimation(anim.id)} disabled={deletingId === anim.id}>
                          {deletingId === anim.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>

                      <p className="text-slate-400 text-xs mb-3 line-clamp-2 h-8">
                        {anim.description || <span className="italic opacity-50">No description provided</span>}
                      </p>

                      {/* Folder badge */}
                      {anim.folder && (
                        <div className="mb-2">
                          <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300 bg-purple-500/10">
                            <Folder className="w-2.5 h-2.5 mr-1" />{anim.folder}
                          </Badge>
                        </div>
                      )}

                      {/* Tags */}
                      {anim.tags && anim.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mb-3 h-6 overflow-hidden">
                          {anim.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-300 rounded border border-slate-700">#{tag}</span>
                          ))}
                          {anim.tags.length > 3 && <span className="text-[10px] text-slate-500">+{anim.tags.length - 3}</span>}
                        </div>
                      ) : (
                        <div className="h-6 mb-3" />
                      )}

                      {/* Move to folder */}
                      {movingAnimId === anim.id ? (
                        <div className="mb-3 flex gap-1">
                          <select
                            className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-md px-2 py-1 text-xs"
                            defaultValue={anim.folder || ''}
                            onChange={(e) => handleMoveToFolder(anim.id, e.target.value)}
                          >
                            <option value="">Unsorted</option>
                            {folders.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setMovingAnimId(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setMovingAnimId(anim.id)}
                          className="text-[10px] text-slate-500 hover:text-purple-300 mb-3 flex items-center gap-1 transition-colors"
                        >
                          <ArrowLeft className="w-3 h-3" /> Move to folder
                        </button>
                      )}

                      <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center">
                        <a href={anim.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1">
                          Download FBX
                        </a>
                        <span className="text-[10px] text-slate-500">{new Date(anim.created_date || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}