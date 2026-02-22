import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Grid3x3, Sun, Box, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EngineViewport({ onSceneReady }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [objectCount, setObjectCount] = useState(0);
  const clockRef = useRef(new THREE.Clock());
  const mixersRef = useRef([]);
  const characterRef = useRef(null);
  const keysRef = useRef({});

  // Combat State
  const gameRef = useRef({
    isActive: false,
    lastSpawn: 0,
    spawnInterval: 5000,
    enemies: [], // { id, mesh, hp, maxHp }
    projectiles: [],
    score: 0
  });

  const [hudState, setHudState] = useState({
    playerHp: 100,
    playerMaxHp: 100,
    exp: 0,
    level: 1,
    enemies: [] // Synced with gameRef for UI { id, hp, maxHp, screenX, screenY }
  });

  useEffect(() => {
    const onKeyDown = (e) => { 
        keysRef.current[e.code] = true; 
        
        // Attack Input (K or Space)
        if ((e.code === 'KeyK' || e.code === 'Space') && characterRef.current && gameRef.current.isActive) {
            handlePlayerAttack();
        }
    };
    const onKeyUp = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handlePlayerAttack = () => {
      // 1. Play Kick Animation (if available) - Logic handled in mixer usually, strictly separate here for damage
      // Assuming 'K' triggers the animation via other controllers or we force it here if we had access to the mixer directly.
      // For now, calculate damage immediately.
      
      const playerPos = characterRef.current.position;
      const range = 3.0;
      const damage = 50;

      gameRef.current.enemies.forEach(enemy => {
          if (enemy.mesh.position.distanceTo(playerPos) < range) {
              enemy.hp -= damage;
              // Floating text or effect could go here
              console.log(`Hit enemy ${enemy.id} for ${damage} dmg`);
          }
      });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(5, 4, 8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Grid
    const grid = new THREE.GridHelper(50, 50, 0x444466, 0x222244);
    grid.name = 'grid';
    scene.add(grid);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404070, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x6688cc, 0.5);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e1e3a, roughness: 0.9 });
    const ground = groundGeo ? new THREE.Mesh(groundGeo, groundMat) : null;
    if (ground) {
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      ground.name = 'ground';
      scene.add(ground);
    }

    // Starter cube
    const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3, metalness: 0.5 });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.position.set(0, 0.5, 0);
    cube.castShadow = true;
    cube.name = 'StarterCube';
    scene.add(cube);
    setObjectCount(1);

    // Expose scene API
    if (onSceneReady) {
      onSceneReady({
        scene,
        camera,
        renderer,
        setupCombatScenario: () => {
            gameRef.current.isActive = true;
            gameRef.current.lastSpawn = 0; // Trigger immediate spawn logic check
            setHudState(prev => ({ ...prev, playerHp: 100, exp: 0 }));
            console.log("Combat Scenario Initiated");
        },
        addModel: async (url, options = {}) => {
          const lower = url.toLowerCase();
          let obj;
          try {
            if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
              const gltf = await new GLTFLoader().loadAsync(url);
              obj = gltf.scene;
              if (gltf.animations?.length > 0) {
                const mixer = new THREE.AnimationMixer(obj);
                gltf.animations.forEach(clip => mixer.clipAction(clip).play());
                mixersRef.current.push(mixer);
              }
            } else if (lower.endsWith('.fbx')) {
              obj = await new FBXLoader().loadAsync(url);
              if (obj.animations?.length > 0) {
                const mixer = new THREE.AnimationMixer(obj);
                obj.animations.forEach(clip => mixer.clipAction(clip).play());
                mixersRef.current.push(mixer);
              }
            }
            if (obj) {
              // Apply options
              if (options.position) obj.position.set(options.position.x, options.position.y, options.position.z);
              if (options.scale) obj.scale.set(options.scale.x, options.scale.y, options.scale.z);
              else {
                 // Auto-scale default if not provided
                const box = new THREE.Box3().setFromObject(obj);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 0) obj.scale.setScalar(3 / maxDim);
              }
              
              if (options.animation_url) {
                 const animLoader = new FBXLoader();
                 const animObj = await animLoader.loadAsync(options.animation_url);
                 if (animObj.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(obj);
                    const action = mixer.clipAction(animObj.animations[0]);
                    action.play();
                    mixersRef.current.push(mixer);
                 }
              }

              obj.traverse(child => {
                if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
              });
              scene.add(obj);
              setObjectCount(c => c + 1);
            }
          } catch(e) { console.error("Failed to load model", e); }
        },
        addPrimitive: (type, options = {}) => {
          let geo;
          switch(type) {
            case 'cube': geo = new THREE.BoxGeometry(1, 1, 1); break;
            case 'sphere': geo = new THREE.SphereGeometry(0.5, 32, 32); break;
            case 'cylinder': geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
            case 'plane': geo = new THREE.PlaneGeometry(10, 10); break; // Larger default plane
            default: geo = new THREE.BoxGeometry(1, 1, 1);
          }
          const color = options.color || (Math.random() * 0xffffff);
          const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });
          const mesh = new THREE.Mesh(geo, mat);
          
          if (options.position) mesh.position.set(options.position.x, options.position.y, options.position.z);
          else mesh.position.set((Math.random() - 0.5) * 6, 0.5, (Math.random() - 0.5) * 6);
          
          if (options.scale) mesh.scale.set(options.scale.x, options.scale.y, options.scale.z);

          if (type === 'plane') {
             mesh.rotation.x = -Math.PI / 2;
             mesh.receiveShadow = true;
          } else {
             mesh.castShadow = true;
             mesh.receiveShadow = true;
          }

          mesh.name = type + '_' + Date.now();
          scene.add(mesh);
          setObjectCount(c => c + 1);
        },
        attachCharacterController: (mesh) => {
            characterRef.current = mesh;
            console.log("Character controller attached to:", mesh.name);
        },
        createTerrain: (options = {}) => {
            const size = options.size || 50;
            const segments = options.segments || 64;
            const color = options.color || 0x2d5a27; // forest green default
            
            const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
            
            // Heightmap
            const positionAttribute = geometry.attributes.position;
            for ( let i = 0; i < positionAttribute.count; i ++ ) {
                const x = positionAttribute.getX( i );
                const y = positionAttribute.getY( i );
                const z = (Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2) + (Math.random() * 0.2);
                positionAttribute.setZ( i, z );
            }
            geometry.computeVertexNormals();

            const material = new THREE.MeshStandardMaterial({ 
                color: color, 
                roughness: 0.9, 
                metalness: 0.05,
                flatShading: false
            });
            
            const terrain = new THREE.Mesh(geometry, material);
            terrain.rotation.x = -Math.PI / 2;
            terrain.receiveShadow = true;
            terrain.castShadow = true;
            terrain.name = 'Terrain';
            scene.add(terrain);
            setObjectCount(c => c + 1);

            // Detailed Grass (InstancedMesh)
            if (options.addFoliage) {
                const bladeGeo = new THREE.ConeGeometry(0.05, 0.5, 3);
                bladeGeo.translate(0, 0.25, 0);
                const bladeMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.6 });
                const grassCount = 2000;
                const grass = new THREE.InstancedMesh(bladeGeo, bladeMat, grassCount);
                
                const dummy = new THREE.Object3D();
                for (let i = 0; i < grassCount; i++) {
                    const x = (Math.random() - 0.5) * size;
                    const z = (Math.random() - 0.5) * size;
                    // Approximate height at x,z
                    const y = (Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2);
                    
                    dummy.position.set(x, y, z); // In terrain local space (rotated later)
                    // Since terrain is rotated X -90, y becomes z and z becomes -y... 
                    // Easier to place them in world space.
                }
                
                // Let's place grass in World Space
                scene.add(grass);
                for (let i = 0; i < grassCount; i++) {
                    const x = (Math.random() - 0.5) * size;
                    const z = (Math.random() - 0.5) * size;
                    // Re-calc height
                    const h = (Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2) + (Math.random() * 0.2);
                    
                    dummy.position.set(x, h, z);
                    dummy.scale.setScalar(0.5 + Math.random() * 0.5);
                    dummy.rotation.y = Math.random() * Math.PI;
                    dummy.rotation.x = (Math.random() - 0.5) * 0.2;
                    dummy.rotation.z = (Math.random() - 0.5) * 0.2;
                    dummy.updateMatrix();
                    grass.setMatrixAt(i, dummy.matrix);
                }
                grass.castShadow = true;
                grass.receiveShadow = true;
            }
        }
      });
    }

    // Animate
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      const now = Date.now();
      controls.update();
      mixersRef.current.forEach(m => m.update(delta));
      
      // GAME LOOP
      if (gameRef.current.isActive) {
          const game = gameRef.current;
          
          // 1. Spawning
          if (now - game.lastSpawn > game.spawnInterval && game.enemies.length < 5) {
              game.lastSpawn = now;
              // Spawn Enemy
              const geo = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
              const mat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
              const enemyMesh = new THREE.Mesh(geo, mat);
              // Random pos around center
              const angle = Math.random() * Math.PI * 2;
              const radius = 10 + Math.random() * 5;
              enemyMesh.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);
              scene.add(enemyMesh);
              
              game.enemies.push({
                  id: 'enemy_' + now,
                  mesh: enemyMesh,
                  hp: 100,
                  maxHp: 100,
                  lastAttack: 0
              });
              console.log("Spawned Enemy");
          }
          
          // 2. Enemy AI & Logic
          const deadEnemies = [];
          const enemiesForUI = [];
          
          game.enemies.forEach(enemy => {
              // Death Check
              if (enemy.hp <= 0) {
                  deadEnemies.push(enemy);
                  return;
              }
              
              // Movement
              if (characterRef.current) {
                  const playerPos = characterRef.current.position;
                  const dir = new THREE.Vector3().subVectors(playerPos, enemy.mesh.position).normalize();
                  const dist = playerPos.distanceTo(enemy.mesh.position);
                  
                  if (dist > 1.5) {
                      enemy.mesh.position.add(dir.multiplyScalar(2 * delta)); // Move
                      enemy.mesh.lookAt(playerPos.x, enemy.mesh.position.y, playerPos.z);
                  } else {
                      // Attack
                      if (now - enemy.lastAttack > 2000) { // 2s cooldown
                          enemy.lastAttack = now;
                          // Deal Damage
                          setHudState(prev => ({ ...prev, playerHp: Math.max(0, prev.playerHp - 1) })); // 1 damage
                          // Visual feedback
                          enemy.mesh.material.emissive.setHex(0xffffff);
                          setTimeout(() => enemy.mesh.material.emissive.setHex(0x000000), 200);
                      }
                  }
              }
              
              // Map to screen space for UI
              const vector = enemy.mesh.position.clone();
              vector.y += 2; // Above head
              vector.project(camera);
              const x = (vector.x * .5 + .5) * containerRef.current.clientWidth;
              const y = -(vector.y * .5 - .5) * containerRef.current.clientHeight;
              
              if (vector.z < 1) { // Only if in front of camera
                  enemiesForUI.push({ ...enemy, screenX: x, screenY: y });
              }
          });
          
          // Cleanup Dead
          deadEnemies.forEach(dead => {
              scene.remove(dead.mesh);
              game.enemies = game.enemies.filter(e => e.id !== dead.id);
              // EXP Reward
              setHudState(prev => ({ ...prev, exp: prev.exp + 20 }));
          });
          
          // Sync UI state every frame (expensive but smooth)
          setHudState(prev => ({ ...prev, enemies: enemiesForUI }));
      }
      
      // Character Movement (WASD)
      if (characterRef.current) {
          const speed = 5 * delta;
          const char = characterRef.current;
          
          if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) char.position.z -= speed;
          if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) char.position.z += speed;
          if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) char.position.x -= speed;
          if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) char.position.x += speed;
      }

      // Rotate starter cube gently
      if (cube) cube.rotation.y += delta * 0.3;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const toggleGrid = () => {
    const grid = sceneRef.current?.getObjectByName('grid');
    if (grid) grid.visible = !grid.visible;
    setShowGrid(!showGrid);
  };

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(5, 4, 8);
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/10" style={{ background: '#1a1a2e' }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Viewport Toolbar */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => setIsPlaying(!isPlaying)} className="h-7 px-2 bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white">
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={toggleGrid} className={`h-7 px-2 bg-black/40 backdrop-blur-md border border-white/10 ${showGrid ? 'text-cyan-400' : 'text-white/40'}`}>
          <Grid3x3 className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={resetCamera} className="h-7 px-2 bg-black/40 backdrop-blur-md border border-white/10 text-white/80">
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>

      {/* Status */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div className="px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-white/60 font-mono">
          {objectCount} objects
        </div>
        <div className="px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* COMBAT HUD */}
      {gameRef.current.isActive && (
          <>
            {/* Player Stats */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/20 w-80">
                <div className="flex justify-between text-xs text-white mb-1">
                    <span>HP {hudState.playerHp}/{hudState.playerMaxHp}</span>
                    <span>Lvl {hudState.level}</span>
                </div>
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div 
                        className="h-full bg-red-500 transition-all duration-300" 
                        style={{ width: `${(hudState.playerHp / hudState.playerMaxHp) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                    <span>EXP {hudState.exp}</span>
                </div>
                <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-yellow-400 transition-all duration-300" 
                        style={{ width: `${Math.min(100, hudState.exp % 100)}%` }} // Simple level curve
                    />
                </div>
            </div>
            
            {/* Enemy Health Bars (Floating) */}
            {hudState.enemies.map(enemy => (
                <div 
                    key={enemy.id}
                    className="absolute w-16 pointer-events-none"
                    style={{ 
                        left: enemy.screenX, 
                        top: enemy.screenY,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/10">
                        <div 
                            className="h-full bg-red-500" 
                            style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
          </>
      )}
    </div>
  );
}