import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Eye, Loader2, Box, Plus, Search, Download, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 3D Model Viewer Component using Three.js directly
function Model3DViewer({ modelUrl, fileType, bundleManifest }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const manager = new THREE.LoadingManager();
    if (bundleManifest && typeof bundleManifest === 'object') {
      manager.setURLModifier((url) => {
        try {
          const u = new URL(url, window.location.href);
          const pathname = decodeURIComponent(u.pathname).replace(/^\//, '');
          const filename = pathname.split('/').pop();
          if (bundleManifest[pathname]) return bundleManifest[pathname];
          if (filename && bundleManifest[filename]) return bundleManifest[filename];
        } catch {}
        return (bundleManifest && bundleManifest[url]) || url;
      });
    }

    const ext = (fileType || (modelUrl.split('.').pop() || '')).toLowerCase();
    const useFBX = ext === 'fbx';
    const loader = useFBX ? new FBXLoader(manager) : new GLTFLoader(manager);
    loader.load(
      modelUrl,
      (asset) => {
        const obj = asset?.scene || asset;
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2 / maxDim;
        obj.scale.multiplyScalar(scale);
        obj.position.sub(center.multiplyScalar(scale));
        scene.add(obj);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error loading model:', err);
        setError('Failed to load model');
        setLoading(false);
      }
    );

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [modelUrl]);

  return (
    <div className="relative w-full h-64 bg-slate-900 rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <p className="text-red-400">{error}</p>
        </div>
      )}
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

    const validExtensions = ['.glb', '.gltf', '.fbx', '.zip'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Please upload a GLB, GLTF, FBX, or ZIP file');
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

  // Folder upload: upload all files and build a manifest so referenced textures/buffers resolve
  const handleFolderUpload = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;

    const entry = fileList.find(f => /\.gltf$/i.test(f.name)) ||
                  fileList.find(f => /\.glb$/i.test(f.name)) ||
                  fileList.find(f => /\.fbx$/i.test(f.name));
    if (!entry) {
      alert('Selected folder must contain a .gltf, .glb, or .fbx entry file');
      return;
    }

    setUploading(true);
    try {
      const uploads = await Promise.all(fileList.map(async (f) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        const original_path = (f.webkitRelativePath || f.name);
        return { original_path, file_url, file_size: f.size, mime_type: f.type, name: f.name };
      }));

      const bundle_manifest = uploads.reduce((acc, u) => {
        acc[u.original_path] = u.file_url;
        acc[u.name] = u.file_url;
        return acc;
      }, {});

      const entryUpload = uploads.find(u => u.name === entry.name) || uploads[0];
      const license = uploads.find(u => /license|licence|readme/i.test(u.name));
      const entryExt = (entry.name.split('.').pop() || '').toLowerCase();

      await createMutation.mutateAsync({
        name: newModel.name || entry.name,
        description: newModel.description,
        file_url: entryUpload.file_url,
        file_type: entryExt,
        category: newModel.category || 'uncategorized',
        tags: newModel.tags,
        file_size: entry.size,
        is_public: false,
        is_bundle: true,
        entry_file: entry.webkitRelativePath || entry.name,
        bundle_manifest,
        files: uploads.map(({ original_path, file_url, file_size, mime_type }) => ({ original_path, file_url, file_size, mime_type })),
        license_url: license?.file_url || null
      });

      setNewModel({ name: '', description: '', category: '', tags: [] });
    } catch (error) {
      console.error('Folder upload failed:', error);
      alert('Folder upload failed. Please try again.');
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
            Upload and manage 3D models (GLB, GLTF, FBX, ZIP) and full folders with textures
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
            accept=".glb,.gltf,.fbx,.zip"
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
                  Upload 3D Model (.glb, .gltf, .fbx, .zip)
                </>
              )}
            </span>
          </Button>
          </label>

          <div className="mt-3">
            <label className="relative cursor-pointer">
              <input
                type="file"
                onChange={handleFolderUpload}
                className="hidden"
                webkitdirectory=""
                multiple
                disabled={uploading}
              />
              <Button disabled={uploading} variant="outline" className="w-full md:w-auto">
                <Upload className="w-4 h-4 mr-2" /> Upload Model Folder (GLTF/FBX + textures)
              </Button>
            </label>
            <p className="text-xs text-slate-400 mt-2">Select a folder containing the model file and its textures. We'll upload everything and link resources automatically.</p>
          </div>
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

                {/* 3D Preview */}
                {(['glb','gltf','fbx'].includes(selectedModel.file_type)) && (
                  <div className="mb-6">
                    <Model3DViewer 
                      modelUrl={selectedModel.file_url} 
                      fileType={selectedModel.file_type}
                      bundleManifest={selectedModel.bundle_manifest}
                    />
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