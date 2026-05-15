import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Eye, Loader2, Box, Plus, Search, Download, Edit2, FolderUp, ScanLine } from 'lucide-react';
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

// Default folder name where auto-extracted companion animations get filed.
const COMPANION_ANIM_FOLDER = 'companion';

// Guess an animation_type enum value from a clip's name.
// Enum: idle, walk, run, jump, attack, swing, dance, emote, other.
function guessAnimationType(clipName) {
  const n = (clipName || '').toLowerCase();
  if (/idle|stand/.test(n)) return 'idle';
  if (/walk/.test(n)) return 'walk';
  if (/run|sprint/.test(n)) return 'run';
  if (/jump|leap/.test(n)) return 'jump';
  if (/attack|punch|bite|claw|strike/.test(n)) return 'attack';
  if (/swing/.test(n)) return 'swing';
  if (/dance/.test(n)) return 'dance';
  if (/emote|wave|cheer/.test(n)) return 'emote';
  return 'other';
}

// --- 3D Viewer Sub-Component ---
// Handles loading GLB, GLTF, and FBX files with texture path re-mapping
function Model3DViewer({ modelUrl, fileType, bundleManifest }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Match Slate-900

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, 5, -5);
    scene.add(backLight);

    // 3. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 4. Loading Manager (Crucial for Folder Uploads)
    const manager = new THREE.LoadingManager();
    
    // If we have a manifest (folder upload), map relative paths to signed URLs
    if (bundleManifest && typeof bundleManifest === 'object') {
      manager.setURLModifier((url) => {
        try {
            // Attempt to extract the filename or relative path requested by the model file
            // Three.js often resolves these to absolute blob: or http: paths, so we parse them.
            const u = new URL(url, window.location.href);
            const pathname = decodeURIComponent(u.pathname).replace(/^\//, ''); // Clean path
            const filename = pathname.split('/').pop();

            // Check manifest for exact path or just filename
            if (bundleManifest[pathname]) return bundleManifest[pathname];
            if (filename && bundleManifest[filename]) return bundleManifest[filename];
        } catch (e) { /* ignore parse errors */ }
        
        // Fallback checks
        return bundleManifest[url] || url;
      });
    }

    // 5. Load Model
    const ext = (fileType || (modelUrl.split('.').pop() || '')).toLowerCase();
    const useFBX = ext === 'fbx';
    const loader = useFBX ? new FBXLoader(manager) : new GLTFLoader(manager);

    loader.load(
      modelUrl,
      (asset) => {
        const obj = asset?.scene || asset;
        if (!obj || !obj.isObject3D) {
          setError('Unsupported model format');
          setLoading(false);
          return;
        }
        
        // Auto-Scale and Center
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.5 / maxDim; // Fit within a ~2.5 unit view
        
        obj.scale.multiplyScalar(scale);
        obj.position.sub(center.multiplyScalar(scale)); // Center at 0,0,0
        
        scene.add(obj);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error loading model:', err);
        setError('Failed to load model. Texture paths may be missing.');
        setLoading(false);
      }
    );

    // 6. Animation Loop
    let reqId;
    function animate() {
      reqId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
      if (containerRef.current) {
          containerRef.current.innerHTML = '';
      }
    };
  }, [modelUrl, fileType, bundleManifest]);

  return (
    <div className="relative w-full h-80 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="text-xs text-slate-400">Loading Geometry...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10">
          <p className="text-red-400 text-sm px-4 text-center">{error}</p>
        </div>
      )}
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded text-[10px] text-slate-500 pointer-events-none">
          Left Click: Rotate • Right Click: Pan • Scroll: Zoom
      </div>
    </div>
  );
}

// --- Main Manager Component ---
export default function Model3DManager() {
  const queryClient = useQueryClient();
  const folderInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [newModel, setNewModel] = useState({
    name: '',
    description: '',
    category: '',
    tags: []
  });

  // Data Fetching
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models3d'],
    queryFn: () => base44.entities.Model3D.list('-created_date'),
  });

  // Mutations
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

  const singleInputRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState('');

  // Extract animation clips embedded in a model file and save each one as an
  // AnimationFBX entry under the "companion" folder. The clip's source URL is
  // the model file itself — runtime loaders (GameWorld3D companion setup) pick
  // the clip by name from the embedded list.
  const extractAndSaveAnimations = async ({ modelUrl, fileType, bundleManifest, modelName }) => {
    try {
      // Ensure the "companion" folder exists (idempotent — find or create)
      const folders = await base44.entities.AnimationFolder.filter({ name: COMPANION_ANIM_FOLDER });
      if (!folders.length) {
        await base44.entities.AnimationFolder.create({
          name: COMPANION_ANIM_FOLDER,
          color: 'purple',
          description: 'Auto-extracted animations from companion / mount 3D models.',
        });
      }

      // Load the model client-side just to read its animation clips
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
          return bundleManifest[url] || url;
        });
      }

      const ext = (fileType || '').toLowerCase();
      const useFBX = ext === 'fbx';
      const loader = useFBX ? new FBXLoader(manager) : new GLTFLoader(manager);

      const asset = await new Promise((resolve, reject) => {
        loader.load(modelUrl, resolve, undefined, reject);
      });

      const clips = useFBX
        ? (asset.animations || [])
        : (asset.animations || asset?.scene?.animations || []);

      if (!clips.length) return { count: 0 };

      // Build AnimationFBX records — one per clip
      const records = clips.map((clip, idx) => {
        const clipName = (clip.name && clip.name.trim()) || `${modelName} Anim ${idx + 1}`;
        return {
          name: clipName,
          description: `Auto-extracted from ${modelName}`,
          file_url: modelUrl,
          animation_type: guessAnimationType(clipName),
          duration: clip.duration || undefined,
          is_loopable: true,
          folder: COMPANION_ANIM_FOLDER,
          tags: ['auto-extracted', 'companion'],
        };
      });

      await base44.entities.AnimationFBX.bulkCreate(records);
      return { count: records.length };
    } catch (err) {
      console.error('Animation extraction failed:', err);
      return { count: 0, error: err?.message || 'unknown error' };
    }
  };

  // Scan existing Model3D entries whose name contains "companion" (e.g.
  // "companion", "Companion 1", "Companion 0"). For each matching model that
  // has embedded animation clips, extract them into the "companion" folder
  // of the AnimationFBX library. Idempotent-safe: re-running on a model that
  // already had its anims extracted will create duplicates only if you
  // haven't cleaned them up, so it's left as a manual action.
  const [scanning, setScanning] = useState(false);
  const [scanReport, setScanReport] = useState(null);
  const handleScanCompanionModels = async () => {
    setScanError(null);
    setScanReport(null);
    setScanning(true);
    try {
      const allModels = await base44.entities.Model3D.list('-created_date');
      const targets = allModels.filter((m) =>
        (m.name || '').toLowerCase().includes('companion')
      );

      if (!targets.length) {
        setScanReport({ scanned: 0, extracted: 0, models: [] });
        return;
      }

      const report = { scanned: targets.length, extracted: 0, models: [] };
      for (let i = 0; i < targets.length; i++) {
        const m = targets[i];
        setUploadProgress(`Scanning ${i + 1}/${targets.length}: ${m.name}`);
        const result = await extractAndSaveAnimations({
          modelUrl: m.file_url,
          fileType: m.file_type,
          bundleManifest: m.bundle_manifest || null,
          modelName: m.name,
        });
        report.extracted += result.count || 0;
        report.models.push({ name: m.name, count: result.count || 0, error: result.error });
      }
      setScanReport(report);
    } catch (err) {
      console.error('Companion scan failed:', err);
      setScanError(`Scan failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setScanning(false);
      setUploadProgress('');
    }
  };
  const [scanError, setScanError] = useState(null);

  // 1. Single File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected
    if (singleInputRef.current) singleInputRef.current.value = '';

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.slice(fileName.lastIndexOf('.'));
    const validExtensions = ['.glb', '.gltf', '.fbx', '.zip'];
    
    if (!validExtensions.includes(fileExtension)) {
      setUploadError(`Invalid file type "${fileExtension}". Please upload a .glb, .gltf, .fbx, or .zip file.`);
      return;
    }

    setUploadError(null);
    setUploading(true);
    setUploadProgress('Uploading file...');
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (!file_url) {
        throw new Error('Upload returned no URL. The file may be too large or unsupported.');
      }

      setUploadProgress('Saving to library...');

      let finalFileType = fileExtension.replace('.', '');
      const modelDisplayName = newModel.name || file.name.replace(/\.[^/.]+$/, '');

      await createMutation.mutateAsync({
        name: modelDisplayName,
        description: newModel.description,
        file_url: file_url,
        file_type: finalFileType,
        category: newModel.category || 'uncategorized',
        tags: newModel.tags,
        file_size: file.size,
        is_public: false
      });

      // Auto-extract embedded animations (glb/fbx scenes often ship with clips)
      if (['glb', 'gltf', 'fbx'].includes(finalFileType)) {
        setUploadProgress('Scanning for embedded animations...');
        await extractAndSaveAnimations({
          modelUrl: file_url,
          fileType: finalFileType,
          bundleManifest: null,
          modelName: modelDisplayName,
        });
      }

      setUploadProgress('');
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(`Upload failed: ${error?.message || 'Unknown error'}. Please try again.`);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  // 2. Folder Upload (For complex models with external textures)
  // Uploads EVERY file in the selected folder (model + textures + .bin + materials),
  // then builds a manifest with multiple key variations so the GLTFLoader/FBXLoader
  // can resolve texture paths no matter how the model references them.
  const handleFolderUpload = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;

    // Reset input so the same folder can be re-selected
    if (folderInputRef.current) folderInputRef.current.value = '';

    // Find the main model file
    const entry = fileList.find(f => /\.gltf$/i.test(f.name)) ||
                  fileList.find(f => /\.glb$/i.test(f.name)) ||
                  fileList.find(f => /\.fbx$/i.test(f.name));

    if (!entry) {
      setUploadError('Selected folder must contain a .gltf, .glb, or .fbx entry file.');
      return;
    }

    // Recognized texture / dependency extensions we'll explicitly include.
    // (We upload ALL files anyway — this is just for clearer progress logging.)
    const TEXTURE_RE = /\.(png|jpg|jpeg|webp|ktx2|basis|hdr|exr|tga|bin|mtl)$/i;
    const textureCount = fileList.filter(f => TEXTURE_RE.test(f.name)).length;

    setUploadError(null);
    setUploading(true);
    setUploadProgress(`Uploading 0/${fileList.length} files (${textureCount} textures)...`);

    try {
      const uploads = [];
      const failed = [];
      // Upload files sequentially to avoid browser hanging on large folders.
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        setUploadProgress(`Uploading ${i + 1}/${fileList.length}: ${f.name}`);
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
          if (!file_url) throw new Error('No URL returned');
          // webkitRelativePath gives us "folder/textures/diffuse.png"
          const original_path = (f.webkitRelativePath || f.name);
          uploads.push({
            original_path,
            file_url,
            name: f.name,
            file_size: f.size,
            mime_type: f.type || '',
          });
        } catch (err) {
          console.error(`Failed to upload ${f.name}:`, err);
          failed.push(f.name);
        }
      }

      if (!uploads.length) {
        throw new Error('All file uploads failed.');
      }

      const entryUpload = uploads.find(u => u.name === entry.name);
      if (!entryUpload) {
        throw new Error(`Entry file ${entry.name} failed to upload.`);
      }

      // Build a robust manifest. GLTF files reference textures by relative URI
      // (e.g. "textures/diffuse.png" or "diffuse.png"). The loader resolves these
      // against the model's base URL, so we map MANY key variations:
      //   • Full webkitRelativePath ("MyModel/textures/diffuse.png")
      //   • Path WITHOUT the top folder ("textures/diffuse.png")
      //   • Just the filename ("diffuse.png")
      //   • URL-encoded variants (spaces → %20)
      const bundle_manifest = {};
      const addKey = (key, url) => {
        if (!key) return;
        bundle_manifest[key] = url;
        // Also store the URL-encoded variant since browsers may request it that way
        try {
          const encoded = encodeURI(key);
          if (encoded !== key) bundle_manifest[encoded] = url;
        } catch {}
      };
      uploads.forEach((u) => {
        addKey(u.original_path, u.file_url);
        addKey(u.name, u.file_url);
        // Strip the top-level folder prefix (e.g. "MyModel/textures/x.png" → "textures/x.png")
        const slashIdx = u.original_path.indexOf('/');
        if (slashIdx !== -1) {
          addKey(u.original_path.slice(slashIdx + 1), u.file_url);
        }
      });

      setUploadProgress('Saving to library...');

      const entryExt = (entry.name.split('.').pop() || '').toLowerCase();
      const modelDisplayName = newModel.name || entry.name.replace(/\.[^/.]+$/, '');

      await createMutation.mutateAsync({
        name: modelDisplayName,
        description: newModel.description,
        file_url: entryUpload.file_url,
        file_type: entryExt,
        category: newModel.category || 'uncategorized',
        tags: newModel.tags,
        file_size: entry.size,
        is_bundle: true,
        bundle_manifest,
        entry_file: entry.webkitRelativePath || entry.name,
        // Populate `files` array too (used by some loaders that iterate dependencies)
        files: uploads.map((u) => ({
          original_path: u.original_path,
          file_url: u.file_url,
          file_size: u.file_size,
          mime_type: u.mime_type,
        })),
      });

      // Extract embedded animations into the AnimationFBX library (companion folder)
      setUploadProgress('Scanning for embedded animations...');
      const animResult = await extractAndSaveAnimations({
        modelUrl: entryUpload.file_url,
        fileType: entryExt,
        bundleManifest: bundle_manifest,
        modelName: modelDisplayName,
      });
      if (animResult.count > 0) {
        console.log(`Extracted ${animResult.count} animation(s) into "${COMPANION_ANIM_FOLDER}" folder.`);
      }

      if (failed.length) {
        setUploadError(`Uploaded ${uploads.length}/${fileList.length} files. Failed: ${failed.join(', ')}`);
      }
      setUploadProgress('');
    } catch (error) {
      console.error('Folder upload failed:', error);
      setUploadError(`Folder upload failed: ${error?.message || 'Unknown error'}. Please try again.`);
      setUploadProgress('');
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
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Box className="w-6 h-6 text-purple-500" />
            3D Model Library
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage GLB, GLTF, FBX assets. Supports single files or folder bundles.
          </p>
        </div>
        <Badge variant="outline" className="text-slate-400 border-slate-700">
          {models.length} Models
        </Badge>
      </div>

      {/* Upload Area */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="font-semibold mb-4 text-white">Upload New Model</h3>
        
        {/* Metadata Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            placeholder="Model Name (Optional)"
            value={newModel.name}
            onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
            className="bg-slate-900 border-slate-700"
          />
          <Input
            placeholder="Category"
            value={newModel.category}
            onChange={(e) => setNewModel({ ...newModel, category: e.target.value })}
            className="bg-slate-900 border-slate-700"
          />
        </div>
        <Textarea
          placeholder="Description..."
          value={newModel.description}
          onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
          className="bg-slate-900 border-slate-700 mb-4 h-20"
        />

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
            {/* Single File Button */}
            <input
                type="file"
                accept=".glb,.gltf,.fbx,.zip,model/gltf-binary,model/gltf+json"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
                ref={singleInputRef}
            />
            <Button 
                disabled={uploading}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12"
                onClick={() => singleInputRef.current?.click()}
            >
                {uploading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {uploadProgress || 'Uploading...'}
                </>
                ) : (
                <>
                    <Upload className="w-4 h-4 mr-2" /> Upload Single File (.glb/.fbx)
                </>
                )}
            </Button>

            {/* Folder Upload Button */}
            <div className="flex-1">
                <input
                    type="file"
                    ref={folderInputRef}
                    onChange={handleFolderUpload}
                    className="hidden"
                    webkitdirectory=""
                    directory=""
                    multiple
                    disabled={uploading}
                />
                <Button 
                    type="button"
                    disabled={uploading} 
                    variant="outline" 
                    className="w-full h-12 border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                    onClick={() => folderInputRef.current?.click()}
                >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {uploadProgress || 'Uploading...'}
                      </>
                    ) : (
                      <>
                        <FolderUp className="w-4 h-4 mr-2" /> Upload Folder (Model + Textures)
                      </>
                    )}
                </Button>
            </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
            Use "Upload Folder" if your model has separate texture files (.png, .jpg, .bin, etc.). Every file in the selected folder is uploaded and linked automatically.
        </p>

        {/* Upload Error Display */}
        {uploadError && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
            <span className="text-red-400 mt-0.5">⚠️</span>
            <div>
              <p>{uploadError}</p>
              <button onClick={() => setUploadError(null)} className="text-xs text-red-400/60 hover:text-red-300 mt-1 underline">Dismiss</button>
            </div>
          </div>
        )}
      </div>

      {/* Companion Scan Tool */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">Scan Companion Models</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Finds existing models whose name contains "companion" and saves any embedded animations into the AnimationFBX <span className="text-purple-300 font-mono">companion</span> folder.
          </p>
        </div>
        <Button
          type="button"
          disabled={scanning}
          variant="outline"
          className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 h-10"
          onClick={handleScanCompanionModels}
        >
          {scanning ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {uploadProgress || 'Scanning...'}</>
          ) : (
            <><ScanLine className="w-4 h-4 mr-2" /> Scan Companion Models</>
          )}
        </Button>
      </div>
      {scanError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{scanError}</div>
      )}
      {scanReport && (
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-sm">
          <p className="text-white font-semibold mb-1">
            Scanned {scanReport.scanned} model{scanReport.scanned === 1 ? '' : 's'} · Extracted {scanReport.extracted} animation{scanReport.extracted === 1 ? '' : 's'}
          </p>
          {scanReport.models.length === 0 ? (
            <p className="text-slate-400 text-xs">No models with "companion" in the name were found.</p>
          ) : (
            <ul className="text-xs text-slate-300 space-y-0.5 mt-1">
              {scanReport.models.map((r, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="truncate">{r.name}</span>
                  <span className={r.count > 0 ? 'text-green-400 font-mono' : 'text-slate-500 font-mono'}>
                    {r.error ? `error: ${r.error}` : `${r.count} anim${r.count === 1 ? '' : 's'}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => setScanReport(null)} className="text-xs text-slate-400 hover:text-slate-200 mt-2 underline">Dismiss</button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search models by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-900 border-slate-700 pl-10"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No models found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredModels.map((model) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden group hover:border-purple-500/50 transition-all cursor-pointer shadow-lg hover:shadow-purple-900/10"
                onClick={() => setSelectedModel(model)}
              >
                {/* Preview Thumbnail Area */}
                <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-950 relative flex items-center justify-center overflow-hidden">
                  <Box className="w-12 h-12 text-slate-700 group-hover:text-purple-500/50 transition-colors" />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white drop-shadow-md" />
                  </div>
                  
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-purple-600/80 backdrop-blur uppercase text-[10px] border-none">
                      {model.file_type}
                    </Badge>
                  </div>
                  {model.is_bundle && (
                     <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 text-[10px] border-blue-500/30">
                           Bundle
                        </Badge>
                     </div>
                  )}
                </div>

                <div className="p-4">
                  <h4 className="font-semibold text-white truncate mb-1">{model.name}</h4>
                  <p className="text-slate-400 text-xs mb-3 line-clamp-2 h-8">
                    {model.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-700/50">
                    <span className="text-slate-500">{model.category || 'General'}</span>
                    <span className="font-mono text-slate-400">{formatFileSize(model.file_size)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedModel(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-50 shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedModel.name}</h2>
                    <p className="text-slate-400 text-sm">{selectedModel.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => window.open(selectedModel.file_url, '_blank')}
                    >
                        <Download className="w-4 h-4 mr-2"/> Download
                    </Button>
                    <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => {
                            if(confirm('Delete this model?')) deleteMutation.mutate(selectedModel.id);
                        }}
                    >
                        <Trash2 className="w-4 h-4"/>
                    </Button>
                  </div>
                </div>

                {/* 3D Viewer */}
                <div className="mb-6">
                    <Model3DViewer 
                        modelUrl={selectedModel.file_url}
                        fileType={selectedModel.file_type}
                        bundleManifest={selectedModel.bundle_manifest}
                    />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">Type</label>
                        <p className="text-white font-mono">{selectedModel.file_type}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">Size</label>
                        <p className="text-white font-mono">{formatFileSize(selectedModel.file_size)}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">Structure</label>
                        <p className="text-white">{selectedModel.is_bundle ? 'Bundle (Folder)' : 'Single File'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">Created</label>
                        <p className="text-white">{new Date(selectedModel.created_date || Date.now()).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Asset URL</label>
                    <code className="text-xs text-green-400 break-all">{selectedModel.file_url}</code>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}