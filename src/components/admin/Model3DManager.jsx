import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Eye, Loader2, Box, Plus, Search, Download, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense } from 'react';

// 3D Model Viewer Component
function Model3DViewer({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1} />;
}

function ModelPreview({ modelUrl }) {
  return (
    <div className="w-full h-64 bg-slate-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          <Model3DViewer url={modelUrl} />
          <OrbitControls enablePan enableZoom enableRotate />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default function Model3DManager() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newModel, setNewModel] = useState({
    name: '',
    description: '',
    category: '',
    tags: []
  });

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models3d'],
    queryFn: () => base44.entities.Model3D.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Model3D.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models3d'] });
      setNewModel({ name: '', description: '', category: '', tags: [] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Model3D.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models3d'] });
      setSelectedModel(null);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.glb', '.gltf', '.zip'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Please upload a GLB, GLTF, or ZIP file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await createMutation.mutateAsync({
        name: newModel.name || file.name,
        description: newModel.description,
        file_url: file_url,
        file_type: fileExtension.replace('.', ''),
        category: newModel.category || 'uncategorized',
        tags: newModel.tags,
        file_size: file.size,
        is_public: false
      });
      
      setNewModel({ name: '', description: '', category: '', tags: [] });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const filteredModels = models.filter(model => 
    searchQuery === '' || 
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Box className="w-6 h-6 text-purple-500" />
            3D Model Library
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload and manage 3D models (GLB, GLTF, ZIP)
          </p>
        </div>
        <Badge variant="outline" className="text-slate-400">
          {models.length} Models
        </Badge>
      </div>

      {/* Upload Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Upload New Model</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            placeholder="Model name"
            value={newModel.name}
            onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
            className="bg-slate-900 border-slate-700"
          />
          <Input
            placeholder="Category (e.g., characters, weapons, environments)"
            value={newModel.category}
            onChange={(e) => setNewModel({ ...newModel, category: e.target.value })}
            className="bg-slate-900 border-slate-700"
          />
        </div>
        <Textarea
          placeholder="Model description..."
          value={newModel.description}
          onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
          className="bg-slate-900 border-slate-700 mb-4"
        />
        <label className="relative cursor-pointer">
          <input
            type="file"
            accept=".glb,.gltf,.zip"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button 
            disabled={uploading}
            className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
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
                  Upload 3D Model (.glb, .gltf, .zip)
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {/* Search */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border-slate-700 pl-10"
          />
        </div>
      </div>

      {/* Models Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading models...
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No 3D models uploaded yet</p>
          <p className="text-sm">Upload your first model above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredModels.map((model) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden group hover:border-purple-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedModel(model)}
              >
                {/* Preview */}
                <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-slate-900 relative flex items-center justify-center">
                  <Box className="w-16 h-16 text-purple-500/30" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-purple-600 uppercase text-xs">
                      {model.file_type}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h4 className="font-semibold truncate mb-1">{model.name}</h4>
                  <p className="text-slate-400 text-xs mb-2 line-clamp-2">
                    {model.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="outline" className="text-xs">
                      {model.category || 'uncategorized'}
                    </Badge>
                    <span className="text-slate-500">{formatFileSize(model.file_size)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Model Detail Modal */}
      <AnimatePresence>
        {selectedModel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSelectedModel(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-20 bg-slate-900 border border-slate-700 rounded-2xl z-50 overflow-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">{selectedModel.name}</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(selectedModel.file_url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => {
                        if (confirm('Delete this model?')) {
                          deleteMutation.mutate(selectedModel.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedModel(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>

                {/* 3D Preview (if GLB/GLTF) */}
                {(selectedModel.file_type === 'glb' || selectedModel.file_type === 'gltf') && (
                  <div className="mb-6">
                    <ModelPreview modelUrl={selectedModel.file_url} />
                  </div>
                )}

                {/* Model Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-slate-400 text-sm">File Type</label>
                    <p className="text-white font-semibold uppercase">{selectedModel.file_type}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">File Size</label>
                    <p className="text-white font-semibold">{formatFileSize(selectedModel.file_size)}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Category</label>
                    <p className="text-white font-semibold">{selectedModel.category || 'uncategorized'}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Visibility</label>
                    <Badge className={selectedModel.is_public ? 'bg-green-600' : 'bg-slate-600'}>
                      {selectedModel.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>

                {selectedModel.description && (
                  <div className="mb-4">
                    <label className="text-slate-400 text-sm block mb-2">Description</label>
                    <p className="text-white">{selectedModel.description}</p>
                  </div>
                )}

                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">File URL (for development)</p>
                  <code className="text-xs text-green-400 break-all">{selectedModel.file_url}</code>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}