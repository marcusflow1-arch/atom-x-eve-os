import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Folder, Music, Plus, FolderPlus, Loader2, ChevronRight, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Game } from '@/entities/Game';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const SOUND_CATEGORIES = [
  { id: 'combat', label: 'Combat Sounds', icon: '⚔️', color: 'red' },
  { id: 'themes', label: 'Themes & Background Music', icon: '🎵', color: 'blue' },
];

export default function SoundLibraryManager() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('combat');
  const [selectedGameId, setSelectedGameId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  // Fetch all games
  const { data: games = [] } = useQuery({
    queryKey: ['adminGames'],
    queryFn: () => Game.list('-created_date'),
  });

  // Fetch sound files for the selected game
  const { data: soundFiles = [], isLoading, refetch } = useQuery({
    queryKey: ['soundFiles', activeCategory, selectedGameId],
    queryFn: async () => {
      if (!selectedGameId) return [];
      const files = await base44.entities.AssetFile.filter({ 
        game_id: selectedGameId,
        category: activeCategory,
        type: 'audio'
      }, '-created_date', 100);
      return files;
    },
    enabled: !!selectedGameId,
  });

  const createAssetMutation = useMutation({
    mutationFn: (data) => base44.entities.AssetFile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soundFiles'] });
      showSuccess('Sound file added successfully!');
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id) => base44.entities.AssetFile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soundFiles'] });
      showSuccess('File deleted');
    },
  });

  // Group files by folder
  const groupedByFolder = useMemo(() => {
    const groups = { 'root': [] };
    soundFiles.forEach(file => {
      const folder = file.folder || 'root';
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push(file);
    });
    return groups;
  }, [soundFiles]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedGameId) {
      showError('Please select a game first');
      return;
    }

    if (!file.type.startsWith('audio/')) {
      showError('Please upload an audio file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await createAssetMutation.mutateAsync({
        name: file.name,
        type: 'audio',
        file_url,
        game_id: selectedGameId,
        category: activeCategory,
        folder: null,
      });
    } catch (error) {
      showError(error, 'Upload');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    if (!selectedGameId) {
      showError('Please select a game first');
      return;
    }

    try {
      await createAssetMutation.mutateAsync({
        name: newFolderName,
        type: 'folder',
        file_url: null,
        game_id: selectedGameId,
        category: activeCategory,
        folder: null,
        is_folder: true,
      });
      setNewFolderName('');
      setShowNewFolderInput(false);
      showSuccess(`Folder "${newFolderName}" created!`);
    } catch (error) {
      showError(error, 'Create Folder');
    }
  };

  const toggleFolderExpand = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const category = SOUND_CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Game Selector */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <label className="block text-sm font-semibold mb-3 text-slate-300">Select a Game</label>
        <Select value={selectedGameId} onValueChange={setSelectedGameId}>
          <SelectTrigger className="bg-slate-900 border-slate-700">
            <SelectValue placeholder="Choose a game to manage its sounds..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            {games.map(game => (
              <SelectItem key={game.id} value={game.id}>
                {game.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedGameId ? (
        <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">Please select a game to manage its sounds</p>
        </div>
      ) : (
        <>
      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800">
          {SOUND_CATEGORIES.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
              <span>{cat.icon}</span>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SOUND_CATEGORIES.map(cat => (
          <TabsContent key={cat.id} value={cat.id}>
            {/* Header */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span>{cat.icon}</span>
                    {cat.label}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Manage {cat.label.toLowerCase()} library with organized folders
                  </p>
                </div>
                <Badge variant="outline" className="text-slate-400">
                  {soundFiles.length} Files
                </Badge>
              </div>

              {/* Upload & Create Folder Section */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                <div className="flex flex-col gap-4">
                  {/* File Upload */}
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2 text-slate-300">Upload Sound File</label>
                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        <Button 
                          disabled={uploading}
                          className="bg-blue-600 hover:bg-blue-700 w-full"
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
                                Upload Audio File
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>

                  {/* Create Folder */}
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2 text-slate-300">Create New Folder</label>
                      <div className="flex gap-2">
                        {showNewFolderInput ? (
                          <>
                            <Input
                              placeholder="Folder name (e.g., Enemy AI Sounds)"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              className="bg-slate-900 border-slate-700 flex-1"
                              autoFocus
                            />
                            <Button
                              onClick={handleCreateFolder}
                              disabled={!newFolderName.trim()}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Create
                            </Button>
                            <Button
                              onClick={() => {
                                setShowNewFolderInput(false);
                                setNewFolderName('');
                              }}
                              variant="outline"
                              className="border-slate-700"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => setShowNewFolderInput(true)}
                            className="bg-purple-600 hover:bg-purple-700 w-full"
                          >
                            <FolderPlus className="w-4 h-4 mr-2" />
                            New Folder
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Files List */}
              {isLoading ? (
                <div className="text-center py-12 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading files...
                </div>
              ) : soundFiles.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No sound files yet</p>
                  <p className="text-sm">Upload your first audio file above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {Object.entries(groupedByFolder).map(([folderName, files]) => (
                      <div key={folderName}>
                        {/* Folder Header */}
                        {folderName !== 'root' && (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-800/30 border border-slate-700 hover:bg-slate-700/40 transition-colors text-left mb-2"
                            onClick={() => toggleFolderExpand(folderName)}
                          >
                            <ChevronRight 
                              className={`w-4 h-4 transition-transform ${expandedFolders[folderName] ? 'rotate-90' : ''}`}
                            />
                            <Folder className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold text-slate-300">{folderName}</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                              {files.length} files
                            </Badge>
                          </motion.button>
                        )}

                        {/* Files in folder */}
                        <AnimatePresence>
                          {(folderName === 'root' || expandedFolders[folderName]) && (
                            <div className={folderName !== 'root' ? 'ml-6 space-y-2 mb-4' : 'space-y-2'}>
                              {files.map(file => (
                                <motion.div
                                  key={file.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <Music className="w-4 h-4 text-blue-400" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-slate-300 font-medium truncate">{file.name}</p>
                                      <p className="text-xs text-slate-500">
                                        {new Date(file.created_date).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    onClick={() => {
                                      if (window.confirm(`Delete "${file.name}"?`)) {
                                        deleteAssetMutation.mutate(file.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
        </>
      )}
    </div>
  );
}