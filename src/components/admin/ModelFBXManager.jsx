import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Eye, X, Loader2, Box, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 3D Preview Modal
function FBXPreviewModal({ model, isOpen, onClose }) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!containerRef.current || !model?.file_url || !isOpen) return;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // Darker slate
    
    // Grid
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(grid);

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(2, 2, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Cleanup existing canvas if any
    if (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Loading Manager with Texture Remapping
    const manager = new THREE.LoadingManager();
    const textures = model.textures || [];
    
    if (textures.length > 0) {
      manager.setURLModifier((url) => {
        // Extract filename
        const requestedName = url.split('/').pop().toLowerCase();
        // Find matching uploaded texture by name
        const match = textures.find(texUrl => texUrl.toLowerCase().includes(requestedName));
        if (match) {
          console.log(`Preview: Remapping texture ${requestedName} -> ${match}`);
          return match;
        }
        return url;
      });
    }

    const loader = new FBXLoader(manager);
    loader.load(
      model.file_url,
      (fbx) => {
        // Auto-Center and Scale
        const box = new THREE.Box3().setFromObject(fbx);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Scale to fit in ~3 units
        const scale = 3 / (maxDim || 1);
        fbx.scale.multiplyScalar(scale);
        
        // Re-center
        const newBox = new THREE.Box3().setFromObject(fbx);
        const newCenter = newBox.getCenter(new THREE.Vector3());
        fbx.position.sub(newCenter);
        
        // Lift to sit on grid
        fbx.position.y += (newBox.max.y - newBox.min.y) / 2;

        // Texture Fallback Strategy
        if (textures.length > 0) {
           const texLoader = new THREE.TextureLoader();
           // Pre-load first texture as a generic fallback
           const fallbackTex = texLoader.load(textures[0]);
           fallbackTex.colorSpace = THREE.SRGBColorSpace;
           
           fbx.traverse((child) => {
             if (child.isMesh && child.material) {
               const applyTex = (mat) => {
                 mat.side = THREE.DoubleSide;
                 // If no map found, apply the first available texture as fallback
                 if (!mat.map) {
                   mat.map = fallbackTex;
                   mat.needsUpdate = true;
                 } else {
                   mat.map.colorSpace = THREE.SRGBColorSpace;
                 }
               };
               if (Array.isArray(child.material)) child.material.forEach(applyTex);
               else applyTex(child.material);
             }
           });
        }

        scene.add(fbx);
        
        // Animation Support
        if (fbx.animations && fbx.animations.length > 0) {
           const mixer = new THREE.AnimationMixer(fbx);
           const action = mixer.clipAction(fbx.animations[0]);
           action.play();
           
           const clock = new THREE.Clock();
           renderer.setAnimationLoop(() => {
             const delta = clock.getDelta();
             mixer.update(delta);
             controls.update();
             renderer.render(scene, camera);
           });
        } else {
           renderer.setAnimationLoop(() => {
             controls.update();
             renderer.render(scene, camera);
           });
        }
      },
      (xhr) => {
         console.log(`Loading FBX: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
      },
      (err) => console.error('Error loading FBX:', err)
    );

    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      renderer.forceContextLoss();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [model, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl w-[90vw] h-[80vh] flex flex-col p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
           <div className="flex items-center gap-3">
             <h3 className="text-lg font-bold text-white">{model?.name}</h3>
             <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
               {model?.file_url?.split('.').pop().toUpperCase()}
             </Badge>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        
        <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-950">
           <div ref={containerRef} className="absolute inset-0" />
           <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded text-xs text-white/50 pointer-events-none">
             Left Click: Rotate • Right Click: Pan • Scroll: Zoom
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ModelFBXManager() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(null);
  const [previewModel, setPreviewModel] = useState(null);
  const [newModel, setNewModel] = useState({
    name: '',
    description: '',
    category: '',
    is_rigged: false,
    tags: '',
    textures: []
  });
  const [selectedTextures, setSelectedTextures] = useState([]);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['modelFBX'],
    queryFn: () => base44.entities.ModelFBX.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ModelFBX.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelFBX'] });
      setNewModel({ name: '', description: '', category: '', is_rigged: false, tags: '', textures: [] });
      setSelectedTextures([]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ModelFBX.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modelFBX'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ModelFBX.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modelFBX'] }),
  });

  const handleFileUpload = async (e) => {
    // Handle both file input and folder input
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Find FBX file
    const fbxFile = files.find(f => f.name.toLowerCase().endsWith('.fbx'));
    
    if (!fbxFile) {
      alert('Please upload an FBX file (or a folder containing one)');
      return;
    }

    // Find texture files (images)
    const textureFiles = files.filter(f => 
      f !== fbxFile && 
      (f.type.startsWith('image/') || /\.(png|jpg|jpeg|tga|bmp|tiff)$/i.test(f.name))
    );
    
    // Also include manually selected textures if not using folder upload
    const allTextures = [...textureFiles, ...selectedTextures];

    setUploading(true);
    try {
      // 1. Upload FBX
      const { file_url } = await base44.integrations.Core.UploadFile({ file: fbxFile });
      
      // 2. Upload Textures
      const textureUrls = [];
      if (allTextures.length > 0) {
        console.log(`Uploading ${allTextures.length} textures...`);
        // Upload concurrently
        const uploadPromises = allTextures.map(file => base44.integrations.Core.UploadFile({ file }));
        const results = await Promise.all(uploadPromises);
        results.forEach(res => {
            if (res.file_url) textureUrls.push(res.file_url);
        });
      }

      // 3. Create Entity
      await createMutation.mutateAsync({
        name: newModel.name || fbxFile.name.replace(/\.fbx$/i, ''),
        description: newModel.description,
        file_url: file_url,
        category: newModel.category,
        is_rigged: newModel.is_rigged,
        tags: newModel.tags ? newModel.tags.split(',').map(t => t.trim()) : [],
        textures: textureUrls
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleTextureSelection = (e) => {
      const files = Array.from(e.target.files || []);
      setSelectedTextures(prev => [...prev, ...files]);
  };

  const removeSelectedTexture = (index) => {
      setSelectedTextures(prev => prev.filter((_, i) => i !== index));
  };

  const handleThumbnailUpload = async (modelId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(modelId);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateMutation.mutateAsync({
        id: modelId,
        data: { thumbnail_url: file_url }
      });
    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      alert('Thumbnail upload failed');
    } finally {
      setUploadingThumbnail(null);
    }
  };

  const deleteModel = (id) => {
    if (confirm('Are you sure you want to delete this model?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Box className="w-6 h-6 text-cyan-500" />
            FBX 3D Models
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload and manage FBX 3D model files with live preview
          </p>
        </div>
        <Badge variant="outline" className="text-slate-400">
          {models.length} Models
        </Badge>
      </div>

      {/* Upload Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
        <h3 className="font-semibold mb-4">Upload New FBX Model</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            placeholder="Model name"
            value={newModel.name}
            onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
            className="bg-slate-900 border-slate-700"
          />
          <Input
            placeholder="Category (e.g., character, weapon)"
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
        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder="Tags (comma separated)"
            value={newModel.tags}
            onChange={(e) => setNewModel({ ...newModel, tags: e.target.value })}
            className="bg-slate-900 border-slate-700 flex-1"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Rigged:</span>
            <Switch
              checked={newModel.is_rigged}
              onCheckedChange={(checked) => setNewModel({ ...newModel, is_rigged: checked })}
            />
          </div>
        </div>
        
        {/* Texture Selection Area */}
        <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700 border-dashed">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">Textures / Materials</span>
                <span className="text-xs text-slate-500">{selectedTextures.length} selected</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
                {selectedTextures.map((file, i) => (
                    <div key={i} className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <button onClick={() => removeSelectedTexture(i)} className="text-slate-400 hover:text-red-400"><X className="w-3 h-3"/></button>
                    </div>
                ))}
            </div>
            
            <div className="flex gap-2">
                <label className="cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleTextureSelection}
                        className="hidden"
                        disabled={uploading}
                    />
                    <div className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-md border border-slate-600 transition-colors flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" />
                        Select Textures
                    </div>
                </label>
            </div>
        </div>

        <div className="flex flex-wrap gap-3">
            {/* Standard FBX Upload */}
            <label className="relative cursor-pointer flex-1">
              <input
                type="file"
                accept=".fbx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button 
                disabled={uploading}
                className="bg-cyan-600 hover:bg-cyan-700 w-full"
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
                      Upload FBX File
                    </>
                  )}
                </span>
              </Button>
            </label>
            
            {/* Folder Upload */}
            <label className="relative cursor-pointer flex-1">
              <input
                type="file"
                webkitdirectory=""
                directory=""
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button 
                disabled={uploading}
                variant="outline"
                className="w-full border-cyan-700 text-cyan-400 hover:bg-cyan-950"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Folder (FBX + Textures)
                </span>
              </Button>
            </label>
        </div>
      </div>

      {/* Models List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading models...
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No FBX models uploaded yet</p>
          <p className="text-sm">Upload your first FBX model above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {models.map((model) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-gradient-to-br from-cyan-900/20 to-slate-900 relative flex items-center justify-center">
                  {model.thumbnail_url ? (
                    <img src={model.thumbnail_url} alt={model.name} className="w-full h-full object-cover" />
                  ) : (
                    <Box className="w-20 h-20 text-cyan-400 opacity-40" />
                  )}
                  
                  {/* Upload Thumbnail Button */}
                  {!model.thumbnail_url && (
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleThumbnailUpload(model.id, e)}
                        className="hidden"
                      />
                      <div className="bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2 text-white text-sm">
                        <ImageIcon className="w-4 h-4" />
                        Add Thumbnail
                      </div>
                    </label>
                  )}

                  {/* Preview Button */}
                  <button
                    onClick={() => setPreviewModel(model)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-all"
                  >
                    <Eye className="w-4 h-4 text-white" />
                  </button>
                  
                  {/* Texture Count Badge */}
                  {model.textures && model.textures.length > 0 && (
                      <div className="absolute bottom-2 right-2">
                         <Badge className="bg-purple-600/80 backdrop-blur-sm text-[10px] h-5 px-1.5">
                            {model.textures.length} Tex
                         </Badge>
                      </div>
                  )}

                  {/* Rigged Badge */}
                  {model.is_rigged && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-green-600 text-white">Rigged</Badge>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h4 className="font-semibold truncate mb-1">{model.name}</h4>
                  {model.description && (
                    <p className="text-slate-400 text-xs mb-2 line-clamp-2">{model.description}</p>
                  )}
                  {model.category && (
                    <Badge variant="outline" className="text-[10px] mb-2">{model.category}</Badge>
                  )}
                  
                  {/* Tags */}
                  {model.tags && model.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {model.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] bg-slate-900/50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <a 
                      href={model.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Download FBX
                    </a>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => deleteModel(model.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Preview Modal */}
      <FBXPreviewModal 
        model={previewModel} 
        isOpen={!!previewModel} 
        onClose={() => setPreviewModel(null)} 
      />
    </section>
  );
}