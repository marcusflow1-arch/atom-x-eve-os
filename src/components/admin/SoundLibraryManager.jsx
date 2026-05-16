import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, Music, FolderPlus, ArrowLeft, Loader2, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SoundLibraryManager() {
  const queryClient = useQueryClient();
  const [currentFolder, setCurrentFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [showFileInput, setShowFileInput] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch all sound assets
  const { data: assets = [] } = useQuery({
    queryKey: ['sound-library-assets'],
    queryFn: () => base44.entities.AssetFile.filter({ type: 'audio' }).catch(() => []),
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderPath) => {
      await base44.entities.AssetFile.create({
        name: folderPath.split('/').pop(),
        type: 'folder',
        folder_path: folderPath,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sound-library-assets'] });
      setNewFolderName('');
      setShowFolderInput(false);
      toast.success('Folder created');
    },
    onError: (error) => {
      console.error('Folder creation error:', error);
      toast.error(error?.message || 'Failed to create folder');
    },
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: (assetId) => base44.entities.AssetFile.delete(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sound-library-assets'] });
      toast.success('Deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = newFileName || file.name.replace(/\.[^/.]+$/, '');
    
    if (!['audio/mpeg', 'audio/mp4', 'video/mp4', 'audio/wav', 'audio/ogg'].includes(file.type)) {
      toast.error('Only MP3, MP4, WAV, and OGG files are supported');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.AssetFile.create({
        name: fileName,
        type: 'audio',
        folder_path: currentFolder || null,
        file_url,
        file_extension: file.name.split('.').pop(),
      });

      toast.success('File uploaded');
      setNewFileName('');
      setShowFileInput(false);
      queryClient.invalidateQueries({ queryKey: ['sound-library-assets'] });
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Group assets by folder
  const groupedAssets = useMemo(() => {
    const groups = { root: [], folders: new Set() };
    
    assets.forEach((asset) => {
      if (asset.type === 'folder') {
        groups.folders.add(asset.folder_path);
      } else if (currentFolder) {
        if (asset.folder_path === currentFolder) {
          groups.root.push(asset);
        }
      } else {
        if (!asset.folder_path) {
          groups.root.push(asset);
        } else if (asset.folder_path.split('/')[0] === asset.folder_path) {
          groups.folders.add(asset.folder_path);
        }
      }
    });

    return groups;
  }, [assets, currentFolder]);

  return (
    <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {currentFolder && (
            <button
              onClick={() => setCurrentFolder(null)}
              className="p-2 hover:bg-slate-800 rounded"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
            </button>
          )}
          <h3 className="text-lg font-bold text-white">
            {currentFolder ? `📁 ${currentFolder}` : '🎵 Sound Library'}
          </h3>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          onClick={() => setShowFolderInput(!showFolderInput)}
          variant="outline"
          className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          Create Folder
        </Button>
        {currentFolder && (
          <Button
            onClick={() => setShowFileInput(!showFileInput)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Music className="w-4 h-4 mr-2" />
            Add Files
          </Button>
        )}
      </div>

      {/* Create Folder Input */}
      {showFolderInput && (
        <div className="flex gap-2 mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <Input
            type="text"
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="bg-slate-900 border-slate-600"
            autoFocus
          />
          <Button
            onClick={() => {
              if (newFolderName) {
                const folderPath = currentFolder
                  ? `${currentFolder}/${newFolderName}`
                  : newFolderName;
                createFolderMutation.mutate(folderPath);
              }
            }}
            disabled={!newFolderName}
            className="bg-green-600 hover:bg-green-700"
          >
            Create
          </Button>
          <Button
            onClick={() => setShowFolderInput(false)}
            variant="outline"
            className="bg-slate-800 border-slate-600"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Upload File Input */}
      {showFileInput && (
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mb-6">
          <div className="flex flex-col gap-3">
            <Input
              type="text"
              placeholder="File name (optional)..."
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="bg-slate-900 border-slate-600"
            />
            <label className="cursor-pointer">
              <input
                type="file"
                accept="audio/mpeg,audio/mp4,video/mp4,audio/wav,audio/ogg"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-700"
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
                      <Music className="w-4 h-4 mr-2" />
                      Choose MP3/MP4 File
                    </>
                  )}
                </span>
              </Button>
            </label>
            <Button
              onClick={() => {
                setShowFileInput(false);
                setNewFileName('');
              }}
              variant="outline"
              className="bg-slate-800 border-slate-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Assets List */}
      <div className="space-y-2">
        {/* Folders */}
        {Array.from(groupedAssets.folders).map((folderPath) => {
          const folderName = folderPath.split('/').pop();
          return (
            <div
              key={folderPath}
              className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors group"
            >
              <Folder className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <span
                onClick={() => setCurrentFolder(folderPath)}
                className="text-slate-200 flex-1 cursor-pointer"
              >
                {folderName}
              </span>
              <button
                onClick={() => {
                  setCurrentFolder(folderPath);
                  setShowFileInput(true);
                }}
                className="p-2 hover:bg-blue-600/20 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                title="Add files to this folder"
              >
                <Plus className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          );
        })}

        {/* Files */}
        {groupedAssets.root.map((asset) => (
          <div
            key={asset.id}
            className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors group"
          >
            <Music className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="text-slate-200">{asset.name}</p>
              {asset.file_extension && (
                <p className="text-xs text-slate-400">.{asset.file_extension}</p>
              )}
            </div>
            <button
              onClick={() => deleteAssetMutation.mutate(asset.id)}
              className="p-2 hover:bg-red-600/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        ))}

        {groupedAssets.root.length === 0 && groupedAssets.folders.size === 0 && (
          <p className="text-center text-slate-400 py-8">No files or folders yet. Create a folder or upload a file to start.</p>
        )}
      </div>
    </div>
  );
}