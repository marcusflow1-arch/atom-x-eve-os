import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Eye, X, Loader2, Box, Image as ImageIcon, FolderUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress'; // Assuming you have this
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// --- 3D Preview Modal ---
function FBXPreviewModal({ model, isOpen, onClose }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const requestRef = useRef(null);
  const [aiAttaching, setAiAttaching] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const attachEnemyAI = async () => {
    setAiAttaching(true);
    setAiMessage("");
    try {
      const { data } = await base44.functions.invoke('attachEnemyAI');
      setAiMessage(data?.message || `Attached to ${data?.attached ?? 0} enemies`);
    } catch (e) {
      setAiMessage('Failed to attach Enemy AI');
    } finally {
      setAiAttaching(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current || !model?.file_url || !isOpen) return;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    
    // Grid & Axes
    scene.add(new THREE.GridHelper(10, 10, 0x334155, 0x1e293b));
    scene.add(new THREE.AxesHelper(1));

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(3, 3, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    
    // Mount
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 2. Loading Manager & Textures
    const manager = new THREE.LoadingManager();
    const textures = model.textures || [];
    
    if (textures.length > 0) {
      manager.setURLModifier((url) => {
        // Robust filename extraction (handles Windows/Unix paths)
        const requestedName = url.split(/[/\\]/).pop().toLowerCase();
        
        // Find best match in uploaded textures
        // We check if the uploaded URL contains the requested filename
        const match = textures.find(texUrl => {
            const texName = texUrl.split(/[/\\]/).pop().toLowerCase();
            return texName.includes(requestedName) || requestedName.includes(texName.split('.')[0]);
        });
        
        if (match) {
          console.debug(`Preview: Remapped ${requestedName} -> ${match}`);
          return match;
        }
        return url;
      });
    }

    // 3. Load FBX
    const loader = new FBXLoader(manager);
    loader.load(
      model.file_url,
      (fbx) => {
        // Auto-Center & Scale
        const box = new THREE.Box3().setFromObject(fbx);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Normalize scale to ~2 units (avoid oversized preview)
        const targetSize = 2;
        const scale = Math.min(targetSize / (maxDim || 1), 10);
        fbx.scale.multiplyScalar(scale);
        
        // Recenter geometry
        fbx.position.sub(center.multiplyScalar(scale));
        // Sit on grid
        fbx.position.y += (size.y * scale) / 2;

        // Apply Shadow & Material Fixes
        fbx.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Fix dark materials
            if (child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    mat.side = THREE.DoubleSide;
                    if(mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
                });
            }
          }
        });

        if (!fbx || !fbx.isObject3D) {
          console.error('Loaded FBX is not a Three.js Object3D');
          return;
        }
        scene.add(fbx);
        
        // Animation Loop
        const clock = new THREE.Clock();
        let mixer = null;
        if (fbx.animations.length > 0) {
           mixer = new THREE.AnimationMixer(fbx);
           mixer.clipAction(fbx.animations[0]).play();
        }

        const animate = () => {
          requestRef.current = requestAnimationFrame(animate);
          const delta = clock.getDelta();
          if (mixer) mixer.update(delta);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();
      },
      undefined,
      (err) => console.error('Error loading FBX:', err)
    );

    // Resize Observer
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current) {
          rendererRef.current.dispose();
          rendererRef.current.forceContextLoss();
      }
      // Dispose Scene
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
            else object.material.dispose();
        }
      });
    };
  }, [model, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-5xl w-[90vw] h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl" aria-describedby="fbx-preview-desc">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
           <div className="flex items-center gap-3">
             <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
               <Box className="w-5 h-5 text-cyan-400"/> {model?.name || 'FBX Preview'}
             </DialogTitle>
             <DialogDescription id="fbx-preview-desc" className="sr-only">3D preview for FBX model</DialogDescription>
           </div>
           <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={attachEnemyAI} disabled={aiAttaching} className="gap-2">
               {aiAttaching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
               Attach Enemy AI
             </Button>
             <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
           </div>
        </div>
        
        <div className="flex-1 relative bg-slate-950">
           <div ref={containerRef} className="absolute inset-0" />
           <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none">
             <div className="bg-black/60 backdrop-blur px-3 py-1.5 rounded text-xs text-slate-300">
               L-Click: Rotate • R-Click: Pan • Scroll: Zoom
             </div>
             {model?.textures?.length > 0 && (
                 <Badge variant="outline" className="bg-black/60 border-slate-700 text-slate-300">
                     {model.textures.length} Textures Loaded
                 </Badge>
             )}
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Component ---
export default function ModelFBXManager() {
  const queryClient = useQueryClient();
  
  // State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100
  const [uploadStatus, setUploadStatus] = useState('');
  
  const [previewModel, setPreviewModel] = useState(null);
  const [newModel, setNewModel] = useState({
    name: '', description: '', category: '', is_rigged: false, tags: '', textures: []
  });
  const [selectedTextures, setSelectedTextures] = useState([]);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Data
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['modelFBX'],
    queryFn: () => base44.entities.ModelFBX.list('-created_date'),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ModelFBX.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelFBX'] });
      setNewModel({ name: '', description: '', category: '', is_rigged: false, tags: '', textures: [] });
      setSelectedTextures([]);
      setUploadStatus('');
      setUploadProgress(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ModelFBX.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modelFBX'] }),
  });

  const updateMutation = useMutation({
      mutationFn: ({ id, data }) => base44.entities.ModelFBX.update(id, data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modelFBX'] })
  });

  // Logic: File Upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Identify Main FBX
    const fbxFile = files.find(f => f.name.toLowerCase().endsWith('.fbx'));
    if (!fbxFile) {
      alert('No .fbx file found in selection.');
      return;
    }

    // Identify Textures (Images)
    const textureFiles = files.filter(f => 
      f !== fbxFile && (f.type.startsWith('image/') || /\.(png|jpg|jpeg|tga|bmp|tiff)$/i.test(f.name))
    );
    const allTexturesToUpload = [...textureFiles, ...selectedTextures];

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload FBX
      setUploadStatus(`Uploading ${fbxFile.name}...`);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: fbxFile });
      setUploadProgress(20);

      // 2. Upload Textures
      const textureUrls = [];
      if (allTexturesToUpload.length > 0) {
        setUploadStatus(`Uploading ${allTexturesToUpload.length} textures...`);
        const totalTex = allTexturesToUpload.length;
        
        for (let i = 0; i < totalTex; i++) {
           const file = allTexturesToUpload[i];
           try {
             const { file_url: texUrl } = await base44.integrations.Core.UploadFile({ file });
             if (texUrl) textureUrls.push(texUrl);
           } catch (err) {
             console.warn(`Failed to upload ${file.name}`, err);
           }
           // Update progress from 20% to 90% based on texture count
           setUploadProgress(20 + Math.floor(((i + 1) / totalTex) * 70));
        }
      } else {
          setUploadProgress(90);
      }

      // 3. Create Entity
      setUploadStatus('Finalizing model entry...');
      await createMutation.mutateAsync({
        name: newModel.name || fbxFile.name.replace(/\.fbx$/i, ''),
        description: newModel.description,
        file_url: file_url,
        category: newModel.category,
        is_rigged: newModel.is_rigged,
        tags: newModel.tags ? newModel.tags.split(',').map(t => t.trim()) : [],
        textures: textureUrls
      });
      
      setUploadProgress(100);

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleThumbnailUpload = async (modelId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await updateMutation.mutateAsync({ id: modelId, data: { thumbnail_url: file_url } });
    } catch(e) { alert('Thumbnail failed'); }
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Box className="w-6 h-6 text-cyan-500" />
            FBX Model Manager
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload characters and props. Supports texture auto-mapping.
          </p>
        </div>
        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
          {models.length} Models
        </Badge>
      </div>

      {/* Upload Area */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-8 shadow-sm">
        <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400"/> Upload New Asset
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input 
             placeholder="Model Name (Optional - defaults to filename)" 
             value={newModel.name}
             onChange={e => setNewModel({...newModel, name: e.target.value})}
             className="bg-slate-800 border-slate-700"
          />
           <div className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-md px-3">
             <span className="text-sm text-slate-400">Is Rigged Character?</span>
             <Switch checked={newModel.is_rigged} onCheckedChange={c => setNewModel({...newModel, is_rigged: c})} />
           </div>
        </div>

        <Textarea 
            placeholder="Description..." 
            value={newModel.description}
            onChange={e => setNewModel({...newModel, description: e.target.value})}
            className="bg-slate-800 border-slate-700 mb-4 h-20"
        />

        {/* Texture Staging */}
        <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Textures Staging</span>
                <Badge variant="outline">{selectedTextures.length} ready</Badge>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
                {selectedTextures.length === 0 && <span className="text-xs text-slate-600 italic">No extra textures selected</span>}
                {selectedTextures.map((f, i) => (
                    <Badge key={i} variant="secondary" className="bg-slate-700 text-slate-300 pl-2 pr-1 py-1 flex gap-1">
                        <span className="truncate max-w-[100px]">{f.name}</span>
                        <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedTextures(prev => prev.filter((_, idx) => idx !== i))} />
                    </Badge>
                ))}
            </div>
            
            <label className="inline-flex">
                <input type="file" multiple accept="image/*" onChange={e => setSelectedTextures(prev => [...prev, ...Array.from(e.target.files)])} className="hidden" />
                <div className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded cursor-pointer transition-colors flex items-center gap-2">
                    <ImageIcon className="w-3 h-3"/> Add Separate Textures
                </div>
            </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
            <input ref={fileInputRef} type="file" accept=".fbx" onChange={handleFileUpload} className="hidden" disabled={uploading}/>
            <Button disabled={uploading} className="w-full bg-cyan-600 hover:bg-cyan-700" onClick={() => fileInputRef.current?.click()}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Upload className="w-4 h-4 mr-2"/>}
                Upload Single FBX
            </Button>
            
            <input ref={folderInputRef} type="file" webkitdirectory="" directory="" onChange={handleFileUpload} className="hidden" disabled={uploading}/>
            <Button disabled={uploading} variant="outline" className="w-full border-cyan-800 text-cyan-400 hover:bg-cyan-950/50" onClick={() => folderInputRef.current?.click()}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <FolderUp className="w-4 h-4 mr-2"/>}
                Upload Folder (FBX + Textures)
            </Button>
        </div>

        {/* Progress Bar */}
        {uploading && (
            <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                    <span>{uploadStatus}</span>
                    <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2 bg-slate-800" indicatorClassName="bg-cyan-500"/>
            </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-500"/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
                {models.map(model => (
                    <motion.div 
                        key={model.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-600 transition-colors"
                    >
                        {/* Thumbnail Area */}
                        <div className="aspect-square bg-slate-950 relative group">
                            {model.thumbnail_url ? (
                                <img src={model.thumbnail_url} alt={model.name} className="w-full h-full object-cover"/>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-800">
                                    <Box className="w-16 h-16"/>
                                </div>
                            )}
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button size="icon" variant="secondary" onClick={() => setPreviewModel(model)} title="Preview 3D">
                                    <Eye className="w-4 h-4"/>
                                </Button>
                                <label className="cursor-pointer">
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleThumbnailUpload(model.id, e)}/>
                                    <div className="h-9 w-9 rounded-md bg-white text-black flex items-center justify-center hover:bg-slate-200">
                                        <ImageIcon className="w-4 h-4"/>
                                    </div>
                                </label>
                            </div>

                            {model.is_rigged && <Badge className="absolute top-2 left-2 bg-green-600">Rigged</Badge>}
                        </div>

                        {/* Details */}
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-white truncate pr-2" title={model.name}>{model.name}</h4>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-500 hover:text-red-400" onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(model.id) }}>
                                    <Trash2 className="w-3 h-3"/>
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {model.textures?.length > 0 && <Badge variant="outline" className="text-[10px] h-5 border-slate-700 text-slate-400">{model.textures.length} Tex</Badge>}
                                {model.category && <Badge variant="outline" className="text-[10px] h-5 border-slate-700 text-slate-400">{model.category}</Badge>}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
      )}

      <FBXPreviewModal 
        model={previewModel} 
        isOpen={!!previewModel} 
        onClose={() => setPreviewModel(null)} 
      />
    </section>
  );
}