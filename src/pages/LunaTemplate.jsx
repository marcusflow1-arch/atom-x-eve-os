import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, Settings,
  Home, BookOpen, Zap, Sword, Gamepad2, Target, Layers,
  ChevronLeft, ChevronRight, User, Trophy, MessageSquare, Shield, Swords, Bot, Crown, Radio, Users, Globe,
  Grid, ArrowUpAz, ArrowDownAz, ArrowUp, ArrowDown, GripVertical, Clapperboard,
  Film, Sparkles, Play, ShoppingBag, Tv, Monitor, Mountain, Feather, Calendar, Hammer
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { base44 } from '@/api/base44Client';
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
import HolographicTile from '@/components/dashboard/HolographicTile';
import CardEnhancementOverlay from '../components/profile/CardEnhancementOverlay';
import { inventoryData, profileData } from '../components/profile/mockData';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useDashboardMode } from '../components/dashboard/DashboardModeContext';
import UserInterfaceView from '../components/dashboard/views/UserInterfaceView';
import PinGamesContent from '../components/dashboard/PinGamesContent';
import StreamingDiscovery from '../components/streaming/StreamingDiscovery';
import LibrarySidebar from '../components/streaming/LibrarySidebar';
import SocialHub from '../components/dashboard/SocialHub';
import UserProfileOverlay from '../components/profile/UserProfileOverlay';
import FriendInteractionPanel from '../components/friends/FriendInteractionPanel';
import FriendRequestsPanel from '../components/friends/FriendRequestsPanel';
import { useAuth } from '../components/auth/AuthContext';
import IntelligentCalendarOverlay from '../components/calendar/IntelligentCalendarOverlay';
import PlatformUpdateModal from '../components/calendar/PlatformUpdateModal';
import FocusModePanel from '../components/dashboard/FocusModePanel';
import CommunityPage from './Community';
import Blacksmith from './Blacksmith';
import UpcomingEventsSection from '../components/dashboard/UpcomingEventsSection';
import Achievements from './Achievements';
import EntertainmentHub from '../components/dashboard/EntertainmentHub';
import useLunaStore from '../components/luna/useLunaStore';
import { useEquipment } from '../components/luna/hooks/useEquipment';
import { useSkills } from '../components/luna/hooks/useSkills';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { showError } from '@/components/error/ErrorToast';
import FriendsHubOverlay from '../components/dashboard/FriendsHubOverlay';
import SideAccessMenu from '../components/dashboard/SideAccessMenu';

// Transparent 3D Model Viewer with WASD Controls
function TransparentModel3DViewer({ modelUrl, weaponModel, triggerAnimation }) {
  const containerRef = useRef(null);
  const modelRef = useRef(null);
  const weaponRef = useRef(null);
  const actionsRef = useRef({});
  const keysPressed = useRef({});
  const velocityRef = useRef(new THREE.Vector3());
  const isJumpingRef = useRef(false);
  const controlsActive = useRef(false);
  const [animations, setAnimations] = React.useState([]);
  const [isActive, setIsActive] = React.useState(false);
  const [weaponAttached, setWeaponAttached] = React.useState(false);
  const currentWeaponRef = useRef(null);
  const currentBaseActionRef = useRef(null);

  // Zustand store state
  const equipment = useLunaStore((state) => state.equipment);
  const actions = useLunaStore((state) => state.actions);
  const animationBindings = useLunaStore((state) => state.animationBindings);
  const clearActions = useLunaStore((state) => state.clearActions);

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
    camera.position.set(0, 1.2, 3.5);

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

    const extension = modelUrl.split('.').pop().toLowerCase();
    const isFBX = extension === 'fbx';

    const processModel = (model, animations) => {
      modelRef.current = model;

      let rightHandBone = null;
      model.traverse((node) => {
        if (node.isBone) {
          const name = node.name.toLowerCase();
          if (name.includes("righthand") || name.includes("hand_r") || name.includes("mixamorig_righthand")) {
            rightHandBone = node;
          }
        }

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

            if (Array.isArray(node.material)) {
              node.material.forEach(applySide);
            } else {
              applySide(node.material);
            }
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

      if (weaponModel && rightHandBone) {
        const weaponLoader = new FBXLoader();
        weaponLoader.load(
          weaponModel,
          (weaponFbx) => {
            weaponRef.current = weaponFbx;
            weaponFbx.scale.multiplyScalar(0.01);
            rightHandBone.add(weaponFbx);
            weaponFbx.position.set(0, 0.1, 0);
            weaponFbx.rotation.set(Math.PI / 2, 0, 0);
            weaponFbx.visible = false;
            setWeaponAttached(true);
          },
          undefined,
          (err) => console.error('Error loading weapon:', err)
        );
      }

      mixer = new THREE.AnimationMixer(model);

      if (animations && animations.length > 0) {
        animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          const name = clip.name.toLowerCase();

          if (name.includes('idle') || name.includes('breathing')) actionsRef.current.idle = action;
          else if (name.includes('walk')) actionsRef.current.walk = action;
          else if (name.includes('run')) actionsRef.current.run = action;
          else if (name.includes('jump') || name.includes('fall')) actionsRef.current.jump = action;
          else if (name.includes('swing') || name.includes('attack') || name.includes('sword')) actionsRef.current.swing = action;
          else if (name.includes('kick')) actionsRef.current.kick = action;
          else if (name.includes('dance')) actionsRef.current.dance = action;
          else if (name.includes('wave') || name.includes('greet')) actionsRef.current.wave = action;
        });

        const idleAction = actionsRef.current.idle || mixer.clipAction(animations[0]);
        if (idleAction) {
          idleAction.play();
        }
      }
    };

    if (isFBX) {
      const loader = new FBXLoader();
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
                if (Array.isArray(node.material)) {
                  node.material.forEach(applySide);
                } else {
                  applySide(node.material);
                }
              }
            }
          });

          const allClips = [...(fbx.animations || [])];
          let loadedCount = 0;

          animations.forEach((anim) => {
            loader.load(
              anim.file_url,
              (animFbx) => {
                if (animFbx.animations && animFbx.animations.length > 0) {
                  animFbx.animations.forEach((clip) => {
                    if (anim.animation_type === 'idle') clip.name = 'idle';
                    else if (anim.animation_type === 'run') clip.name = 'run';
                    else if (anim.name.toLowerCase().includes('falling')) clip.name = 'fall';
                    allClips.push(clip);
                  });
                }
                loadedCount++;

                if (loadedCount === animations.length) {
                  processModel(fbx, allClips);
                }
              },
              undefined,
              (err) => console.error(`Error loading animation ${anim.name}:`, err)
            );
          });

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

                if (Array.isArray(node.material)) {
                  node.material.forEach(applySide);
                } else {
                  applySide(node.material);
                }
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

    const handleKeyDown = (e) => {
      if (!controlsActive.current) return;

      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;

      if (key === ' ') {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (!controlsActive.current) return;
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const animationLocked = { current: false };

    const setBaseAction = (name, once = false) => {
      if (animationLocked.current && !once) return;
      if (currentBaseActionRef.current === name && !once) return;

      const action = actionsRef.current[name];
      if (!action) return;

      currentBaseActionRef.current = name;

      Object.values(actionsRef.current).forEach((a) => {
        if (a !== action) {
          a.fadeOut(0.2);
        }
      });

      if (!action.isRunning() || once) {
        action.reset();
        action.fadeIn(0.2);
        action.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat);
        action.clampWhenFinished = once;
        action.play();

        if (once) {
          animationLocked.current = true;
          mixer.addEventListener('finished', function onFinish(e) {
            if (e.action === action) {
              animationLocked.current = false;
              mixer.removeEventListener('finished', onFinish);
            }
          });
        }
      }
    };

    const resolveIdle = () => {
      const state = useLunaStore.getState();
      const weapon = state.equipment.weapon;
      if (weapon && state.animationBindings?.weapon_idle?.[weapon]) {
        return state.animationBindings.weapon_idle[weapon];
      }
      return 'idle';
    };

    const handleAttack = () => {
      const state = useLunaStore.getState();
      if (!state.actions.attack) return;

      const weapon = state.equipment.weapon;
      if (!weapon) return;

      const anim = state.animationBindings?.weapon_attack?.[weapon];
      if (!anim || !actionsRef.current[anim]) return;

      setBaseAction(anim, true);
      state.clearActions();
    };

    const handleSkill = () => {
      const state = useLunaStore.getState();
      const skill = state.actions.skill;
      if (!skill) return;

      if (state.isOnCooldown(skill)) return;

      const anim = state.animationBindings?.skills?.[skill];
      if (!anim || !actionsRef.current[anim]) return;

      setBaseAction(anim, true);
      state.setCooldown(skill, Date.now() + 3000);
      state.clearActions();
    };

    const updateWeaponVisual = () => {
      if (!weaponRef.current) return;
      const state = useLunaStore.getState();
      const equipped = state.equipment.weapon === "sword_of_the_abyss";
      weaponRef.current.visible = equipped;
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

    let animationFrameId;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      updateWeaponVisual();

      const storeState = useLunaStore.getState();
      if (storeState.equippedWeapon !== currentWeaponRef.current) {
        currentWeaponRef.current = storeState.equippedWeapon;
      }

      if (modelRef.current && controlsActive.current) {
        const moveSpeed = 0.04;
        let direction = new THREE.Vector3();

        if (keysPressed.current['w']) direction.z -= 1;
        if (keysPressed.current['s']) direction.z += 1;
        if (keysPressed.current['a']) direction.x -= 1;
        if (keysPressed.current['d']) direction.x += 1;

        const dirLength = direction.length();
        const isMoving = dirLength > 0.01;
        const grounded = !isJumpingRef.current && modelRef.current.position.y <= 0;

        if (keysPressed.current[' '] && grounded) {
          isJumpingRef.current = true;
          velocityRef.current.y = 0.15;
        }

        if (isJumpingRef.current || modelRef.current.position.y > 0) {
          velocityRef.current.y -= 0.008;
          modelRef.current.position.y += velocityRef.current.y;

          if (modelRef.current.position.y <= 0) {
            modelRef.current.position.y = 0;
            isJumpingRef.current = false;
            velocityRef.current.y = 0;
          }
        }

        if (grounded) {
          const currentState = useLunaStore.getState();
          if (currentState.actions.skill) {
            handleSkill();
          }
          else if (currentState.actions.attack) {
            handleAttack();
          }
          else if (isMoving) {
            direction.normalize();
            modelRef.current.position.x += direction.x * moveSpeed;
            modelRef.current.position.z += direction.z * moveSpeed;
            const angle = Math.atan2(direction.x, direction.z);
            modelRef.current.rotation.y = angle;
            if (!animationLocked.current) {
              setBaseAction('run');
            }
          } else {
            if (!animationLocked.current) {
              setBaseAction(resolveIdle());
            }
          }
        } else {
          if (!animationLocked.current) {
            setBaseAction('jump');
          }
        }

        const offset = new THREE.Vector3(0, 1.5, 5);
        camera.position.x = modelRef.current.position.x + offset.x;
        camera.position.y = modelRef.current.position.y + offset.y;
        camera.position.z = modelRef.current.position.z + offset.z;
        controls.target.copy(modelRef.current.position);
        controls.update();
      } else if (modelRef.current && !controlsActive.current) {
        const currentState = useLunaStore.getState();
        if (currentState.actions.skill) {
          handleSkill();
        } else if (currentState.actions.attack) {
          handleAttack();
        } else if (!animationLocked.current) {
          setBaseAction(resolveIdle());
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, weaponModel, animations]);

  useEffect(() => {
    if (triggerAnimation && actionsRef.current[triggerAnimation]) {
      const action = actionsRef.current[triggerAnimation];
      action.reset();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.play();
    }
  }, [triggerAnimation]);

  return <div ref={containerRef} className="w-full h-full" />;
}

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
  }];


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

      const newRows = Array.from(rows).map((row) => [...row]); // Deep copy

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
        className="w-full h-full flex flex-col">

        {/* Header / Toolbar */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            {genre} Inventory
          </h2>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 group">

            <X className="w-5 h-5 text-white/60 group-hover:text-white" />
          </button>
        </div>

        {/* Rows Content */}
        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
          <Droppable droppableId="all-rows" type="ROW">
            {(provided) =>
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-6">
                {rows.map((row, rowIndex) =>
                  <Draggable key={`row-${rowIndex}`} draggableId={`row-${rowIndex}`} index={rowIndex}>
                    {(providedRow) =>
                      <div
                        ref={providedRow.innerRef}
                        {...providedRow.draggableProps}
                        className="flex items-center gap-4 py-2">

                        {/* Left Control Circle */}
                        <div
                          {...providedRow.dragHandleProps}
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors group shadow-lg z-10">

                          <ArrowUp
                            className="w-3 h-3 text-white/50 hover:text-white mb-0.5 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); moveRow(rowIndex, -1); }} />

                          <div className="w-1 h-1 rounded-full bg-white/30 group-hover:bg-blue-400 mb-0.5" />
                          <ArrowDown
                            className="w-3 h-3 text-white/50 hover:text-white cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); moveRow(rowIndex, 1); }} />

                        </div>

                        {/* Items Row */}
                        <Droppable droppableId={`row-${rowIndex}`} type="ITEM" direction="horizontal">
                          {(providedItems) =>
                            <div
                              ref={providedItems.innerRef}
                              {...providedItems.droppableProps}
                              className="flex-1 grid grid-cols-8 gap-4">

                              {row.map((item, itemIndex) =>
                                <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                  {(providedItem) =>
                                    <div
                                      ref={providedItem.innerRef}
                                      {...providedItem.draggableProps}
                                      {...providedItem.dragHandleProps}
                                      className="aspect-[3/4]"
                                      onClick={() => onCardClick(item)}>

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
                                  }
                                </Draggable>
                              )}
                              {providedItems.placeholder}
                            </div>
                          }
                        </Droppable>

                        {/* Right Control Circle */}
                        <div
                          {...providedRow.dragHandleProps}
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors group shadow-lg z-10">

                          <GripVertical className="w-4 h-4 text-white/50 group-hover:text-white" />
                        </div>
                      </div>
                    }
                  </Draggable>
                )}
                {provided.placeholder}
              </div>
            }
          </Droppable>
        </div>
      </motion.div>
    </DragDropContext>);

};

// Console Tile Component - Sumi-e Liquid Glass Style
const ConsoleTile = ({ children, onClick, className = "", accentColor = null, hasImage = false, isLegendary = false }) => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  return (
    <motion.div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
      animate={{
        scale: isHovered || isFocused ? 1.02 : 1,
        y: isHovered || isFocused ? -2 : 0,
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative overflow-hidden group outline-none ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${isHovered || isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)'}`,
        borderRadius: '24px',
        boxShadow: isHovered || isFocused
          ? '0 0 15px rgba(168, 192, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.05)'
          : 'inset 0 0 20px rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Inner Glass Volume Effect */}
      <div
        className="absolute inset-0 pointer-events-none z-0 rounded-[24px]"
        style={{
          background: isHovered || isFocused
            ? 'rgba(255, 255, 255, 0.10)'
            : 'transparent',
          transition: 'background 0.3s ease'
        }}
      />

      {/* Shine Effect - Silver Filament */}
      <div
        className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 rounded-[24px]"
        style={{
          opacity: isHovered ? 0.6 : 0,
          background: `linear-gradient(105deg, transparent ${mousePos.x * 100 - 30}%, rgba(255,255,255,0.4) ${mousePos.x * 100}%, transparent ${mousePos.x * 100 + 30}%)`
        }}
      />

      {/* Focus ring for keyboard navigation - Moonlight accent */}
      {isFocused && (
        <div className="absolute inset-0 rounded-[24px] border-2 pointer-events-none z-30" style={{ borderColor: '#A8C0FF' }} />
      )}

      {/* Content */}
      {children}
    </motion.div>
  );
};

// Hero Tile - Sumi-e Liquid Glass (Monochromatic)
const LegendaryTile = ({ children, onClick, className = "" }) => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  return (
    <motion.div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
      animate={{
        scale: isHovered ? 1.02 : 1,
        y: isHovered ? -4 : 0,
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative overflow-hidden group cursor-pointer ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)'}`,
        borderRadius: '24px',
        boxShadow: isHovered
          ? '0 0 15px rgba(168, 192, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.05)'
          : 'inset 0 0 20px rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Inner Glass Volume Effect */}
      <div
        className="absolute inset-0 pointer-events-none z-0 rounded-[24px]"
        style={{
          background: isHovered ? 'rgba(255, 255, 255, 0.10)' : 'transparent',
          transition: 'background 0.3s ease'
        }}
      />

      {/* Shine Effect - Silver Filament */}
      <div
        className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 rounded-[24px]"
        style={{
          opacity: isHovered ? 0.6 : 0,
          background: `linear-gradient(105deg, transparent ${mousePos.x * 100 - 30}%, rgba(255,255,255,0.4) ${mousePos.x * 100}%, transparent ${mousePos.x * 100 + 30}%)`
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// Leaderboard Tile Component with Real-Time Data
const LeaderboardTile = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['leaderboard-users'],
    queryFn: () => base44.entities.User.list('-level', 10),
    refetchInterval: 30000,
  });

  return (
    <ConsoleTile className="w-64 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-white/10 relative">
        <h3 className="text-[#FFFFFF] font-serif text-lg tracking-wide flex items-center gap-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          <Trophy className="w-5 h-5 text-[#E0E5EC]" style={{ filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} />
          LEADERBOARD
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : users && users.length > 0 ? (
          users.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
            >
              {player.avatar_url ? (
                <img
                  src={player.avatar_url}
                  alt={player.username || player.full_name}
                  className="w-8 h-8 rounded-lg object-cover grayscale"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">
                  {(player.username || player.full_name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#A0A0A0] text-xs font-sans">{index + 1}</span>
                  <span className="text-[#CCCCCC] text-sm font-sans truncate" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    {player.username || player.full_name || 'Unknown'}
                  </span>
                </div>
              </div>
              <span className="text-[#E0E5EC] text-sm font-sans" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                {player.level || 0}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-white/30 text-sm">
            No players yet
          </div>
        )}
      </div>
    </ConsoleTile>
  );
};

// Mock Friends Data
const mockFriends = [
  { id: 1, name: 'Shadow_Striker', avatar: 'https://i.pravatar.cc/150?u=1', status: 'online', game: 'Cyberpunk 2088' },
  { id: 2, name: 'CyberVixen', avatar: 'https://i.pravatar.cc/150?u=2', status: 'online', game: 'Final Fantasy XIV' },
  { id: 3, name: 'GhostReaper', avatar: 'https://i.pravatar.cc/150?u=3', status: 'idle' },
  { id: 4, name: 'IronFist', avatar: 'https://i.pravatar.cc/150?u=4', status: 'offline' },
  { id: 5, name: 'NovaStar', avatar: 'https://i.pravatar.cc/150?u=5', status: 'online', game: 'League of Legends' }];

export default function LunaTemplate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const resetLunaStore = useLunaStore((state) => state.reset);
  const { equipItem, unequipItem, equippedItems, setWeaponModelUrl, weaponModelUrl } = useEquipment();
  const { activeSkills, triggerSkill } = useSkills();
  const [showSettings, setShowSettings] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [showAINews, setShowAINews] = useState(false);
  const [showSeasonalPass, setShowSeasonalPass] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPinGames, setShowPinGames] = useState(false);
  const [expandedGenre, setExpandedGenre] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [uiVisible, setUiVisible] = useState(false);
  const [selectedCardForUpgrade, setSelectedCardForUpgrade] = useState(null);
  const [showBlankPage, setShowBlankPage] = useState(false);
  const [blankPageTab, setBlankPageTab] = useState('entertainment');
  const [selectedStreamingService, setSelectedStreamingService] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userEvents, setUserEvents] = useState([]);
  const [platformUpdates, setPlatformUpdates] = useState([]);
  const [showForumOverlay, setShowForumOverlay] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [showConsoleMode, setShowConsoleMode] = useState(false);
  const [showFriendsHub, setShowFriendsHub] = useState(false);
  const [modelUrl, setModelUrl] = useState(null);
  const [clickedSlot, setClickedSlot] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);

  const { mode } = useDashboardMode();

  useEffect(() => {
    const fetchModelAndAnimations = async () => {
      try {
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

  useEffect(() => {
    return () => {
      resetLunaStore();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const panel = params.get('panel');
    setShowSettings(panel === 'settings');
    setShowLive(panel === 'live');
    setShowProfile(panel === 'profile');
    setShowNotifications(panel === 'notifications');
    setShowConsoleMode(panel === 'console');

    if (panel === 'blacksmith' || panel === 'seasonalpass' || panel === 'entertainment' || panel === 'clan' || panel === 'forum') {
      setActiveSubTab(panel);
    } else {
      setActiveSubTab(null);
    }
    
    setShowAchievements(panel === 'achievements');
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const events = await base44.entities.UserEvent.filter({ user_id: user.id });
        setUserEvents(events);

        const updates = await base44.entities.PlatformUpdate.filter({ published: true });
        setPlatformUpdates(updates);
      } catch (error) {
        showError(error, 'Load Events');
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const checkBladeEquipped = async () => {
      const hasBladeOfAbyss = Object.entries(equippedItems).some(
        ([slotId, item]) => slotId.startsWith('weapon-') && item.name === 'Blade of Abyss'
      );

      if (hasBladeOfAbyss && !weaponModelUrl) {
        try {
          const swordModels = await base44.entities.ModelFBX.filter({ name: 'Blade of Abyss Sword' });
          if (swordModels.length > 0) {
            setWeaponModelUrl(swordModels[0].file_url);
          }
        } catch (error) {
          console.error('Failed to load weapon model:', error);
        }
      } else if (!hasBladeOfAbyss && weaponModelUrl) {
        setWeaponModelUrl(null);
      }
    };

    checkBladeEquipped();
  }, [equippedItems, weaponModelUrl]);

  const [triggerAnimation, setTriggerAnimation] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'i' || e.key === 'I') {
        setUiVisible((v) => !v);
      }
      if (e.key === 'Escape') {
        if (showForumOverlay) setShowForumOverlay(false);
        const params = new URLSearchParams(window.location.search);
        if (params.get('panel')) {
          navigate(createPageUrl('LunaTemplate'));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForumOverlay]);

  const itemCount = ORBITAL_ITEMS.length;
  const angleStep = 360 / itemCount;

  const getItemPosition = (index) => {
    const angle = (index - activeIndex) * angleStep * (Math.PI / 180);
    const radius = 350;
    const x = Math.sin(angle) * radius;
    const y = Math.cos(angle) * radius;
    const scale = index === activeIndex ? 1 : 0.75;
    const opacity = index === activeIndex ? 1 : 0.5;
    const zIndex = index === activeIndex ? 20 : 10;

    return { x, y, scale, opacity, zIndex };
  };

  const handleBoxClick = (slotId) => {
    setClickedSlot(slotId);
    setShowInventory(true);
  };

  const handleEquipItem = (item) => {
    if (clickedSlot && item) {
      equipItem(clickedSlot, item);
      setShowInventory(false);
    }
  };

  if (mode === 'user') {
    return (
      <div className="h-screen w-full bg-slate-900 pt-24 px-8 pb-8">
        <UserInterfaceView />
      </div>);

  }

  return (
    <PageErrorBoundary pageName="LunaTemplate">
    <div
      className="min-h-screen text-white p-8 pt-0 overflow-hidden relative"
      style={{
        backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/fed9dc2c3_unnamed4.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#080808'
      }}>



      <LibrarySidebar />
      {/* 3D Model Viewer - Fixed floating element in top-left */}
      {/* Hidden when overlays are open (Friends Hub, Achievements, etc.) */}
      {modelUrl && !showConsoleMode && !showFriendsHub && !showAchievements &&
        <div
          className="fixed top-0 left-0 bottom-0 w-[260px] z-[35] pointer-events-auto"
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>

          <TransparentModel3DViewer modelUrl={modelUrl} weaponModel={weaponModelUrl} triggerAnimation={triggerAnimation} />
        </div>
      }

      {/* Focus Mode Background Overlay - Removed to show custom background */}

      {/* Plasma Water Video Background - Shows when I key is pressed (uiVisible) */}
      <AnimatePresence>
        {uiVisible && !showConsoleMode && !showAchievements &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-0"
          >
            <video
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/15b006cdb_Plasma-Water.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
          </motion.div>
        }
      </AnimatePresence>

      {/* Focus Mode Panel - Shows when UI is hidden (I key) */}
      <AnimatePresence>
        {!uiVisible && !showConsoleMode &&
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed right-8 z-30 overflow-y-auto"
            style={{
              left: '280px', /* Reduced offset for the 3D viewer sidebar */
              top: '80px',
              bottom: '32px',
              maxHeight: 'calc(100vh - 112px)',
              minHeight: '800px'
            }}>

            <FocusModePanel
              onOpenCalendar={() => setShowCalendar(true)}
            />
          </motion.div>
        }
      </AnimatePresence>





      {/* Universal Slide-Out Drawer */}
      <AnimatePresence>
        {activeDrawer &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setActiveDrawer(null)} />

            <motion.div
              initial={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 0, scale: 0.95 } : { x: '-100%', opacity: 0 }}
              animate={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 1, scale: 1 } : { x: 0, opacity: 1 }}
              exit={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 0, scale: 0.95 } : { x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col ${['settings', 'skill-tree', 'battle', 'home', 'story'].includes(activeDrawer.id) ?
                'inset-0' :
                'left-0 rounded-3xl'}`
              }
              style={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? {
                WebkitBackdropFilter: 'blur(50px) saturate(200%)'
              } : {
                top: '80px',
                bottom: '48px',
                width: '28vw',
                WebkitBackdropFilter: 'blur(50px) saturate(200%)'
              }}>

              {/* Header - Hidden for full screen apps that have their own header */}
              {!['skill-tree', 'battle', 'home', 'story'].includes(activeDrawer.id) &&
                <div className="p-6 flex items-center justify-between">
                  <h2 className="text-white font-bold text-xl tracking-wider uppercase">{activeDrawer.label}</h2>
                  <button
                    onClick={() => setActiveDrawer(null)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all">

                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              }

              {/* Close Button Overlay for Full Screen Apps (Story has its own internal close button) */}
              {['battle', 'home'].includes(activeDrawer.id) &&
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white">

                  <X className="w-5 h-5" />
                </button>
              }

              {/* Content Area */}
              <div className={`flex-1 overflow-y-auto ${activeDrawer.id === 'skill-tree' ? '' : 'p-6'}`}>
                {activeDrawer.id === 'loadout' ?
                  <LoadoutPanel /> :
                  activeDrawer.id === 'settings' ?
                    <SettingsPanel /> :
                    activeDrawer.id === 'skill-tree' ?
                      <GenreMastery onClose={() => setActiveDrawer(null)} /> :
                      activeDrawer.id === 'battle' ?
                        <BattleModeOverlay onClose={() => setActiveDrawer(null)} /> :
                        activeDrawer.id === 'home' ?
                          <AIHomeOverlay
                            onClose={() => setActiveDrawer(null)}
                            onSelectItem={(item) => setActiveDrawer(item)} /> :

                          activeDrawer.id === 'story' ?
                            <AIStoryOverlay onClose={() => setActiveDrawer(null)} /> :
                            activeDrawer.id === 'games' ?
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
                                      { title: 'Shadow Realm', genre: 'Fantasy', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', status: 'Installed' }];

                                    const game = games[i % games.length];
                                    return { ...game, index: i };
                                  }).map((game, index) =>
                                    <motion.div
                                      key={index}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: Math.min(index * 0.02, 1) }}
                                      onClick={() => setSelectedGame(game)}
                                      className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-400/50 transition-all">

                                      {/* Game Image */}
                                      <img src={game.image} alt={game.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

                                      {/* Gradient Overlay */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                      {/* Status Badge */}
                                      <div className="absolute top-1 right-1">
                                        <div className={`w-2 h-2 rounded-full ${game.status === 'Playing' ? 'bg-green-400' : 'bg-blue-400'}`} />
                                      </div>

                                      {/* Game Info - Only on hover */}
                                      <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <p className="text-white/60 text-[8px] uppercase tracking-wider mb-0.5">{game.genre}</p>
                                        <h4 className="text-white font-bold text-[10px] mb-1 truncate">{game.title}</h4>
                                      </div>

                                      {/* Achievements Link - Top Right on Hover */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(createPageUrl('Store') + '?subview=achievements&gameId=' + game.title);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 hover:scale-110 z-10"
                                        title="View Achievements"
                                      >
                                        <Trophy size={12} />
                                      </button>
                                    </motion.div>
                                  )}
                                </div>

                                {/* Add More Games */}
                                <motion.button
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.5 }}
                                  className="w-full border-2 border-dashed border-white/20 hover:border-cyan-400/50 rounded-xl py-8 text-white/40 hover:text-white/80 transition-all flex flex-col items-center justify-center gap-2">

                                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                    <Gamepad2 className="w-6 h-6" />
                                  </div>
                                  <span className="text-sm font-semibold">Pin More Games</span>
                                </motion.button>
                              </div> :

                              <p className="text-white/40 text-sm">{activeDrawer.label} content will appear here</p>
                }
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>

      {/* Game Detail Drawer - Slides from Right */}
      <AnimatePresence>
        {selectedGame &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSelectedGame(null)} />

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
              }}>

              {/* Header */}
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="text-white font-bold text-xl tracking-wider uppercase">Game Details</h2>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all">

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
                    {[1, 2, 3].map((i) =>
                      <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">Achievement Title</p>
                          <p className="text-white/40 text-xs">Unlocked today</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pin/Unpin Button */}
                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg py-3 text-white font-semibold transition-all">
                  Unpin from Dashboard
                </button>
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>

      {/* Back to Loadout X Button (Only visible when Inventory is open) */}
      <AnimatePresence>
        {showInventory &&
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setShowInventory(false)}
            className="fixed top-40 left-8 z-[70] w-11 h-11 rounded-full hover:bg-white/[0.1] flex items-center justify-center transition-all border border-white/12"
            style={{
              background: 'rgba(11, 11, 11, 0.85)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 4px 20px rgba(0, 0, 0, 0.4)'
            }}>

            <X className="w-5 h-5 text-[#EDEDED]" />
          </motion.button>
        }
      </AnimatePresence>


      {/* Main Content Area - Switches based on Console Mode or Achievements */}
      <AnimatePresence mode="wait">
        {showAchievements ? (
          <motion.div
            key="achievements-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
          >
            <Achievements 
              showCloseButton={true} 
              onClose={() => navigate(createPageUrl('LunaTemplate'))}
            />
          </motion.div>
        ) : showConsoleMode ? (
          <motion.div
            key="console-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-screen pt-20 px-12 pb-12 relative z-20 flex flex-col"
          >
            {/* LIVE STREAM SECTION (Condition Rendered) */}
            <AnimatePresence>
              {showLive && (
                <motion.div
                  initial={{ opacity: 0, height: 0, mb: 0 }}
                  animate={{ opacity: 1, height: 'auto', mb: 24 }}
                  exit={{ opacity: 0, height: 0, mb: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex gap-6 overflow-hidden"
                >
                  {/* Streamy Box */}
                  <div className="flex-[2] aspect-video bg-black/40 rounded-2xl border border-white/10 overflow-hidden relative group">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <span className="text-white/40">Stream Offline</span>
                        </div>
                    </div>
                    {/* Mock Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-3">
                            <button className="text-white hover:text-cyan-400"><Play className="w-5 h-5 fill-current" /></button>
                            <span className="text-white text-sm">00:00 / 00:00</span>
                        </div>
                        <button className="text-white hover:text-cyan-400"><Settings className="w-5 h-5" /></button>
                    </div>
                  </div>

                  {/* Chat Box */}
                  <div className="flex-1 bg-black/40 rounded-2xl border border-white/10 flex flex-col overflow-hidden h-auto min-h-[300px]">
                    <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <span className="text-white font-bold text-sm">Stream Chat</span>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                        <div className="text-xs text-white/60">Welcome to the chat!</div>
                        <div className="flex gap-2">
                            <span className="text-cyan-400 text-xs font-bold">Bot:</span>
                            <span className="text-white text-xs">Stream starting soon...</span>
                        </div>
                    </div>
                    <div className="p-3 border-t border-white/10 bg-white/5">
                        <input 
                            type="text" 
                            placeholder="Send a message..." 
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TOP SECTION: Game Banner + Memories (directly under header tabs) */}
            <div className="flex gap-6 mb-6">
              {/* Large Hero Tile - Game Banner (Sumi-e Style) with Video */}
              <LegendaryTile
                onClick={() => navigate(createPageUrl('Store'))}
                className="flex-[2] h-48 relative overflow-hidden"
              >
                <video
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/15b006cdb_Plasma-Water.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 via-[#080808]/20 to-transparent" />
                <div className="absolute bottom-4 left-6 z-10">
                  <h3 className="text-white text-2xl font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Game Banner</h3>
                </div>
              </LegendaryTile>

              {/* Memories Section */}
              <ConsoleTile className="flex-1 h-48 p-5 flex flex-col">
                <h3 className="text-[#CCCCCC] text-sm font-semibold uppercase tracking-wider mb-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Memories</h3>
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div 
                      key={i}
                      className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-white/30 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      <Sparkles className="w-4 h-4 text-white/20" />
                    </div>
                  ))}
                </div>
              </ConsoleTile>
            </div>

            {/* Divider Line under Game Banner */}
            <div className="h-px bg-white/10 mb-6" />

            {/* QUICK ACCESS BOXES - Under the Game Banner line */}
            <div className="flex gap-4 mb-6">
              {/* Skill Tree */}
              <ConsoleTile
                onClick={() => navigate(createPageUrl('GenreMastery'))}
                className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Bot className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Skill Tree</span>
              </ConsoleTile>

              {/* Season Pass */}
              <ConsoleTile
                onClick={() => navigate(createPageUrl('SeasonalPass'))}
                className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Crown className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Season Pass</span>
              </ConsoleTile>

              {/* Achievements */}
              <ConsoleTile
                onClick={() => navigate(createPageUrl('Achievements'))}
                className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Trophy className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 10px rgba(255, 215, 0, 0.6))' }} strokeWidth={1.5} />
                <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Achievements</span>
              </ConsoleTile>

              {/* Leaderboard */}
              <ConsoleTile
                onClick={() => navigate(createPageUrl('Leaderboard'))}
                className="flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Target className="w-10 h-10 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                <span className="text-[#CCCCCC] text-sm font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Leaderboard</span>
              </ConsoleTile>
            </div>

            {/* Main Grid: Leaderboard + 2x2 Right */}
            <div className="flex-1 flex gap-6 min-h-0">
              {/* Leaderboard Tile - Left */}
              <LeaderboardTile />

              {/* Right Side - 2x2 Grid */}
              <div className="flex-1 flex flex-col gap-6">
                {/* App Shortcuts */}
                <div className="flex gap-6 flex-1">
                  {/* Settings */}
                  <ConsoleTile
                    onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=settings')}
                    className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-3"
                  >
                    <Settings className="w-16 h-16 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                    <span className="text-[#CCCCCC] text-lg font-sans relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Settings</span>
                  </ConsoleTile>

                  {/* My Games & Apps */}
                  <ConsoleTile
                    onClick={() => navigate(createPageUrl('Store') + '?subview=library')}
                    className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-3"
                  >
                    <Layers className="w-16 h-16 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                    <span className="text-[#CCCCCC] text-lg font-sans text-center relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>My games & apps</span>
                  </ConsoleTile>
                </div>
              </div>
            </div>

            {/* Time Display - Bottom Left */}
            <div className="absolute bottom-6 left-12 z-30">
              <span className="text-[#CCCCCC] text-lg font-sans" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>

            {/* SVG Gradient Definitions */}
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#A0A0A0" />
                </linearGradient>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#FFA500" />
                  <stop offset="100%" stopColor="#FF8C00" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        ) : uiVisible ? (
          <motion.div
            key="loadout-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full">

            <AnimatePresence mode="wait">
              {false &&
                <motion.div
                  key="hidden-ui"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full flex gap-8 py-8">

                  {/* Friends List - Far Left */}
                <div className="w-80 flex-shrink-0">
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full flex flex-col">
                    <FriendRequestsPanel currentUserId={user?.id} />
                    <div className="mt-6 flex-1 overflow-y-auto">
                      <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Friends Online
                      </h2>
                      <div className="space-y-3">
                        {mockFriends.map((friend) =>
                          <div
                            key={friend.id}
                            onClick={() => setSelectedFriend(friend)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">

                            <div className="relative">
                              <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full" />
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${friend.status === 'online' ? 'bg-green-500' : friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'}`
                              } />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold truncate">{friend.name}</p>
                              {friend.game ?
                                <p className="text-blue-400 text-xs truncate">{friend.game}</p> :

                                <p className="text-slate-500 text-xs">Offline</p>
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center - Calendar, Clock & Date */}
                <div className="flex-1 flex flex-col gap-6">
                  {/* Clock & Date */}
                  <div
                    onClick={() => setShowCalendar(true)}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">

                    <div className="text-7xl font-bold text-white mb-2 font-mono">
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-2xl text-white/60">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <p className="text-xs text-white/40 mt-2">Click to open calendar</p>
                  </div>

                  {/* Calendar */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex-1">
                    <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      Upcoming Events
                    </h2>
                    <div className="space-y-3">
                      {userEvents.slice(0, 3).map((event, i) =>
                        <div
                          key={i}
                          onClick={() => setShowCalendar(true)}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400/50 transition-colors cursor-pointer">

                          <div className="flex items-center gap-3">
                            <div className="bg-purple-500/20 rounded-lg px-3 py-2 text-purple-300 font-bold text-sm">
                              {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold">{event.title}</p>
                              {event.game && <p className="text-white/50 text-sm">{event.game}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                      {userEvents.length === 0 &&
                        <p className="text-white/40 text-sm text-center py-4">No upcoming events</p>
                      }
                    </div>
                  </div>

                  {/* AI News */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                      <Radio className="w-5 h-5 text-green-400" />
                      Platform Updates
                    </h2>
                    <div className="space-y-3">
                      {platformUpdates.slice(0, 3).map((update, i) =>
                        <div
                          key={i}
                          onClick={() => setSelectedUpdate(update)}
                          className={`bg-white/5 rounded-lg p-4 border transition-colors cursor-pointer ${update.update_type === 'required' ? 'border-red-500/50 hover:border-red-400' : 'border-white/10 hover:border-green-400/50'}`
                          }>

                          <div className="flex items-start gap-3">
                            <Bot className={`w-5 h-5 flex-shrink-0 mt-0.5 ${update.update_type === 'required' ? 'text-red-400' : 'text-green-400'}`} />
                            <div className="flex-1">
                              <p className="text-white font-semibold mb-1">{update.title}</p>
                              <p className="text-white/60 text-sm">{update.description}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {platformUpdates.length === 0 &&
                        <p className="text-white/40 text-sm text-center py-4">No updates available</p>
                      }
                    </div>
                  </div>
                </div>
                </motion.div>
              }
              {uiVisible &&
                <motion.div
                  key="visible-ui"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full">

                  <AnimatePresence mode="wait">
                  {expandedGenre ?
                    <motion.div
                      key="expanded-genre"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[70] p-8"
                      style={{
                        background: 'rgba(11, 11, 11, 0.95)',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)'
                      }}
                    >
                      <ExpandedGenreView
                        genre={expandedGenre}
                        onClose={() => setExpandedGenre(null)}
                        onCardClick={setSelectedCardForUpgrade}
                      />
                    </motion.div> :

                    showInventory ?
                      <motion.div
                        key="inventory"
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.4 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-8"
                        style={{
                          background: 'rgba(11, 11, 11, 0.95)',
                          backdropFilter: 'blur(40px)',
                          WebkitBackdropFilter: 'blur(40px)'
                        }}>
                        <div className="w-full h-full max-w-7xl">
                          <InventoryPanel
                            onEquip={handleEquipItem}
                            targetSlot={clickedSlot}
                          />
                        </div>
                      </motion.div> :
                      <motion.div
                        key="boxes"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex h-full relative">

                        {/* Left: 3D Viewer Spacing */}
                        <div className="w-[260px] flex-shrink-0" />



                        {/* Middle: All Equipment Sections - positioned below header */}
                        <div className="flex flex-col gap-8 flex-shrink-0 ml-8 relative z-30 items-center mt-20">
                          {/* Top Row: Armor and Weapons with Genre */}
                          <div className="flex gap-12 items-start">
                            {/* Armor - 3x3 Grid */}
                            <div className="flex flex-col items-center gap-4">
                              <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Armor</h2>
                              <div className="relative w-48 h-4 mb-2"><div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div><div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/10"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div></div>
                              <div className="grid grid-cols-3 gap-3">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {const slotId = `armor-${i}`; const equippedItem = equippedItems[slotId]; return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);})}</div>
                            </div>

                            {/* Weapons with Genre to the right */}
                            <div className="flex gap-8 items-start">
                              {/* Weapons */}
                              <div className="flex flex-col items-center">
                                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase mb-4 text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Weapons</h2>
                                <div className="relative w-64 h-4 mb-4">
                                  <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
                                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-[1px] bg-white/10"></div>
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
                                </div>
                                <div className="flex gap-3">
                                  {[1, 2, 3].map((i) => {
                                    const slotId = `weapon-${i}`;
                                    const equippedItem = equippedItems[slotId];
                                    return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);
                                  })}
                                </div>
                              </div>

                              {/* Genre (right of Weapons) */}
                              <div className="flex flex-col items-center gap-4">
                                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Genre</h2>
                                <div className="relative w-40 h-4"><div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div><div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div></div>
                                <div className="flex gap-3">{[1, 2].map((i) => {const slotId = `genre-${i}`; const equippedItem = equippedItems[slotId]; return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);})}</div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row: Aspects, Artifacts, Genre (pushed to very bottom) */}
                          <div className="flex gap-8 mt-32">
                            {/* Aspects */}
                            <div className="flex flex-col items-center gap-4">
                              <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Aspects</h2>
                              <div className="relative w-40 h-4"><div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div><div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div></div>
                              <div className="flex gap-3">{[1, 2, 3].map((i) => {const slotId = `aspect-${i}`; const equippedItem = equippedItems[slotId]; return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-full border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);})}</div>
                            </div>

                            {/* Artifacts */}
                            <div className="flex flex-col items-center gap-4">
                              <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Artifacts</h2>
                              <div className="relative w-52 h-4"><div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div><div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/10"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div></div>
                              <div className="flex gap-3">{[1, 2, 3, 4, 5].map((i) => {const slotId = `artifact-${i}`; const equippedItem = equippedItems[slotId]; return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);})}</div>
                            </div>

                            {/* Genre (bottom row) */}
                            <div className="flex flex-col items-center gap-4">
                              <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Genre</h2>
                              <div className="relative w-40 h-4"><div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div><div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div></div>
                              <div className="flex gap-3">{[3, 4].map((i) => {const slotId = `genre-${i}`; const equippedItem = equippedItems[slotId]; return (<div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />{equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}</div>);})}</div>
                            </div>
                          </div>
                        </div>


                      </motion.div>
                  }
                  </AnimatePresence>
                </motion.div>
              }
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowSettings(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}>

              <div className="flex-1 overflow-y-auto">
                <SettingsPanel />
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white">

                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        }
      </AnimatePresence>

      {/* AI News Overlay */}
      <AnimatePresence>
        {showAINews &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowAINews(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}>

              <div className="flex-1 overflow-y-auto">
                <AINewsContent />
              </div>

              <button
                onClick={() => setShowAINews(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white">

                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        }
      </AnimatePresence>

      {/* Seasonal Pass Overlay */}
      <AnimatePresence>
        {showSeasonalPass &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowSeasonalPass(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}>

              <div className="flex-1 overflow-y-auto">
                <SeasonalPassContent />
              </div>

              <button
                onClick={() => setShowSeasonalPass(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white">

                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        }
      </AnimatePresence>





      {/* Pin Games Overlay */}
      <AnimatePresence>
        {showPinGames &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowPinGames(false)} />

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
                boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.05)'
              }}>

              <div className="flex-1 overflow-hidden">
                <PinGamesContent />
              </div>

              <button
                onClick={() => setShowPinGames(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white">

                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        }
      </AnimatePresence>

      {/* Card Enhancement Overlay */}
      <AnimatePresence>
        {selectedCardForUpgrade &&
          <CardEnhancementOverlay
            card={selectedCardForUpgrade}
            onClose={() => setSelectedCardForUpgrade(null)} />

        }


      </AnimatePresence>

      {/* Blank Page Overlay */}
      <AnimatePresence>
        {showBlankPage &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowBlankPage(false)} />

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
              }}>

              {/* Header with Tabs */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                  <h2 className="text-3xl font-bold text-white/90 drop-shadow-lg">User Interface</h2>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBlankPageTab('entertainment')}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${blankPageTab === 'entertainment' ?
                        'text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)]' :
                        'text-white/60 hover:text-white'}`
                      }
                      style={blankPageTab === 'entertainment' ? {
                        background: 'rgba(59, 130, 246, 0.3)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(147, 197, 253, 0.3)'
                      } : {}}>

                      Entertainment
                    </button>
                    <button
                      onClick={() => setBlankPageTab('streaming')}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${blankPageTab === 'streaming' ?
                        'text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)]' :
                        'text-white/60 hover:text-white'}`
                      }
                      style={blankPageTab === 'streaming' ? {
                        background: 'rgba(59, 130, 246, 0.3)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(147, 197, 253, 0.3)'
                      } : {}}>

                      Streaming
                    </button>
                    <button
                      onClick={() => setBlankPageTab('social')}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${blankPageTab === 'social' ?
                        'text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)]' :
                        'text-white/60 hover:text-white'}`
                      }
                      style={blankPageTab === 'social' ? {
                        background: 'rgba(59, 130, 246, 0.3)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(147, 197, 253, 0.3)'
                      } : {}}>

                      Social Hub
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowBlankPage(false)}
                  className="text-white/60 hover:text-white transition-colors">

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
                    className="h-full overflow-y-auto">

                    {blankPageTab === 'entertainment' &&
                      <AnimatePresence mode="wait">
                        {!selectedStreamingService ?
                          <motion.div
                            key="service-grid"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-4 gap-4">

                            {[
                              { name: 'Netflix', icon: Film, color: 'rgba(229, 9, 20, 0.3)', topText: 'Netflix', bottomText: '' },
                              { name: 'Disney+', icon: Sparkles, color: 'rgba(17, 60, 207, 0.3)', topText: 'Disney', bottomText: '+' },
                              { name: 'HBO Max', icon: Play, color: 'rgba(185, 28, 255, 0.3)', topText: 'HBO', bottomText: 'Max' },
                              { name: 'Prime Video', icon: ShoppingBag, color: 'rgba(0, 168, 225, 0.3)', topText: 'Prime', bottomText: 'Video' },
                              { name: 'Hulu', icon: Tv, color: 'rgba(28, 231, 131, 0.3)', topText: 'Hulu', bottomText: '' },
                              { name: 'Apple TV+', icon: Monitor, color: 'rgba(0, 0, 0, 0.5)', topText: 'Apple', bottomText: 'TV+' },
                              { name: 'Paramount+', icon: Mountain, color: 'rgba(0, 99, 235, 0.3)', topText: 'Paramount', bottomText: '+' },
                              { name: 'Peacock', icon: Feather, color: 'rgba(0, 0, 0, 0.4)', topText: 'Peacock', bottomText: '' }].
                              map((service, idx) => {
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
                                    }}>

                                    <span className="text-white/90 text-[10px] font-semibold">{service.topText}</span>
                                    <Icon className="w-5 h-5 text-white/90 my-0.5" />
                                    {service.bottomText && <span className="text-white/90 text-[10px] font-semibold">{service.bottomText}</span>}
                                  </motion.div>);

                              })}
                          </motion.div> :

                          <motion.div
                            key="streaming-app"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="fixed inset-0 flex items-center justify-center bg-black z-[100]">

                            <button
                              onClick={() => setSelectedStreamingService(null)}
                              className="fixed top-8 right-8 text-white/60 hover:text-white transition-colors">

                              <X className="w-8 h-8" />
                            </button>

                            <div className="text-center">
                              <Clapperboard className="w-16 h-16 text-white/40 mx-auto mb-4" />
                              <p className="text-white/60 text-lg">{selectedStreamingService} app will load here</p>
                              <p className="text-white/40 text-sm mt-2">Streaming interface coming soon</p>
                            </div>
                          </motion.div>
                        }
                      </AnimatePresence>
                    }
                    {blankPageTab === 'streaming' &&
                      <StreamingDiscovery />
                    }
                    {blankPageTab === 'social' &&
                      <SocialHub />
                    }
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>



      {/* AI Attributes Panel - Bottom Right */}
      {uiVisible && !showConsoleMode && !showAchievements &&
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 z-30"
          style={{ transform: 'scale(0.68) scaleX(0.7225)' }}
        >
          <LunaStatsPanel />
        </motion.div>
      }

      {/* Skills & AI Passives - Bottom Left */}
      {uiVisible && !showInventory && !showConsoleMode && !showAchievements &&
        <div className="fixed bottom-8 left-8 z-30 flex flex-col items-center gap-4 pointer-events-auto">
          {/* Skills */}
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Skills</h2>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => {
                const skillMap = {
                  0: 'kick_ability',
                  1: null,
                  2: null,
                  3: null,
                  4: null
                };

                const handleSkillClick = () => {
                  triggerSkill(i);
                };

                const onDragOver = (e) => {
                  if (e.dataTransfer) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }
                };

                const onDrop = (e) => {
                  e.preventDefault();
                  try {
                    const json = e.dataTransfer.getData('application/json');
                    const payload = json ? JSON.parse(json) : null;
                    if (payload?.source === 'luna-card' && payload.card) {
                      useLunaStore.getState().assignToHotbar(i, payload.card);
                    }
                  } catch { }
                };

                const assigned = useLunaStore.getState().hotbar[i] || null;

                return (
                  <div
                    key={`skill-${i}`}
                    onClick={handleSkillClick}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    className={`w-10 h-10 rounded-lg border cursor-pointer flex items-center justify-center relative overflow-hidden group transition-all duration-700 ${activeSkills[i] ?
                      'border-white/25 shadow-[inset_0_1px_3px_rgba(255,255,255,0.15)]' :
                      ''}`
                    }
                    style={{
                      background: 'rgba(11, 11, 11, 0.85)',
                      backdropFilter: 'blur(35px)',
                      WebkitBackdropFilter: 'blur(35px)',
                      borderColor: activeSkills[i] ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)',
                      boxShadow: activeSkills[i] ? 'inset 0 1px 3px rgba(255, 255, 255, 0.15), 0 0 12px rgba(255, 255, 255, 0.1)' : 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)'
                    }}
                    title={assigned ? `${assigned.title} (${assigned.type})` : 'Drag a card here to assign'}><div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <span className="text-[#9A9A9A] text-xs font-light relative z-10">{i + 1}</span>
                    {assigned &&
                      <div className="absolute inset-0 flex items-center justify-center">
                        {assigned.image ?
                          <img src={assigned.image} alt={assigned.title} className="w-full h-full object-cover opacity-30" /> :
                          <span className="text-white/50 text-[10px] font-semibold px-1 text-center leading-tight line-clamp-2">
                            {assigned.title}
                          </span>
                        }
                      </div>
                    }
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Passives */}
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>AI Passives</h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => {
                const slotId = `passive-${i}`;
                const equippedItem = equippedItems[slotId];
                return (
                  <div
                    key={slotId}
                    onClick={() => handleBoxClick(slotId)}
                    className="w-10 h-10 rounded-lg border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700"
                    style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    {equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-1 relative z-10" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      }

      {/* User Profile Overlay */}
      <UserProfileOverlay
        isOpen={showProfile}
        onClose={() => setShowProfile(false)} />


      {/* Friend Interaction Panel */}
      <AnimatePresence>
        {selectedFriend &&
          <FriendInteractionPanel
            friend={{
              id: selectedFriend.id,
              friend_id: selectedFriend.id,
              friend_name: selectedFriend.name,
              friend_avatar: selectedFriend.avatar,
              status: selectedFriend.status,
              current_game: selectedFriend.game
            }}
            currentUserId={user?.id}
            onClose={() => setSelectedFriend(null)} />

        }
      </AnimatePresence>

      {/* Calendar Overlay */}
      <AnimatePresence>
        {showCalendar &&
          <IntelligentCalendarOverlay
            currentUserId={user?.id}
            onClose={() => setShowCalendar(false)} />

        }
      </AnimatePresence>

      {/* Platform Update Modal */}
      <AnimatePresence>
        {selectedUpdate &&
          <PlatformUpdateModal
            update={selectedUpdate}
            onClose={() => setSelectedUpdate(null)} />

        }
      </AnimatePresence>

      {/* Friends Hub Overlay */}
      <AnimatePresence>
        {showFriendsHub && (
          <FriendsHubOverlay onClose={() => setShowFriendsHub(false)} />
        )}
      </AnimatePresence>

      {/* Notifications Overlay */}
      <AnimatePresence>
        {showNotifications &&
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowNotifications(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}>

              {/* Content area - blank for now */}
              <div className="flex-1 overflow-y-auto">
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                className="fixed top-6 right-6 z-[60] text-white/60 hover:text-white transition-all">

                <X className="w-8 h-8" />
              </button>
            </motion.div>
          </>
        }
      </AnimatePresence>

      {/* Side Access Menu - Minimally invasive left edge interaction */}
      {!showInventory && !showConsoleMode && !showAchievements && !activeSubTab && (
        <SideAccessMenu />
      )}

      {/* Sub-Page Views - Blacksmith, Season Pass, Entertainment, Clan, Forum */}
      <AnimatePresence>
        {activeSubTab &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40"
            style={{
              background: 'linear-gradient(135deg, #0a0d14 0%, #111827 25%, #1a202c 50%, #111827 75%, #0a0d14 100%)'
            }}>

             {/* Close Blacksmith -> Console */}
             {activeSubTab === 'blacksmith' && (
               <button
                 onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=console')}
                 className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white"
               >
                 <X className="w-5 h-5" />
               </button>
             )}

             <div className={`h-full w-full overflow-hidden ${activeSubTab === 'entertainment' ? '' : 'pt-20'}`}>
              {activeSubTab === 'forum' && <CommunityPage />}
              {activeSubTab === 'blacksmith' && <Blacksmith />}
              {activeSubTab === 'seasonalpass' && <SeasonalPassContent />}
              {activeSubTab === 'entertainment' && <EntertainmentHub />}
              {activeSubTab === 'clan' && <div className="text-white p-8">Clan Content Here</div>}
            </div>
          </motion.div>
        }
      </AnimatePresence>

    </div>
    </PageErrorBoundary>
    );


}