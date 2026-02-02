import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Trash2, Box, Move, RotateCw, Maximize, Search, Eye, Check, X, Layers, Layout, Globe, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// Helper to convert Three.js Euler/Vector3 to simple object
const toObj = (v) => ({ x: v.x, y: v.y, z: v.z });

export default function SceneEditor() {
  const queryClient = useQueryClient();
  const [sceneName, setSceneName] = useState('New Scene');
  const [selectedLayoutId, setSelectedLayoutId] = useState(null);
  const [mode, setMode] = useState('translate'); // translate, rotate, scale
  const [selectedObjectId, setSelectedObjectId] = useState('environment'); // 'environment' or object UUID
  
  // Data for models
  const { data: models3d = [] } = useQuery({ queryKey: ['models3d'], queryFn: () => base44.entities.Model3D.list() });
  const { data: modelsFbx = [] } = useQuery({ queryKey: ['modelsfbx'], queryFn: () => base44.entities.ModelFBX.list() });
  const { data: layouts = [] } = useQuery({ queryKey: ['sceneLayouts'], queryFn: () => base44.entities.SceneLayout.list() });

  const allModels = [...models3d, ...modelsFbx];

  // Current Scene State
  const [sceneConfig, setSceneConfig] = useState({
    environment: {
      model_id: null,
      url: null,
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    },
    objects: []
  });

  const [addModelOpen, setAddModelOpen] = useState(false);
  const [selectingMode, setSelectingMode] = useState('obj'); // 'obj', 'env', 'spawn'

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (selectedLayoutId) {
        return base44.entities.SceneLayout.update(selectedLayoutId, data);
      } else {
        return base44.entities.SceneLayout.create(data);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sceneLayouts'] });
      showSuccess('Scene saved successfully!');
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
      // Deactivate all others first
      const activeScenes = layouts.filter(l => l.is_active && l.id !== id);
      await Promise.all(activeScenes.map(l => base44.entities.SceneLayout.update(l.id, { is_active: false })));
      // Activate current
      return base44.entities.SceneLayout.update(id, { is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sceneLayouts'] });
      showSuccess('Scene activated and live on Dashboard');
    },
    onError: (err) => showError(err, 'Activate Scene')
  });

  const resetEditor = () => {
    setSelectedLayoutId(null);
    setSceneName('New Scene');
    setSceneConfig({
      environment: { model_id: null, url: null, transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } },
      objects: []
    });
    setSelectedObjectId('environment');
  };

  const loadLayout = (layout) => {
    setSelectedLayoutId(layout.id);
    setSceneName(layout.name);
    // Ensure deep copy and defaults
    setSceneConfig({
      environment: layout.environment_transform ? {
        model_id: layout.environment_model_id,
        url: layout.environment_url,
        transform: layout.environment_transform
      } : { model_id: null, url: null, transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } },
      objects: layout.objects || []
    });
  };

  // --- 3D Scene Refs ---
  const containerRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const transformControlsRef = useRef(null);
  const transformRef = useRef(null); // The actual Three.js object for TransformControls
  
  // Maps specific object IDs to their Three.js Object3D
  const sceneObjectsMap = useRef({}); 

  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Scene
    const scene = sceneRef.current;
    scene.background = new THREE.Color(0x111827); // Slate-900 like
    
    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);
    
    // Axes
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    controlsRef.current = orbit;

    // Transform Controls
    const transform = new TransformControls(camera, renderer.domElement);
    transform.setSize(2.5); // Make handles larger/thicker for easier grabbing
    transform.addEventListener('dragging-changed', function (event) {
      orbit.enabled = !event.value;
    });
    // When transform changes, update React state (but be careful of loops)
    transform.addEventListener('change', () => {
      if (transform.object) {
        // Find which ID this object belongs to
        const id = Object.keys(sceneObjectsMap.current).find(key => sceneObjectsMap.current[key] === transform.object);
        if (id) {
          // Update local state without re-triggering loader
          // We'll update the 'sceneConfig' state on drag end or throttling?
          // Actually, 'change' fires constantly. Let's update internal ref or only on mouseUp.
        }
      }
    });
    // Use mouseUp to commit changes to React State
    transform.addEventListener('mouseUp', () => {
        if (transform.object) {
            const obj = transform.object;
            const id = Object.keys(sceneObjectsMap.current).find(key => sceneObjectsMap.current[key] === obj);
            
            if (id === 'environment') {
                setSceneConfig(prev => ({
                    ...prev,
                    environment: {
                        ...prev.environment,
                        transform: {
                            position: toObj(obj.position),
                            rotation: toObj(obj.rotation), // Euler
                            scale: toObj(obj.scale)
                        }
                    }
                }));
            } else if (id) {
                setSceneConfig(prev => ({
                    ...prev,
                    objects: prev.objects.map(o => o.id === id ? {
                        ...o,
                        transform: {
                            position: toObj(obj.position),
                            rotation: toObj(obj.rotation),
                            scale: toObj(obj.scale)
                        }
                    } : o)
                }));
            }
        }
    });

    scene.add(transform);
    transformRef.current = transform;

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      orbit.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  // --- Sync State to Scene ---
  // Load models when sceneConfig changes
  useEffect(() => {
    const scene = sceneRef.current;
    
    // 1. Handle Environment
    const envConfig = sceneConfig.environment;
    let envObj = sceneObjectsMap.current['environment'];

    if (envConfig.url) {
        // If URL changed or obj doesn't exist
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
                
                // Apply current transform state
                model.position.set(envConfig.transform.position.x, envConfig.transform.position.y, envConfig.transform.position.z);
                model.rotation.set(envConfig.transform.rotation.x, envConfig.transform.rotation.y, envConfig.transform.rotation.z);
                model.scale.set(envConfig.transform.scale.x, envConfig.transform.scale.y, envConfig.transform.scale.z);

                // Treat as static mesh (optimization + prevents some physics/rendering glitches)
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.matrixAutoUpdate = false;
                        child.updateMatrix();
                    }
                });
                
                scene.add(model);
                sceneObjectsMap.current['environment'] = model;
                
                // Re-attach transform controls if selected
                if (selectedObjectId === 'environment') {
                    transformRef.current.attach(model);
                }
            });
        } else {
            // Just update transform if object already exists (and not being dragged by transform controls currently?)
            // Actually, if we update from React state which WAS updated by transform controls, it's cyclic but safe-ish.
            // But if we are dragging, we don't want to snap back. 
            // `transformRef.current.dragging` check might be needed if we were driving animation from state.
            // For now, we only update state on mouseUp, so this effect runs after drag.
            envObj.position.set(envConfig.transform.position.x, envConfig.transform.position.y, envConfig.transform.position.z);
            envObj.rotation.set(envConfig.transform.rotation.x, envConfig.transform.rotation.y, envConfig.transform.rotation.z);
            envObj.scale.set(envConfig.transform.scale.x, envConfig.transform.scale.y, envConfig.transform.scale.z);
        }
    } else {
        if (envObj) {
            scene.remove(envObj);
            if (transformRef.current.object === envObj) transformRef.current.detach();
            delete sceneObjectsMap.current['environment'];
        }
    }

    // 2. Handle Objects
    // Remove deleted objects
    Object.keys(sceneObjectsMap.current).forEach(key => {
        if (key === 'environment') return;
        if (!sceneConfig.objects.find(o => o.id === key)) {
            const obj = sceneObjectsMap.current[key];
            scene.remove(obj);
            if (transformRef.current.object === obj) transformRef.current.detach();
            delete sceneObjectsMap.current[key];
        }
    });

    // Add/Update objects
    sceneConfig.objects.forEach(objConf => {
        let obj3d = sceneObjectsMap.current[objConf.id];
        
        if (!obj3d) {
            // Check if it's a spawn point with a model or a helper
            if (objConf.type === 'spawn_point' && !objConf.model_url) {
                // Generic helper if no model selected
                const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.5 });
                const model = new THREE.Mesh(geometry, material);
                model.userData.id = objConf.id;
                
                model.position.set(objConf.transform.position.x, objConf.transform.position.y + 0.9, objConf.transform.position.z); 
                model.rotation.set(objConf.transform.rotation.x, objConf.transform.rotation.y, objConf.transform.rotation.z);
                model.scale.set(objConf.transform.scale.x, objConf.transform.scale.y, objConf.transform.scale.z);
                
                scene.add(model);
                sceneObjectsMap.current[objConf.id] = model;
                if (selectedObjectId === objConf.id) transformRef.current.attach(model);
            } else if (objConf.model_url) {
                // Load actual model (for Object or Spawn Point with visual)
                const ext = objConf.model_url.split('.').pop().toLowerCase();
                const loader = ext === 'fbx' ? new FBXLoader() : new GLTFLoader();
                loader.load(objConf.model_url, (asset) => {
                    const model = asset.scene || asset;
                    model.userData.id = objConf.id;
                    
                    model.position.set(objConf.transform.position.x, objConf.transform.position.y, objConf.transform.position.z);
                    model.rotation.set(objConf.transform.rotation.x, objConf.transform.rotation.y, objConf.transform.rotation.z);
                    model.scale.set(objConf.transform.scale.x, objConf.transform.scale.y, objConf.transform.scale.z);
                    
                    scene.add(model);
                    sceneObjectsMap.current[objConf.id] = model;

                    if (selectedObjectId === objConf.id) {
                        transformRef.current.attach(model);
                    }
                });
            }
        } else {
            // Update transform
            obj3d.position.set(objConf.transform.position.x, objConf.transform.position.y, objConf.transform.position.z);
            obj3d.rotation.set(objConf.transform.rotation.x, objConf.transform.rotation.y, objConf.transform.rotation.z);
            obj3d.scale.set(objConf.transform.scale.x, objConf.transform.scale.y, objConf.transform.scale.z);
        }
    });

  }, [sceneConfig]); // Only re-run when config changes (which happens on mouseUp of transform)

  // Mode & Selection Effect
  useEffect(() => {
    if (transformRef.current) {
        transformRef.current.setMode(mode);
        const obj = sceneObjectsMap.current[selectedObjectId];
        if (obj) {
            transformRef.current.attach(obj);
        } else {
            transformRef.current.detach();
        }
    }
  }, [mode, selectedObjectId]);

  // Click Selection Logic
  const handleCanvasClick = (event) => {
    if (!rendererRef.current || !cameraRef.current) return;
    
    try {
        const rect = rendererRef.current.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);

        // 1. Priority: Check if clicking on Transform Gizmo
        if (transformRef.current && transformRef.current.isObject3D) {
            // If dragging, definitely don't select
            if (transformRef.current.dragging) return;
            
            // The gizmo is a child of the TransformControls object (helper)
            const gizmoIntersects = raycaster.intersectObject(transformRef.current, true);
            if (gizmoIntersects.length > 0) {
                // Clicked on the gizmo - let it do its job, don't change selection
                return;
            }
        }

        // 2. Normal Selection Logic
        // Filter only valid Object3Ds to prevent "undefined reading 'test'" errors (raycaster checks layers)
        const selectables = Object.values(sceneObjectsMap.current).filter(obj => obj && obj.isObject3D);
        const intersects = raycaster.intersectObjects(selectables, true);

        if (intersects.length > 0) {
            // Traverse up to find the root model container
            let current = intersects[0].object;
            while (current) {
                if (current.userData.isEnvironment) {
                    setSelectedObjectId('environment');
                    return;
                }
                if (current.userData.id) {
                    setSelectedObjectId(current.userData.id);
                    return;
                }
                if (current === sceneRef.current) break;
                current = current.parent;
            }
        }
    } catch (e) {
        console.error("Selection Error:", e);
    }
  };

  // Actions
  const handleAddObject = (model) => {
    const newId = crypto.randomUUID();
    const newObj = {
      id: newId,
      model_id: model.id,
      model_url: model.file_url,
      name: model.name || 'Object',
      type: 'static',
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    };
    setSceneConfig(prev => ({ ...prev, objects: [...prev.objects, newObj] }));
    setSelectedObjectId(newId);
    setAddModelOpen(false);
  };

  const handleAddSpawnPoint = (model) => {
    const newId = crypto.randomUUID();
    // Auto-scale check for Y-Bot or similar large FBX models
    const name = model.name.toLowerCase();
    const isYBot = name.includes('ybot') || name.includes('y-bot') || name.includes('y bot') || name.includes('white bot');
    const defaultScale = isYBot ? 0.01 : 1;

    const newObj = {
      id: newId,
      model_id: model.id,
      model_url: model.file_url,
      name: 'Player Spawn (' + model.name + ')',
      type: 'spawn_point',
      transform: { 
          position: { x: 0, y: 0, z: 0 }, 
          rotation: { x: 0, y: 0, z: 0 }, 
          scale: { x: defaultScale, y: defaultScale, z: defaultScale } 
      }
    };
    setSceneConfig(prev => ({ ...prev, objects: [...prev.objects, newObj] }));
    setSelectedObjectId(newId);
    setAddModelOpen(false);
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
  };

  const handleSave = () => {
    if (!sceneName) return showError('Please name your scene');
    
    const data = {
        name: sceneName,
        environment_model_id: sceneConfig.environment.model_id,
        environment_url: sceneConfig.environment.url,
        environment_transform: sceneConfig.environment.transform,
        objects: sceneConfig.objects,
        is_active: true // Auto-activate on save for now, as requested
    };
    
    saveMutation.mutate(data);
  };

  // Keyboard Shortcuts for Tools
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.target && e.target.matches && e.target.matches('input, textarea')) return;
        if (!e.key) return;
        
        switch(e.key.toLowerCase()) {
            case 'w': setMode('translate'); break;
            case 'e': setMode('rotate'); break;
            case 'r': setMode('scale'); break;
            case 'x': 
                // Toggle local/world space if needed, or just stick to defaults
                if (transformRef.current) {
                    transformRef.current.setSpace(transformRef.current.space === 'local' ? 'world' : 'local');
                }
                break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">
      {/* Sidebar - Scene Tree & Library */}
      <div className="w-80 flex flex-col gap-4">
        {/* Scenes List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-shrink-0">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white flex items-center gap-2"><Layout className="w-4 h-4"/> Layouts</h3>
                <Button size="icon" variant="ghost" onClick={resetEditor} title="New Scene"><Plus className="w-4 h-4"/></Button>
            </div>
            <Select onValueChange={(val) => {
                const layout = layouts.find(l => l.id === val);
                if (layout) loadLayout(layout);
            }} value={selectedLayoutId || ""}>
                <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select a scene..." />
                </SelectTrigger>
                <SelectContent>
                    {layouts.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                            <div className="flex items-center gap-2">
                                {l.name}
                                {l.is_active && <Badge className="bg-green-500/20 text-green-400 text-[10px] px-1 h-4 border-none">LIVE</Badge>}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {/* Scene Hierarchy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900">
                <Input 
                    value={sceneName} 
                    onChange={e => setSceneName(e.target.value)} 
                    className="bg-slate-800 border-slate-700 font-bold"
                    placeholder="Scene Name"
                />
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">Environment</div>
                <div 
                    onClick={() => setSelectedObjectId('environment')}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm ${selectedObjectId === 'environment' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                    <div className="flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        <span className="truncate">{sceneConfig.environment.model_id ? 'Environment Model' : 'Empty Environment'}</span>
                    </div>
                    {sceneConfig.environment.url && <Check className="w-3 h-3 opacity-50" />}
                </div>

                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1 mt-4">Objects</div>
                {sceneConfig.objects.map((obj, i) => (
                    <div 
                        key={obj.id}
                        onClick={() => setSelectedObjectId(obj.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm ${selectedObjectId === obj.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Box className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{obj.name}</span>
                        </div>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 hover:bg-red-500/20 hover:text-red-400"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSceneConfig(prev => ({ ...prev, objects: prev.objects.filter(o => o.id !== obj.id) }));
                                if (selectedObjectId === obj.id) setSelectedObjectId('environment');
                            }}
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-col gap-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => { setSelectingMode('obj'); setAddModelOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Object
                </Button>
                <Button className="w-full bg-slate-700 hover:bg-slate-600" onClick={() => { setSelectingMode('spawn'); setAddModelOpen(true); }}>
                    <Move className="w-4 h-4 mr-2" /> Add Player Spawn
                </Button>
                <Button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700" onClick={() => { setSelectingMode('env'); setAddModelOpen(true); }}>
                    <Box className="w-4 h-4 mr-2" /> Set Environment
                </Button>
            </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-1 flex gap-1 shadow-xl">
            <Button size="icon" variant={mode === 'translate' ? 'default' : 'ghost'} onClick={() => setMode('translate')} title="Translate (W)">
                <Move className="w-4 h-4" />
            </Button>
            <Button size="icon" variant={mode === 'rotate' ? 'default' : 'ghost'} onClick={() => setMode('rotate')} title="Rotate (E)">
                <RotateCw className="w-4 h-4" />
            </Button>
            <Button size="icon" variant={mode === 'scale' ? 'default' : 'ghost'} onClick={() => setMode('scale')} title="Scale (R)">
                <Maximize className="w-4 h-4" />
            </Button>
        </div>

        <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
            {selectedLayoutId && (
                <>
                    {layouts.find(l => l.id === selectedLayoutId)?.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 h-9 px-3 flex items-center gap-2">
                            <Radio className="w-4 h-4 animate-pulse" />
                            Live on Dashboard
                        </Badge>
                    ) : (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                            onClick={() => activateMutation.mutate(selectedLayoutId)}
                            disabled={activateMutation.isPending}
                        >
                            <Globe className="w-4 h-4 mr-2" /> 
                            {activateMutation.isPending ? 'Activating...' : 'Set Active'}
                        </Button>
                    )}
                    
                    <div className="w-px h-6 bg-slate-700 mx-1" />

                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selectedLayoutId)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                </>
            )}
            <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Save Scene
            </Button>
        </div>

        {/* 3D Canvas Container */}
        <div 
            ref={containerRef} 
            className="w-full h-full bg-slate-950" 
            onClick={handleCanvasClick}
        />
      </div>

      {/* Add Model Modal/Drawer */}
      <AnimatePresence>
        {addModelOpen && (
            <motion.div 
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                className="absolute right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
            >
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <h3 className="font-bold text-white">Asset Library</h3>
                    <Button size="icon" variant="ghost" onClick={() => setAddModelOpen(false)}><X className="w-4 h-4" /></Button>
                </div>
                <div className="p-4 bg-slate-900">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input placeholder="Search models..." className="pl-9 bg-slate-800 border-slate-700" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
                    {allModels.map(model => (
                        <div key={model.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 group hover:border-blue-500 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-semibold text-sm truncate w-40" title={model.name}>{model.name}</div>
                                <Badge variant="outline" className="text-[10px]">{model.file_type}</Badge>
                            </div>
                            <div className="flex gap-2 mt-2">
                                {selectingMode === 'env' && (
                                    <Button size="sm" className="w-full bg-slate-700 hover:bg-blue-600 h-8 text-xs" onClick={() => handleSetEnvironment(model)}>
                                        Set as Environment
                                    </Button>
                                )}
                                {selectingMode === 'obj' && (
                                    <Button size="sm" className="w-full bg-slate-700 hover:bg-green-600 h-8 text-xs" onClick={() => handleAddObject(model)}>
                                        Add Object
                                    </Button>
                                )}
                                {selectingMode === 'spawn' && (
                                    <Button size="sm" className="w-full bg-slate-700 hover:bg-purple-600 h-8 text-xs" onClick={() => handleAddSpawnPoint(model)}>
                                        Use as Spawn Model
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}