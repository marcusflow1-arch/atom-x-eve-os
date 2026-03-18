import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Globe, X, ChevronLeft, ChevronRight, Settings, Image as ImageIcon, Box, Bot, Shield, Cpu, ShoppingCart, Map, Lock, Unlock, Zap, Eye, Play, PenTool, Shirt, Home, Car, Swords, Layers } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function MiniRoomViewer({ roomUrl }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const roomModelRef = useRef(null);
  const reqFrameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x080808);
    scene.fog = new THREE.FogExp2(0x080808, 0.05);

    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 500);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const animate = () => {
      reqFrameRef.current = requestAnimationFrame(animate);
      if (roomModelRef.current) {
        roomModelRef.current.rotation.y += 0.002;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqFrameRef.current);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !roomUrl) return;

    if (roomModelRef.current) {
      sceneRef.current.remove(roomModelRef.current);
      roomModelRef.current = null;
    }

    const onLoaded = (obj) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        obj.scale.setScalar(10 / maxDim);
      }
      
      const box2 = new THREE.Box3().setFromObject(obj);
      const center = box2.getCenter(new THREE.Vector3());
      obj.position.set(-center.x, -center.y, -center.z);

      roomModelRef.current = new THREE.Group();
      roomModelRef.current.add(obj);
      sceneRef.current.add(roomModelRef.current);
    };

    const lower = roomUrl.toLowerCase();
    if (lower.endsWith('.fbx')) {
      new FBXLoader().load(roomUrl, onLoaded);
    } else if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
      new GLTFLoader().load(roomUrl, (gltf) => onLoaded(gltf.scene));
    }
  }, [roomUrl]);

  return <div ref={containerRef} className="w-full h-full pointer-events-none" />;
}

export default function EnvHubDrawer({ open, onClose, currentEnvId, onSelectEnv }) {
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [envList, setEnvList] = useState([]);

  useEffect(() => {
    if (!open) return;
    const fetchEnvs = async () => {
      try {
        const allModels = await base44.entities.Model3D.list();
        const rooms = allModels.filter(m => m.name && m.name.toLowerCase().includes('room'));
        
        const mapped = rooms.map((m, idx) => ({
          id: m.id,
          name: m.name,
          level: (idx % 10) + 1,
          xp: Math.floor(Math.random() * 5000),
          maxXp: 5000,
          status: 'Available',
          thumbnail: m.thumbnail_url || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400',
          image: m.thumbnail_url || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920',
          modelUrl: m.file_url,
          capacity: '8/10',
          energy: '450/500',
          slots: '3/5',
        }));
        
        if (mapped.length > 0) {
          setEnvList(mapped);
          if (!selectedEnv) {
             const current = mapped.find(e => e.id === currentEnvId) || mapped[0];
             setSelectedEnv(current);
          }
        }
      } catch (e) {
        console.error("Failed to fetch environments", e);
      }
    };
    fetchEnvs();
  }, [open, currentEnvId]);

  const initialModules = [
    { 
      id: 'wardrobe', title: 'Wardrobe', icon: Shirt, 
      upgrades: [
        { id: 'w1', name: 'Upgrade Clothing Racks', unlocked: true },
        { id: 'w2', name: 'Upgrade Color Customization', unlocked: true },
        { id: 'w3', name: 'Upgrade Advanced Fabrics', unlocked: false },
        { id: 'w4', name: 'Upgrade Holographic Mirrors', unlocked: false }
      ]
    },
    { 
      id: 'housing', title: 'Housing', icon: Home, 
      upgrades: [
        { id: 'h1', name: 'Upgrade Basic Living Quarters', unlocked: true },
        { id: 'h2', name: 'Upgrade Furniture Tools', unlocked: false },
        { id: 'h3', name: 'Upgrade Trophy Display', unlocked: false },
        { id: 'h4', name: 'Upgrade Floor Plan', unlocked: false }
      ]
    },
    { 
      id: 'cars', title: 'Car Collection', icon: Car, 
      upgrades: [
        { id: 'c1', name: 'Upgrade Garage Space', unlocked: true },
        { id: 'c2', name: 'Upgrade Tuning Shop', unlocked: false },
        { id: 'c3', name: 'Upgrade Paint Booth', unlocked: false },
        { id: 'c4', name: 'Upgrade Test Track', unlocked: false }
      ]
    },
    { 
      id: 'equipment', title: 'Equipment', icon: Shield, 
      upgrades: [
        { id: 'e1', name: 'Upgrade Basic Armory', unlocked: true },
        { id: 'e2', name: 'Upgrade Weapon Racks', unlocked: false },
        { id: 'e3', name: 'Upgrade Enchantment Station', unlocked: false },
        { id: 'e4', name: 'Upgrade Forge', unlocked: false }
      ]
    },
    { 
      id: 'market', title: 'Marketplace', icon: ShoppingCart, 
      upgrades: [
        { id: 'm1', name: 'Upgrade Local Kiosks', unlocked: true },
        { id: 'm2', name: 'Upgrade Global Trade Terminal', unlocked: false },
        { id: 'm3', name: 'Upgrade Black Market Access', unlocked: false },
        { id: 'm4', name: 'Upgrade Auction House', unlocked: false }
      ]
    },
    { 
      id: 'training', title: 'Training Room', icon: Swords, 
      upgrades: [
        { id: 't1', name: 'Upgrade Dummy Targets', unlocked: true },
        { id: 't2', name: 'Upgrade AI Sparring Bots', unlocked: false },
        { id: 't3', name: 'Upgrade Simulation Hazards', unlocked: false },
        { id: 't4', name: 'Upgrade Combat Analytics', unlocked: false }
      ]
    },
    { 
      id: 'cards', title: 'Card Collection', icon: Layers, 
      upgrades: [
        { id: 'cc1', name: 'Upgrade Deck Builder', unlocked: true },
        { id: 'cc2', name: 'Upgrade Holographic Displays', unlocked: false },
        { id: 'cc3', name: 'Upgrade Trading Binders', unlocked: false }
      ]
    },
    { 
      id: 'ai_npc', title: 'AI / NPC System', icon: Bot, 
      upgrades: [
        { id: 'a1', name: 'Upgrade Basic Pathfinding', unlocked: true },
        { id: 'a2', name: 'Upgrade Dialog Trees', unlocked: false },
        { id: 'a3', name: 'Upgrade Companion Logic', unlocked: false }
      ]
    },
    { 
      id: 'portals', title: 'Portals & Travel', icon: Map, 
      upgrades: [
        { id: 'p1', name: 'Upgrade Local Teleporters', unlocked: true },
        { id: 'p2', name: 'Upgrade Cross-Realm Gates', unlocked: false },
        { id: 'p3', name: 'Upgrade Starship Dock', unlocked: false }
      ]
    },
  ];

  const [modules, setModules] = useState(initialModules);
  const [selectedModuleId, setSelectedModuleId] = useState(initialModules[0].id);

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  const handleUpgradeToggle = (modId, upId) => {
    setModules(prev => prev.map(m => {
      if (m.id !== modId) return m;
      return {
        ...m,
        upgrades: m.upgrades.map(u => u.id === upId ? { ...u, unlocked: !u.unlocked } : u)
      };
    }));
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed z-[35] left-0 right-0 bg-[#080808] shadow-2xl border-t border-white/10"
          style={{ top: '64px', bottom: '48px', pointerEvents: 'all' }}
        >
          <div className="flex w-full h-full text-white font-sans overflow-hidden bg-transparent">
            {/* LEFT PANEL (15%) - Environment Navigation */}
            <div className="w-[15%] h-full flex flex-col border-r border-white/10 bg-black/60 overflow-hidden relative backdrop-blur-md">
              {/* Back / Close button */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <button 
                  onClick={onClose}
                  className="flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                </button>
              </div>

              {/* Selected Environment Summary (Fixed) */}
              <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-black/40">
                    {selectedEnv?.thumbnail && <img src={selectedEnv.thumbnail} alt={selectedEnv.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate text-white">{selectedEnv?.name || 'Loading...'}</h3>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${selectedEnv?.status === 'Active' ? 'text-cyan-400' : selectedEnv?.status === 'Locked' ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedEnv?.status || ''}
                    </p>
                  </div>
                </div>
                {selectedEnv && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-white/60">LVL {selectedEnv.level}</span>
                      <span className="text-[9px] text-white/40">{selectedEnv.xp} / {selectedEnv.maxXp} XP</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${(selectedEnv.xp / selectedEnv.maxXp) * 100}%` }} />
                    </div>
                  </>
                )}
              </div>

              {/* List of Environments */}
              <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 mb-2 mt-2">All Worlds</p>
                <div className="flex flex-col gap-1">
                  {envList.map(env => (
                    <button
                      key={env.id}
                      onClick={() => {
                        setSelectedEnv(env);
                      }}
                      className={`flex flex-col p-2 rounded-lg transition-all border text-left ${selectedEnv?.id === env.id ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {env.thumbnail ? (
                          <img src={env.thumbnail} alt={env.name} className="w-6 h-6 rounded object-cover border border-white/10" />
                        ) : (
                          <div className="w-6 h-6 rounded border border-white/10 bg-black/40" />
                        )}
                        <span className={`text-xs font-bold truncate ${selectedEnv?.id === env.id ? 'text-cyan-400' : 'text-white/80'}`}>{env.name}</span>
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] font-bold text-white/50">LVL {env.level}</span>
                        <div className="flex-1 ml-2 mr-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${selectedEnv?.id === env.id ? 'bg-cyan-400' : 'bg-white/30'}`} style={{ width: `${(env.xp / env.maxXp) * 100}%` }} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER PANEL (50%) - Feature Control System */}
            <div className="w-[50%] h-full flex flex-col relative border-r border-white/10 bg-[#0a0d14]">
              {/* TOP BAR */}
              <div className="h-[15%] min-h-[100px] border-b border-white/10 px-8 flex flex-col justify-center flex-shrink-0 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-black tracking-wide text-white drop-shadow-lg flex items-center gap-3">
                      <Globe className="w-8 h-8 text-cyan-400" />
                      {selectedEnv?.name || 'Loading...'}
                    </h1>
                    {selectedEnv && (
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">LEVEL {selectedEnv.level}</span>
                          <span className="text-xs text-white/50">{selectedEnv.xp} / {selectedEnv.maxXp} XP</span>
                        </div>
                        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${(selectedEnv.xp / selectedEnv.maxXp) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedEnv && (
                    <div className="flex items-center gap-6 bg-black/40 p-4 rounded-xl border border-white/5">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Capacity</span>
                        <span className="text-sm font-bold text-white">{selectedEnv.capacity}</span>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Energy</span>
                        <span className="text-sm font-bold text-amber-400">{selectedEnv.energy}</span>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Slots</span>
                        <span className="text-sm font-bold text-white">{selectedEnv.slots}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="flex-1 p-8 flex flex-col min-h-0">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2 flex-shrink-0">
                  <Settings className="w-4 h-4" /> Feature Modules
                </h3>
                
                <div className="flex-1 flex gap-8 min-h-0 overflow-hidden">
                  {/* LEFT HALF: Module Options */}
                  <div className="w-1/2 overflow-y-auto pr-4 space-y-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {modules.map(mod => {
                      const isSelected = mod.id === selectedModuleId;
                      const Icon = mod.icon;
                      return (
                        <button
                          key={mod.id}
                          onClick={() => setSelectedModuleId(mod.id)}
                          className={`w-full text-left flex items-center gap-4 p-4 rounded-xl transition-all border ${isSelected ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isSelected ? 'bg-white/5 border-white/10' : 'bg-transparent border-transparent'} transition-colors`}>
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-white/40'}`} />
                          </div>
                          <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-white/40'}`}>{mod.title}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* RIGHT HALF: Upgrades */}
                  <div className="w-1/2 overflow-y-auto pl-4 space-y-2 relative" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <AnimatePresence mode="wait">
                      {selectedModule && (
                        <motion.div
                          key={selectedModule.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col gap-2"
                        >
                          {selectedModule.upgrades.map((upgrade, idx) => {
                            const isUnlocked = upgrade.unlocked;
                            return (
                              <div 
                                key={upgrade.id}
                                onClick={() => handleUpgradeToggle(selectedModule.id, upgrade.id)}
                                className={`flex items-center gap-3 p-4 rounded-xl transition-all cursor-pointer group border ${isUnlocked ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                              >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${isUnlocked ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-white/20'}`} />
                                <span className={`text-sm font-semibold transition-colors ${isUnlocked ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
                                  {upgrade.name}
                                </span>
                                {!isUnlocked && (
                                  <Lock className="w-3 h-3 ml-auto text-white/20 group-hover:text-white/40 transition-colors" />
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL (35%) - Live Environment Preview */}
            <div className="w-[35%] h-full relative overflow-hidden bg-black flex flex-col">
              {/* 3D Room Viewer */}
              <div className="absolute inset-0 opacity-80">
                 {selectedEnv?.modelUrl ? (
                   <MiniRoomViewer roomUrl={selectedEnv.modelUrl} />
                 ) : (
                   <img src={selectedEnv?.image} alt={selectedEnv?.name} className="w-full h-full object-cover opacity-60" />
                 )}
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

              {/* Status Indicators overlaid on preview */}
              <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10 pointer-events-none">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Preview</span>
                </div>
                <div className="flex flex-col gap-2 max-h-[60%] overflow-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {modules.filter(m => m.upgrades.some(u => u.unlocked)).map(m => (
                    <div key={`preview-${m.id}`} className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30">
                      <m.icon className="w-3 h-3 text-cyan-400" />
                      <span className="text-[10px] font-bold text-cyan-100 uppercase tracking-wider">{m.title} Active</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Overlay at bottom */}
              <div className="absolute bottom-12 left-8 right-8 z-10 flex flex-col gap-3">
                <button 
                  onClick={() => {
                    if (onSelectEnv && selectedEnv) {
                      onSelectEnv({
                        id: selectedEnv.id,
                        name: selectedEnv.name,
                        modelUrl: selectedEnv.modelUrl,
                        isSkybox: false
                      });
                      onClose();
                    }
                  }}
                  className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] flex items-center justify-center gap-3 group cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                  Enter World
                </button>
                <button className="w-full py-3 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  <PenTool className="w-4 h-4" />
                  Edit Mode
                </button>
              </div>

              {/* Target Reticle decoration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/10 rounded-full flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 bg-cyan-400/50 rounded-full" />
                <div className="absolute top-0 w-px h-4 bg-white/20" />
                <div className="absolute bottom-0 w-px h-4 bg-white/20" />
                <div className="absolute left-0 w-4 h-px bg-white/20" />
                <div className="absolute right-0 w-4 h-px bg-white/20" />
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}