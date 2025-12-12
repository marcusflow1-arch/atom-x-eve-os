import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Circle, X, ArrowLeft, Settings,
  Home, BookOpen, Zap, Sword, Gamepad2, Target, Layers,
  ChevronLeft, ChevronRight, User, Trophy, MessageSquare, Shield, Swords, Bot, Crown, Radio, Users, Globe,
  Grid, ArrowUpAz, ArrowDownAz, ArrowUp, ArrowDown, GripVertical, Clapperboard,
  Film, Sparkles, Play, ShoppingBag, Tv, Monitor, Mountain, Feather, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { base44 } from '@/api/base44Client';

// Transparent 3D Model Viewer with WASD Controls
function TransparentModel3DViewer({ modelUrl }) {
  const containerRef = useRef(null);
  const modelRef = useRef(null);
  const actionsRef = useRef({});
  const keysPressed = useRef({});
  const velocityRef = useRef(new THREE.Vector3());
  const isJumpingRef = useRef(false);
  const controlsActive = useRef(false);
  const [animations, setAnimations] = React.useState([]);
  const [isActive, setIsActive] = React.useState(false);

  // Fetch animations for Y Bot
  useEffect(() => {
    const fetchAnimations = async () => {
      try {
        const anims = await base44.entities.AnimationFBX.list();
        setAnimations(anims);
      } catch (error) {
        console.error('Failed to load animations:', error);
      }
    };
    fetchAnimations();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.enabled = true;

    // Click handler to activate controls
    const handleCanvasClick = () => {
      controlsActive.current = !controlsActive.current;
      setIsActive(controlsActive.current);
      if (controlsActive.current) {
        renderer.domElement.style.cursor = 'none';
      } else {
        renderer.domElement.style.cursor = 'pointer';
      }
    };
    renderer.domElement.addEventListener('click', handleCanvasClick);
    renderer.domElement.style.cursor = 'pointer';

    let mixer = null;
    const clock = new THREE.Clock();

    // Detect file type and use appropriate loader
    const extension = modelUrl.split('.').pop().toLowerCase();
    const isFBX = extension === 'fbx';

    const processModel = (model, animations) => {
      modelRef.current = model;

        model.traverse((node) => {
          if (node.isMesh || node.isSkinnedMesh) {
            node.frustumCulled = false;

            if (node.geometry) {
              try {
                node.geometry.computeBoundingBox();
                node.geometry.computeBoundingSphere();
              } catch (e) {
                console.warn('Failed to compute bounds for', node.name, e);
              }
            }

            if (node.material) {
              const applySide = (mat) => {
                mat.side = THREE.DoubleSide;
                mat.needsUpdate = true;
              };

              if (Array.isArray(node.material)) node.material.forEach(applySide);
              else applySide(node.material);
            }

            if (node.isSkinnedMesh) {
              node.skeleton && node.skeleton.pose && node.skeleton.pose();
              node.bindMatrix && node.bindMatrix.identity && node.bindMatrix.identity();
            }
          }
        });

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      model.scale.multiplyScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      scene.add(model);

      mixer = new THREE.AnimationMixer(model);

      // Find and store animations
      if (animations && animations.length > 0) {
        animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          const name = clip.name.toLowerCase();
          
          if (name.includes('idle') || name.includes('breathing')) actionsRef.current.idle = action;
          else if (name.includes('walk')) actionsRef.current.walk = action;
          else if (name.includes('run')) actionsRef.current.run = action;
          else if (name.includes('jump') || name.includes('fall')) actionsRef.current.jump = action;
          else if (name.includes('swing') || name.includes('attack') || name.includes('sword')) actionsRef.current.swing = action;
        });

        // Default to idle or first animation
        const idleAction = actionsRef.current.idle || mixer.clipAction(animations[0]);
        if (idleAction) {
          idleAction.play();
        }
      }
    };

    if (isFBX) {
      const loader = new FBXLoader();
      
      // Load main model
      loader.load(
        modelUrl,
        (fbx) => {
          fbx.traverse((node) => {
            if (node.isMesh || node.isSkinnedMesh) {
              node.frustumCulled = false;
              if (node.material) {
                const applySide = (mat) => {
                  mat.side = THREE.DoubleSide;
                  mat.needsUpdate = true;
                };
                if (Array.isArray(node.material)) node.material.forEach(applySide);
                else applySide(node.material);
              }
            }
          });

          // Load external animations
          const allClips = [...(fbx.animations || [])];
          let loadedCount = 0;

          animations.forEach((anim) => {
            loader.load(
              anim.file_url,
              (animFbx) => {
                if (animFbx.animations && animFbx.animations.length > 0) {
                  animFbx.animations.forEach(clip => {
                    // Rename clip based on animation type
                    if (anim.animation_type === 'idle') clip.name = 'idle';
                    else if (anim.animation_type === 'run') clip.name = 'run';
                    else if (anim.name.toLowerCase().includes('falling')) clip.name = 'fall';
                    allClips.push(clip);
                  });
                }
                loadedCount++;
                
                // Process model after all animations loaded
                if (loadedCount === animations.length) {
                  processModel(fbx, allClips);
                }
              },
              undefined,
              (err) => console.error(`Error loading animation ${anim.name}:`, err)
            );
          });

          // If no external animations, process immediately
          if (animations.length === 0) {
            processModel(fbx, allClips);
          }
        },
        undefined,
        (err) => console.error('Error loading FBX model:', err)
      );
    } else {
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((node) => {
            if (node.isMesh || node.isSkinnedMesh) {
              node.frustumCulled = false;

              if (node.geometry) {
                try {
                  node.geometry.computeBoundingBox();
                  node.geometry.computeBoundingSphere();
                } catch (e) {
                  console.warn('Failed to compute bounds for', node.name, e);
                }
              }

              if (node.material) {
                const applySide = (mat) => {
                  mat.side = THREE.DoubleSide;
                  mat.needsUpdate = true;
                };

                if (Array.isArray(node.material)) node.material.forEach(applySide);
                else applySide(node.material);
              }

              if (node.isSkinnedMesh) {
                node.skeleton && node.skeleton.pose && node.skeleton.pose();
                node.bindMatrix && node.bindMatrix.identity && node.bindMatrix.identity();
              }
            }
          });
          processModel(model, gltf.animations);
        },
        undefined,
        (err) => console.error('Error loading GLTF model:', err)
      );
    }

    // Keyboard Controls
    const handleKeyDown = (e) => {
      if (!controlsActive.current) return;
      
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;

      // Spacebar for jump
      if (key === ' ') {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (!controlsActive.current) return;
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const setBaseAction = (name) => {
      const action = actionsRef.current[name];
      if (!action) return;

      // Stop all other animations
      Object.values(actionsRef.current).forEach(a => {
        if (a !== action) {
          a.fadeOut(0.2);
        }
      });

      if (!action.isRunning()) {
        action.reset();
        action.fadeIn(0.2);
        action.setLoop(THREE.LoopRepeat);
        action.play();
      }
    };

    const mixAction = (name, fadeDuration, weight) => {
      const action = actionsRef.current[name];
      if (!action) return;

      action.setEffectiveWeight(weight);
      if (!action.isRunning()) {
        action.reset();
        action.fadeIn(fadeDuration);
        action.play();
      }
    };

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      
      if (modelRef.current && controlsActive.current) {
        const moveSpeed = 0.04;
        let direction = new THREE.Vector3();

        // WASD movement
        if (keysPressed.current.w) direction.z -= 1;
        if (keysPressed.current.s) direction.z += 1;
        if (keysPressed.current.a) direction.x -= 1;
        if (keysPressed.current.d) direction.x += 1;

        const dirLength = direction.length();
        const isMoving = dirLength > 0.01;
        const grounded = !isJumpingRef.current && modelRef.current.position.y <= 0;

        // Jumping
        if (keysPressed.current[' '] && grounded) {
          isJumpingRef.current = true;
          velocityRef.current.y = 0.15;
        }

        // Apply gravity
        if (isJumpingRef.current || modelRef.current.position.y > 0) {
          velocityRef.current.y -= 0.008;
          modelRef.current.position.y += velocityRef.current.y;
          
          if (modelRef.current.position.y <= 0) {
            modelRef.current.position.y = 0;
            isJumpingRef.current = false;
            velocityRef.current.y = 0;
          }
        }

        // PlayerController Logic
        if (grounded) {
          if (isMoving) {
            direction.normalize();
            
            // Move model
            modelRef.current.position.x += direction.x * moveSpeed;
            modelRef.current.position.z += direction.z * moveSpeed;

            // Rotate model to face movement direction
            const angle = Math.atan2(direction.x, direction.z);
            modelRef.current.rotation.y = angle;

            // Play running animation
            if (actionsRef.current.run && !actionsRef.current.run.isRunning()) {
              setBaseAction('run');
            }
          } else {
            // Play idle when stopped
            if (actionsRef.current.idle && !actionsRef.current.idle.isRunning()) {
              setBaseAction('idle');
            }
          }
        } else {
          // Falling overrides everything when not grounded
          if (actionsRef.current.jump && !actionsRef.current.jump.isRunning()) {
            setBaseAction('jump');
          }
        }

        // Keep camera following model
        const offset = new THREE.Vector3(0, 1.5, 5);
        camera.position.x = modelRef.current.position.x + offset.x;
        camera.position.y = modelRef.current.position.y + offset.y;
        camera.position.z = modelRef.current.position.z + offset.z;
        controls.target.copy(modelRef.current.position);
        controls.update();
      } else if (modelRef.current && !controlsActive.current) {
        // When inactive, play idle animation
        if (actionsRef.current.idle && !actionsRef.current.idle.isRunning()) {
          setBaseAction('idle');
        }
      }
      
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [modelUrl, animations]);

  return <div ref={containerRef} className="w-full h-full" />;
}
import InventoryPanel from '../components/profile/InventoryPanel';
import LunaStatsPanel from '../components/profile/LunaStatsPanel';
import LunaCardScroll from '../components/profile/LunaCardScroll';
import SettingsPanel from '../components/dashboard/SettingsPanel';
import LoadoutPanel from '../components/dashboard/LoadoutPanel';
import GenreMastery from './GenreMastery';
import BattleModeOverlay from '../components/dashboard/BattleModeOverlay';
import AIHomeOverlay from '../components/dashboard/AIHomeOverlay';
import AIStoryOverlay from '../components/dashboard/AIStoryOverlay';
import AINewsContent from '../components/dashboard/AINewsContent';
import SeasonalPassContent from '../components/dashboard/SeasonalPassContent';
import ShinyCard from '../components/shared/ShinyCard';
import CardEnhancementOverlay from '../components/profile/CardEnhancementOverlay';
import { inventoryData, profileData } from '../components/profile/mockData';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useDashboardMode } from '../components/dashboard/DashboardModeContext';
import UserInterfaceView from '../components/dashboard/views/UserInterfaceView';
import PinGamesContent from '../components/dashboard/PinGamesContent';
import StreamingDiscovery from '../components/streaming/StreamingDiscovery';
import SocialHub from '../components/dashboard/SocialHub';
import UserProfileOverlay from '../components/profile/UserProfileOverlay';

// Orbital Menu Items
const ORBITAL_ITEMS = [
  { 
    id: 'skill-tree', 
    label: 'Skill Tree', 
    icon: Layers, 
    color: 'from-purple-500 to-pink-500', 
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    description: 'View & Unlock Abilities'
  },
  { 
    id: 'battle', 
    label: 'Battle Mode', 
    icon: Swords, 
    color: 'from-red-500 to-orange-500', 
    route: 'Challenges',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    description: 'Enter Combat Arena'
  },

  { 
    id: 'story', 
    label: 'AI Story', 
    icon: BookOpen, 
    color: 'from-indigo-500 to-purple-500', 
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    description: 'Continue Your Journey'
  },
  { 
    id: 'home', 
    label: 'AI Home', 
    icon: Home, 
    color: 'from-green-500 to-emerald-500', 
    route: 'Dashboard',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    description: 'Personal Space'
  },

  { 
    id: 'games', 
    label: 'PINGAMES', 
    icon: Gamepad2, 
    color: 'from-cyan-500 to-blue-500', 
    route: 'Library',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400',
    description: 'Your Game Library'
  },
];

// Expanded Grid View Component
const ExpandedGenreView = ({ genre, onClose, onCardClick }) => {
  // Generate 50 items
  const initialItems = Array.from({ length: 50 }, (_, i) => ({
    id: `item-${i}`,
    numericId: i + 1,
    title: `Item ${i + 1}`,
    rarity: ['Common', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 4)]
  }));

  // Chunk into rows of 8
  const chunkItems = (items, size) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  };

  const [rows, setRows] = useState(() => chunkItems(initialItems, 8));

  const moveRow = (index, direction) => {
    if (index + direction < 0 || index + direction >= rows.length) return;
    const newRows = Array.from(rows);
    const [removed] = newRows.splice(index, 1);
    newRows.splice(index + direction, 0, removed);
    setRows(newRows);
  };

  const handleDragEnd = (result) => {
    const { source, destination, type } = result;
    
    if (!destination) return;

    // Handle Row Reordering
    if (type === 'ROW') {
      const newRows = Array.from(rows);
      const [removed] = newRows.splice(source.index, 1);
      newRows.splice(destination.index, 0, removed);
      setRows(newRows);
      return;
    }

    // Handle Item Swapping (Row to Row or same Row)
    if (type === 'ITEM') {
      const sourceRowIndex = parseInt(source.droppableId.split('-')[1]);
      const destRowIndex = parseInt(destination.droppableId.split('-')[1]);
      
      const newRows = Array.from(rows).map(row => [...row]); // Deep copy
      
      if (destRowIndex < newRows.length) {
         const sourceItem = newRows[sourceRowIndex][source.index];
         
         // Check if dropping on an existing item to swap
         if (destination.index < newRows[destRowIndex].length) {
             const targetItem = newRows[destRowIndex][destination.index];
             
             // SWAP
             newRows[sourceRowIndex][source.index] = targetItem;
             newRows[destRowIndex][destination.index] = sourceItem;
         } else {
             // Append if moving to empty space (rare in grid but possible at end)
             newRows[sourceRowIndex].splice(source.index, 1);
             newRows[destRowIndex].splice(destination.index, 0, sourceItem);
         }
         setRows(newRows);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full h-full flex flex-col"
      >
        {/* Header / Toolbar */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            {genre} Inventory
          </h2>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 group"
          >
            <X className="w-5 h-5 text-white/60 group-hover:text-white" />
          </button>
        </div>

        {/* Rows Content */}
        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
          <Droppable droppableId="all-rows" type="ROW">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-6">
                {rows.map((row, rowIndex) => (
                  <Draggable key={`row-${rowIndex}`} draggableId={`row-${rowIndex}`} index={rowIndex}>
                    {(providedRow) => (
                      <div 
                        ref={providedRow.innerRef} 
                        {...providedRow.draggableProps} 
                        className="flex items-center gap-4 py-2"
                      >
                        {/* Left Control Circle */}
                        <div 
                          {...providedRow.dragHandleProps}
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors group shadow-lg z-10"
                        >
                          <ArrowUp 
                            className="w-3 h-3 text-white/50 hover:text-white mb-0.5 cursor-pointer" 
                            onClick={(e) => { e.stopPropagation(); moveRow(rowIndex, -1); }}
                          />
                          <div className="w-1 h-1 rounded-full bg-white/30 group-hover:bg-blue-400 mb-0.5" />
                          <ArrowDown 
                            className="w-3 h-3 text-white/50 hover:text-white cursor-pointer" 
                            onClick={(e) => { e.stopPropagation(); moveRow(rowIndex, 1); }}
                          />
                        </div>

                        {/* Items Row */}
                        <Droppable droppableId={`row-${rowIndex}`} type="ITEM" direction="horizontal">
                          {(providedItems) => (
                            <div 
                              ref={providedItems.innerRef} 
                              {...providedItems.droppableProps} 
                              className="flex-1 grid grid-cols-8 gap-4"
                            >
                              {row.map((item, itemIndex) => (
                                <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                  {(providedItem) => (
                                    <div
                                      ref={providedItem.innerRef}
                                      {...providedItem.draggableProps}
                                      {...providedItem.dragHandleProps}
                                      className="aspect-[3/4]"
                                      onClick={() => onCardClick(item)}
                                    >
                                      <ShinyCard>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-mono text-sm text-white/40">
                                            {item.numericId}
                                          </div>
                                        </div>
                                        <div className="absolute bottom-3 left-3">
                                          <div className="text-[8px] font-bold tracking-wider text-white/50 uppercase">{item.rarity}</div>
                                        </div>
                                      </ShinyCard>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {providedItems.placeholder}
                            </div>
                          )}
                        </Droppable>

                        {/* Right Control Circle */}
                        <div 
                          {...providedRow.dragHandleProps}
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors group shadow-lg z-10"
                        >
                           <GripVertical className="w-4 h-4 text-white/50 group-hover:text-white" />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </motion.div>
    </DragDropContext>
  );
};

// Mock Friends Data
const mockFriends = [
  { id: 1, name: 'Shadow_Striker', avatar: 'https://i.pravatar.cc/150?u=1', status: 'online', game: 'Cyberpunk 2088' },
  { id: 2, name: 'CyberVixen', avatar: 'https://i.pravatar.cc/150?u=2', status: 'online', game: 'Final Fantasy XIV' },
  { id: 3, name: 'GhostReaper', avatar: 'https://i.pravatar.cc/150?u=3', status: 'idle' },
  { id: 4, name: 'IronFist', avatar: 'https://i.pravatar.cc/150?u=4', status: 'offline' },
  { id: 5, name: 'NovaStar', avatar: 'https://i.pravatar.cc/150?u=5', status: 'online', game: 'League of Legends' }
];

export default function LunaTemplate() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAINews, setShowAINews] = useState(false);
  const [showSeasonalPass, setShowSeasonalPass] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPinGames, setShowPinGames] = useState(false);
  const [expandedGenre, setExpandedGenre] = useState(null); // New State for Expanded View
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [uiVisible, setUiVisible] = useState(true);
  const [selectedCardForUpgrade, setSelectedCardForUpgrade] = useState(null);
  const [showBlankPage, setShowBlankPage] = useState(false);
  const [blankPageTab, setBlankPageTab] = useState('entertainment');
  const [selectedStreamingService, setSelectedStreamingService] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [modelUrl, setModelUrl] = useState(null);
  const [activeSkills, setActiveSkills] = useState([false, false, false, false, false]);
  const { mode } = useDashboardMode();

  // Fetch 3D Model and Animations
  useEffect(() => {
    const fetchModelAndAnimations = async () => {
      try {
        // Fetch Y Bot FBX Model
        const models = await base44.entities.ModelFBX.filter({ name: 'Y Bot' });
        if (models.length > 0) {
          setModelUrl(models[0].file_url);
        }
      } catch (error) {
        console.error('Failed to load 3D model:', error);
      }
    };
    fetchModelAndAnimations();
  }, []);

  // Skill Keybinds (1-5 keys)
  useEffect(() => {
    const handleSkillKey = (e) => {
      const key = e.key;
      if (['1', '2', '3', '4', '5'].includes(key)) {
        const index = parseInt(key) - 1;
        setActiveSkills(prev => {
          const newSkills = [...prev];
          newSkills[index] = !newSkills[index];
          return newSkills;
        });
      }
    };

    window.addEventListener('keydown', handleSkillKey);
    return () => window.removeEventListener('keydown', handleSkillKey);
  }, []);

  const itemCount = ORBITAL_ITEMS.length;
  const angleStep = 360 / itemCount;

  const getItemPosition = (index) => {
    const angle = ((index - activeIndex) * angleStep) * (Math.PI / 180);
    const radius = 350;
    const x = Math.sin(angle) * radius;
    const y = Math.cos(angle) * radius;
    const scale = index === activeIndex ? 1 : 0.75;
    const opacity = index === activeIndex ? 1 : 0.5;
    const zIndex = index === activeIndex ? 20 : 10;

    return { x, y, scale, opacity, zIndex };
  };

  const handleBoxClick = () => {
    setShowInventory(true);
  };

  if (mode === 'user') {
    return (
      <div className="h-screen w-full bg-slate-900 pt-24 px-8 pb-8">
        <UserInterfaceView />
      </div>
    );
  }

  return (

      <div 
        className="min-h-screen text-white p-8 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
      >
        {/* 3D Model Viewer - Centered */}
        {modelUrl && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[500px] pointer-events-auto z-30">
            <TransparentModel3DViewer modelUrl={modelUrl} />
          </div>
        )}
        {/* Circle Icon Button with Hover Dropdown */}
        <div className="fixed top-[4.75rem] left-4 z-40 group">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
            style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
          >
            <Circle className="w-5 h-5 text-white/80" />
          </button>

          {/* Dropdown Circle Icons on Hover */}
          <div className="absolute top-full left-0 mt-2 flex flex-col gap-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
            
            {/* World Events */}
            <button
              onClick={() => navigate(createPageUrl('WorldEvents'))}
              className="w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
              style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
            >
              <Globe className="w-5 h-5 text-white/80" />
            </button>

            {/* Pin Games */}
            <button
              onClick={() => setShowPinGames(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all border border-white/20 hover:border-cyan-400/40"
              style={{ 
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(147, 197, 253, 0.15) 50%, rgba(203, 213, 225, 0.2) 100%)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                boxShadow: '0 8px 32px rgba(30, 58, 138, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 20px rgba(147, 197, 253, 0.2)'
              }}
            >
              <Gamepad2 className="w-5 h-5 text-blue-100" />
            </button>

            {/* Seasonal Pass */}
            <button
              onClick={() => setShowSeasonalPass(true)}
              className="w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
              style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
            >
              <Crown className="w-5 h-5 text-white/80" />
            </button>

            {/* AI News */}
            <button
              onClick={() => setShowAINews(true)}
              className="w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
              style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
            >
              <Radio className="w-5 h-5 text-white/80" />
            </button>

            {/* User Interface */}
            <button
              onClick={() => setShowBlankPage(true)}
              className="w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
              style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
            >
              <User className="w-5 h-5 text-white/80" />
            </button>

          </div>
        </div>



        {/* Profile Circle Icon */}
        <motion.button
          className="absolute top-4 right-20 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border-2 border-white/20"
          style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
          onClick={() => setShowProfile(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <User className="w-6 h-6 text-white" />
        </motion.button>

        {/* Settings Gear Icon */}
        <motion.button
          className="absolute top-4 right-4 z-40 w-12 h-12 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10 text-white"
          style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
          onClick={() => setShowSettings(true)}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="w-6 h-6 text-white/80" />
        </motion.button>

        {/* Skills Section Above Dock */}
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4 pointer-events-auto">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-white/50">Skills</h2>
          
          {/* Decorative Lines */}
          <div className="relative w-52 h-4">
            <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/20"></div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/40"></div>
          </div>

          {/* Skill Boxes */}
          <div className="flex flex-col items-center gap-3">
            {/* Top Row: 2 boxes */}
            <div className="flex gap-3">
              {[0, 1].map(i => (
                <div 
                  key={`skill-top-${i}`}
                  className={`w-14 h-14 rounded-xl backdrop-blur-xl border shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center ${
                    activeSkills[i] 
                      ? 'bg-cyan-500/30 border-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.5)]' 
                      : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-white/60 text-xs font-bold">{i + 1}</span>
                </div>
              ))}
            </div>
            
            {/* Bottom Row: 3 boxes */}
            <div className="flex gap-3">
              {[2, 3, 4].map(i => (
                <div 
                  key={`skill-bottom-${i}`}
                  className={`w-14 h-14 rounded-xl backdrop-blur-xl border shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center ${
                    activeSkills[i] 
                      ? 'bg-cyan-500/30 border-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.5)]' 
                      : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-white/60 text-xs font-bold">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Dock Menu */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-end justify-center gap-6 pointer-events-auto pb-4 overflow-x-auto w-full px-8 no-scrollbar">
          {ORBITAL_ITEMS.filter(item => ['home'].includes(item.id)).map((item) => {
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.id}
                className="flex-shrink-0 cursor-pointer"
                onClick={() => setActiveDrawer(item)}
                whileHover={{ y: -20, transition: { duration: 0.3 } }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="w-[140px] h-[105px] rounded-xl overflow-hidden transition-all duration-500 flex flex-col items-center justify-center text-center p-3 border border-white/10 hover:border-white/30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {/* Icon Badge */}
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg mb-2 bg-opacity-80 backdrop-blur-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>

                  {/* Card Content */}
                  <div>
                    <h3 className="text-white font-bold text-xs mb-0.5 tracking-wide">{item.label}</h3>
                    <p className="text-white/60 text-[10px] leading-tight line-clamp-2">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Universal Slide-Out Drawer */}
        <AnimatePresence>
          {activeDrawer && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setActiveDrawer(null)}
              />
              <motion.div
                initial={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 0, scale: 0.95 } : { x: '-100%', opacity: 0 }}
                animate={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 1, scale: 1 } : { x: 0, opacity: 1 }}
                exit={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 0, scale: 0.95 } : { x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col ${
                  ['settings', 'skill-tree', 'battle', 'home', 'story'].includes(activeDrawer.id)
                    ? 'inset-0' 
                    : 'left-0 rounded-3xl'
                }`}
                style={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { 
                  WebkitBackdropFilter: 'blur(50px) saturate(200%)' 
                } : { 
                  top: '80px',
                  bottom: '48px',
                  width: '28vw',
                  WebkitBackdropFilter: 'blur(50px) saturate(200%)' 
                }}
              >
                {/* Header - Hidden for full screen apps that have their own header */}
                {!['skill-tree', 'battle', 'home', 'story'].includes(activeDrawer.id) && (
                  <div className="p-6 flex items-center justify-between">
                    <h2 className="text-white font-bold text-xl tracking-wider uppercase">{activeDrawer.label}</h2>
                    <button 
                      onClick={() => setActiveDrawer(null)}
                      className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                )}

                {/* Close Button Overlay for Full Screen Apps (Story has its own internal close button) */}
                {['battle', 'home'].includes(activeDrawer.id) && (
                  <button 
                    onClick={() => setActiveDrawer(null)}
                    className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                {/* Content Area */}
                <div className={`flex-1 overflow-y-auto ${activeDrawer.id === 'skill-tree' ? '' : 'p-6'}`}>
                  {activeDrawer.id === 'loadout' ? (
                    <LoadoutPanel />
                  ) : activeDrawer.id === 'settings' ? (
                    <SettingsPanel />
                  ) : activeDrawer.id === 'skill-tree' ? (
                    <GenreMastery onClose={() => setActiveDrawer(null)} />
                  ) : activeDrawer.id === 'battle' ? (
                    <BattleModeOverlay onClose={() => setActiveDrawer(null)} />
                  ) : activeDrawer.id === 'home' ? (
                    <AIHomeOverlay onClose={() => setActiveDrawer(null)} />
                  ) : activeDrawer.id === 'story' ? (
                    <AIStoryOverlay onClose={() => setActiveDrawer(null)} />
                  ) : activeDrawer.id === 'games' ? (
                    <div className="space-y-6">
                      {/* Pinned Games Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-white/80 font-semibold text-sm uppercase tracking-wider">Pinned Games</h3>
                        <span className="text-white/40 text-xs">Quick Access</span>
                      </div>

                      {/* Pinned Games Grid */}
                      <div className="grid grid-cols-7 gap-3">
                        {Array.from({ length: 70 }, (_, i) => {
                          const games = [
                            { title: 'Cyberpunk 2088', genre: 'RPG', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', status: 'Playing' },
                            { title: 'Neon Legends', genre: 'Action', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', status: 'Installed' },
                            { title: 'Stellar Odyssey', genre: 'Space Sim', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', status: 'Playing' },
                            { title: 'Shadow Realm', genre: 'Fantasy', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', status: 'Installed' },
                          ];
                          const game = games[i % games.length];
                          return { ...game, index: i };
                        }).map((game, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.02, 1) }}
                            onClick={() => setSelectedGame(game)}
                            className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-400/50 transition-all"
                          >
                            {/* Game Image */}
                            <img src={game.image} alt={game.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                            
                            {/* Status Badge */}
                            <div className="absolute top-1 right-1">
                              <div className={`w-2 h-2 rounded-full ${
                                game.status === 'Playing' ? 'bg-green-400' : 'bg-blue-400'
                              }`} />
                            </div>

                            {/* Game Info - Only on hover */}
                            <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white/60 text-[8px] uppercase tracking-wider mb-0.5">{game.genre}</p>
                              <h4 className="text-white font-bold text-[10px] mb-1 truncate">{game.title}</h4>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Add More Games */}
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="w-full border-2 border-dashed border-white/20 hover:border-cyan-400/50 rounded-xl py-8 text-white/40 hover:text-white/80 transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                          <Gamepad2 className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold">Pin More Games</span>
                      </motion.button>
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm">{activeDrawer.label} content will appear here</p>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Game Detail Drawer - Slides from Right */}
        <AnimatePresence>
          {selectedGame && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => setSelectedGame(null)}
              />
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 border-l rounded-none bg-white/[0.03] backdrop-blur-3xl border-white/[0.08] z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
                style={{ 
                  top: '80px',
                  bottom: '48px',
                  width: '35vw',
                  WebkitBackdropFilter: 'blur(50px) saturate(200%)' 
                }}
              >
                {/* Header */}
                <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                  <h2 className="text-white font-bold text-xl tracking-wider uppercase">Game Details</h2>
                  <button 
                    onClick={() => setSelectedGame(null)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Game Cover */}
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                    <img src={selectedGame.image} alt={selectedGame.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-2xl font-bold text-white mb-1">{selectedGame.title}</h3>
                      <p className="text-white/60 text-sm">{selectedGame.genre}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedGame.status === 'Playing' ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`} />
                    <span className="text-white font-semibold">{selectedGame.status}</span>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-lg py-3 text-white font-semibold transition-all flex items-center justify-center gap-2">
                      <Gamepad2 className="w-4 h-4" />
                      Launch Game
                    </button>
                    <button className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg py-3 text-white font-semibold transition-all">
                      View Library
                    </button>
                  </div>

                  {/* Game Stats */}
                  <div className="space-y-3">
                    <h4 className="text-white/80 font-semibold text-sm uppercase tracking-wider">Statistics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-white/40 text-xs mb-1">Playtime</p>
                        <p className="text-white font-bold text-lg">24.5h</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-white/40 text-xs mb-1">Achievements</p>
                        <p className="text-white font-bold text-lg">12/50</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-white/40 text-xs mb-1">Last Played</p>
                        <p className="text-white font-bold text-sm">2 hours ago</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-white/40 text-xs mb-1">Progress</p>
                        <p className="text-white font-bold text-lg">68%</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Achievements */}
                  <div className="space-y-3">
                    <h4 className="text-white/80 font-semibold text-sm uppercase tracking-wider">Recent Achievements</h4>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-semibold">Achievement Title</p>
                            <p className="text-white/40 text-xs">Unlocked today</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pin/Unpin Button */}
                  <button className="w-full bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg py-3 text-white font-semibold transition-all">
                    Unpin from Dashboard
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Back to Loadout X Button (Only visible when Inventory is open) */}
        <AnimatePresence>
          {showInventory && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setShowInventory(false)}
              className="fixed top-40 left-8 z-40 w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
              style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
            >
              <X className="w-5 h-5 text-white/80" />
              </motion.button>
              )}
              </AnimatePresence> */
              }

              {/* UI Toggle Side Bars */}
              <div className="fixed right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4">
                {/* Hide UI Bar */}
                <button 
                  onClick={() => setUiVisible(!uiVisible)}
                  className={`w-1 h-32 rounded-full transition-all duration-500 hover:h-40 ${
                    uiVisible 
                      ? 'bg-white/10 hover:bg-white/30 hover:w-1.5' 
                      : 'bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.5)] w-1.5'
                  }`}
                />
                
                {/* Social Hub Bar */}
                <button 
                  onClick={() => setShowBlankPage(true)}
                  className="w-1 h-32 rounded-full transition-all duration-500 hover:h-40 bg-purple-400/30 hover:bg-purple-400/50 hover:w-1.5 shadow-[0_0_15px_rgba(192,132,252,0.3)]"
                />
              </div>

              {/* Main Content Area */}
              <div className="w-full mt-24 px-12 relative">
              <AnimatePresence mode="wait">
              {!uiVisible && (
                <motion.div
                  key="hidden-ui"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full flex gap-8"
                >
                  {/* Friends List - Far Left */}
                  <div className="w-80 flex-shrink-0">
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full">
                      <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Friends Online
                      </h2>
                      <div className="space-y-3">
                        {mockFriends.map(friend => (
                          <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                            <div className="relative">
                              <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full" />
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                friend.status === 'online' ? 'bg-green-500' : friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold truncate">{friend.name}</p>
                              {friend.game ? (
                                <p className="text-blue-400 text-xs truncate">{friend.game}</p>
                              ) : (
                                <p className="text-slate-500 text-xs">Offline</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Center - Calendar, Clock & Date */}
                  <div className="flex-1 flex flex-col gap-6">
                    {/* Clock & Date */}
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
                      <div className="text-7xl font-bold text-white mb-2 font-mono">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-2xl text-white/60">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>

                    {/* Calendar */}
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex-1">
                      <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        Upcoming Events
                      </h2>
                      <div className="space-y-3">
                        {[
                          { time: '2:00 PM', title: 'Raid with Shadow_Striker', game: 'Destiny 2' },
                          { time: '5:30 PM', title: 'Tournament Match', game: 'League of Legends' },
                          { time: '8:00 PM', title: 'Clan Meeting', game: 'World of Warcraft' }
                        ].map((event, i) => (
                          <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="bg-purple-500/20 rounded-lg px-3 py-2 text-purple-300 font-bold text-sm">
                                {event.time}
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-semibold">{event.title}</p>
                                <p className="text-white/50 text-sm">{event.game}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI News */}
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                      <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                        <Radio className="w-5 h-5 text-green-400" />
                        Platform Updates
                      </h2>
                      <div className="space-y-3">
                        {[
                          { title: 'AdamXEve v2.5 Released', desc: 'New AI companion features and enhanced social hub', type: 'update' },
                          { title: 'Desktop App Update Required', desc: 'Version 1.8.0 now available for download', type: 'required' },
                          { title: 'New Tournament System', desc: 'Cross-game tournaments launching next week', type: 'feature' }
                        ].map((news, i) => (
                          <div key={i} className={`bg-white/5 rounded-lg p-4 border transition-colors cursor-pointer ${
                            news.type === 'required' ? 'border-red-500/50 hover:border-red-400' : 'border-white/10 hover:border-green-400/50'
                          }`}>
                            <div className="flex items-start gap-3">
                              <Bot className={`w-5 h-5 flex-shrink-0 mt-0.5 ${news.type === 'required' ? 'text-red-400' : 'text-green-400'}`} />
                              <div className="flex-1">
                                <p className="text-white font-semibold mb-1">{news.title}</p>
                                <p className="text-white/60 text-sm">{news.desc}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {uiVisible && (
                <motion.div
                  key="visible-ui"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full"
                >
                <AnimatePresence mode="wait">
                  {expandedGenre ? (
                    <ExpandedGenreView 
                      genre={expandedGenre} 
                      onClose={() => setExpandedGenre(null)} 
                      onCardClick={setSelectedCardForUpgrade}
                    />
                  ) : !showInventory ? (
                    <motion.div 
                      key="boxes"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-between gap-12"
                    >
                    <div className="flex flex-col items-start gap-8">
                      {/* Weapons Section - 3 boxes */}
                      <div className="flex flex-col items-center">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-4 text-white/50">Weapons</h2>
                        
                        {/* Decorative Lines */}
                        <div className="relative w-64 h-4 mb-4">
                          <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/40"></div>
                        </div>
                        
                        <div className="flex gap-4">
                          {[1, 2, 3].map(i => (
                            <div key={`weapon-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>

                      {/* Armor Section - 3x3 grid */}
                      <div className="flex flex-col items-center gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-white/50">Armor</h2>
                        
                        {/* Decorative Lines */}
                        <div className="relative w-64 h-4">
                          <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/40"></div>
                        </div>
                        
                        {/* Top: 3 boxes */}
                        <div className="flex gap-4">
                          {[1, 2, 3].map(i => (
                            <div key={`armor-top-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>

                        {/* Middle: 3 boxes */}
                        <div className="flex gap-4">
                          {[1, 2, 3].map(i => (
                            <div key={`armor-mid-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>

                        {/* Bottom: 3 boxes */}
                        <div className="flex gap-4">
                          {[1, 2, 3].map(i => (
                            <div key={`armor-bot-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>

                      {/* Genre Mastery Section - 2 boxes */}
                      <div className="flex flex-col items-center gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50">Genre Mastery</h2>
                        
                        {/* Decorative Lines */}
                        <div className="relative w-52 h-4">
                          <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/40"></div>
                        </div>
                        
                        <div className="flex gap-4">
                          {[1, 2].map(i => (
                            <div key={`genre-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>

                      {/* Aspect Section - 3 circular boxes */}
                      <div className="flex flex-col items-center gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50">Aspect</h2>

                        {/* Decorative Lines */}
                        <div className="relative w-64 h-4">
                          <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/40"></div>
                        </div>

                        <div className="flex gap-4">
                          {[1, 2, 3].map(i => (
                            <div key={`aspect-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>

                      {/* AI Passives Section - 2 boxes on top, 3 centered below */}
                      <div className="flex flex-col items-center gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50">AI Passives</h2>

                        {/* Decorative Lines */}
                        <div className="relative w-52 h-4">
                          <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/40"></div>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                          <div className="flex gap-4">
                            {[1, 2].map(i => (
                              <div key={`passive-top-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                            ))}
                          </div>
                          <div className="flex gap-4">
                            {[3, 4, 5].map(i => (
                              <div key={`passive-bottom-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Artifacts Section - 2 boxes on top, 3 centered below */}
                      <div className="flex flex-col items-center gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50">Artifacts</h2>

                        {/* Decorative Lines */}
                        <div className="relative w-52 h-4">
                          <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/20"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/40"></div>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                          <div className="flex gap-4">
                            {[1, 2].map(i => (
                              <div key={`artifact-top-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                            ))}
                          </div>
                          <div className="flex gap-4">
                            {[3, 4, 5].map(i => (
                              <div key={`artifact-bottom-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side Stats Panel */}
                    <div className="flex-shrink-0 pt-6 flex flex-col">
                      <LunaStatsPanel />
                      <LunaCardScroll onExpand={setExpandedGenre} onCardClick={setSelectedCardForUpgrade} />
                    </div>

                  </motion.div>
            ) : (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                className="w-full max-w-5xl"
              >
                <InventoryPanel 
                  inventory={inventoryData} 
                  capacity={profileData.inventoryCapacity} 
                  profile={profileData} 
                  onClose={() => setShowInventory(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        )}
        </AnimatePresence>
        </div>

      {/* Blank Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col rounded-r-3xl border-r border-white/10"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <div className="p-6 flex justify-end">
                  <button 
                    onClick={() => setDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
              </div>
              {/* Menu Content Area */}
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
                {ORBITAL_ITEMS.filter(item => ['story', 'battle', 'skill-tree', 'home'].includes(item.id)).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setDrawerOpen(false);
                        setActiveDrawer(item);
                      }}
                      className="w-full p-4 transition-all group flex items-center gap-4 hover:scale-105"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left relative">
                        <h3 className="text-white font-bold text-lg">{item.label}</h3>
                        <p className="text-white/40 text-xs">{item.description}</p>
                        <div className="absolute -bottom-2 left-0 h-0.5 bg-blue-500 transition-all duration-300 w-0 group-hover:w-full" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <div className="flex-1 overflow-y-auto">
                <SettingsPanel />
              </div>
              
              <button 
                onClick={() => setShowSettings(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI News Overlay */}
      <AnimatePresence>
        {showAINews && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowAINews(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <div className="flex-1 overflow-y-auto">
                <AINewsContent />
              </div>
              
              <button 
                onClick={() => setShowAINews(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Seasonal Pass Overlay */}
      <AnimatePresence>
        {showSeasonalPass && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowSeasonalPass(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <div className="flex-1 overflow-y-auto">
                <SeasonalPassContent />
              </div>
              
              <button 
                onClick={() => setShowSeasonalPass(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>





      {/* Pin Games Overlay */}
      <AnimatePresence>
        {showPinGames && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowPinGames(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 flex flex-col p-8"
              style={{ 
                background: 'rgba(30, 41, 59, 0.25)', // Very translucent grayish dark blue
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex-1 overflow-hidden">
                <PinGamesContent />
              </div>
              
              <button 
                onClick={() => setShowPinGames(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Card Enhancement Overlay */}
      <AnimatePresence>
        {selectedCardForUpgrade && (
          <CardEnhancementOverlay 
            card={selectedCardForUpgrade} 
            onClose={() => setSelectedCardForUpgrade(null)} 
          />
        )}
      </AnimatePresence>

      {/* Blank Page Overlay */}
      <AnimatePresence>
        {showBlankPage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowBlankPage(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 flex flex-col p-8"
              style={{ 
                background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.15) 0%, rgba(191, 219, 254, 0.1) 50%, rgba(147, 197, 253, 0.05) 100%)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 8px 32px rgba(59, 130, 246, 0.15)'
              }}
            >
              {/* Header with Tabs */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                  <h2 className="text-3xl font-bold text-white/90 drop-shadow-lg">User Interface</h2>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBlankPageTab('entertainment')}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                        blankPageTab === 'entertainment'
                          ? 'text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)]'
                          : 'text-white/60 hover:text-white'
                      }`}
                      style={blankPageTab === 'entertainment' ? {
                        background: 'rgba(59, 130, 246, 0.3)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(147, 197, 253, 0.3)'
                      } : {}}
                    >
                      Entertainment
                    </button>
                    <button
                      onClick={() => setBlankPageTab('streaming')}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                        blankPageTab === 'streaming'
                          ? 'text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)]'
                          : 'text-white/60 hover:text-white'
                      }`}
                      style={blankPageTab === 'streaming' ? {
                        background: 'rgba(59, 130, 246, 0.3)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(147, 197, 253, 0.3)'
                      } : {}}
                    >
                      Streaming
                    </button>
                    <button
                      onClick={() => setBlankPageTab('social')}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                        blankPageTab === 'social'
                          ? 'text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)]'
                          : 'text-white/60 hover:text-white'
                      }`}
                      style={blankPageTab === 'social' ? {
                        background: 'rgba(59, 130, 246, 0.3)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(147, 197, 253, 0.3)'
                      } : {}}
                    >
                      Social Hub
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowBlankPage(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={blankPageTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto"
                  >
                    {blankPageTab === 'entertainment' && (
                      <AnimatePresence mode="wait">
                        {!selectedStreamingService ? (
                          <motion.div
                            key="service-grid"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            className="flex flex-wrap gap-4"
                          >
                            {[
                              { name: 'Netflix', icon: Film, color: 'rgba(229, 9, 20, 0.3)', topText: 'Netflix', bottomText: '' },
                              { name: 'Disney+', icon: Sparkles, color: 'rgba(17, 60, 207, 0.3)', topText: 'Disney', bottomText: '+' },
                              { name: 'HBO Max', icon: Play, color: 'rgba(185, 28, 255, 0.3)', topText: 'HBO', bottomText: 'Max' },
                              { name: 'Prime Video', icon: ShoppingBag, color: 'rgba(0, 168, 225, 0.3)', topText: 'Prime', bottomText: 'Video' },
                              { name: 'Hulu', icon: Tv, color: 'rgba(28, 231, 131, 0.3)', topText: 'Hulu', bottomText: '' },
                              { name: 'Apple TV+', icon: Monitor, color: 'rgba(0, 0, 0, 0.5)', topText: 'Apple', bottomText: 'TV+' },
                              { name: 'Paramount+', icon: Mountain, color: 'rgba(0, 99, 235, 0.3)', topText: 'Paramount', bottomText: '+' },
                              { name: 'Peacock', icon: Feather, color: 'rgba(0, 0, 0, 0.4)', topText: 'Peacock', bottomText: '' }
                            ].map((service, idx) => {
                              const Icon = service.icon;
                              return (
                                <motion.div
                                  key={service.name}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  onClick={() => setSelectedStreamingService(service.name)}
                                  className="w-20 h-20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform p-1"
                                  style={{
                                    background: `linear-gradient(135deg, ${service.color} 0%, rgba(147, 197, 253, 0.15) 100%)`,
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                  }}
                                >
                                  <span className="text-white/90 text-[10px] font-semibold">{service.topText}</span>
                                  <Icon className="w-5 h-5 text-white/90 my-0.5" />
                                  {service.bottomText && <span className="text-white/90 text-[10px] font-semibold">{service.bottomText}</span>}
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        ) : (
                          <motion.div
                            key="streaming-app"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="fixed inset-0 flex items-center justify-center bg-black z-[100]"
                          >
                            <button
                              onClick={() => setSelectedStreamingService(null)}
                              className="fixed top-8 right-8 text-white/60 hover:text-white transition-colors"
                            >
                              <X className="w-8 h-8" />
                            </button>

                            <div className="text-center">
                              <Clapperboard className="w-16 h-16 text-white/40 mx-auto mb-4" />
                              <p className="text-white/60 text-lg">{selectedStreamingService} app will load here</p>
                              <p className="text-white/40 text-sm mt-2">Streaming interface coming soon</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                    {blankPageTab === 'streaming' && (
                      <StreamingDiscovery />
                    )}
                    {blankPageTab === 'social' && (
                      <SocialHub />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Score Display */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl pointer-events-none"
      >
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total Score</div>
          <div className="text-xl font-black text-white leading-none">12,450</div>
        </div>
      </motion.div>

      {/* User Profile Overlay */}
      <UserProfileOverlay 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
      </div>
    
  );
}