import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Trash2, Box, Move, RotateCw, Maximize, Search, Check, X, Layout, Radio, Copy, Globe, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/error/ErrorToast';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import InstanceDetailsPanel from './InstanceDetailsPanel';
import { ScriptRuntime } from './ScriptRuntime';

// Helper: Convert Three.js vector/euler to clean object
const toObj = (v) => ({ 
    x: Number(v.x.toFixed(3)), 
    y: Number(v.y.toFixed(3)), 
    z: Number(v.z.toFixed(3)) 
});

export default function SceneEditor() {
  const queryClient = useQueryClient();
  
  // --- Global State ---
  const [sceneName, setSceneName] = useState('New Scene');
  const [selectedLayoutId, setSelectedLayoutId] = useState(null);
  const [mode, setMode] = useState('translate'); // translate, rotate, scale
  const [selectedObjectId, setSelectedObjectId] = useState('environment'); 
  const [isDirty, setIsDirty] = useState(false);
  const [addModelOpen, setAddModelOpen] = useState(false);
  const [selectingMode, setSelectingMode] = useState('obj'); // 'obj', 'env', 'spawn'
  const [isPlaying, setIsPlaying] = useState(false); // PLAY MODE STATE

  // Preferences
  const [autoScaleHumanoids, setAutoScaleHumanoids] = useState(() => {
    try { return JSON.parse(localStorage.getItem('auto_scale_humanoids') || 'true'); } catch { return true; }
  });

  // --- Data Fetching ---
  const { data: models3d = [] } = useQuery({ queryKey: ['models3d'], queryFn: () => base44.entities.Model3D.list() });
  const { data: modelsFbx = [] } = useQuery({ queryKey: ['modelsfbx'], queryFn: () => base44.entities.ModelFBX.list() });
  const { data: layouts = [] } = useQuery({ queryKey: ['sceneLayouts'], queryFn: () => base44.entities.SceneLayout.list() });
  const { data: scripts = [] } = useQuery({ queryKey: ['model3DScripts'], queryFn: () => base44.entities.Model3DScript.list() });

  const allModels = [...models3d, ...modelsFbx];

  // --- Scene Configuration State ---
  const [sceneConfig, setSceneConfig] = useState({
    environment: {
      model_id: null,
      url: null,
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    },
    objects: []
  });

  // --- Three.js Refs ---
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const transformRef = useRef(null);
  const sceneObjectsMap = useRef({}); // Map ID -> THREE.Object3D
  const mixersRef = useRef({}); // Map ID -> AnimationMixer
  const clockRef = useRef(new THREE.Clock());
  const reqIdRef = useRef(null); // Animation frame ID
  const scriptRuntimeRef = useRef(null); // Script Runtime Instance

  // --- API Mutations ---
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (selectedLayoutId) return base44.entities.SceneLayout.update(selectedLayoutId, data);
      return base44.entities.SceneLayout.create(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sceneLayouts'] });
      showSuccess('Scene saved successfully!');
      setIsDirty(false);
      if (!selectedLayoutId) setSelectedLayoutId(data.id);
    },
    onError: (err) => showError(err, 'Save Scene')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SceneLayout.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sceneLayouts'] });
      resetEditor();
      showSuccess('Scene deleted');
    }
  });

  const activateMutation = useMutation({
    mutationFn: async (id) => {
      const activeScenes = layouts.filter(l => l.is_active && l.id !== id);
      await Promise.all(activeScenes.map(l => base44.entities.SceneLayout.update(l.id, { is_active: false })));
      return base44.entities.SceneLayout.update(id, { is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sceneLayouts'] });
      showSuccess('Scene activated live');
    }
  });

  // --- Logic: Load/Reset ---
  const resetEditor = () => {
    setSelectedLayoutId(null);
    setSceneName('New Scene');
    setSceneConfig({
      environment: { model_id: null, url: null, transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } },
      objects: []
    });
    setSelectedObjectId('environment');
    setIsDirty(false);
  };

  const loadLayout = (layout) => {
    setSelectedLayoutId(layout.id);
    setSceneName(layout.name);

    // Preserve Actor_Layer/Y Bot scripts so the player brain persists
    const cleanObjects = (layout.objects || []);

    setSceneConfig({
      environment: layout.environment_transform ? {
        model_id: layout.environment_model_id,
        url: layout.environment_url,
        transform: layout.environment_transform
      } : { model_id: null, url: null, transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } },
      objects: cleanObjects
    });
    setIsDirty(false); // Loading saved state is clean
  };

  // --- Three.js Initialization ---
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const scene = sceneRef.current;
    scene.background = new THREE.Color(0x111827);
    scene.fog = new THREE.Fog(0x111827, 10, 50);

    const gridHelper = new THREE.GridHelper(40, 40, 0x334155, 0x1e293b);
    scene.add(gridHelper);
    scene.add(new THREE.AxesHelper(2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 2. Camera & Renderer
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(5, 5, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Controls
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    controlsRef.current = orbit;

    const transform = new TransformControls(camera, renderer.domElement);
    transform.setSize(1.0);
    transform.addEventListener('dragging-changed', (event) => {
      orbit.enabled = !event.value;
    });

    // 4. Sync Transform back to React State (Only on MouseUp to prevent loops)
    transform.addEventListener('mouseUp', () => {
        if (!transform.object) return;
        
        const obj = transform.object;
        const id = Object.keys(sceneObjectsMap.current).find(key => sceneObjectsMap.current[key] === obj);

        if (id) {
            // We use a functional update to setSceneConfig to ensure we don't need it as a dependency
            setSceneConfig(prev => {
                const newTransform = {
                    position: toObj(obj.position),
                    rotation: toObj(obj.rotation),
                    scale: toObj(obj.scale)
                };

                // Update Environment
                if (id === 'environment') {
                    return { ...prev, environment: { ...prev.environment, transform: newTransform } };
                }
                
                // Update Object
                return {
                    ...prev,
                    objects: prev.objects.map(o => o.id === id ? { ...o, transform: newTransform } : o)
                };
            });
            setIsDirty(true);
        }
    });

    scene.add(transform);
    transformRef.current = transform;

    // 5. Script Runtime Init
    scriptRuntimeRef.current = new ScriptRuntime(sceneRef, sceneObjectsMap, mixersRef, controlsRef);

    // 6. Animation Loop
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      
      // Update Mixers
      Object.values(mixersRef.current).forEach(({ mixer }) => mixer.update(delta));

      // Update Scripts
      if (scriptRuntimeRef.current) scriptRuntimeRef.current.update(delta);
      
      orbit.update();
      renderer.render(scene, camera);
    };
    animate();

    // 6. Resize Handling
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqIdRef.current);
      renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []); // Run once on mount

  // --- Logic: Sync Scene Config to Three.js ---
  useEffect(() => {
    const scene = sceneRef.current;
    
    // Helper to clean "ghost" data from loaded models
    const sanitizeModel = (model) => {
        model.traverse(child => {
            if (child.userData) {
                // Remove ANY behavior logic that might cause auto-play
                delete child.userData.controller;
                delete child.userData.people;
                delete child.userData.defaultAvatar;
                delete child.userData.behaviorGraph;
                delete child.userData.aiController;
                delete child.userData.playerController;
            }
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Fix for FBX/GLB visibility issues
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                    child.material.needsUpdate = true;
                }
            }
        });
    };

    // 1. Sync Environment
    const envConfig = sceneConfig.environment;
    let envObj = sceneObjectsMap.current['environment'];

    if (envConfig.url) {
        if (!envObj || envObj.userData.url !== envConfig.url) {
            // Remove old
            if (envObj) {
                scene.remove(envObj);
                if (transformRef.current.object === envObj) transformRef.current.detach();
            }
            // Load new
            const ext = envConfig.url.split('.').pop().toLowerCase();
            const loader = ext === 'fbx' ? new FBXLoader() : new GLTFLoader();
            loader.load(envConfig.url, (asset) => {
                const model = asset.scene || asset;
                model.userData.url = envConfig.url;
                model.userData.isEnvironment = true;
                sanitizeModel(model); // Clean it

                // Apply Transform
                model.position.set(envConfig.transform.position.x, envConfig.transform.position.y, envConfig.transform.position.z);
                model.rotation.set(envConfig.transform.rotation.x, envConfig.transform.rotation.y, envConfig.transform.rotation.z);
                model.scale.set(envConfig.transform.scale.x, envConfig.transform.scale.y, envConfig.transform.scale.z);

                scene.add(model);
                sceneObjectsMap.current['environment'] = model;

                if (selectedObjectId === 'environment') transformRef.current.attach(model);
            });
        } else {
            // Just update transform if model is same
            envObj.position.set(envConfig.transform.position.x, envConfig.transform.position.y, envConfig.transform.position.z);
            envObj.rotation.set(envConfig.transform.rotation.x, envConfig.transform.rotation.y, envConfig.transform.rotation.z);
            envObj.scale.set(envConfig.transform.scale.x, envConfig.transform.scale.y, envConfig.transform.scale.z);
        }
    } else if (envObj) {
        scene.remove(envObj);
        delete sceneObjectsMap.current['environment'];
    }

    // 2. Sync Objects
    // A. Remove Deleted
    Object.keys(sceneObjectsMap.current).forEach(key => {
        if (key === 'environment') return;
        if (!sceneConfig.objects.find(o => o.id === key)) {
            const obj = sceneObjectsMap.current[key];
            scene.remove(obj);
            if (transformRef.current.object === obj) transformRef.current.detach();
            mixersRef.current[key]?.mixer?.stopAllAction();
            delete mixersRef.current[key];
            delete sceneObjectsMap.current[key];
        }
    });

    // B. Add/Update Existing
    sceneConfig.objects.forEach(objConf => {
        let obj3d = sceneObjectsMap.current[objConf.id];

        // Ensure Actor_Layer persistence: never re-create if already present, just update transform
        const mustPersist = objConf.persistent || objConf.layer === 'Actor_Layer';

        if (!obj3d) {
            // NEW OBJECT
            const onLoad = (model) => {
                model.userData.id = objConf.id;
                sanitizeModel(model); // Clean it

                model.position.set(objConf.transform.position.x, objConf.transform.position.y, objConf.transform.position.z);
                model.rotation.set(objConf.transform.rotation.x, objConf.transform.rotation.y, objConf.transform.rotation.z);
                model.scale.set(objConf.transform.scale.x, objConf.transform.scale.y, objConf.transform.scale.z);

                scene.add(model);
                sceneObjectsMap.current[objConf.id] = model;

                // Setup Animation Mixer if clips exist (but don't play yet)
                const clips = model.animations || (model.geometry ? [] : []);
                if (clips.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    mixersRef.current[objConf.id] = { mixer };
                }
                
                if (selectedObjectId === objConf.id) transformRef.current.attach(model);
            };

            if (objConf.model_url) {
                const ext = objConf.model_url.split('.').pop().toLowerCase();
                const loader = ext === 'fbx' ? new FBXLoader() : new GLTFLoader();
                // If this object must persist and was previously loaded once in this session, short-circuit creation
                if (mustPersist && sceneObjectsMap.current[objConf.id]) {
                    obj3d = sceneObjectsMap.current[objConf.id];
                    // Only update transform (handled below)
                } else {
                    loader.load(objConf.model_url, (asset) => {
                        const model = asset.scene || asset;
                        if (asset.animations && asset.animations.length) model.animations = asset.animations;
                        onLoad(model);
                    });
                }
            } else if (objConf.type === 'spawn_point') {
                // Placeholder for spawn point without model
                const geometry = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 16);
                const material = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.6 });
                const model = new THREE.Mesh(geometry, material);
                // Offset Y for spawn visualization
                model.position.y += 0.9; 
                onLoad(model);
            }
        } else {
            // EXISTING OBJECT - Update Transform
            // Only update if NOT currently being dragged to avoid fighting
            if (!transformRef.current.dragging) {
                obj3d.position.set(objConf.transform.position.x, objConf.transform.position.y, objConf.transform.position.z);
                obj3d.rotation.set(objConf.transform.rotation.x, objConf.transform.rotation.y, objConf.transform.rotation.z);
                obj3d.scale.set(objConf.transform.scale.x, objConf.transform.scale.y, objConf.transform.scale.z);
            }
        }
    });

  }, [sceneConfig]); // Dependencies: Re-run sync when config changes

  // --- Logic: Play Mode ---
  useEffect(() => {
    if (isPlaying) {
        // Enter Play Mode
        if (scriptRuntimeRef.current) {
            scriptRuntimeRef.current.start(sceneConfig.objects, scripts);
        }
        // Deselect to hide gizmos
        if (transformRef.current) transformRef.current.detach();
    } else {
        // Exit Play Mode
        if (scriptRuntimeRef.current) {
            scriptRuntimeRef.current.stop();
        }
        // Restore gizmo if object selected
        const obj = sceneObjectsMap.current[selectedObjectId];
        if (obj && transformRef.current) transformRef.current.attach(obj);
    }
  }, [isPlaying, sceneConfig, scripts]);

  // --- Logic: Selection & Gizmo Mode ---
  useEffect(() => {
    if (!transformRef.current) return;
    if (isPlaying) return; // Disable gizmo in play mode

    transformRef.current.setMode(mode);
    
    const obj = sceneObjectsMap.current[selectedObjectId];
    if (obj) {
        transformRef.current.attach(obj);
    } else {
        transformRef.current.detach();
    }
  }, [mode, selectedObjectId, isPlaying]);

  // --- Logic: Click Selection ---
  const handleCanvasClick = (event) => {
    if (!rendererRef.current || !cameraRef.current) return;
    
    // Standard Raycasting
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // Filter selectables (Ignore helpers/grid)
    const selectables = Object.values(sceneObjectsMap.current);
    const intersects = raycaster.intersectObjects(selectables, true);

    if (intersects.length > 0) {
        // Find root object
        let target = intersects[0].object;
        while(target) {
            if (target.userData.id) {
                setSelectedObjectId(target.userData.id);
                return;
            }
            if (target.userData.isEnvironment) {
                setSelectedObjectId('environment');
                return;
            }
            if (target === sceneRef.current) break;
            target = target.parent;
        }
    } else {
        // Deselect if clicked empty space
        setSelectedObjectId(null);
    }
  };

  // --- Logic: Adding Objects ---
  const handleAddObject = (model, type = 'static') => {
    const newId = crypto.randomUUID();
    const nameLower = (model.name || '').toLowerCase();
    const isHumanoid = nameLower.includes('ybot') || nameLower.includes('bot');
    const scaleVal = (isHumanoid && autoScaleHumanoids) ? 0.01 : 1;

    // Auto-attach PlayerController for Y-Bot or Humanoids
    const defaultScripts = [];
    if (isHumanoid) {
        const playerScript = scripts.find(s => s.name === 'PlayerController');
        if (playerScript) {
            defaultScripts.push({ script_id: playerScript.id, params: {} });
            console.log("Auto-attached PlayerController to:", model.name);
        }
    }

    const newObj = {
      id: newId,
      model_id: model.id,
      model_url: model.file_url,
      name: type === 'spawn_point' ? `Spawn (${model.name})` : model.name,
      instance_name: type === 'spawn_point' ? `PlayerStart_${newId.slice(0,4)}` : model.name,
      role: (isHumanoid || type === 'spawn_point') ? 'player' : 'static',
      type: type,
      layer: (isHumanoid ? 'Actor_Layer' : (type === 'spawn_point' ? 'Actor_Layer' : 'Default')),
      persistent: !!(isHumanoid || type === 'spawn_point'),
      scripts: defaultScripts,
      transform: { 
          position: { x: 0, y: 0, z: 0 }, 
          rotation: { x: 0, y: 0, z: 0 }, 
          scale: { x: scaleVal, y: scaleVal, z: scaleVal } 
      }
    };
    
    setSceneConfig(prev => ({ ...prev, objects: [...prev.objects, newObj] }));
    setSelectedObjectId(newId);
    setAddModelOpen(false);
    setIsDirty(true);
  };

  const handleSetEnvironment = (model) => {
      setSceneConfig(prev => ({
          ...prev,
          environment: {
              model_id: model.id,
              url: model.file_url,
              transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
          }
      }));
      setSelectedObjectId('environment');
      setAddModelOpen(false);
      setIsDirty(true);
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const onKey = (e) => {
        if (e.target.matches('input, textarea')) return;
        const key = e.key.toLowerCase();
        
        // Tools
        if (key === 'w') setMode('translate');
        if (key === 'e') setMode('rotate');
        if (key === 'r') setMode('scale');
        
        // Actions
        if ((e.metaKey || e.ctrlKey) && key === 's') {
            e.preventDefault();
            if (isDirty) saveMutation.mutate({ // Basic Save logic replication
                 name: sceneName,
                 environment_model_id: sceneConfig.environment.model_id,
                 environment_url: sceneConfig.environment.url,
                 environment_transform: sceneConfig.environment.transform,
                 objects: sceneConfig.objects,
                 is_active: layouts.find(l => l.id === selectedLayoutId)?.is_active || false
            });
        }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, isDirty, sceneConfig, sceneName, selectedLayoutId]);


  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">
      {/* --- SIDEBAR --- */}
      <div className="w-80 flex flex-col gap-4">
        {/* Layout Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white flex items-center gap-2"><Layout className="w-4 h-4"/> Layouts</h3>
                <Button size="icon" variant="ghost" onClick={resetEditor} title="New Scene"><Plus className="w-4 h-4"/></Button>
            </div>
            <Select value={selectedLayoutId || ""} onValueChange={(val) => {
                const layout = layouts.find(l => l.id === val);
                if(layout) loadLayout(layout);
            }}>
                <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select a scene..." />
                </SelectTrigger>
                <SelectContent>
                    {layouts.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                            <span className="flex items-center gap-2">
                                {l.name} {l.is_active && <Badge className="bg-green-500/20 text-green-400 text-[10px] h-4">LIVE</Badge>}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {/* Scene Tree */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800">
                <Input value={sceneName} onChange={e => { setSceneName(e.target.value); setIsDirty(true); }} className="bg-slate-800 border-slate-700 font-bold" placeholder="Scene Name"/>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Environment Node */}
                <div 
                    onClick={() => setSelectedObjectId('environment')}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm ${selectedObjectId === 'environment' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span className="truncate">{sceneConfig.environment.model_id ? 'Environment' : 'Empty Environment'}</span>
                    </div>
                    {sceneConfig.environment.url && <Check className="w-3 h-3 opacity-50" />}
                </div>

                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1 mt-4">Objects</div>
                {sceneConfig.objects.map(obj => (
                    <div 
                        key={obj.id}
                        onClick={() => setSelectedObjectId(obj.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm ${selectedObjectId === obj.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                         <div className="flex items-center gap-2 overflow-hidden">
                            <Box className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{obj.instance_name || obj.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => {
                                e.stopPropagation();
                                const copy = { ...obj, id: crypto.randomUUID(), instance_name: `${obj.instance_name}_copy` };
                                setSceneConfig(prev => ({ ...prev, objects: [...prev.objects, copy] }));
                                setIsDirty(true);
                            }}>
                                <Copy className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-red-400" onClick={(e) => {
                                e.stopPropagation();
                                setSceneConfig(prev => ({ ...prev, objects: prev.objects.filter(o => o.id !== obj.id) }));
                                if(selectedObjectId === obj.id) setSelectedObjectId('environment');
                                setIsDirty(true);
                            }}>
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Selection Details Panel */}
            {selectedObjectId !== 'environment' && sceneConfig.objects.find(o => o.id === selectedObjectId) && (
                 <div className="px-4 pb-4 border-t border-slate-800 pt-4 bg-slate-900">
                    <InstanceDetailsPanel 
                        obj={sceneConfig.objects.find(o => o.id === selectedObjectId)}
                        scriptsCatalog={scripts}
                        onChangeName={(val) => { setSceneConfig(prev => ({ ...prev, objects: prev.objects.map(o => o.id === selectedObjectId ? { ...o, instance_name: val } : o) })); setIsDirty(true); }}
                        onChangeRole={(val) => { setSceneConfig(prev => ({ ...prev, objects: prev.objects.map(o => o.id === selectedObjectId ? { ...o, role: val } : o) })); setIsDirty(true); }}
                        onAddScript={(sId) => { setSceneConfig(prev => ({ ...prev, objects: prev.objects.map(o => o.id === selectedObjectId ? { ...o, scripts: [...(o.scripts||[]), { script_id: sId }] } : o) })); setIsDirty(true); }}
                        onRemoveScript={(idx) => { setSceneConfig(prev => ({ ...prev, objects: prev.objects.map(o => o.id === selectedObjectId ? { ...o, scripts: (o.scripts||[]).filter((_,i) => i !== idx) } : o) })); setIsDirty(true); }}
                        onResetZeroState={() => {
                             // Zero state reset
                             setSceneConfig(prev => ({ ...prev, objects: prev.objects.map(o => o.id === selectedObjectId ? { ...o, scripts: [] } : o) }));
                             setIsDirty(true);
                        }}
                        onClose={() => setSelectedObjectId('environment')}
                    />
                 </div>
            )}

            {/* Add Buttons */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-col gap-2">
                <Button className="w-full bg-blue-600" onClick={() => { setSelectingMode('obj'); setAddModelOpen(true); }}><Plus className="w-4 h-4 mr-2"/> Add Object</Button>
                <div className="flex gap-2">
                    <Button className="flex-1 bg-slate-700" onClick={() => { setSelectingMode('spawn'); setAddModelOpen(true); }}><Move className="w-4 h-4 mr-2"/> Spawn</Button>
                    <Button className="flex-1 bg-slate-800 border border-slate-700" onClick={() => { setSelectingMode('env'); setAddModelOpen(true); }}><Globe className="w-4 h-4 mr-2"/> Env</Button>
                </div>
            </div>
        </div>
      </div>

      {/* --- MAIN VIEWPORT --- */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden">
        {/* Viewport Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex gap-1 bg-slate-900/80 p-1 rounded-lg backdrop-blur border border-slate-700">
            <Button size="icon" variant={mode === 'translate' ? 'default' : 'ghost'} onClick={() => setMode('translate')}><Move className="w-4 h-4"/></Button>
            <Button size="icon" variant={mode === 'rotate' ? 'default' : 'ghost'} onClick={() => setMode('rotate')}><RotateCw className="w-4 h-4"/></Button>
            <Button size="icon" variant={mode === 'scale' ? 'default' : 'ghost'} onClick={() => setMode('scale')}><Maximize className="w-4 h-4"/></Button>
            
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            
            <Button 
                size="sm" 
                variant={isPlaying ? "destructive" : "default"} 
                className={isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"}
                onClick={() => setIsPlaying(!isPlaying)}
            >
                {isPlaying ? <Box className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isPlaying ? "Stop" : "Play"}
            </Button>
        </div>

        {/* Save/Activate Bar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
             <div className="flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded border border-slate-700">
                 <Switch id="auto-scale" checked={autoScaleHumanoids} onCheckedChange={setAutoScaleHumanoids} />
                 <Label htmlFor="auto-scale" className="text-xs text-slate-300">Auto-scale YBot</Label>
             </div>
             {selectedLayoutId && (
                 <Button 
                    variant={layouts.find(l => l.id === selectedLayoutId)?.is_active ? "outline" : "secondary"}
                    className={layouts.find(l => l.id === selectedLayoutId)?.is_active ? "border-green-500 text-green-400" : ""}
                    onClick={() => activateMutation.mutate(selectedLayoutId)}
                 >
                     {layouts.find(l => l.id === selectedLayoutId)?.is_active ? "Live Active" : "Set Active"}
                 </Button>
             )}
             <Button 
                onClick={() => saveMutation.mutate({
                    name: sceneName,
                    environment_model_id: sceneConfig.environment.model_id,
                    environment_url: sceneConfig.environment.url,
                    environment_transform: sceneConfig.environment.transform,
                    objects: sceneConfig.objects,
                    is_active: layouts.find(l => l.id === selectedLayoutId)?.is_active || false
                })} 
                disabled={!isDirty} 
                className={isDirty ? "bg-green-600 hover:bg-green-700" : "bg-slate-700"}
            >
                <Save className="w-4 h-4 mr-2"/> {isDirty ? "Save Changes" : "Saved"}
             </Button>
        </div>

        {/* 3D Canvas */}
        <div ref={containerRef} className="w-full h-full cursor-crosshair" onClick={handleCanvasClick} />
      </div>

      {/* --- ASSET DRAWER --- */}
      <AnimatePresence>
        {addModelOpen && (
            <motion.div 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
            >
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-white">Library</h3>
                    <Button size="icon" variant="ghost" onClick={() => setAddModelOpen(false)}><X className="w-4 h-4"/></Button>
                </div>
                <div className="p-4"><Input placeholder="Search assets..." className="bg-slate-800 border-slate-700"/></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {allModels.map(model => (
                        <div key={model.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-blue-500 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-semibold text-sm truncate w-48">{model.name}</div>
                                <Badge variant="outline" className="text-[10px]">{model.file_type}</Badge>
                            </div>
                            {selectingMode === 'env' ? (
                                <Button size="sm" className="w-full bg-slate-700 hover:bg-blue-600" onClick={() => handleSetEnvironment(model)}>Set Environment</Button>
                            ) : selectingMode === 'obj' ? (
                                <Button size="sm" className="w-full bg-slate-700 hover:bg-green-600" onClick={() => handleAddObject(model, 'static')}>Add Object</Button>
                            ) : (
                                <Button size="sm" className="w-full bg-slate-700 hover:bg-purple-600" onClick={() => handleAddObject(model, 'spawn_point')}>Add Spawn</Button>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}