import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, Settings,
  Home, BookOpen, Zap, Sword, Gamepad2, Target, Layers,
  ChevronLeft, ChevronRight, User, Trophy, MessageSquare, Shield, Swords, Bot, Crown, Radio, Users, Globe,
  Grid, ArrowUpAz, ArrowDownAz, ArrowUp, ArrowDown, GripVertical, Clapperboard,
  Film, Sparkles, Play, ShoppingBag, Tv, Monitor, Mountain, Feather, Calendar, Hammer, Video
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
import ShinyCard from '../components/shared/ShinyCard';
import HolographicTile from '@/components/dashboard/HolographicTile';
import CardEnhancementOverlay from '../components/profile/CardEnhancementOverlay';
import { inventoryData, profileData, itemData } from '../components/profile/mockData';
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
import IntelligentCalendarOverlay from '../components/calendar/IntelligentCalendarOverlay';
import PlatformUpdateModal from '../components/calendar/PlatformUpdateModal';
import FocusModePanel from '../components/dashboard/FocusModePanel';
import CommunityPage from './Community';
import Blacksmith from './Blacksmith';
import UpcomingEventsSection from '../components/dashboard/UpcomingEventsSection';
import Achievements from './Achievements';
import Leaderboard from './Leaderboard';
import EntertainmentHub from '../components/dashboard/EntertainmentHub.jsx';
import useLunaStore from '../components/luna/useLunaStore';
import { useEquipment } from '../components/luna/hooks/useEquipment';
import { useSkills } from '../components/luna/hooks/useSkills';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { showError } from '@/components/error/ErrorToast';
import FriendsHubOverlay from '../components/dashboard/FriendsHubOverlay';
import SideAccessMenu from '../components/dashboard/SideAccessMenu';
import AvatarProgressionBox from '../components/avatar/AvatarProgressionBox';
import AvatarStatsOverlay from '../components/dashboard/AvatarStatsOverlay';
import EnvironmentSelector from '../components/avatarHome/EnvironmentSelector';
import GlassPageFrame from '../components/shared/GlassPageFrame';
import Mini3DViewerBox from '../components/dashboard/Mini3DViewerBox';
import DevSpotlightOverlay from '../components/dashboard/DevSpotlightOverlay';
import CardCollectionBrowser from '../components/dashboard/CardCollectionBrowser';
import QuestLogBook from '../components/dashboard/QuestLogBook';
import ReactorBridge from '../components/admin/reactor/ReactorBridge';
import CombatXPHandler from '../components/combat/CombatXPHandler';
import MultiplayerSystem from '../components/game/MultiplayerSystem';
import { attachWeapon, attachEffect } from '../components/3d/WeaponAttachmentSystem';
import DevSpotlightRibbon from '../components/dashboard/DevSpotlightRibbon';
import FriendsListContent from '../components/dashboard/FriendsListContent';
import ExpandedGenreView from '../components/dashboard/ExpandedGenreView';
import InventoryGrid from '../components/dashboard/InventoryGrid';
import TransparentModel3DViewer from '../components/dashboard/TransparentModel3DViewer';

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


// ExpandedGenreView extracted to component

import { ConsoleTile, LegendaryTile, LeaderboardTile } from '../components/dashboard/ConsoleTiles';

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
  const [stageMode, setStageMode] = useState('default'); // 'default', 'stats', 'live', 'friends'
  const [showAINews, setShowAINews] = useState(false);
  // showInventory removed to prevent duplicate state source of truth
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
  const [avatarFocusMode, setAvatarFocusMode] = useState(false);
  const [showQuestBook, setShowQuestBook] = useState(true);
  const [showCardCollection, setShowCardCollection] = useState(true);
  const [activeAvatarFocusView, setActiveAvatarFocusView] = useState(null);
  const [currentHostName, setCurrentHostName] = useState(null);

  useEffect(() => {
    if (user) {
      setCurrentHostName(user.full_name || user.username || 'My');
    }
  }, [user]);

  useEffect(() => {
    const handleJoin = (e) => {
      const { hostId, hostName } = e.detail;
      if (hostId === user?.id || !hostId) {
        setCurrentHostName(user?.full_name || user?.username || 'My');
      } else if (hostName) {
        setCurrentHostName(hostName);
      }
    };
    window.addEventListener('joinMultiplayerChannel', handleJoin);
    return () => window.removeEventListener('joinMultiplayerChannel', handleJoin);
  }, [user]);

  useEffect(() => {
    const toggleQB = () => setShowQuestBook(v => !v);
    const toggleCC = () => setShowCardCollection(v => !v);
    window.addEventListener('toggleQuestBook', toggleQB);
    window.addEventListener('toggleCardCollection', toggleCC);
    return () => {
      window.removeEventListener('toggleQuestBook', toggleQB);
      window.removeEventListener('toggleCardCollection', toggleCC);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      setAvatarFocusMode(prev => {
        if (prev) setActiveAvatarFocusView(null);
        return !prev;
      });
    };
    window.addEventListener('toggleAvatarFocusMode', handler);
    return () => {
      window.removeEventListener('toggleAvatarFocusMode', handler);
    };
  }, []);

  // Hardcoded assets for System Reboot
  const [modelUrl, setModelUrl] = useState(null);
  const [roomModelUrl, setRoomModelUrl] = useState(null);
  const [activeScene, setActiveScene] = useState(null);
  const [bannerBackgroundUrl, setBannerBackgroundUrl] = useState(null);
  const [playerSpawn, setPlayerSpawn] = useState({ x: 0, y: -0.5, z: 0 });
  const [useMeshCollision, setUseMeshCollision] = useState(false);

  // Auto-select model: Y-Bot (Xbot.glb)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Default to Y-bot (using Xbot.glb as standard web-ready version)
        let url = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Xbot.glb';
        
        // Optional: Check for override in DB
        // const exact = await base44.entities.ModelFBX.filter({ name: 'Y-bot' });
        // if (exact && exact.length) url = exact[0].file_url;

        if (!cancelled) {
          setModelUrl(url);
        }
      } catch (e) {
        console.error('Dashboard model lookup failed:', e);
      }
    };
    if (!modelUrl) load();
    return () => { cancelled = true; };
  }, [modelUrl]);
  const [clickedSlot, setClickedSlot] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showAvatarProgression, setShowAvatarProgression] = useState(false);
  const [hideUI, setHideUI] = useState(false); // Toggle with '0' key
  const [showDevSpotlight, setShowDevSpotlight] = useState(false); // Toggle with 'P' key
  const [currentEnvId, setCurrentEnvId] = useState('default_room');

  const { mode } = useDashboardMode();

  // Fetch Active Scene Layout from Admin
  useEffect(() => {
    const fetchScene = async () => {
        try {
            // 1. Try to find an ACTIVE SceneLayout
            const layouts = await base44.entities.SceneLayout.filter({ is_active: true });
            
            if (layouts.length > 0) {
                const layout = layouts[0];
                console.log("Loading Active Scene:", layout.name);
                setActiveScene(layout);
                if (layout.environment_url) setRoomModelUrl(layout.environment_url);
            } else {
                // Fallback to legacy auto-fetch logic if no scene is active
                console.warn("No active scene found, falling back to auto-discovery.");
                const models = await base44.entities.Model3D.list();
                const room2Fbx = models.find(m => (m.name.toLowerCase().includes('room 2') || m.name.toLowerCase().includes('room2')) && (m.file_type === 'fbx' || m.file_url.toLowerCase().endsWith('.fbx')));
                const room2Any = models.find(m => m.name.toLowerCase().includes('room 2') || m.name.toLowerCase().includes('room2'));
                const room1Asset = models.find(m => m.name.toLowerCase().includes('room 1') || m.name.toLowerCase().includes('room1'));
                const selectedAsset = room2Fbx || room2Any || room1Asset;
                
                if (selectedAsset?.file_url) {
                  setRoomModelUrl(selectedAsset.file_url);
                  // Apply per-environment spawn & collision settings
                  if (selectedAsset.player_spawn) setPlayerSpawn(selectedAsset.player_spawn);
                  if (selectedAsset.use_mesh_collision) setUseMeshCollision(true);
                }
                else setRoomModelUrl('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/58d1bc849_scene.gltf');
            }
        } catch (e) {
            console.error("Failed to load scene configuration:", e);
        }
    };
    fetchScene();
    
    // Model selection handled separately (Maria WProp J J Ong)
  }, []);

  // Load saved environment preference
  useEffect(() => {
    const loadUserEnv = async () => {
      if (!user?.id) return;
      try {
        const states = await base44.entities.AvatarHomeState.filter({ avatarId: user.id });
        if (states && states.length > 0 && states[0].currentEnvironmentId) {
          const savedId = states[0].currentEnvironmentId;
          setCurrentEnvId(savedId);
          
          // 1. Try to load as SceneLayout (New System)
          if (savedId !== 'default_room' && !savedId.startsWith('joined_')) {
             try {
                 const layouts = await base44.entities.SceneLayout.filter({ id: savedId });
                 if (layouts && layouts.length > 0) {
                     const layout = layouts[0];
                     setActiveScene(layout);
                     if (layout.environment_url) setRoomModelUrl(layout.environment_url);
                     return;
                 }
             } catch (e) { /* Not a scene layout or fetch failed */ }

             // 2. Legacy Fallback (Old IDs)
             const models = await base44.entities.Model3D.list();
             const fbxs = await base44.entities.ModelFBX.list();
             const all = [...(models || []), ...(fbxs || [])];
             
             const queries = {
               'cyber_loft': ['room 2', 'room2'],
               'zen_garden': ['zen', 'garden'],
               'mars_outpost': ['mars', 'outpost']
             };
             
             if (queries[savedId]) {
               const found = all.find(m => queries[savedId].some(q => (m.name || '').toLowerCase().includes(q)));
               if (found?.file_url) {
                 setRoomModelUrl(found.file_url);
               }
             }
          } else {
             // Default Room fallback
             try {
                 const models = await base44.entities.Model3D.list();
                 const room1Asset = models.find(m => m.name.toLowerCase().includes('room 1') || m.name.toLowerCase().includes('room1'));
                 if (room1Asset?.file_url) setRoomModelUrl(room1Asset.file_url);
                 else setRoomModelUrl('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/58d1bc849_scene.gltf');
                 setActiveScene(null);
             } catch {}
          }
        }
      } catch (e) { console.error('Error loading env pref', e); }
    };
    loadUserEnv();
  }, [user?.id]);

  const handleEnvSelect = async (env) => {
    if (env.isSkybox) {
      setBannerBackgroundUrl(env.background);
      return;
    }

    setCurrentEnvId(env.id);
    
    // Update player spawn and collision from environment data
    if (env.playerSpawn) {
      setPlayerSpawn(env.playerSpawn);
    } else {
      setPlayerSpawn({ x: 0, y: -0.5, z: 0 });
    }
    setUseMeshCollision(env.useMeshCollision || false);
    
    // Check if it's a full SceneLayout
    if (env.layoutData) {
        console.log("Switching to Scene Layout:", env.layoutData.name);
        setActiveScene(env.layoutData);
        if (env.layoutData.environment_url) {
            setRoomModelUrl(env.layoutData.environment_url);
        }
    } else if (env.modelUrl) {
        // Legacy/Simple model switch
        setRoomModelUrl(env.modelUrl);
        setActiveScene(null); // Clear complex scene if switching to simple env
    }

    // Persist Preference
    if (user?.id && !env.id.toString().startsWith('joined_')) {
      try {
        const states = await base44.entities.AvatarHomeState.filter({ avatarId: user.id });
        if (states.length > 0) {
          await base44.entities.AvatarHomeState.update(states[0].id, { currentEnvironmentId: env.id });
        } else {
          await base44.entities.AvatarHomeState.create({ avatarId: user.id, currentEnvironmentId: env.id });
        }
      } catch (e) { console.error('Error saving env pref', e); }
    }
  };



  useEffect(() => {
    return () => {
      resetLunaStore();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const panel = params.get('panel');
    setShowSettings(panel === 'settings');
    if (panel === 'live') setStageMode('live');
    setShowProfile(panel === 'profile');
    setShowNotifications(panel === 'notifications');
    setShowConsoleMode(panel === 'console');

    if (panel === 'blacksmith' || panel === 'entertainment' || panel === 'clan' || panel === 'forum') {
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
    const handleEnvChange = (e) => {
      const { envUrl, layoutData, envId } = e.detail || {};
      if (envUrl) {
        setRoomModelUrl(envUrl);
        if (layoutData !== undefined) {
          setActiveScene(layoutData);
        }
        if (envId) {
          setCurrentEnvId(envId);
        }
      }
    };
    window.addEventListener('changeEnvironment', handleEnvChange);
    return () => window.removeEventListener('changeEnvironment', handleEnvChange);
  }, []);

  useEffect(() => {
    const checkBladeEquipped = async () => {
      // Check if any weapon slot has an item with a model_url (direct from inventory)
      const equippedWeapon = Object.entries(equippedItems).find(
        ([slotId, item]) => slotId.startsWith('weapon-') && item.model_url
      );

      if (equippedWeapon) {
        const [, item] = equippedWeapon;
        if (item.model_url !== weaponModelUrl) {
          setWeaponModelUrl(item.model_url);
        }
        return;
      }

      // Legacy check for Blade of Abyss by name
      const hasBladeOfAbyss = Object.entries(equippedItems).some(
        ([slotId, item]) => slotId.startsWith('weapon-') && (item.name === 'Blade of Abyss' || item.name === 'Blade of the Abyss')
      );

      if (hasBladeOfAbyss && !weaponModelUrl) {
        // Use the known sword GLB URL directly
        setWeaponModelUrl('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/53379b78d_stylized_emerald_sword.glb');
      } else if (!hasBladeOfAbyss && !equippedWeapon && weaponModelUrl) {
        setWeaponModelUrl(null);
      }
    };

    checkBladeEquipped();
  }, [equippedItems, weaponModelUrl]);

  const [triggerAnimation, setTriggerAnimation] = useState(null);
  const stageContainerRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      const key = (e.key || '').toLowerCase();
      if (key === 'i') {
        if (clickedSlot) {
          setClickedSlot(null);
        } else {
          setUiVisible((v) => !v);
        }
      }
      if (key === 'p') {
        setShowDevSpotlight((v) => !v);
      }
      if (key === '0') {
        setHideUI((v) => !v);
      }
      if (key === 'escape') {
        if (showDevSpotlight) { setShowDevSpotlight(false); return; }
        if (hideUI) setHideUI(false);
        if (showAvatarProgression) setShowAvatarProgression(false);
        if (showForumOverlay) setShowForumOverlay(false);
        const params = new URLSearchParams(window.location.search);
        if (params.get('panel')) {
          navigate(createPageUrl('LunaTemplate'));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForumOverlay, showAvatarProgression, navigate]);

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
    // Open the new centralized inventory overlay only
    window.dispatchEvent(new CustomEvent('openInventoryPanel', { detail: { slotId } }));
  };

  const handleEquipItem = (item) => {
    if (clickedSlot && item) {
      equipItem(clickedSlot, item);
      // Do NOT close inventory on equip - keeps UI stable
    }
  };

  // Open InventoryPanel from other components (e.g., StatsDropdown InventoryGrid)
  useEffect(() => {
    const handler = (e) => {
      const slotId = e?.detail?.slotId;
      if (slotId) {
        setClickedSlot(slotId);
        setStageMode('default'); // Close stats panel to prevent duplicate UI background
      }
    };
    window.addEventListener('openInventoryPanel', handler);
    return () => window.removeEventListener('openInventoryPanel', handler);
  }, []);

  if (mode === 'user') {
    return (
      <div className="h-screen w-full bg-slate-900 pt-24 px-8 pb-8">
        <UserInterfaceView />
      </div>);

  }

  return (
    <PageErrorBoundary pageName="LunaTemplate">
    <GlassPageFrame>
    {/* Combat XP handler — listens for kill events and updates AvatarProgression */}
    <CombatXPHandler />
    <MultiplayerSystem envUrl={roomModelUrl} />
    <div
      className="min-h-screen text-white p-8 pt-0 overflow-hidden relative"
      style={{
        backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/fed9dc2c3_unnamed4.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#080808'
      }}>



      {/* Mini 3D Viewer Box + Quest Log Book + Card Collection - positioned below the dashboard title, left column */}
      {!showConsoleMode && !showAchievements && (
        <div className="fixed z-20 pointer-events-auto flex flex-col transition-all duration-700 ease-in-out" 
             style={uiVisible ? {
               left: '32px', top: '80px', bottom: '0px', width: '388px', gap: '0px'
             } : { left: '32px', top: '80px', width: '322px', gap: '12px' }}>
             
          <Mini3DViewerBox isUiVisible={uiVisible} hostName={currentHostName} />
          
          {!avatarFocusMode && !uiVisible && (
            <>
              {showQuestBook && (
                <div className="w-full" style={{ transform: 'scale(1.15)', transformOrigin: 'top left' }}>
                  <QuestLogBook />
                </div>
              )}
              {showCardCollection && (
                <div className="w-full" style={{ marginTop: '24px' }}>
                  <CardCollectionBrowser />
                </div>
              )}
            </>
          )}

          <AnimatePresence>
            {avatarFocusMode && !uiVisible && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-3 mt-2"
              >
                {['AI Story', 'AI Battle', 'Leaderboard', 'Stats', 'Live'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setActiveAvatarFocusView(activeAvatarFocusView === opt ? null : opt)}
                    className={`w-full py-4 rounded-xl border transition-all backdrop-blur-md shadow-lg uppercase tracking-wider text-sm cursor-pointer text-center font-bold ${
                      activeAvatarFocusView === opt
                        ? 'bg-cyan-500/20 border-cyan-400/50 text-white shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Avatar Focus Content Panel (Appears to the right) */}
      <AnimatePresence>
        {avatarFocusMode && activeAvatarFocusView && !uiVisible && !showConsoleMode && !showAchievements && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            className="fixed z-10 pointer-events-auto overflow-hidden flex flex-col"
            style={{
              left: '440px',
              top: '80px',
              bottom: '32px',
              width: '1000px',
              maxWidth: 'calc(100vw - 480px)',
              background: 'transparent'
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-transparent">
              <h2 className="text-xl font-bold text-white tracking-wider uppercase flex items-center gap-3">
                {activeAvatarFocusView === 'AI Story' && <Sparkles className="w-5 h-5 text-cyan-400" />}
                {activeAvatarFocusView === 'AI Battle' && <Swords className="w-5 h-5 text-red-400" />}
                {activeAvatarFocusView === 'Leaderboard' && <Crown className="w-5 h-5 text-yellow-400" />}
                {activeAvatarFocusView === 'Stats' && <Layers className="w-5 h-5 text-purple-400" />}
                {activeAvatarFocusView === 'Live' && <Radio className="w-5 h-5 text-green-400" />}
                {activeAvatarFocusView}
              </h2>
              <button
                onClick={() => setActiveAvatarFocusView(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto relative bg-transparent" style={{ scrollbarWidth: 'none' }}>
              {activeAvatarFocusView === 'AI Story' && <AIStoryOverlay onClose={() => setActiveAvatarFocusView(null)} />}
              {activeAvatarFocusView === 'AI Battle' && <BattleModeOverlay onClose={() => setActiveAvatarFocusView(null)} />}
              {activeAvatarFocusView === 'Stats' && <AvatarStatsOverlay onClose={() => setActiveAvatarFocusView(null)} />}
              {activeAvatarFocusView === 'Leaderboard' && (
                <div className="absolute inset-0 bg-transparent overflow-y-auto overflow-x-hidden">
                  <Leaderboard isEmbedded={true} />
                </div>
              )}
              {activeAvatarFocusView === 'Live' && <StreamingDiscovery />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Model Viewer - Full Page Background */}
      {/* Hidden when overlays are open (Friends Hub, Achievements, etc.) */}
      {(modelUrl || roomModelUrl) && !showConsoleMode && !showFriendsHub && !showAchievements &&
        <div
          className="fixed inset-0 z-0 pointer-events-auto"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100vw',
            height: '100vh',
            // Ensure background image container doesn't move, only this 3D view container is affected
            // but the transform is inside TransparentModel3DViewer, so this wrapper stays put.
          }}>

          <TransparentModel3DViewer 
            modelUrl={modelUrl} 
            weaponModel={weaponModelUrl} 
            triggerAnimation={triggerAnimation} 
            backgroundUrl={bannerBackgroundUrl} 
            roomModelUrl={roomModelUrl} 
            activeScene={activeScene}
            isStatsOpen={stageMode === 'stats'}
            playerSpawn={playerSpawn}
            useMeshCollision={useMeshCollision}
            equippedWeaponUrl={weaponModelUrl}
            drawEffectUrl="https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/2d967f68b_jetpack_effect.glb"
          />
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

      {/* Developer Spotlight Overlay (P key) */}
      <AnimatePresence>
        {showDevSpotlight && (
          <DevSpotlightOverlay onClose={() => setShowDevSpotlight(false)} />
        )}
      </AnimatePresence>

      {/* Focus Mode Panel - Shows when UI is hidden (I key) */}
      <AnimatePresence>
        {!uiVisible && !showConsoleMode && !avatarFocusMode &&
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed right-8 z-30 overflow-hidden pointer-events-none"
            style={{
              left: '440px', /* Offset matches expanded 3D viewer (420px) + 20px gap */
              top: '80px',
              bottom: '32px',
            }}>

            <div className="h-full">
              <FocusModePanel
                 onOpenCalendar={() => setShowCalendar(true)}
                 onBackgroundChange={(url) => setBannerBackgroundUrl(url)}
                 onToggleStats={() => setStageMode(m => m === 'stats' ? 'default' : 'stats')}
                 currentEnvId={currentEnvId}
                 onSelectEnv={handleEnvSelect}
                 onOpenDevSpotlight={() => setShowDevSpotlight(true)}
                />
            </div>
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
            className="w-full h-screen pt-20 px-12 pb-12 relative z-20 flex flex-col pointer-events-none"
          >
{!showAvatarProgression && (
            <>
            {/* Live/Stats Dropdowns Removed - Replaced by DashboardStage */}

            {/* TOP SECTION: Aspects / Artifacts / Genre */}
            <div className={`flex gap-12 mb-6 items-start pointer-events-auto transition-opacity duration-500 ${hideUI ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {/* Aspects */}
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Aspects</h2>
                <div className="relative w-40 h-4">
                  <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
                </div>
                <div className="flex gap-3">
                  {[1,2,3].map((i)=> (
                    <div key={i} className="w-[60px] h-[60px] rounded-full border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Artifacts */}
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Artifacts</h2>
                <div className="relative w-52 h-4">
                  <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
                </div>
                <div className="flex gap-3">
                  {[1,2,3,4,5].map((i)=> (
                    <div key={i} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Genre */}
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Genre</h2>
                <div className="relative w-40 h-4">
                  <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
                </div>
                <div className="flex gap-3">
                  {[1,2].map((i)=> (
                    <div key={i} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider Line under Game Banner */}
            <div className={`h-px bg-white/10 mb-6 transition-opacity duration-500 ${hideUI ? 'opacity-0' : 'opacity-100'}`} />

            {/* QUICK ACCESS BOXES */}
            <div style={{ paddingLeft: '440px' }}>
            <div className={`flex gap-4 mb-6 pointer-events-auto transition-opacity duration-500 ${hideUI ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {/* Stats */}
              <ConsoleTile
                onClick={() => setStageMode(m => m === 'stats' ? 'default' : 'stats')}
                className={`flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2 ${stageMode === 'stats' ? 'border-cyan-400/50 bg-cyan-900/20' : ''}`}
              >
                <Grid className={`w-10 h-10 relative z-10 ${stageMode === 'stats' ? 'text-cyan-400' : ''}`} style={stageMode === 'stats' ? {} : { stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                <span className={`text-sm font-sans relative z-10 ${stageMode === 'stats' ? 'text-cyan-400 font-bold' : 'text-[#CCCCCC]'}`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Stats</span>
              </ConsoleTile>

              {/* Friends (Replaces Skill Tree) */}
              <ConsoleTile
                onClick={() => setStageMode(m => m === 'friends' ? 'default' : 'friends')}
                className={`flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2 ${stageMode === 'friends' ? 'border-green-400/50 bg-green-900/20' : ''}`}
              >
                <Users className={`w-10 h-10 relative z-10 ${stageMode === 'friends' ? 'text-green-400' : ''}`} style={stageMode === 'friends' ? {} : { stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                <span className={`text-sm font-sans relative z-10 ${stageMode === 'friends' ? 'text-green-400 font-bold' : 'text-[#CCCCCC]'}`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Friends</span>
              </ConsoleTile>

              {/* Live (Replaces Cards) */}
              <ConsoleTile
                onClick={() => setStageMode(m => m === 'live' ? 'default' : 'live')}
                className={`flex-1 h-28 cursor-pointer flex flex-col items-center justify-center gap-2 ${stageMode === 'live' ? 'border-red-400/50 bg-red-900/20' : ''}`}
              >
                <Video className={`w-10 h-10 relative z-10 ${stageMode === 'live' ? 'text-red-400' : ''}`} style={stageMode === 'live' ? {} : { stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 10px rgba(255, 215, 0, 0.6))' }} strokeWidth={1.5} />
                <span className={`text-sm font-sans relative z-10 ${stageMode === 'live' ? 'text-red-400 font-bold' : 'text-[#CCCCCC]'}`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Live</span>
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

            {/* DASHBOARD STAGE: EnvironmentSelector always in normal flow */}
            {/* Stage overlay (Stats/Friends/Live) floats on top without affecting layout */}
            <div 
              className={`mb-6 relative transition-opacity duration-500 pointer-events-auto ${hideUI ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              ref={stageContainerRef}
            >
              {/* Always-visible default content — EnvironmentSelector only, DevSpotlight moved to right column */}
              <div className="flex flex-col gap-4">
                <EnvironmentSelector currentEnvId={currentEnvId} onSelect={handleEnvSelect} />
                {/* Open space below — Stats/Friends/Live overlay fills this exactly */}
                <div style={{ height: '140px' }} />
              </div>

              {/* Overlay panel — floats ON TOP of the open space, no layout impact */}
              <AnimatePresence>
                {stageMode !== 'default' && (
                  <motion.div
                    key={stageMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute z-30 rounded-2xl overflow-hidden"
                    style={{
                      top: 'calc(100% - 140px)',
                      left: 0,
                      right: 0,
                      height: '140px',
                      background: 'linear-gradient(135deg, rgba(10, 16, 26, 0.96) 0%, rgba(14, 22, 38, 0.94) 100%)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: stageMode === 'stats' ? '1px solid rgba(34,211,238,0.30)'
                            : stageMode === 'friends' ? '1px solid rgba(74,222,128,0.30)'
                            : '1px solid rgba(248,113,113,0.30)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(125,211,252,0.06)',
                    }}
                  >
                    {/* Close button */}
                    <button
                      onClick={() => setStageMode('default')}
                      className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                      <X className="w-3 h-3 text-white/60" />
                    </button>

                    {stageMode === 'stats' && (
                      <div className="h-full overflow-y-auto p-3" style={{ scrollbarWidth: 'none' }}>
                        <div className="text-white/40 text-xs text-center py-8">Click a stat button below to expand</div>
                      </div>
                    )}

                    {stageMode === 'friends' && (
                      <div className="h-full overflow-hidden">
                        <FriendsListContent />
                      </div>
                    )}

                    {stageMode === 'live' && (
                      <div className="h-full flex gap-3 p-3">
                        <div className="flex-1 bg-black/40 rounded-xl border border-red-500/20 overflow-hidden flex items-center justify-center flex-col gap-2">
                          <Video className="w-8 h-8 text-red-500/40" />
                          <span className="text-white/30 text-xs">Stream Offline</span>
                        </div>
                        <div className="w-1/3 bg-black/40 rounded-xl border border-white/10 flex flex-col overflow-hidden">
                          <div className="p-2 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <span className="text-white font-bold text-xs">Chat</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          </div>
                          <div className="flex-1 p-2">
                            <div className="text-[10px] text-white/40 italic">Connecting...</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            </div>

            {/* Main Grid: Leaderboard + 2x2 Right */}
            {/* Added relative z-index to ensure it sits below the overlays if they overflow */}
            <div className={`flex-1 flex gap-6 min-h-0 relative z-0 transition-opacity duration-500 ${hideUI ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {/* Leaderboard Tile - Left */}
              <div className="pointer-events-auto"><LeaderboardTile /></div>

              {/* Right Side - 2x2 Grid */}
                <div className="flex-1 flex flex-col gap-6">
                   {/* App Shortcuts */}
                   <div className="flex gap-6 flex-1">
                     {/* My Games & Apps */}
                     <ConsoleTile
                       onClick={() => navigate(createPageUrl('Store') + '?subview=library')}
                       className="flex-1 cursor-pointer flex flex-col items-center justify-center gap-3 pointer-events-auto"
                     >
                       <Layers className="w-16 h-16 relative z-10" style={{ stroke: 'url(#silverGradient)', filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.4))' }} strokeWidth={1.5} />
                       <span className="text-[#CCCCCC] text-lg font-sans text-center relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>My games & apps</span>
                     </ConsoleTile>
                   </div>
                   {/* Developer Spotlight — at the bottom of the right column, aligned with AI Attribute Box bottom */}
                   <div className="pointer-events-auto">
                     <DevSpotlightRibbon onOpenOverlay={() => setShowDevSpotlight(true)} />
                   </div>
                 </div>
            </div>
            </>
            )}

            {showAvatarProgression && (
              <div className="pt-4 pr-8" style={{ paddingLeft: '440px' }}>
                <div className="max-w-5xl mx-auto pointer-events-auto">
                  <AvatarProgressionBox />
                </div>
              </div>
            )}

            {/* Time Display - Bottom Left */}
            <div className="absolute bottom-6 left-12 z-30 pointer-events-auto">
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

                  <div className="mt-6 w-full max-w-sm">
                  <LunaStatsPanel />
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
                  {expandedGenre ? (
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
                    </motion.div>
                  ) : (
                    <InventoryGrid equippedItems={equippedItems} handleBoxClick={handleBoxClick} />
                  )}
                  </AnimatePresence>
                </motion.div>
              }
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Inventory Panel Overlay (Global) - Single Instance */}
      {/* Moved out of AnimatePresence to ensure single stable instance when visible */}
      {clickedSlot && (
        <div 
          className="fixed inset-0 z-[60]"
          key="inventory-panel-container"
        >
          <InventoryPanel
            inventory={inventoryData}
            onEquip={handleEquipItem}
            targetSlot={clickedSlot}
            onClose={() => setClickedSlot(null)}
          />
        </div>
      )}

      {/* Avatar Progression Overlay (O key) */}
      <AnimatePresence>
        {showAvatarProgression && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowAvatarProgression(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <div className="flex-1 overflow-y-auto p-8">
                <AvatarProgressionBox />
              </div>
              <button
                onClick={() => setShowAvatarProgression(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        )}
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

      {/* Side Access Menu - Minimally invasive left edge interaction */}
      {!clickedSlot && !showConsoleMode && !showAchievements && !activeSubTab && (
        // SideAccessMenu stays visible even when hideUI is true, per user request:
        // "You're going to keep the button that's below the navigation menu. Inside this button is my library, aura, and entertainment."
        // SideAccessMenu contains Library, Entertainment, AI Story, AI Battle - close enough match
        <SideAccessMenu />
      )}

      {/* Calendar Overlay */}
      <AnimatePresence>
        {showCalendar && (
          <IntelligentCalendarOverlay onClose={() => setShowCalendar(false)} currentUserId={user?.id} />
        )}
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
              {activeSubTab === 'entertainment' && <EntertainmentHub />}
              {activeSubTab === 'clan' && <div className="text-white p-8">Clan Content Here</div>}
            </div>
          </motion.div>
        }
      </AnimatePresence>

    </div>
    </GlassPageFrame>
    </PageErrorBoundary>
    );


}