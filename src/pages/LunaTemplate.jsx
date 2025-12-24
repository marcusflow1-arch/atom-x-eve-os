import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, Settings,
  Home, BookOpen, Zap, Sword, Gamepad2, Target, Layers,
  ChevronLeft, ChevronRight, User, Trophy, MessageSquare, Shield, Swords, Bot, Crown, Radio, Users, Globe,
  Grid, ArrowUpAz, ArrowDownAz, ArrowUp, ArrowDown, GripVertical, Clapperboard,
  Film, Sparkles, Play, ShoppingBag, Tv, Monitor, Mountain, Feather, Calendar } from
'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { base44 } from '@/api/base44Client';

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

  // Initialize global state objects
  useEffect(() => {
    if (!window.LUNA_EQUIPMENT_STATE) {
      window.LUNA_EQUIPMENT_STATE = { weapon: null };
    }
    if (!window.LUNA_ACTION_STATE) {
      window.LUNA_ACTION_STATE = { attack: false, skill: null };
    }
    if (!window.LUNA_COOLDOWNS) {
      window.LUNA_COOLDOWNS = {};
    }
    if (!window.LUNA_ANIMATION_BINDINGS) {
      window.LUNA_ANIMATION_BINDINGS = {
        idle: "idle",
        weapon_idle: {
          sword_of_the_abyss: "sort_afk"
        },
        weapon_attack: {
          sword_of_the_abyss: "sword_attack"
        },
        skills: {
          kick_ability: "kick"
        }
      };
    }
  }, []);

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

      // Find right hand bone
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

            if (Array.isArray(node.material)) node.material.forEach(applySide);else
            applySide(node.material);
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

      // Load weapon model if provided and right hand found
      if (weaponModel && rightHandBone) {
        const weaponLoader = new FBXLoader();
        weaponLoader.load(
          weaponModel,
          (weaponFbx) => {
            weaponRef.current = weaponFbx;
            weaponFbx.scale.multiplyScalar(0.01);

            // Attach weapon to hand
            rightHandBone.add(weaponFbx);

            // Position and rotate weapon in hand
            weaponFbx.position.set(0, 0.1, 0);
            weaponFbx.rotation.set(Math.PI / 2, 0, 0);

            // Hidden by default - will be toggled by state
            weaponFbx.visible = false;
            setWeaponAttached(true);
          },
          undefined,
          (err) => console.error('Error loading weapon:', err)
        );
      }

      mixer = new THREE.AnimationMixer(model);

      // Find and store animations
      if (animations && animations.length > 0) {
        animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          const name = clip.name.toLowerCase();

          if (name.includes('idle') || name.includes('breathing')) actionsRef.current.idle = action;else
          if (name.includes('walk')) actionsRef.current.walk = action;else
          if (name.includes('run')) actionsRef.current.run = action;else
          if (name.includes('jump') || name.includes('fall')) actionsRef.current.jump = action;else
          if (name.includes('swing') || name.includes('attack') || name.includes('sword')) actionsRef.current.swing = action;else
          if (name.includes('kick')) actionsRef.current.kick = action;else
          if (name.includes('dance')) actionsRef.current.dance = action;else
          if (name.includes('wave') || name.includes('greet')) actionsRef.current.wave = action;
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
                if (Array.isArray(node.material)) node.material.forEach(applySide);else
                applySide(node.material);
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
                  animFbx.animations.forEach((clip) => {
                    // Rename clip based on animation type
                    if (anim.animation_type === 'idle') clip.name = 'idle';else
                    if (anim.animation_type === 'run') clip.name = 'run';else
                    if (anim.name.toLowerCase().includes('falling')) clip.name = 'fall';
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

                if (Array.isArray(node.material)) node.material.forEach(applySide);else
                applySide(node.material);
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

    // Animation priority system
    const animationLocked = { current: false };

    // Safe base action setter - prevents animation spam
    const setBaseAction = (name, once = false) => {
      if (animationLocked.current && !once) return;
      if (currentBaseActionRef.current === name && !once) return;

      const action = actionsRef.current[name];
      if (!action) return;

      currentBaseActionRef.current = name;

      // Stop all other animations
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

    // Resolve idle animation based on weapon state
    const resolveIdle = () => {
      const weapon = window.LUNA_EQUIPMENT_STATE?.weapon;
      if (weapon && window.LUNA_ANIMATION_BINDINGS?.weapon_idle?.[weapon]) {
        return window.LUNA_ANIMATION_BINDINGS.weapon_idle[weapon];
      }
      return 'idle';
    };

    // Handle attack trigger
    const handleAttack = () => {
      if (!window.LUNA_ACTION_STATE?.attack) return;

      const weapon = window.LUNA_EQUIPMENT_STATE?.weapon;
      if (!weapon) return;

      const anim = window.LUNA_ANIMATION_BINDINGS?.weapon_attack?.[weapon];
      if (!anim || !actionsRef.current[anim]) return;

      setBaseAction(anim, true);
      window.LUNA_ACTION_STATE.attack = false;
    };

    // Handle skill trigger
    const handleSkill = () => {
      const skill = window.LUNA_ACTION_STATE?.skill;
      if (!skill) return;

      const now = Date.now();
      if (now < (window.LUNA_COOLDOWNS?.[skill] || 0)) return;

      const anim = window.LUNA_ANIMATION_BINDINGS?.skills?.[skill];
      if (!anim || !actionsRef.current[anim]) return;

      setBaseAction(anim, true);
      window.LUNA_COOLDOWNS[skill] = now + 3000;
      window.LUNA_ACTION_STATE.skill = null;
    };

    // Update weapon visibility
    const updateWeaponVisual = () => {
      if (!weaponRef.current) return;
      const equipped = window.LUNA_EQUIPMENT_STATE?.weapon === "sword_of_the_abyss";
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

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      // Update weapon visibility
      updateWeaponVisual();

      // UI → STATE → VIEWER BRIDGE
      const state = window.LUNA_STATE;
      if (state && state.equippedWeapon !== currentWeaponRef.current) {
        window.LUNA_EQUIPMENT_STATE.weapon = state.equippedWeapon;
        currentWeaponRef.current = state.equippedWeapon;
      }

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

        // Animation priority system
        if (grounded) {
          // Priority 1: Skill
          if (window.LUNA_ACTION_STATE?.skill) {
            handleSkill();
          }
          // Priority 2: Attack
          else if (window.LUNA_ACTION_STATE?.attack) {
            handleAttack();
          }
          // Priority 3: Movement or Idle
          else if (isMoving) {
            direction.normalize();

            // Move model
            modelRef.current.position.x += direction.x * moveSpeed;
            modelRef.current.position.z += direction.z * moveSpeed;

            // Rotate model to face movement direction
            const angle = Math.atan2(direction.x, direction.z);
            modelRef.current.rotation.y = angle;

            // Play running animation
            if (!animationLocked.current) {
              setBaseAction('run');
            }
          } else {
            // Idle state (weapon-aware)
            if (!animationLocked.current) {
              setBaseAction(resolveIdle());
            }
          }
        } else {
          // Falling overrides everything when not grounded
          if (!animationLocked.current) {
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
        // When inactive, check for actions or use idle
        if (window.LUNA_ACTION_STATE?.skill) {
          handleSkill();
        } else if (window.LUNA_ACTION_STATE?.attack) {
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [modelUrl, weaponModel, animations]);

  // Trigger animation events from parent
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
import FriendInteractionPanel from '../components/friends/FriendInteractionPanel';
import FriendRequestsPanel from '../components/friends/FriendRequestsPanel';
import { useAuth } from '../components/auth/AuthContext';
import CalendarOverlay from '../components/calendar/CalendarOverlay';
import PlatformUpdateModal from '../components/calendar/PlatformUpdateModal';
import FocusModePanel from '../components/dashboard/FocusModePanel';
import CommunityPage from './Community';
import UpcomingEventsSection from '../components/dashboard/UpcomingEventsSection';

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
                      onClick={(e) => {e.stopPropagation();moveRow(rowIndex, -1);}} />

                          <div className="w-1 h-1 rounded-full bg-white/30 group-hover:bg-blue-400 mb-0.5" />
                          <ArrowDown
                      className="w-3 h-3 text-white/50 hover:text-white cursor-pointer"
                      onClick={(e) => {e.stopPropagation();moveRow(rowIndex, 1);}} />

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
  const [showSettings, setShowSettings] = useState(false);
  const [showAINews, setShowAINews] = useState(false);
  const [showSeasonalPass, setShowSeasonalPass] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPinGames, setShowPinGames] = useState(false);
  const [expandedGenre, setExpandedGenre] = useState(null); // New State for Expanded View
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
  const [activeSubTab, setActiveSubTab] = useState(null); // 'forum' | 'blacksmith' | 'seasonalpass' | 'entertainment' | 'clan' | null
  const [modelUrl, setModelUrl] = useState(null);
  const [activeSkills, setActiveSkills] = useState([false, false, false, false, false]);
  const [clickedSlot, setClickedSlot] = useState(null);
  const [equippedItems, setEquippedItems] = useState({});
  const [weaponModelUrl, setWeaponModelUrl] = useState(null);
  const [customBackground, setCustomBackground] = useState(null);

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

  // Open overlays based on URL panel param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const panel = params.get('panel');
    setShowSettings(panel === 'settings');
    setShowProfile(panel === 'profile');
    setShowNotifications(panel === 'notifications');

    // Handle sub-tabs
    if (panel === 'blacksmith' || panel === 'seasonalpass' || panel === 'entertainment' || panel === 'clan' || panel === 'forum') {
      setActiveSubTab(panel);
    } else {
      setActiveSubTab(null);
    }
  }, [location.search]);

  // Fetch User Events and Platform Updates
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const events = await base44.entities.UserEvent.filter({ user_id: user.id });
        setUserEvents(events);

        const updates = await base44.entities.PlatformUpdate.filter({ published: true });
        setPlatformUpdates(updates);
      } catch (error) {
        console.error('Failed to load events/updates:', error);
      }
    };
    fetchData();
  }, [user]);

  // Check if Blade of Abyss is equipped and load weapon model
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

  // Animation Event Trigger
  const [triggerAnimation, setTriggerAnimation] = useState(null);

  // Skill Keybinds (1-5 keys) - Trigger skill animations via state
  useEffect(() => {
    const handleSkillKey = (e) => {
      const key = e.key;
      if (['1', '2', '3', '4', '5'].includes(key)) {
        const index = parseInt(key) - 1;

        // Toggle active state briefly
        setActiveSkills((prev) => {
          const next = [...prev];
          next[index] = true;
          setTimeout(() => setActiveSkills((p) => {
            const n = [...p];
            n[index] = false;
            return n;
          }), 800);
          return next;
        });

        // If a card is assigned to this slot, trigger its demo
        const assigned = window.LUNA_HOTBAR && window.LUNA_HOTBAR[index] || null;
        if (assigned && window.LUNA_ACTION_STATE) {
          const skillFromCardType = { ability: 'kick_ability' };
          const derived = skillFromCardType[assigned.type] || 'kick_ability';
          window.LUNA_ACTION_STATE.skill = derived;
          return;
        }

        // Fallback to static mapping
        const skillMap = {
          '1': 'kick_ability',
          '2': null,
          '3': null,
          '4': null,
          '5': null
        };
        const skillId = skillMap[key];
        if (skillId && window.LUNA_ACTION_STATE) {
          window.LUNA_ACTION_STATE.skill = skillId;
        }
      }
    };

    window.addEventListener('keydown', handleSkillKey);
    return () => window.removeEventListener('keydown', handleSkillKey);
  }, []);

  // Hotkey to toggle UI (I key) and close overlays (ESC)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'i' || e.key === 'I') {
        setUiVisible((v) => !v);
      }
      if (e.key === 'Escape') {
        if (showForumOverlay) setShowForumOverlay(false);
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
      setEquippedItems((prev) => ({
        ...prev,
        [clickedSlot]: item
      }));

      // Initialize global state bridge
      window.LUNA_STATE = window.LUNA_STATE || {};

      // Update global state for weapon equips (weapon-1, weapon-2, weapon-3)
      if (clickedSlot.startsWith('weapon-') && item.name === 'Blade of Abyss') {
        window.LUNA_STATE.equippedWeapon = "sword_of_the_abyss";
      } else if (clickedSlot.startsWith('weapon-')) {
        // Other weapons or unequip
        window.LUNA_STATE.equippedWeapon = null;
      }

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

    <div
      className="min-h-screen text-white p-8 pt-0 overflow-hidden relative"
      style={{ 
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' 
      }}>
      {/* Custom background image - shown in front of base gradient, behind content */}
      {customBackground && (
        <div 
          className="absolute inset-0 z-[5]"
          style={{
            backgroundImage: `url(${customBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
      {/* Very light overlay to maintain some readability */}
      {customBackground && (
        <div className="absolute inset-0 bg-black/20 z-[6]" />
      )}

        {/* 3D Model Viewer - Fixed floating element in top-left, separate from page scroll */}
        {modelUrl &&
      <div
        className={`fixed pointer-events-auto transition-all duration-500 ease-in-out ${
        uiVisible ?
        'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[500px] z-20' :
        'top-20 left-8 w-[200px] h-[180px] z-[35]'}`
        }
        style={!uiVisible ? {
          /* Constrained to reduced area */
          maxWidth: '200px',
          maxHeight: '180px'
        } : {}}>

            <TransparentModel3DViewer modelUrl={modelUrl} weaponModel={weaponModelUrl} triggerAnimation={triggerAnimation} />
          </div>
      }

        {/* Focus Mode Background Overlay - More translucent when custom background is active */}
        <AnimatePresence>
          {!uiVisible &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-10"
          style={customBackground ? {
            background: 'rgba(15, 23, 42, 0.3)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          } : {
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 58, 95, 0.75) 50%, rgba(15, 23, 42, 0.85) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }} />

        }
        </AnimatePresence>

        {/* Focus Mode Panel - Shows when UI is hidden (I key) */}
        <AnimatePresence>
          {!uiVisible &&
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed left-8 right-8 z-30 overflow-y-auto"
          style={{
            top: '80px',
            bottom: '32px',
            maxHeight: 'calc(100vh - 112px)',
            minHeight: '800px'
          }}>

              <FocusModePanel onBackgroundChange={setCustomBackground} />
            </motion.div>
        }
        </AnimatePresence>









        {/* Skills Section Above Dock */}
        {uiVisible && !showInventory &&
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4 pointer-events-auto" aria-hidden={!uiVisible}>
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-white/50">Skills</h2>
          
          {/* Decorative Lines */}
          <div className="relative w-[308px] h-4">
            <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/20"></div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-[1px] bg-white/20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/40"></div>
          </div>

          {/* Skill Boxes - Single Row with Drop Targets */}
          <div className="flex gap-3">
            {[0, 1, 2, 3, 4].map((i) => {
            const skillMap = {
              0: 'kick_ability',
              1: null,
              2: null,
              3: null,
              4: null
            };

            const handleSkillClick = () => {
              const skillId = skillMap[i];
              if (skillId && window.LUNA_ACTION_STATE) {
                window.LUNA_ACTION_STATE.skill = skillId;
                setActiveSkills((prev) => {
                  const newSkills = [...prev];
                  newSkills[i] = true;
                  setTimeout(() => {
                    setActiveSkills((s) => {
                      const updated = [...s];
                      updated[i] = false;
                      return updated;
                    });
                  }, 1000);
                  return newSkills;
                });
              }
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
                  window.LUNA_HOTBAR = window.LUNA_HOTBAR || {};
                  window.LUNA_HOTBAR[i] = payload.card;
                  // Optional: flash active state briefly to confirm assignment
                  setActiveSkills((prev) => {
                    const next = [...prev];
                    next[i] = true;
                    setTimeout(() => setActiveSkills((p) => {
                      const n = [...p];
                      n[i] = false;
                      return n;
                    }), 500);
                    return next;
                  });
                }
              } catch {}
            };

            const assigned = window.LUNA_HOTBAR && window.LUNA_HOTBAR[i] || null;

            return (
              <div
                key={`skill-${i}`}
                onClick={handleSkillClick}
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={`w-14 h-14 rounded-xl backdrop-blur-xl border shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center relative overflow-hidden ${
                activeSkills[i] ?
                'bg-cyan-500/30 border-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.5)]' :
                'bg-[rgba(100,120,140,0.08)] border-white/[0.08] hover:bg-[rgba(100,120,140,0.12)]'}`
                }
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                title={assigned ? `${assigned.title} (${assigned.type})` : 'Drag a card here to assign'}>

                  {/* Key label */}
                  <span className="text-white/60 text-xs font-bold">{i + 1}</span>
                  {/* Assigned card preview */}
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
                </div>);

          })}
            </div>
            </div>
      }

        {/* AI Home Button - Hover Menu at Bottom Center */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center pointer-events-auto group">
          {/* Left Items */}
          <div className="flex items-center gap-2 mr-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
            <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveDrawer(ORBITAL_ITEMS.find((item) => item.id === 'skill-tree'))}
            className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer border border-white/20 hover:border-white/40 transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
            title="Skill Tree">

              <Layers className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveDrawer(ORBITAL_ITEMS.find((item) => item.id === 'battle'))}
            className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer border border-white/20 hover:border-white/40 transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
            title="Battle Mode">

              <Swords className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Center Home Button */}
          <motion.button
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveDrawer(ORBITAL_ITEMS.find((item) => item.id === 'home'))} className="my-5 rounded-2xl w-14 h-14 flex items-center justify-center cursor-pointer border border-white/20 hover:border-white/40 transition-all"

          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
          }}
          title="AI Home">

            <Home className="w-6 h-6 text-white" />
          </motion.button>

          {/* Right Items */}
          <div className="flex items-center gap-2 ml-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
            <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveDrawer(ORBITAL_ITEMS.find((item) => item.id === 'story'))}
            className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer border border-white/20 hover:border-white/40 transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
            title="AI Story">

              <BookOpen className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveDrawer(ORBITAL_ITEMS.find((item) => item.id === 'games'))}
            className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer border border-white/20 hover:border-white/40 transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
            title="PINGAMES">

              <Gamepad2 className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
        )}

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
            className={`fixed bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col ${
            ['settings', 'skill-tree', 'battle', 'home', 'story'].includes(activeDrawer.id) ?
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
                              <div className={`w-2 h-2 rounded-full ${
                      game.status === 'Playing' ? 'bg-green-400' : 'bg-blue-400'}`
                      } />
                            </div>

                            {/* Game Info - Only on hover */}
                            <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white/60 text-[8px] uppercase tracking-wider mb-0.5">{game.genre}</p>
                              <h4 className="text-white font-bold text-[10px] mb-1 truncate">{game.title}</h4>
                            </div>
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
          className="fixed top-40 left-8 z-40 w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
          style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}>

              <X className="w-5 h-5 text-white/80" />
              </motion.button>
        }
              </AnimatePresence>


              {/* Main Content Area */}
              {uiVisible &&
      <div className="w-full mt-2 px-12 relative" style={{ display: uiVisible ? 'block' : 'none' }}>
              <AnimatePresence mode="wait">
              {false &&
          <motion.div
            key="hidden-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full flex gap-8">

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
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        friend.status === 'online' ? 'bg-green-500' : friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'}`
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
                    className={`bg-white/5 rounded-lg p-4 border transition-colors cursor-pointer ${
                    update.update_type === 'required' ? 'border-red-500/50 hover:border-red-400' : 'border-white/10 hover:border-green-400/50'}`
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
              <ExpandedGenreView
                genre={expandedGenre}
                onClose={() => setExpandedGenre(null)}
                onCardClick={setSelectedCardForUpgrade} /> :

              !showInventory ?
              <motion.div
                key="boxes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col">

                    {/* Primary Dashboard Section */}
                    <div className="flex justify-between gap-12">
                    <div className="flex flex-col items-start gap-10 relative z-40">
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
                          {[1, 2, 3].map((i) => {
                          const slotId = `weapon-${i}`;
                          const equippedItem = equippedItems[slotId];
                          return (
                            <div
                              key={slotId}
                              onClick={() => handleBoxClick(slotId)}
                              className="w-20 h-20 rounded-2xl border shadow-lg hover:border-cyan-400/30 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden relative"
                              style={{
                                background: 'rgba(100, 120, 140, 0.10)',
                                backdropFilter: 'blur(12px) saturate(120%)',
                                WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                              }}>

                                {equippedItem &&
                              <img
                                src={equippedItem.icon_url || equippedItem.icon}
                                alt={equippedItem.name}
                                className="w-full h-full object-contain p-2" />

                              }
                              </div>);

                        })}
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
                          {[1, 2, 3].map((i) => {
                          const slotId = `armor-top-${i}`;
                          const equippedItem = equippedItems[slotId];
                          return (
                            <div
                              key={slotId}
                              onClick={() => handleBoxClick(slotId)}
                              className="w-20 h-20 rounded-2xl border shadow-lg hover:border-cyan-400/30 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden relative"
                              style={{
                                background: 'rgba(100, 120, 140, 0.10)',
                                backdropFilter: 'blur(12px) saturate(120%)',
                                WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                              }}>

                                {equippedItem &&
                              <img
                                src={equippedItem.icon_url || equippedItem.icon}
                                alt={equippedItem.name}
                                className="w-full h-full object-contain p-2" />

                              }
                              </div>);

                        })}
                        </div>

                        {/* Middle: 3 boxes */}
                        <div className="flex gap-4">
                          {[1, 2, 3].map((i) => {
                          const slotId = `armor-mid-${i}`;
                          const equippedItem = equippedItems[slotId];
                          return (
                            <div
                              key={slotId}
                              onClick={() => handleBoxClick(slotId)}
                              className="w-20 h-20 rounded-2xl border shadow-lg hover:border-cyan-400/30 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden relative"
                              style={{
                                background: 'rgba(100, 120, 140, 0.10)',
                                backdropFilter: 'blur(12px) saturate(120%)',
                                WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                              }}>

                                {equippedItem &&
                              <img
                                src={equippedItem.icon_url || equippedItem.icon}
                                alt={equippedItem.name}
                                className="w-full h-full object-contain p-2" />

                              }
                              </div>);

                        })}
                        </div>

                        {/* Bottom: 3 boxes */}
                        <div className="flex gap-4">
                          {[1, 2, 3].map((i) => {
                          const slotId = `armor-bot-${i}`;
                          const equippedItem = equippedItems[slotId];
                          return (
                            <div
                              key={slotId}
                              onClick={() => handleBoxClick(slotId)}
                              className="w-20 h-20 rounded-2xl border shadow-lg hover:border-cyan-400/30 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden relative"
                              style={{
                                background: 'rgba(100, 120, 140, 0.10)',
                                backdropFilter: 'blur(12px) saturate(120%)',
                                WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                              }}>

                                {equippedItem &&
                              <img
                                src={equippedItem.icon_url || equippedItem.icon}
                                alt={equippedItem.name}
                                className="w-full h-full object-contain p-2" />

                              }
                              </div>);

                        })}
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
                          {[1, 2].map((i) => {
                          const slotId = `genre-${i}`;
                          const equippedItem = equippedItems[slotId];
                          return (
                            <div
                              key={slotId}
                              onClick={() => handleBoxClick(slotId)}
                              className="w-20 h-20 rounded-2xl border shadow-lg hover:border-cyan-400/30 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden relative"
                              style={{
                                background: 'rgba(100, 120, 140, 0.10)',
                                backdropFilter: 'blur(12px) saturate(120%)',
                                WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                              }}>

                                {equippedItem &&
                              <img
                                src={equippedItem.icon_url || equippedItem.icon}
                                alt={equippedItem.name}
                                className="w-full h-full object-contain p-2" />

                              }
                              </div>);

                        })}
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
                          {[1, 2, 3].map((i) => {
                          const slotId = `aspect-${i}`;
                          const equippedItem = equippedItems[slotId];
                          return (
                            <div
                              key={slotId}
                              onClick={() => handleBoxClick(slotId)}
                              className="w-20 h-20 rounded-full border shadow-lg hover:border-cyan-400/30 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden relative"
                              style={{
                                background: 'rgba(100, 120, 140, 0.10)',
                                backdropFilter: 'blur(12px) saturate(120%)',
                                WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                              }}>

                                {equippedItem &&
                              <img
                                src={equippedItem.icon_url || equippedItem.icon}
                                alt={equippedItem.name}
                                className="w-full h-full object-contain p-2" />

                              }
                              </div>);

                        })}
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
                            {[1, 2].map((i) => {
                            const slotId = `passive-top-${i}`;
                            const equippedItem = equippedItems[slotId];
                            return (
                              <div
                                key={slotId}
                                onClick={() => handleBoxClick(slotId)}
                                className="w-20 h-20 rounded-2xl border shadow-lg hover:border-cyan-400/30 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden relative"
                                style={{
                                  background: 'rgba(100, 120, 140, 0.10)',
                                  backdropFilter: 'blur(12px) saturate(120%)',
                                  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                  borderColor: 'rgba(255, 255, 255, 0.08)',
                                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                                }}>

                                  {equippedItem &&
                                <img
                                  src={equippedItem.icon_url || equippedItem.icon}
                                  alt={equippedItem.name}
                                  className="w-full h-full object-contain p-2" />

                                }
                                </div>);

                          })}
                          </div>
                          <div className="flex gap-4">
                            {[3, 4, 5].map((i) => {
                            const slotId = `passive-bottom-${i}`;
                            const equippedItem = equippedItems[slotId];
                            return (
                              <div
                                key={slotId}
                                onClick={() => handleBoxClick(slotId)}
                                className="w-20 h-20 rounded-2xl border shadow-lg hover:border-cyan-400/30 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden relative"
                                style={{
                                  background: 'rgba(100, 120, 140, 0.10)',
                                  backdropFilter: 'blur(12px) saturate(120%)',
                                  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                  borderColor: 'rgba(255, 255, 255, 0.08)',
                                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                                }}>

                                  {equippedItem &&
                                <img
                                  src={equippedItem.icon_url || equippedItem.icon}
                                  alt={equippedItem.name}
                                  className="w-full h-full object-contain p-2" />

                                }
                                </div>);

                          })}
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
                            {[1, 2].map((i) => {
                            const slotId = `artifact-top-${i}`;
                            const equippedItem = equippedItems[slotId];
                            return (
                              <div
                                key={slotId}
                                onClick={() => handleBoxClick(slotId)}
                                className="w-20 h-20 rounded-2xl border shadow-lg hover:border-cyan-400/30 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden relative"
                                style={{
                                  background: 'rgba(100, 120, 140, 0.10)',
                                  backdropFilter: 'blur(12px) saturate(120%)',
                                  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                  borderColor: 'rgba(255, 255, 255, 0.08)',
                                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                                }}>

                                  {equippedItem &&
                                <img
                                  src={equippedItem.icon_url || equippedItem.icon}
                                  alt={equippedItem.name}
                                  className="w-full h-full object-contain p-2" />

                                }
                                </div>);

                          })}
                          </div>
                          <div className="flex gap-4">
                            {[3, 4, 5].map((i) => {
                            const slotId = `artifact-bottom-${i}`;
                            const equippedItem = equippedItems[slotId];
                            return (
                              <div
                                key={slotId}
                                onClick={() => handleBoxClick(slotId)}
                                className="w-20 h-20 rounded-2xl border shadow-lg hover:border-cyan-400/30 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden relative"
                                style={{
                                  background: 'rgba(100, 120, 140, 0.10)',
                                  backdropFilter: 'blur(12px) saturate(120%)',
                                  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                  borderColor: 'rgba(255, 255, 255, 0.08)',
                                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                                }}>

                                  {equippedItem &&
                                <img
                                  src={equippedItem.icon_url || equippedItem.icon}
                                  alt={equippedItem.name}
                                  className="w-full h-full object-contain p-2" />

                                }
                                </div>);

                          })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side Stats Panel */}
                    <div className="flex-shrink-0 pt-6 flex flex-col relative z-40">
                      <LunaStatsPanel />
                    </div>
                    </div>
                  
                  {/* Divider Line */}
                  <div className="w-full flex items-center gap-4 mt-12 mb-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <span className="text-white/30 text-xs font-medium uppercase tracking-widest">What's Happening</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                  
                  {/* Upcoming Events Section */}
                  <UpcomingEventsSection />
                  
                  {/* Library Section - Bottom Docked, Secondary */}
                  <div className="w-full mt-6">
                    <LunaCardScroll onExpand={setExpandedGenre} onCardClick={setSelectedCardForUpgrade} />
                  </div>
                  </motion.div> :
              null}
            {showInventory && uiVisible &&
              <motion.div
                key="inventory"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                className="w-full max-w-5xl">

                <InventoryPanel
                  inventory={inventoryData}
                  capacity={profileData.inventoryCapacity}
                  profile={profileData}
                  onClose={() => setShowInventory(false)}
                  onEquip={handleEquipItem} />

              </motion.div>
              }
          </AnimatePresence>
          </motion.div>
          }
        </AnimatePresence>
        </div>
      }



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
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                    blankPageTab === 'entertainment' ?
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
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                    blankPageTab === 'streaming' ?
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
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                    blankPageTab === 'social' ?
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
                      className="flex flex-wrap gap-4">

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

      {/* Floating Score Display */}
      {uiVisible &&
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl pointer-events-none" style={{ display: uiVisible ? 'flex' : 'none' }}>

        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total Score</div>
          <div className="text-xl font-black text-white leading-none">12,450</div>
        </div>
      </motion.div>
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
        <CalendarOverlay
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

            <div className="h-full w-full pt-20 overflow-hidden">
              {activeSubTab === 'forum' && <CommunityPage />}
              {activeSubTab === 'blacksmith' && <div className="text-white p-8">Blacksmith Content Here</div>}
              {activeSubTab === 'seasonalpass' && <SeasonalPassContent />}
              {activeSubTab === 'entertainment' && <div className="text-white p-8">Entertainment Content Here</div>}
              {activeSubTab === 'clan' && <div className="text-white p-8">Clan Content Here</div>}
            </div>
          </motion.div>
        }
      </AnimatePresence>

      </div>);


}