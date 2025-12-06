import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Trophy, Zap, Lock, CheckCircle, Users, MessageSquare, TrendingUp, X,
  Radio, Star, Heart, Clock, Upload, Download, Youtube, Share2,
  Calendar, Target, MapPin, Bell, Mail, Bookmark, Eye, EyeOff, Video,
  Search, Filter, ChevronDown, Sparkles, Loader2, LayoutGrid, Mic, MicOff, Volume2,
  Bot, Gamepad2, Palette, List, Grid, Send, HelpCircle, Hash, Gift,
  ChevronLeft, User, Crown, Settings, LayoutDashboard, Info, Library, Gem, Swords,
  Home, BookOpen, Shield, Sword, ChevronRight, ImageIcon, Clapperboard, Package
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import ProfileModule from '../components/dashboard/ProfileModule';
import GameBrowser from '../components/dashboard/GameBrowser';
import ClipsOverlay from '../components/dashboard/ClipsOverlay';
import ActivityHub from '../components/dashboard/ActivityHub';
import GameHubOverlay from '../components/dashboard/GameHubOverlay';
import ConsoleHub from '../components/dashboard/ConsoleHub';
import ConsoleHubOverlay from '../components/dashboard/ConsoleHubOverlay';
import RecentlyAchievedOverlay from '../components/library/RecentlyAchievedOverlay';
import OwnedGameOverlay from '../components/library/OwnedGameOverlay';
import GameAchievementsOverlay from '../components/library/GameAchievementsOverlay';
import { allMockGames } from '../components/store/mockData';
import MoveHubTab from '../components/dashboard/MoveHubGames';
import ThreeScene from '../components/shared/ThreeScene';


import PartyPanel from '../components/clan/PartyPanel';
import DashboardTab from '../components/clan/DashboardTab';
import MembersTab from '../components/clan/MembersTab';
import RoomsTab from '../components/clan/RoomsTab';
import GuildInfoTab from '../components/clan/GuildInfoTab';

// New imports for multi-mode dashboard
import ModeToggle from '../components/dashboard/ModeToggle';

import AINexusView from '../components/dashboard/views/AINexusView';
import UserInterfaceView from '../components/dashboard/views/UserInterfaceView';
import EconomyDistrictView from '../components/dashboard/views/EconomyDistrictView';
import HallOfRecordsView from '../components/dashboard/views/HallOfRecordsView';

const GameCard = ({ game, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="relative rounded-lg overflow-hidden cursor-pointer group"
    onClick={onClick}
  >
    <img
      src={game.image}
      alt={game.title}
      className="w-full aspect-video object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
      <div>
        <h3 className="text-white font-bold text-sm mb-1">{game.title}</h3>
        <p className="text-slate-300 text-xs">{game.description}</p>
      </div>
    </div>
  </motion.div>
);

// Game Details Expandable Section Component
const GameDetailsSection = ({ game, onClose }) => {
  if (!game) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full border-2 border-blue-500/50 rounded-xl bg-slate-800/60 backdrop-blur-sm p-6 mb-6 relative">

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-colors">

        <X className="w-5 h-5" />
      </button>

      <div className="flex gap-6">
        {/* Game Cover */}
        <div className="w-48 h-64 flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={game.cover_image || game.cover}
            alt={game.title}
            className="w-full h-full object-cover" />

        </div>

        {/* Game Info */}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white mb-2">{game.title}</h2>
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
              {game.genre}
            </Badge>
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-semibold">{game.rating || '4.5'}</span>
            </div>
          </div>

          <p className="text-slate-300 mb-4 line-clamp-3">{game.description}</p>

          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Developer:</span>
              <span className="text-white">{game.developer || 'AtomXEve Studios'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Release Date:</span>
              <span className="text-white">{game.releaseDate || '2024'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Price:</span>
              <span className="text-green-400 font-bold">${game.price}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              <Play className="w-4 h-4 mr-2" />
              Play Now
            </Button>
            <Button variant="outline" className="border-slate-600 hover:bg-slate-700">
              View Full Details
            </Button>
            <Button variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20">
              <Trophy className="w-4 h-4 mr-2" />
              Achievements
            </Button>
          </div>
        </div>
      </div>
    </motion.div>);

};

const AIViewport = ({ selectedGame, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Welcome to the AI Assistant! How can I help you with your gameplay today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, { id: messages.length + 1, sender: 'user', text: inputMessage }]);
      setInputMessage('');
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          sender: 'ai',
          text: 'I understand. Let me help you with that...'
        }]);
      }, 1000);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold">AI Assistant</h3>
            <p className="text-slate-400 text-xs">{selectedGame?.title || 'Ready to assist'}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex">
        <div className="w-2/3 bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-4">
              <Sparkles className="w-16 h-16 text-blue-400" />
            </div>
            <p className="text-slate-400">AI Viewport Active</p>
          </div>
        </div>

        <div className="w-1/3 border-l border-slate-700 flex flex-col">
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 text-slate-200'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2 mb-3">
              <Button
                size="sm"
                variant={isRecording ? "destructive" : "outline"}
                className="flex-1"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isRecording ? 'Stop' : 'Voice'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <Volume2 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// AIViewport component - encapsulates the 3D model iframe and badges (RENAMED FROM AIViewport)
const LiveAI3DAvatar = ({ name, status, user }) => {
  // If user has a custom 3D model URL set
  const customModelUrl = user?.avatar?.model_url; 

  return (
    <div className="relative w-full h-full">
      {/* 3D Model Render */}
      <div className="w-full h-full bg-gradient-to-b from-slate-900/50 to-slate-900/10">
        {customModelUrl ? (
            <ThreeScene modelUrl={customModelUrl} scale={1.5} />
        ) : (
            /* Fallback to existing iframe or placeholder ThreeScene if preferred */
            /* Using ThreeScene as placeholder if no iframe to show readiness */
            <div className="w-full h-full relative z-10">
                <iframe 
                    title="Sinestrea WAVE (AOV)" 
                    frameBorder="0" 
                    allowFullScreen 
                    mozallowfullscreen="true" 
                    webkitallowfullscreen="true" 
                    allow="autoplay; fullscreen; xr-spatial-tracking" 
                    xr-spatial-tracking="true" 
                    execution-while-out-of-viewport="true" 
                    execution-while-not-rendered="true" 
                    web-share="true" 
                    src="https://sketchfab.com/models/a6493956f268493c8e40db5bbbca140f/embed?autostart=1&ui_controls=0&ui_infos=0&ui_stop=0&ui_inspector=0&ui_hint=0"
                    className="w-full h-full"
                />
            </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg text-white flex items-center gap-2 border border-purple-500/30 z-10">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        <span className="font-semibold">{user?.avatar?.gender === 'male' ? 'Atum' : 'Eve'} - Active</span>
      </div>

      {/* Info Badge */}
      <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg text-white border border-blue-500/30 z-10">
        <p className="text-xs text-slate-300">AI Companion</p>
        <p className="text-sm font-bold text-blue-400">Level {user?.avatar?.level || 1}</p>
      </div>
    </div>);

};


// Clan Hub Component
const ClanHubTab = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState({ role: 'Leader', name: 'Marcus' });

  // Simulate real-time member presence
  useEffect(() => {
    const simulatePresence = () => {
      const members = [
      { id: 1, name: 'Marcus', role: 'Leader', status: 'online', activity: 'In Dashboard', avatar: 'https://i.pravatar.cc/150?u=marcus', joinedAt: '2023-01-15', lastSeen: 'now' },
      { id: 2, name: 'Shadow_Stryker', role: 'Officer', status: 'online', activity: 'Playing Vanguard Ops', avatar: 'https://i.pravatar.cc/150?u=shadow', joinedAt: '2023-02-20', lastSeen: 'now' },
      { id: 3, name: 'Glitch_Witch', role: 'Member', status: 'away', activity: 'Idle', avatar: 'https://i.pravatar.cc/150?u=glitch', joinedAt: '2023-03-10', lastSeen: '5 minutes ago' },
      { id: 4, name: 'Jax_Ripper', role: 'Member', status: 'online', activity: 'In Division: Combat Training', avatar: 'https://i.pravatar.cc/150?u=jax', joinedAt: '2023-03-25', lastSeen: 'now' },
      { id: 5, name: 'Cortex', role: 'Member', status: 'offline', activity: 'Offline', avatar: 'https://i.pravatar.cc/150?u=cortex', joinedAt: '2023-04-05', lastSeen: '2 hours ago' },
      { id: 6, name: 'Vexia', role: 'Recruit', status: 'online', activity: 'In Voice Chat', avatar: 'https://i.pravatar.cc/150?u=vexia', joinedAt: '2023-04-20', lastSeen: 'now' }];


      setAllMembers(members);
      setOnlineMembers(members.filter((member) => member.status === 'online'));
    };

    simulatePresence();

    const interval = setInterval(() => {
      simulatePresence();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab currentUser={currentUser} onlineMembers={onlineMembers} />;
      case 'members':
        return <MembersTab members={allMembers} onlineMembers={onlineMembers} currentUser={currentUser} />;
      case 'rooms':
        return <RoomsTab onlineMembers={onlineMembers} currentUser={currentUser} />;
      case 'info':
        return <GuildInfoTab currentUser={currentUser} />;
      default:
        return null;
    }
  };

  const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'rooms', label: 'Divisions / Rooms', icon: MessageSquare },
  { id: 'info', label: 'Guild Info', icon: Info }];


  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Guild Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <img src="https://cdn-icons-png.flaticon.com/512/167/167735.png" alt="Clan Icon" className="w-12 h-12" />
            <div>
              <h2 className="text-2xl font-bold text-white">CYBER VANGUARDS</h2>
              <p className="text-sm text-cyan-400">"Forge the future, pixel by pixel."</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 bg-slate-900/70 p-1 rounded-lg border border-slate-700">
            {tabs.map((tab) =>
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              activeTab === tab.id ?
              'bg-blue-600 text-white' :
              'text-slate-300 hover:bg-slate-700/50'}`
              }>

                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}>

              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Party Panel */}
      <div className="w-80 flex-shrink-0 border-l border-slate-700/50 pl-4">
        <PartyPanel onlineMembers={onlineMembers} />
      </div>
    </div>);

};

// This section containing the definition of LibraryContent was moved to `../components/library/LibraryContent.jsx`
/*
const LibraryContent = () => {
  // ... (all existing code for LibraryContent and its sub-components) ...
};
*/

// MoveHub Component - Abilities & Skill Tree
/* This component was moved to its own file.
const MoveHubTab = () => {
  const [selectedGame, setSelectedGame] = React.useState(null);

  const moveHubGames = [
    {
      id: 1,
      title: 'Star Wars Knights of the Old Republic',
      image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=80&h=80&fit=crop',
      achievements: [
        { id: 1, name: 'Jedi Master', icon: '⚔️', description: 'Complete the Jedi training' },
        { id: 2, name: 'Sith Lord', icon: '🔴', description: 'Embrace the dark side' },
        { id: 3, name: 'Republic Hero', icon: '🌟', description: 'Save the Republic' },
        { id: 4, name: 'Force Sensitive', icon: '✨', description: 'Master all Force powers' }
      ]
    },
    {
      id: 2,
      title: 'Legend of Kain Blood Omen',
      image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=80&h=80&fit=crop',
      achievements: [
        { id: 1, name: 'Vampire Lord', icon: '🦇', description: 'Become the ultimate vampire' },
        { id: 2, name: 'Blood Feast', icon: '🩸', description: 'Drain 100 enemies' },
        { id: 3, name: 'Soul Reaver', icon: '⚔️', description: 'Obtain the Soul Reaver' },
        { id: 4, name: 'Ancient Power', icon: '💀', description: 'Unlock ancient abilities' }
      ]
    },
    {
      id: 3,
      title: 'Star Wars Jedi Knight Outcast',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=80&h=80&fit=crop',
      achievements: [
        { id: 1, name: 'Lightsaber Master', icon: '🗡️', description: 'Master all lightsaber forms' },
        { id: 2, name: 'Force Push', icon: '👋', description: 'Push 50 enemies off ledges' },
        { id: 3, name: 'Jedi Knight', icon: '⭐', description: 'Complete the story' },
        { id: 4, name: 'Dark Forces', icon: '🌑', description: 'Defeat the dark Jedi' }
      ]
    },
    {
      id: 4,
      title: 'Star Wars Jedi Academy',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=80&h=80&fit=crop',
      achievements: [
        { id: 1, name: 'Academy Graduate', icon: '🎓', description: 'Complete Jedi training' },
        { id: 2, name: 'Dual Wielder', icon: '⚔️⚔️', description: 'Master dual lightsabers' },
        { id: 3, name: 'Saber Staff', icon: '🔱', description: 'Master the double-bladed saber' },
        { id: 4, name: 'Chosen Path', icon: '🛤️', description: 'Choose your destiny' }
      ]
    },
    {
      id: 5,
      title: 'Fallout 4',
      image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=80&h=80&fit=crop',
      achievements: [
        { id: 1, name: 'Vault Dweller', icon: '🏠', description: 'Leave Vault 111' },
        { id: 2, name: 'Wasteland Wanderer', icon: '🌍', description: 'Discover 50 locations' },
        { id: 3, name: 'Power Armor', icon: '🤖', description: 'Acquire power armor' },
        { id: 4, name: 'Brotherhood', icon: '⚙️', description: 'Join the Brotherhood of Steel' }
      ]
    },
    {
      id: 6,
      title: 'Quake',
      image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=80&h=80&fit=crop',
      achievements: [
        { id: 1, name: 'Rocket Master', icon: '🚀', description: 'Get 100 rocket kills' },
        { id: 2, name: 'Quad Damage', icon: '💥', description: 'Activate Quad Damage 10 times' },
        { id: 3, name: 'Speedrunner', icon: '⚡', description: 'Complete a level in under 2 minutes' },
        { id: 4, name: 'Arena Master', icon: '🏆', description: 'Win 25 multiplayer matches' }
      ]
    },
    {
      id: 7,
      title: 'Elder Scrolls',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=80&h=80&fit=crop',
      achievements: [
        { id: 1, name: 'Dragonborn', icon: '🐉', description: 'Discover your true nature' },
        { id: 2, name: 'Thane', icon: '👑', description: 'Become Thane of a hold' },
        { id: 3, name: 'Master Wizard', icon: '🔮', description: 'Master all schools of magic' },
        { id: 4, name: 'Legendary', icon: '⭐', description: 'Reach level 50' }
      ]
    },
    {
      id: 8,
      title: 'Star Wars Force Unleashed',
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=80&h=80&fit=crop',
      achievements: [
        { id: 1, name: 'Sith Apprentice', icon: '🔴', description: 'Complete your training' },
        { id: 2, name: 'Force Lightning', icon: '⚡', description: 'Master Force Lightning' },
        { id: 3, name: 'Star Destroyer', icon: '🚀', description: 'Pull down a Star Destroyer' },
        { id: 4, name: 'Unleashed', icon: '💫', description: 'Unleash your full power' }
      ]
    }
  ];

  const handleGameClick = (game) => {
    setSelectedGame(game);
  };

  const handleCloseOverlay = () => {
    setSelectedGame(null);
  };

  return (
    <div className="h-full w-full flex">
      <div className="w-[20%] h-full bg-slate-800/20 relative overflow-hidden">
        <div className="h-full overflow-y-auto">
          {moveHubGames.map((game) => (
            <div
              key={game.id}
              onClick={() => handleGameClick(game)}
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              <img
                src={game.image}
                alt={game.title}
                className="w-12 h-12 rounded object-cover flex-shrink-0"
              />
              <span className="text-slate-300 text-sm hover:text-blue-400 transition-colors">
                {game.title}
              </span>
            </div>
          ))}
        </div>

        {selectedGame && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-10 flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <button
                onClick={handleCloseOverlay}
                className="text-slate-400 hover:text-white mb-2"
              >
                ← Back
              </button>
              <h3 className="text-white font-bold text-lg">{selectedGame.title}</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <h4 className="text-blue-400 font-semibold mb-3 text-sm">Achievements</h4>
              <div className="space-y-3">
                {selectedGame.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-blue-500/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-white font-semibold text-sm mb-1">
                          {achievement.name}
                        </h5>
                        <p className="text-slate-400 text-xs">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="w-[1px] h-full bg-slate-600"></div>
      
      <div className="flex-1 h-full bg-slate-800/10"></div>
    </div>
  );
};
*/

  // Activity Hub Component with Sub-tabs
  const ActivityHubTab = () => {
    return (
      <div className="h-full p-6 overflow-y-auto">
        <ActivityHub />
      </div>
    );
  };


// NewsCard Component for HomeTab
const NewsCard = ({ title, description, image, time }) =>
<div className="bg-slate-700/30 rounded-lg overflow-hidden hover:bg-slate-700/50 transition-colors cursor-pointer">
    <div className="flex gap-4 items-center">
      <div className="w-24 h-20 flex-shrink-0">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 p-3 py-4">
        <h4 className="text-white font-semibold mb-1 line-clamp-1">{title}</h4>
        <p className="text-slate-300 text-xs line-clamp-2">{description}</p>
        <p className="text-slate-500 text-xs mt-2">{time}</p>
      </div>
    </div>
  </div>;


// AI News Overlay Component
const AINewsOverlay = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 right-0 h-full w-[600px] z-50 bg-slate-900/95 backdrop-blur-lg border-l border-slate-700/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2 text-xl">
            <TrendingUp className="w-6 h-6 text-green-400" />
            AI News Updates
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 h-full overflow-y-auto pb-20">
          <NewsCard
            title="AI Companion System 2.0 Released"
            description="Major update to AI companion system with enhanced emotional intelligence"
            image="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop"
            time="2 hours ago" />

          <NewsCard
            title="New AI-Generated Quest System"
            description="Start infinite AI-generated quests based on your playstyle and preferences"
            image="https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=200&fit=crop"
            time="5 hours ago" />

          <NewsCard
            title="Voice Recognition Improvements"
            description="Improved voice commands with 99% accuracy. Control your games with TTS!"
            image="https://images.unsplash.com/photo-1589254065878-42c9da997008?w=400&h=200&fit=crop"
            time="1 day ago" />

          <NewsCard
            title="Cross-Platform Sync Available"
            description="Your progress now syncs seamlessly across all devices and platforms"
            image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop"
            time="2 days ago" />

          <NewsCard
            title="New Achievement System Launch"
            description="Unlock exclusive rewards with the new tiered achievement system"
            image="https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400&h=200&fit=crop"
            time="3 days ago" />

          <NewsCard
            title="AI Companion Customization"
            description="Personalize your AI companion's appearance and personality traits"
            image="https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400&h=200&fit=crop"
            time="1 week ago" />

        </div>
      </motion.div>
    </AnimatePresence>);

};

// QuickAccessCard Component for HomeTab
const QuickAccessCard = ({ icon, title, description, color, onClick }) =>
<motion.button
  whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(0,0,0,0.2)' }}
  whileTap={{ scale: 0.98 }}
  className={`relative bg-gradient-to-br ${color} rounded-xl p-5 border border-white/10 flex flex-col items-start text-left`}
  onClick={onClick}>

    <div className="absolute inset-0 bg-white/5 rounded-xl -z-10" />
    <div className="text-white mb-3">{icon}</div>
    <h3 className="text-lg font-bold text-white">{title}</h3>
    <p className="text-sm text-white/80">{description}</p>
  </motion.button>;


// Animated Quick Access Card with rotating images
const AnimatedQuickAccessCard = ({ images, icon, title, description, color, onClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeState, setFadeState] = useState('fade-in');

  useEffect(() => {
    if (images.length <= 1) return; // No need to animate if only one or no images

    const interval = setInterval(() => {
      setFadeState('fade-out');
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
        setFadeState('fade-in');
      }, 500); // Duration of fade-out animation
    }, 3000); // Time each image is visible

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl cursor-pointer group h-48`}>

      {/* Background Image with Fade Animation */}
      <div className="absolute inset-0">
        <motion.img
          key={currentImageIndex} // Use key for re-rendering motion.img to trigger animation
          src={images[currentImageIndex]}
          alt={title}
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: fadeState === 'fade-in' ? 1 : 0 }}
          transition={{ duration: 0.5 }} />

        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-60 group-hover:opacity-70 transition-opacity`}></div>
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="text-white mb-3 drop-shadow-lg">

          {icon}
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{title}</h3>
        <p className="text-sm text-white/90 drop-shadow-lg">{description}</p>
      </div>
    </motion.div>);

};

// HomeTab Component
const HomeTab = ({ setActiveTab,
  user, navigate,
  activeSubTab, setActiveSubTab,
  activePinGamePage, setActivePinGamePage,
  selectedCustomCategory, setSelectedCustomCategory,
  setShowGameHub, setShowClips, setShowConsoleHub,
  setShowAINewsOverlay, setShowAIAssistantOverlay, setSelectedGameForAI
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showAIControls, setShowAIControls] = useState(true);
  const [activeStoreFeaturesPage, setActiveStoreFeaturesPage] = useState(0); // Not moved to Dashboard

  // Image arrays for rotating backgrounds
  const gameHubImages = [
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop'];


  const clipsImages = [
  'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400&h=300&fit=crop'];


  const achievementImages = [
  'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=400&h=300&fit=crop'];


  const handleVoiceClick = () => {
    setIsListening(!isListening);
    // TODO: Implement voice recognition
    console.log('Voice input:', isListening ? 'stopped' : 'started');
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Welcome Header - No Box, Just Text and Line */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative">

        {/* Welcome Text and Box Container */}
        <div className="grid grid-cols-12 gap-6 mb-3">
          <div className="col-span-12 lg:col-span-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome Back, {user?.username || 'Player'}!
            </h1>
            <p className="text-lg text-slate-300">Ready to continue your gaming journey?</p>
          </div>
          
          {/* Empty Box - Aligned with Welcome Text */}
          <div className="col-span-12 lg:col-span-6">
            <div
              className="w-full h-32 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-blue-500/50 cursor-pointer transition-all"
              onClick={() => { setSelectedGameForAI({ title: 'AI Assistant', description: 'General Inquiries' }); setShowAIAssistantOverlay(true); }}>
            </div>
          </div>
        </div>

        {/* Horizontal Divider Line - Limited to Live AI Avatar width */}
        <div className="w-full lg:w-1/3 h-px bg-gradient-to-r from-blue-500 via-purple-500 to-transparent"></div>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* Live AI Avatar */}
        <motion.div
          className={`col-span-12 ${showAIControls ? 'lg:col-span-4' : 'lg:col-span-6'} bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden transition-all duration-300`}
          whileHover={{ scale: 1.02 }}>

          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Live AI Avatar
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => navigate(createPageUrl('AvatarStudio'))}>

              Customize
            </Button>
          </div>
          <div className="h-96 bg-slate-900/50">
            <LiveAI3DAvatar name={user?.username || 'Guest'} status="online" user={user} />
          </div>
        </motion.div>

        {/* New AI Controls - No Box, Just Divider Line with Arrow Toggle */}
        <AnimatePresence>
          {showAIControls &&
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3 }}
            className="col-span-12 lg:col-span-2 relative flex items-center">

              {/* Vertical Divider Line with Toggle Arrow */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
                <div className="w-px bg-gradient-to-b from-transparent via-cyan-500 to-transparent flex-1"></div>
                
                {/* Toggle Arrow Button - Centered on Line */}
                <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAIControls(false)}
                className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-500/50 hover:bg-cyan-400 transition-colors z-10"
                title="Hide AI Controls">

                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Menu Items - Minimal Style */}
              <div className="pl-8 pr-4 py-6 space-y-4 w-full">
                {/* AI Home */}
                <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left group"
                onClick={() => navigate(createPageUrl('Dashboard'))}>

                  <div className="flex items-center gap-2 pb-1">
                    <Home className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">AI Home</span>
                  </div>
                  <div className="h-px bg-slate-700 group-hover:bg-blue-500 transition-colors"></div>
                </motion.button>

                {/* AI Story */}
                <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left group"
                onClick={() => navigate(createPageUrl('Storyline'))}>

                  <div className="flex items-center gap-2 pb-1">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">AI Story</span>
                  </div>
                  <div className="h-px bg-slate-700 group-hover:bg-purple-500 transition-colors"></div>
                </motion.button>

                {/* AI Skill Tree */}
                <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left group"
                onClick={() => setActiveTab('movehub')}>

                  <div className="flex items-center gap-2 pb-1">
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">AI Skill Tree</span>
                  </div>
                  <div className="h-px bg-slate-700 group-hover:bg-green-500 transition-colors"></div>
                </motion.button>

                {/* AI Loadout */}
                <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left group"
                onClick={() => navigate(createPageUrl('Profile'))}>

                  <div className="flex items-center gap-2 pb-1">
                    <Sword className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-white">AI Loadout</span>
                  </div>
                  <div className="h-px bg-slate-700 group-hover:bg-orange-500 transition-colors"></div>
                </motion.button>

                {/* Talk to AI - Minimal Style */}
                <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVoiceClick}
                className="w-full text-left group mt-6">

                  <div className={`flex items-center gap-2 pb-1 ${isListening ? 'text-red-400' : 'text-cyan-400'}`}>
                    {isListening ?
                  <>
                        <MicOff className="w-4 h-4 animate-pulse" />
                        <span className="text-sm font-medium">Stop Listening</span>
                      </> :

                  <>
                        <Mic className="w-4 h-4" />
                        <span className="text-sm font-medium">Talk to AI</span>
                      </>
                  }
                  </div>
                  <div className={`h-px transition-colors ${isListening ? 'bg-red-500' : 'bg-slate-700 group-hover:bg-cyan-500'}`}></div>
                </motion.button>
              </div>
            </motion.div>
          }
        </AnimatePresence>

        {/* Show Controls Button - When Hidden */}
        {!showAIControls &&
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowAIControls(true)}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-500/50 hover:bg-cyan-400 transition-colors z-20"
          title="Show AI Controls">

            <ChevronRight className="w-5 h-5" />
          </motion.button>
        }

        {/* Right Column - AI News & Sub-tabs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`col-span-12 ${showAIControls ? 'lg:col-span-6' : 'lg:col-span-6'}`}>

          {/* Tabs and AI News Section */}
          <div>
            {/* Tabs and AI News Title on Same Line */}
            <div className="flex items-center justify-between mb-2">
              {/* Left Side - Three Sub-Tabs */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSubTab('pin_games')}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  activeSubTab === 'pin_games' ?
                  'bg-blue-600 border-blue-500 text-white' :
                  'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50 text-white'}`
                  }>

                  Pin Games
                </button>
                <button
                  onClick={() => setActiveSubTab('store_features')}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  activeSubTab === 'store_features' ?
                  'bg-blue-600 border-blue-500 text-white' :
                  'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50 text-white'}`
                  }>

                  Store Features
                </button>
                <button
                  onClick={() => setActiveSubTab('entertainment')}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  activeSubTab === 'entertainment' ?
                  'bg-blue-600 border-blue-500 text-white' :
                  'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50 text-white'}`
                  }>

                  Entertainment
                </button>
                <button
                  onClick={() => setActiveSubTab('custom')}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  activeSubTab === 'custom' ?
                  'bg-blue-600 border-blue-500 text-white' :
                  'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50 text-white'}`
                  }>

                  <Package className="w-4 h-4 inline mr-2" />
                  Custom
                </button>
              </div>

              {/* Right Side - AI News Update Title */}
              <div>
                <h3 className="font-bold text-white flex items-center gap-2 cursor-pointer hover:text-green-400 transition-colors" onClick={() => setShowAINewsOverlay(true)}>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  AI News Update
                  <motion.div whileHover={{ x: 3 }} className="text-green-400">
                    <ChevronRight className="w-5 h-5" />
                  </motion.div>
                </h3>
              </div>
            </div>

            {/* Horizontal Divider Line */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-green-500 to-green-500 mb-4"></div>
            
            {/* Tab Content Area */}
            <div className="mb-4">
              {/* Pin Games Tab */}
              {activeSubTab === 'pin_games' &&
              <div className="bg-slate-800/20 rounded-lg border border-slate-700/30 p-3">
                  {/* 4 columns x 5 rows grid */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[...Array(20)].map((_, index) =>
                  <div key={index} className="flex items-center gap-2">
                        {/* Game Icon Box */}
                        <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-16 h-16 flex-shrink-0 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-center">

                          <Gamepad2 className="w-6 h-6 text-slate-500" />
                        </motion.div>
                        
                        {/* Game Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-300 truncate">Game {index + 1}</p>
                          <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-0.5 px-2 py-0.5 bg-blue-600/80 hover:bg-blue-600 rounded text-[10px] font-medium text-white flex items-center gap-1 transition-all">

                            <Play className="w-2.5 h-2.5" fill="currentColor" />
                            Play
                          </motion.button>
                        </div>
                      </div>
                  )}
                  </div>

                  {/* Pagination Dots */}
                  <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2].map((page) =>
                  <button
                    key={page}
                    onClick={() => setActivePinGamePage(page)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                    activePinGamePage === page ?
                    'bg-blue-500 w-8' :
                    'bg-slate-600 hover:bg-slate-500'}`
                    } />

                  )}
                  </div>
                </div>
              }

              {/* Store Features Tab */}
              {activeSubTab === 'store_features' &&
              <div className="bg-slate-800/20 rounded-lg border border-slate-700/30 p-6">
                  <div className="space-y-6">
                    {/* Game Entry 1 */}
                    <div className="space-y-3">
                      {/* Large Rectangle - Game Banner */}
                      <div className="w-full h-32 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-r from-blue-900/30 to-purple-900/30 flex items-center justify-center">
                          <span className="text-slate-400 text-sm">Game Banner / Cover</span>
                        </div>
                      </div>
                      
                      {/* Four Square Boxes - smaller */}
                      <div className="flex gap-2 justify-center">
                        {/* Play Video Box */}
                        <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-red-500/50 transition-all cursor-pointer flex items-center justify-center">

                          <Play className="w-6 h-6 text-red-400" fill="currentColor" />
                        </motion.div>
                        
                        {/* Screenshot Box 1 */}
                        <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">

                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                          </div>
                        </motion.div>
                        
                        {/* Screenshot Box 2 */}
                        <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">

                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                          </div>
                        </motion.div>
                        
                        {/* Screenshot Box 3 */}
                        <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">

                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Game Entry 2 */}
                    <div className="space-y-3">
                      {/* Large Rectangle - Game Banner */}
                      <div className="w-full h-32 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-r from-purple-900/30 to-pink-900/30 flex items-center justify-center">
                          <span className="text-slate-400 text-sm">Game Banner / Cover</span>
                        </div>
                      </div>
                      
                      {/* Four Square Boxes - smaller */}
                      <div className="flex gap-2 justify-center">
                        {/* Play Video Box */}
                        <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-red-500/50 transition-all cursor-pointer flex items-center justify-center">

                          <Play className="w-6 h-6 text-red-400" fill="currentColor" />
                        </motion.div>
                        
                        {/* Screenshot Box 1 */}
                        <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">

                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                          </div>
                        </motion.div>
                        
                        {/* Screenshot Box 2 */}
                        <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">

                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                          </div>
                        </motion.div>
                        
                        {/* Screenshot Box 3 */}
                        <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">

                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Pagination Numbers */}
                  <div className="flex items-center justify-center gap-3 mt-6">
                    {[0, 1, 2, 3, 4].map((page) =>
                  <button
                    key={page}
                    onClick={() => setActiveStoreFeaturesPage(page)}
                    className={`w-8 h-8 rounded-lg font-semibold transition-all ${
                    activeStoreFeaturesPage === page ?
                    'bg-blue-600 text-white shadow-lg shadow-blue-500/50' :
                    'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white'}`
                    }>

                        {page + 1}
                      </button>
                  )}
                  </div>
                </div>
              }

              {/* Entertainment Tab */}
              {activeSubTab === 'entertainment' &&
              <div className="bg-slate-800/20 rounded-lg border border-slate-700/30 p-4">
                  {/* Streaming Services Grid - perfect squares */}
                  <div className="grid grid-cols-4 gap-3">
                    {/* Netflix */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-red-600 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-red-500/50">

                      <span className="text-white font-bold text-sm">NETFLIX</span>
                    </motion.div>

                    {/* Amazon Prime Video */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-blue-500 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-blue-500/50">

                      <span className="text-white font-bold text-xs text-center">Prime<br />Video</span>
                    </motion.div>

                    {/* Hulu */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-green-500 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-green-500/50">

                      <span className="text-white font-bold text-base">hulu</span>
                    </motion.div>

                    {/* Disney+ */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-blue-700 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-blue-700/50">

                      <span className="text-white font-bold text-sm">Disney+</span>
                    </motion.div>

                    {/* HBO Max */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-purple-700 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-purple-700/50">

                      <span className="text-white font-bold text-base">MAX</span>
                    </motion.div>

                    {/* Paramount+ */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-blue-600 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-blue-600/50">

                      <span className="text-white font-bold text-xs">Paramount+</span>
                    </motion.div>

                    {/* Apple TV+ */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-black rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-white/20 border border-white/20">

                      <span className="text-white font-bold text-xs">Apple TV+</span>
                    </motion.div>

                    {/* Peacock */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-gradient-to-br from-yellow-500 to-purple-600 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-purple-500/50">

                      <span className="text-white font-bold text-sm">Peacock</span>
                    </motion.div>

                    {/* Showtime */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-red-700 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-red-700/50">

                      <span className="text-white font-bold text-xs">SHOWTIME</span>
                    </motion.div>

                    {/* Starz */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-black rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-white/20 border border-white/20">

                      <span className="text-white font-bold text-base">STARZ</span>
                    </motion.div>

                    {/* YouTube */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-red-600 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-red-600/50">

                      <span className="text-white font-bold text-sm">YouTube</span>
                    </motion.div>

                    {/* Twitch */}
                    <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square w-full bg-purple-600 rounded-lg cursor-pointer transition-all flex items-center justify-center shadow-lg hover:shadow-purple-600/50">

                      <span className="text-white font-bold text-base">Twitch</span>
                    </motion.div>
                  </div>
                </div>
              }

              {/* Custom Tab */}
              {activeSubTab === 'custom' &&
              <div className="bg-slate-800/20 rounded-lg border border-slate-700/30 p-4">
                  {/* Horizontal Scroll Wheel with 4 Rectangles */}
                  <div className="flex gap-3 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {[0, 1, 2, 3].map((index) =>
                  <motion.button
                    key={index}
                    onClick={() => setSelectedCustomCategory(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-shrink-0 w-32 h-20 rounded-lg border transition-all ${
                    selectedCustomCategory === index ?
                    'bg-blue-600/30 border-blue-500/50' :
                    'bg-slate-700/30 border-slate-600/50 hover:border-slate-500'}`
                    }>

                        <div className="flex items-center justify-center h-full">
                          <span className="text-sm font-medium text-slate-300">Category {index + 1}</span>
                        </div>
                      </motion.button>
                  )}
                  </div>

                  {/* Grid of Square Boxes - 4 columns x 5 rows */}
                  <div className="grid grid-cols-4 gap-3">
                    {[...Array(20)].map((_, index) =>
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-center">

                        <Package className="w-6 h-6 text-slate-500" />
                      </motion.div>
                  )}
                  </div>
                </div>
              }
            </div>

            {/* AI News Content */}
            <div className="cursor-pointer" onClick={() => setShowAINewsOverlay(true)}>
              <NewsCard
                title="AI Companion System 2.0 Released"
                description="Major update to AI companion system with enhanced emotional intelligence"
                image="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop"
                time="2 hours ago" />

              <div className="text-center py-2 mt-2">
                <p className="text-sm text-slate-400 hover:text-slate-300 transition-colors">Click to view all news →</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Access Cards with Animated Backgrounds */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatedQuickAccessCard
          images={gameHubImages}
          icon={<Gamepad2 className="w-8 h-8" />}
          title="Game Hub"
          description="Browse library"
          color="from-blue-500 to-cyan-500"
          onClick={() => setShowGameHub(true)} />

        <AnimatedQuickAccessCard
          images={clipsImages}
          icon={<Video className="w-8 h-8" />}
          title="Clips"
          description="View recordings"
          color="from-purple-500 to-pink-500"
          onClick={() => setShowClips(true)} />

        <AnimatedQuickAccessCard
          images={achievementImages}
          icon={<Trophy className="w-8 h-8" />}
          title="Achievements"
          description="Track progress"
          color="from-yellow-500 to-amber-500"
          onClick={() => navigate(createPageUrl('Achievements'))} />

        <QuickAccessCard
          icon={<Swords className="w-8 h-8" />}
          title="AI Console"
          description="Battle modes"
          color="from-red-500 to-orange-500"
          onClick={() => setShowConsoleHub(true)} />

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Activity Hub */}
        <ActivityHub />
      </div>
    </div>);

};


// Main Dashboard Component
export default function Dashboard() {
  const { user, isAuthenticated, loading, showSignUp } = useAuth();
  const navigate = useNavigate();
  
  // Multi-mode dashboard state
  const [currentMode, setCurrentMode] = useState('ai'); // ai, user, economy, records
  const [activeTab, setActiveTab] = useState('home');

  // States for overlays and interactions
  const [showGameHub, setShowGameHub] = useState(false);
  const [showClips, setShowClips] = useState(false);
  const [showConsoleHub, setShowConsoleHub] = useState(false);
  const [showAINewsOverlay, setShowAINewsOverlay] = useState(false);
  const [showAIAssistantOverlay, setShowAIAssistantOverlay] = useState(false);
  const [selectedGameForAI, setSelectedGameForAI] = useState(null);

  const handleQuickCutNavigation = (shortcutId) => {
    if (shortcutId === 'gamehub') setShowGameHub(true);
    else if (shortcutId === 'library') navigate(createPageUrl('Library'));
    else if (shortcutId === 'achievements') navigate(createPageUrl('Achievements'));
    else if (shortcutId === 'console') setShowConsoleHub(true);
  };

  if (showSignUp) {
    return null;
  }

  return (
    <div 
      className="flex flex-col h-screen text-white overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
    >
      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-300/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-200/3 rounded-full blur-[180px]" />
      </div>
      {/* Mode Toggle at Top */}
      <div className="p-4 flex-shrink-0">
        <ModeToggle currentMode={currentMode} onModeChange={setCurrentMode} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            {currentMode === 'ai' && (
              <AINexusView 
                user={user} 
                setActiveTab={setActiveTab}
                onNavigate={handleQuickCutNavigation}
              />
            )}
            {currentMode === 'user' && (
              <UserInterfaceView
                setShowGameHub={setShowGameHub}
                setShowClips={setShowClips}
                setShowAINewsOverlay={setShowAINewsOverlay}
              />
            )}
            {currentMode === 'economy' && <EconomyDistrictView />}
            {currentMode === 'records' && <HallOfRecordsView />}
          </motion.div>
        </AnimatePresence>
      </div>



      {/* Overlays */}
      <AnimatePresence>
        {showAIAssistantOverlay && (
          <AIViewport
            selectedGame={selectedGameForAI}
            onClose={() => setShowAIAssistantOverlay(false)}
          />
        )}
        {showClips && <ClipsOverlay isVisible={true} onClose={() => setShowClips(false)} />}
        {showGameHub && <GameHubOverlay isVisible={true} onClose={() => setShowGameHub(false)} />}
        {showConsoleHub && <ConsoleHubOverlay isVisible={true} onClose={() => setShowConsoleHub(false)} />}
        {showAINewsOverlay && <AINewsOverlay isVisible={showAINewsOverlay} onClose={() => setShowAINewsOverlay(false)} />}
      </AnimatePresence>
    </div>
  );
}