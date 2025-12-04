import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Library as LibraryIcon, Search, Play, Loader2, Gamepad2, Radio, Mic, MicOff, Grid, List, Heart, Clock, Trophy, Eye, Bot, Sparkles, Users, MessageSquare, Hash, Send, Volume2, Package, Video, HelpCircle, Gift, MapPin, Palette } from 'lucide-react';
import { allMockGames } from '../components/store/mockData';
import RecentlyAchievedOverlay from '../components/library/RecentlyAchievedOverlay';
import OwnedGameOverlay from '../components/library/OwnedGameOverlay';
import GameAchievementsOverlay from '../components/library/GameAchievementsOverlay';
import GameLauncherOverlay from '../components/library/GameLauncherOverlay';
import RemotePlayOverlay from '../components/streaming/RemotePlayOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Library Background Themes
const LIBRARY_THEMES = {
  midnight_library: {
    id: 'midnight_library',
    name: 'Midnight Library',
    css: 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950',
    animation: 'stars'
  },
  neon_shelf: {
    id: 'neon_shelf',
    name: 'Neon Shelf',
    css: 'bg-gradient-to-br from-pink-900 via-purple-950 to-blue-950',
    animation: 'neon'
  },
  enchanted_archive: {
    id: 'enchanted_archive',
    name: 'Enchanted Archive',
    css: 'bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900',
    animation: 'magic'
  },
  cyber_vault: {
    id: 'cyber_vault',
    name: 'Cyber Vault',
    css: 'bg-gradient-to-br from-cyan-950 via-blue-950 to-slate-950',
    animation: 'grid'
  },
  royal_collection: {
    id: 'royal_collection',
    name: 'Royal Collection',
    css: 'bg-gradient-to-br from-amber-950 via-yellow-950 to-orange-950',
    animation: 'particles'
  },
  shadow_realm: {
    id: 'shadow_realm',
    name: 'Shadow Realm',
    css: 'bg-gradient-to-br from-gray-950 via-slate-950 to-zinc-950',
    animation: 'smoke'
  },
  crystal_cave: {
    id: 'crystal_cave',
    name: 'Crystal Cave',
    css: 'bg-gradient-to-br from-emerald-950 via-teal-950 to-cyan-950',
    animation: 'crystals'
  },
  volcanic_chamber: {
    id: 'volcanic_chamber',
    name: 'Volcanic Chamber',
    css: 'bg-gradient-to-br from-red-950 via-orange-950 to-yellow-950',
    animation: 'embers'
  },
  frozen_archive: {
    id: 'frozen_archive',
    name: 'Frozen Archive',
    css: 'bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950',
    animation: 'snow'
  },
  aurora_vault: {
    id: 'aurora_vault',
    name: 'Aurora Vault',
    css: 'bg-gradient-to-br from-green-900 via-blue-900 to-purple-900',
    animation: 'aurora'
  },
  cosmic_library: {
    id: 'cosmic_library',
    name: 'Cosmic Library',
    css: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950',
    animation: 'nebula'
  },
  digital_matrix: {
    id: 'digital_matrix',
    name: 'Digital Matrix',
    css: 'bg-gradient-to-br from-green-950 via-black to-green-950',
    animation: 'matrix'
  },
  sakura_garden: {
    id: 'sakura_garden',
    name: 'Sakura Garden',
    css: 'bg-gradient-to-br from-pink-950 via-rose-950 to-red-950',
    animation: 'petals'
  },
  electric_blue: {
    id: 'electric_blue',
    name: 'Electric Blue',
    css: 'bg-gradient-to-br from-blue-600 via-cyan-700 to-blue-900',
    animation: 'lightning'
  },
  mystic_forest: {
    id: 'mystic_forest',
    name: 'Mystic Forest',
    css: 'bg-gradient-to-br from-green-950 via-emerald-950 to-teal-950',
    animation: 'fireflies'
  },
  neon_tokyo: {
    id: 'neon_tokyo',
    name: 'Neon Tokyo',
    css: 'bg-gradient-to-br from-purple-900 via-fuchsia-900 to-pink-900',
    animation: 'neon'
  },
  deep_space: {
    id: 'deep_space',
    name: 'Deep Space',
    css: 'bg-gradient-to-br from-black via-slate-950 to-indigo-950',
    animation: 'stars'
  },
  starlight_expanse: {
    id: 'starlight_expanse',
    name: 'Starlight Expanse',
    css: 'bg-gradient-to-br from-blue-950 via-slate-900 to-black',
    animation: 'stars'
  },
  moonlight_dream: {
    id: 'moonlight_dream',
    name: 'Moonlight Dream',
    css: 'bg-gradient-to-br from-slate-800 via-zinc-800 to-neutral-900',
    animation: 'fireflies'
  },
  infinite_universe: {
    id: 'infinite_universe',
    name: 'Infinite Universe',
    css: 'bg-gradient-to-br from-violet-950 via-indigo-950 to-blue-950',
    animation: 'nebula'
  },
  mystic_glyphs: {
    id: 'mystic_glyphs',
    name: 'Mystic Glyphs',
    css: 'bg-gradient-to-br from-amber-950 via-orange-950 to-yellow-950',
    animation: 'matrix'
  },
  cartoon_chaos: {
    id: 'cartoon_chaos',
    name: 'Cartoon Chaos',
    css: 'bg-gradient-to-br from-yellow-500 via-red-500 to-pink-500',
    animation: 'particles'
  },
  retro_toon: {
    id: 'retro_toon',
    name: 'Retro Toon',
    css: 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500',
    animation: 'grid'
  },
  comic_hero: {
    id: 'comic_hero',
    name: 'Comic Hero',
    css: 'bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600',
    animation: 'magic'
  }
};

// Per-game animated themes
const GAME_THEMES = {
  'Elder Scrolls Reborn': {
    background: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&h=1080&fit=crop',
    animation: 'fantasy_particles',
    overlayColor: 'from-purple-900/40 via-blue-900/40 to-transparent',
    particles: {
      count: 50,
      type: 'magic',
      colors: ['rgba(168, 85, 247, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(139, 92, 246, 0.6)']
    }
  },
  'Cyberpunk 2088': {
    background: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=1920&h=1080&fit=crop',
    animation: 'cyber_rain',
    overlayColor: 'from-pink-900/40 via-cyan-900/40 to-transparent',
    particles: {
      count: 100,
      type: 'rain',
      colors: ['rgba(236, 72, 153, 0.6)', 'rgba(6, 182, 212, 0.6)']
    }
  },
  'Vanguard Ops': {
    background: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&h=1080&fit=crop',
    animation: 'tactical_grid',
    overlayColor: 'from-red-900/40 via-orange-900/40 to-transparent',
    particles: {
      count: 30,
      type: 'grid',
      colors: ['rgba(239, 68, 68, 0.4)', 'rgba(249, 115, 22, 0.4)']
    }
  }
};

const GameCard = ({ game, isStreaming, viewMode = 'expanded', onSelect, isSelected, onPlay }) => {
    // The original collapsed view logic is now moved and modified directly into the Library component's map for the left sidebar.
    // This GameCard component will now primarily handle the 'expanded' view, or if the 'collapsed' view is still called from other places.
    // However, for the specific left sidebar list in Library, it's explicitly replaced by inline JSX.
    // To avoid breaking external uses of GameCard in collapsed mode if they exist, we keep the original collapsed logic here,
    // but the Library component will bypass it for its primary left sidebar.
    
    const handlePlayClick = (e) => {
        e.stopPropagation();
        if (onPlay) onPlay(game);
    };

    if (viewMode === 'collapsed') {
        return (
            <div 
                onClick={() => onSelect(game)}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 border-b border-slate-700/30 hover:bg-slate-800/50 ${
                    isSelected ? 'bg-blue-900/30 border-l-4 border-l-blue-500' : ''
                }`}
            >
                <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden relative">
                    <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
                    {isStreaming && (
                        <div className="absolute top-0.5 right-0.5 flex items-center gap-1 bg-red-600 text-white px-1 rounded text-xs font-bold">
                            <Radio className="w-2 h-2 animate-pulse" />
                        </div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {game.title}
                    </h3>
                    <p className="text-xs text-slate-500 capitalize">{game.genre}</p>
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button size="sm" onClick={handlePlayClick} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-1.5 py-0.5 rounded text-[9px] h-5 transition-all hover:scale-105">
                        <Play className="w-2 h-2 mr-0.5" />
                        Play
                    </Button>
                    <Button size="sm" variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20 font-semibold px-1.5 py-0.5 rounded text-[9px] h-5 transition-all hover:scale-105">
                        <Bot className="w-2 h-2 mr-0.5" />
                        AI
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div onClick={() => onSelect(game)} className="block group relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-600/20 cursor-pointer">
            <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 w-full">
                <h3 className="text-lg font-bold text-white mb-1">{game.title}</h3>
                <p className="text-sm text-slate-400 capitalize mb-2">{game.genre}</p>
                
                <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>12.5h played</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        <span>8/15 achievements</span>
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={handlePlayClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Play Now
                </Button>
            </div>
            {isStreaming && (
                <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold z-10">
                    <Radio className="w-3 h-3 animate-pulse" />
                    LIVE
                </div>
            )}
        </div>
    );
};

// Mock chat channels
const CHAT_CHANNELS = [
    { id: 'general', name: 'General Chat', users: 1543, description: 'General discussion about the game' },
    { id: 'help', name: 'Help & Tips', users: 892, description: 'Get help from other players' },
    { id: 'trading', name: 'Trading', users: 456, description: 'Trade items and gear' },
    { id: 'lfg', name: 'Looking for Group', users: 678, description: 'Find party members' },
    { id: 'pvp', name: 'PvP Discussion', users: 334, description: 'PvP strategies and matchmaking' },
    { id: 'endgame', name: 'Endgame Content', users: 221, description: 'Discuss raids and endgame' },
    { id: 'builds', name: 'Character Builds', users: 567, description: 'Share and discuss builds' },
    { id: 'lore', name: 'Lore & Story', users: 189, description: 'Discuss game story and lore' }
];

// Mock chat messages
const MOCK_MESSAGES = [
    { id: 1, user: 'DragonSlayer', avatar: 'https://i.pravatar.cc/150?u=dragon', message: 'Anyone know where to find the Ancient Sword?', timestamp: '2 min ago', isVoice: false },
    { id: 2, user: 'MysticMage', avatar: 'https://i.pravatar.cc/150?u=mystic', message: 'Check the Frozen Temple, third floor', timestamp: '1 min ago', isVoice: false },
    { id: 3, user: 'ShadowNinja', avatar: 'https://i.pravatar.cc/150?u=shadow', message: 'LFG for raid tonight at 8pm EST', timestamp: '30 sec ago', isVoice: false },
    { id: 4, user: 'HealerQueen', avatar: 'https://i.pravatar.cc/150?u=healer', message: 'I can join! I\'m a level 85 healer', timestamp: 'Just now', isVoice: false }
];

// Mock community posts
const MOCK_POSTS = [
    {
        id: 1,
        user: 'EpicGamer123',
        avatar: 'https://i.pravatar.cc/150?u=epic',
        title: 'Just completed my first Dragon Raid!',
        content: 'After 50 hours of gameplay, I finally defeated the Ancient Dragon! The graphics during the final phase were absolutely stunning. Here\'s my setup and strategy...',
        image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=600&h=400&fit=crop',
        likes: 234,
        comments: 45,
        timestamp: '3 hours ago'
    },
    {
        id: 2,
        user: 'ProStreamer99',
        avatar: 'https://i.pravatar.cc/150?u=pro',
        title: 'Best Build for PvP Combat',
        content: 'I\'ve been testing different builds and this one dominates in arena. Focus on these stats and abilities...',
        videoThumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop',
        likes: 567,
        comments: 89,
        timestamp: '1 day ago'
    },
    {
        id: 3,
        user: 'LoreMaster',
        avatar: 'https://i.pravatar.cc/150?u=lore',
        title: 'Hidden Easter Eggs in the Castle',
        content: 'Found some amazing lore details that connect to the original game. Check out these hidden symbols...',
        likes: 189,
        comments: 34,
        timestamp: '2 days ago'
    }
];

// Mock recently achieved data with multiple player unlocks
const MOCK_RECENTLY_ACHIEVED = [
    {
        id: 1,
        achievement: 'Dragon Slayer Supreme',
        icon: '🐉',
        rarity: 'Legendary',
        game: 'Elder Scrolls Reborn',
        playerUnlocks: [
            {
                playerId: 1,
                player: 'ShadowHunter99',
                avatar: 'https://i.pravatar.cc/150?u=shadow99',
                timestamp: '5 minutes ago',
                description: 'I finally defeated the Ancient Dragon! Here\'s my complete strategy. First, make sure you have at least 500 HP and fire resistance potions. Position yourself behind the left wing and attack when it breathes fire. The key is timing your dodges perfectly.',
                screenshots: [
                    'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop'
                ],
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                voiceNoteUrl: null,
                location: 'Frozen Peak Summit, Northern Mountains',
                tips: 'Use fire resistance potions and focus on the wings first!'
            },
            {
                playerId: 2,
                player: 'DragonMaster99',
                avatar: 'https://i.pravatar.cc/150?u=dragon99',
                timestamp: '2 hours ago',
                description: 'Alternative approach: Use the ice cavern entrance and sneak attack from behind. Took me 3 tries but this method is more reliable.',
                screenshots: [
                    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
                ],
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                voiceNoteUrl: null,
                location: 'Ice Cavern, Eastern Entrance',
                tips: 'Bring healing potions and use stealth approach'
            }
        ]
    },
    {
        id: 2,
        achievement: 'Master Thief',
        icon: '💰',
        rarity: 'Epic',
        game: 'Elder Scrolls Reborn',
        playerUnlocks: [
            {
                playerId: 3,
                player: 'StealthyNinja',
                avatar: 'https://i.pravatar.cc/150?u=stealthy',
                timestamp: '12 minutes ago',
                description: 'Just hit 1000 gold stolen! The Royal Treasury method works perfectly. Wait until 2 AM game time for guard shift change. Use invisibility potions.',
                screenshots: [
                    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=300&fit=crop'
                ],
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                voiceNoteUrl: null,
                location: 'Royal Treasury, Capital City',
                tips: 'Wait for guard shift changes at 2 AM game time'
            }
        ]
    },
    {
        id: 3,
        achievement: 'Arena Champion',
        icon: '⚔️',
        rarity: 'Epic',
        game: 'Elder Scrolls Reborn',
        playerUnlocks: [
            {
                playerId: 4,
                player: 'BattleMaster',
                avatar: 'https://i.pravatar.cc/150?u=battle',
                timestamp: '1 hour ago',
                description: '100 consecutive wins! My build focuses on defense and counter-attacks. Here\'s the full strategy guide with all the moves.',
                screenshots: [
                    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
                    'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=300&fit=crop'
                ],
                videoUrl: null,
                voiceNoteUrl: null,
                location: 'Grand Arena, Center Stage',
                tips: 'Focus on defense stats and counter-attack abilities'
            }
        ]
    },
    {
        id: 4,
        achievement: 'Legendary Explorer',
        icon: '🗺️',
        rarity: 'Rare',
        game: 'Elder Scrolls Reborn',
        playerUnlocks: [
            {
                playerId: 5,
                player: 'Wanderer',
                avatar: 'https://i.pravatar.cc/150?u=wander',
                timestamp: '2 hours ago',
                description: 'Discovered all hidden locations in the game! It took me 40 hours but I finally did it. The explorer\'s compass is essential.',
                screenshots: [
                    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
                ],
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                voiceNoteUrl: null,
                location: 'Various Locations',
                tips: 'Use the explorer\'s compass from the starting village'
            }
        ]
    },
    {
        id: 5,
        achievement: 'Spell Master',
        icon: '🔮',
        rarity: 'Legendary',
        game: 'Elder Scrolls Reborn',
        playerUnlocks: [
            {
                playerId: 6,
                player: 'ArcaneMage',
                avatar: 'https://i.pravatar.cc/150?u=arcane',
                timestamp: '3 hours ago',
                description: 'Learned all 100 spells in the game! The hardest ones are in the Mage Tower. Here\'s my complete guide.',
                screenshots: [
                    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop'
                ],
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                voiceNoteUrl: null,
                location: 'Mage Tower, Top Floor',
                tips: 'Start with fire spells, they\'re the easiest to master'
            }
        ]
    }
];

// Mock loot boxes
const MOCK_LOOT_BOXES = [
    {
        id: 1,
        name: 'Dragon\'s Hoard',
        rarity: 'Legendary',
        earnedFrom: 'Dragon Slayer Supreme',
        icon: '📦',
        color: '#ff6b35',
        glow: 'shadow-orange-500/50',
        timestamp: '5 minutes ago',
        unopened: true,
        contents: ['Legendary Weapon', 'Epic Armor', '500 Gold']
    },
    {
        id: 2,
        name: 'Thief\'s Cache',
        rarity: 'Epic',
        earnedFrom: 'Master Thief',
        icon: '🎁',
        color: '#9b59b6',
        glow: 'shadow-purple-500/50',
        timestamp: '12 minutes ago',
        unopened: true,
        contents: ['Epic Dagger', 'Stealth Cloak', '300 Gold']
    },
    {
        id: 3,
        name: 'Champion\'s Prize',
        rarity: 'Epic',
        earnedFrom: 'Arena Champion',
        icon: '🏆',
        color: '#3498db',
        glow: 'shadow-blue-500/50',
        timestamp: '1 hour ago',
        unopened: false,
        contents: ['Epic Sword', 'Battle Armor', '400 Gold'],
        opened: true,
        openedItems: [
            { name: 'Gladiator\'s Sword', rarity: 'Epic', icon: '⚔️' },
            { name: 'Champion\'s Armor', rarity: 'Rare', icon: '🛡️' },
            { name: '400 Gold', rarity: 'Common', icon: '💰' }
        ]
    },
    {
        id: 4,
        name: 'Explorer\'s Treasure',
        rarity: 'Rare',
        earnedFrom: 'Legendary Explorer',
        icon: '🎒',
        color: '#2ecc71',
        glow: 'shadow-green-500/50',
        timestamp: '2 hours ago',
        unopened: true,
        contents: ['Rare Map', 'Explorer\'s Compass', '200 Gold']
    }
];

const CommunityChatTab = ({ game }) => {
    const { user } = useAuth();
    const [selectedChannel, setSelectedChannel] = useState(CHAT_CHANNELS[0]);
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [messageInput, setMessageInput] = useState('');
    // Removed redundant `isVoiceToText` state as `isListening` serves the same purpose
    const [isPushToTalk, setIsPushToTalk] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        
        const newMessage = {
            id: messages.length + 1,
            user: user?.username || user?.full_name || 'Guest',
            avatar: user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.email}`,
            message: messageInput,
            timestamp: 'Just now',
            isVoice: false
        };
        
        setMessages([...messages, newMessage]);
        setMessageInput('');
    };

    const startVoiceToText = () => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setMessageInput(transcript);
            };

            recognition.start();
        }
    };

    const togglePushToTalk = () => {
        setIsPushToTalk(!isPushToTalk);
    };

    return (
        <div className="flex gap-4 h-full">
            <div className="w-64 flex-shrink-0 bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Hash className="w-5 h-5 text-blue-400" />
                        Channels
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Select a channel to join</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {CHAT_CHANNELS.map(channel => (
                        <button
                            key={channel.id}
                            onClick={() => setSelectedChannel(channel)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${
                                selectedChannel.id === channel.id
                                    ? 'bg-blue-600/30 border border-blue-500/50'
                                    : 'hover:bg-slate-700/30 border border-transparent'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold text-sm ${
                                    selectedChannel.id === channel.id ? 'text-white' : 'text-slate-300'
                                }`}>
                                    # {channel.name}
                                </span>
                                <Badge className="text-xs bg-slate-700 text-slate-300">
                                    {channel.users}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1">{channel.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Hash className="w-5 h-5 text-blue-400" />
                                {selectedChannel.name}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">{selectedChannel.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Users className="w-4 h-4" />
                            <span>{selectedChannel.users} online</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className="flex gap-3">
                            <img 
                                src={msg.avatar} 
                                alt={msg.user}
                                className="w-10 h-10 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-white text-sm">{msg.user}</span>
                                    <span className="text-xs text-slate-500">{msg.timestamp}</span>
                                </div>
                                <p className="text-slate-300 text-sm">{msg.message}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Input
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={`Message #${selectedChannel.name}...`}
                                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <Button
                            onClick={startVoiceToText}
                            variant="outline"
                            size="icon"
                            className={`${isListening ? 'border-red-500 bg-red-500/20 text-red-400 animate-pulse' : 'border-slate-600 text-slate-400 hover:text-white'}`}
                            title="Voice to Text"
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </Button>

                        <Button
                            onClick={togglePushToTalk}
                            variant="outline"
                            size="icon"
                            className={`${isPushToTalk ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-slate-600 text-slate-400 hover:text-white'}`}
                            title="Push to Talk"
                        >
                            <Mic className="w-5 h-5" />
                        </Button>

                        <Button
                            onClick={handleSendMessage}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="icon"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-4">
                        {isListening && (
                            <span className="text-red-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                Listening...
                            </span>
                        )}
                        {isPushToTalk && (
                            <span className="text-green-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Voice chat active
                            </span>
                        )}
                        {!isListening && !isPushToTalk && (
                            <span>Use Voice to Text or Push to Talk</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CommunityPostsTab = ({ game }) => {
    const [posts, setPosts] = useState(MOCK_POSTS);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white">Community Posts</h3>
                    <p className="text-slate-400 text-sm">Share your experiences, videos, and bonding moments</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Create Post
                </Button>
            </div>

            <div className="space-y-4">
                {posts.map(post => (
                    <div key={post.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600 transition-colors">
                        <div className="flex items-start gap-4 mb-4">
                            <img 
                                src={post.avatar} 
                                alt={post.user}
                                className="w-12 h-12 rounded-full"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-white">{post.user}</span>
                                    <span className="text-xs text-slate-500">{post.timestamp}</span>
                                </div>
                                <h4 className="text-lg font-semibold text-white mb-2">{post.title}</h4>
                                <p className="text-slate-300 text-sm">{post.content}</p>
                            </div>
                        </div>

                        {post.image && (
                            <img 
                                src={post.image} 
                                alt={post.title}
                                className="w-full rounded-lg mb-4"
                            />
                        )}

                        {post.videoThumbnail && (
                            <div className="relative mb-4 rounded-lg overflow-hidden group cursor-pointer">
                                <img 
                                    src={post.videoThumbnail} 
                                    alt={post.title}
                                    className="w-full"
                                />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-16 h-16 text-white" />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-6 text-sm text-slate-400">
                            <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                                <Heart className="w-4 h-4" />
                                <span>{post.likes} likes</span>
                            </button>
                            <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                <span>{post.comments} comments</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RecentlyAchievedTab = ({ game }) => {
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [selectedPlayerUnlock, setSelectedPlayerUnlock] = useState(null);
    const [showHelpRequest, setShowHelpRequest] = useState(false);
    const [playingVideo, setPlayingVideo] = useState(false); // State not used in this specific implementation but kept for future expansion.
    const [playingVoice, setPlayingVoice] = useState(false);

    // Auto-select first achievement and first player unlock on mount
    useEffect(() => {
        if (MOCK_RECENTLY_ACHIEVED.length > 0) {
            const firstAchievement = MOCK_RECENTLY_ACHIEVED[0];
            setSelectedAchievement(firstAchievement);
            if (firstAchievement.playerUnlocks.length > 0) {
                setSelectedPlayerUnlock(firstAchievement.playerUnlocks[0]);
            }
        }
    }, []);

    const handleAchievementClick = (achievement) => {
        setSelectedAchievement(achievement);
        if (achievement.playerUnlocks.length > 0) {
            setSelectedPlayerUnlock(achievement.playerUnlocks[0]);
        }
    };

    const handleRequestHelp = () => {
        setShowHelpRequest(true);
    };

    const RARITY_STYLES = {
        Common: { color: 'text-gray-400', bg: 'bg-gray-900/50', border: 'border-gray-500' },
        Uncommon: { color: 'text-green-400', bg: 'bg-green-900/50', border: 'border-green-500' },
        Rare: { color: 'text-blue-400', bg: 'bg-blue-900/50', border: 'border-blue-500' },
        Epic: { color: 'text-purple-400', bg: 'bg-purple-900/50', border: 'border-purple-500' },
        Legendary: { color: 'text-orange-400', bg: 'bg-orange-900/50', border: 'border-orange-500' }
    };

    return (
        <div className="flex gap-4 h-full">
            {/* Left Side - Achievement List (20%) */}
            <div className="w-[20%] flex-shrink-0 bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                    <h3 className="font-bold text-white text-sm">Achievements</h3>
                    <p className="text-xs text-slate-400 mt-1">{MOCK_RECENTLY_ACHIEVED.length} recently unlocked</p>
                </div>
                
                <div className="flex-1 overflow-y-auto game-list-scrollable">
                    {MOCK_RECENTLY_ACHIEVED.map(achievement => {
                        const rarity = RARITY_STYLES[achievement.rarity];
                        const isSelected = selectedAchievement?.id === achievement.id;
                        
                        return (
                            <button
                                key={achievement.id}
                                onClick={() => handleAchievementClick(achievement)}
                                className={`w-full text-left p-4 border-b border-slate-700/30 transition-all ${
                                    isSelected
                                        ? 'bg-blue-900/30 border-l-4 border-l-blue-500'
                                        : 'hover:bg-slate-800/50'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-3xl flex-shrink-0">{achievement.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-slate-300'} truncate`}>
                                            {achievement.achievement}
                                        </h4>
                                        <Badge className={`${rarity.bg} ${rarity.color} border ${rarity.border} text-xs mb-1`}>
                                            {achievement.rarity}
                                        </Badge>
                                        <p className="text-xs text-slate-400">
                                            {achievement.playerUnlocks.length} player{achievement.playerUnlocks.length !== 1 ? 's' : ''} unlocked
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Vertical Separator */}
            <div className="w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent" />

            {/* Right Side - Player Unlock Details (80%) */}
            <div className="flex-1 overflow-y-auto game-list-scrollable">
                {selectedAchievement && selectedPlayerUnlock ? (
                    <div className="space-y-4">
                        {/* Achievement Header */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="text-6xl">{selectedAchievement.icon}</div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-white mb-2">{selectedAchievement.achievement}</h2>
                                    <div className="flex items-center gap-3">
                                        <Badge className={`${RARITY_STYLES[selectedAchievement.rarity]?.bg} ${RARITY_STYLES[selectedAchievement.rarity]?.color} border-2 ${RARITY_STYLES[selectedAchievement.rarity]?.border}`}>
                                            {selectedAchievement.rarity}
                                        </Badge>
                                        <span className="text-sm text-slate-400">{selectedAchievement.game}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Player Unlock Selector */}
                            {selectedAchievement.playerUnlocks.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {selectedAchievement.playerUnlocks.map(unlock => (
                                        <button
                                            key={unlock.playerId}
                                            onClick={() => setSelectedPlayerUnlock(unlock)}
                                            className={`flex-shrink-0 px-4 py-2 rounded-lg border transition-all ${
                                                selectedPlayerUnlock?.playerId === unlock.playerId
                                                    ? 'bg-blue-600/30 border-blue-500 text-white'
                                                    : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <img src={unlock.avatar} alt={unlock.player} className="w-6 h-6 rounded-full" />
                                                <span className="text-sm font-semibold">{unlock.player}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Player Unlock Details */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                            {/* Player Info Header */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                                <div className="flex items-center gap-4">
                                    <img src={selectedPlayerUnlock.avatar} alt={selectedPlayerUnlock.player} className="w-16 h-16 rounded-full border-2 border-blue-500" />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{selectedPlayerUnlock.player}</h3>
                                        <p className="text-sm text-slate-400">{selectedPlayerUnlock.timestamp}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {selectedPlayerUnlock.location}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleRequestHelp}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <HelpCircle className="w-4 h-4 mr-2" />
                                        Request Help
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                                    >
                                        <Video className="w-4 h-4 mr-2" />
                                        Screen Share
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Message
                                    </Button>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-white mb-3">How I Did It</h4>
                                <p className="text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-lg">
                                    {selectedPlayerUnlock.description}
                                </p>
                            </div>

                            {/* Tips Section */}
                            {selectedPlayerUnlock.tips && (
                                <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-semibold text-blue-400 mb-2">Pro Tip</h5>
                                            <p className="text-sm text-blue-200">{selectedPlayerUnlock.tips}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Screenshots */}
                            {selectedPlayerUnlock.screenshots && selectedPlayerUnlock.screenshots.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-white mb-3">Screenshots</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedPlayerUnlock.screenshots.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt={`Screenshot ${idx + 1}`}
                                                className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer border border-slate-700"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Video */}
                            {selectedPlayerUnlock.videoUrl && (
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-white mb-3">Video Guide</h4>
                                    <div className="relative h-64 rounded-lg overflow-hidden bg-black border border-slate-700">
                                        <video
                                            className="w-full h-64 object-cover"
                                            controls
                                            poster={selectedPlayerUnlock.screenshots?.[0]}
                                        >
                                            <source src={selectedPlayerUnlock.videoUrl} type="video/mp4" />
                                        </video>
                                    </div>
                                </div>
                            )}

                            {/* Voice Note */}
                            {selectedPlayerUnlock.voiceNoteUrl && (
                                <div>
                                    <h4 className="text-lg font-semibold text-white mb-3">Voice Guide</h4>
                                    <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
                                        <div className="flex items-center gap-4">
                                            <Button
                                                onClick={() => setPlayingVoice(!playingVoice)}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Volume2 className="w-5 h-5 mr-2" />
                                                {playingVoice ? 'Stop' : 'Play'} Voice Guide
                                            </Button>
                                            <p className="text-sm text-slate-400">
                                                Listen to {selectedPlayerUnlock.player}'s voice walkthrough
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-slate-500">
                            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg">Select an achievement to view details</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Help Request Modal */}
            <AnimatePresence>
                {showHelpRequest && selectedPlayerUnlock && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowHelpRequest(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 rounded-2xl border-2 border-blue-500/30 p-6 max-w-md w-full"
                        >
                            <h3 className="text-2xl font-bold text-white mb-4">Request Help from {selectedPlayerUnlock.player}</h3>
                            <p className="text-slate-300 mb-6">
                                Send a help request to {selectedPlayerUnlock.player} for guidance on this achievement. They can assist you through:
                            </p>
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <Video className="w-5 h-5 text-blue-400" />
                                    <div>
                                        <p className="font-semibold text-white">Video Screen Share</p>
                                        <p className="text-xs text-slate-400">Live screen sharing session</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <MessageSquare className="w-5 h-5 text-green-400" />
                                    <div>
                                        <p className="font-semibold text-white">Text Chat</p>
                                        <p className="text-xs text-slate-400">Message-based help</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <Mic className="w-5 h-5 text-purple-400" />
                                    <div>
                                        <p className="font-semibold text-white">Voice Call</p>
                                        <p className="text-xs text-slate-400">Real-time voice guidance</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={() => setShowHelpRequest(false)}
                                >
                                    Send Request
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowHelpRequest(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AchievementLootBoxTab = ({ game }) => {
    const [selectedBox, setSelectedBox] = useState(null);
    const [isOpening, setIsOpening] = useState(false);

    const handleOpenBox = (box) => {
        if (box.unopened) {
            setSelectedBox(box);
            setIsOpening(true);
            // Simulate box opening animation
            setTimeout(() => {
                setIsOpening(false);
            }, 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">Achievement Loot Boxes</h3>
                    <p className="text-slate-400 text-sm">Open loot boxes earned from achievements to get rewards</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MOCK_LOOT_BOXES.map(box => (
                    <motion.div
                        key={box.id}
                        whileHover={{ scale: 1.02 }}
                        className={`relative bg-slate-800/50 rounded-xl p-6 border-2 ${
                            box.unopened ? 'border-yellow-500/50' : 'border-slate-700/50'
                        } ${box.unopened ? box.glow : ''} cursor-pointer`}
                        onClick={() => handleOpenBox(box)}
                    >
                        {box.unopened && (
                            <div className="absolute top-3 right-3">
                                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50 animate-pulse">
                                    NEW
                                </Badge>
                            </div>
                        )}

                        {/* 3D Box Display */}
                        <div className="relative h-48 flex items-center justify-center mb-4">
                            <motion.div
                                animate={isOpening && selectedBox?.id === box.id ? {
                                    rotateY: [0, 360],
                                    scale: [1, 1.2, 1]
                                } : {}}
                                transition={{ duration: 2 }}
                                className="text-8xl"
                                style={{ 
                                    filter: box.unopened ? `drop-shadow(0 0 20px ${box.color})` : 'none',
                                    transform: 'perspective(1000px) rotateX(10deg) rotateY(-10deg)'
                                }}
                            >
                                {box.icon}
                            </motion.div>
                        </div>

                        <div className="text-center mb-4">
                            <h4 className="text-xl font-bold text-white mb-1">{box.name}</h4>
                            <Badge className={`${
                                box.rarity === 'Legendary' ? 'bg-orange-900/50 text-orange-300 border-orange-500' :
                                box.rarity === 'Epic' ? 'bg-purple-900/50 text-purple-300 border-purple-500' :
                                'bg-blue-900/50 text-blue-300 border-blue-500'
                            } mb-2`}>
                                {box.rarity}
                            </Badge>
                            <p className="text-xs text-slate-400">Earned from: {box.earnedFrom}</p>
                            <p className="text-xs text-slate-500 mt-1">{box.timestamp}</p>
                        </div>

                        {box.unopened ? (
                            <div>
                                <Button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold">
                                    <Gift className="w-4 h-4 mr-2" />
                                    Open Loot Box
                                </Button>
                                <div className="mt-3 text-xs text-slate-400 text-center">
                                    Contains: {box.contents.join(', ')}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                    <p className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Items Received:
                                    </p>
                                    <div className="space-y-2">
                                        {box.openedItems?.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <span className="text-2xl">{item.icon}</span>
                                                <span className="text-white">{item.name}</span>
                                                <Badge className="text-xs">{item.rarity}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Opening Animation Overlay */}
            <AnimatePresence>
                {isOpening && selectedBox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
                    >
                        <div className="text-center">
                            <motion.div
                                animate={{
                                    rotateY: [0, 360],
                                    scale: [1, 1.5, 1],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-9xl mb-6"
                                style={{ filter: `drop-shadow(0 0 40px ${selectedBox.color})` }}
                            >
                                {selectedBox.icon}
                            </motion.div>
                            <h2 className="text-4xl font-bold text-white mb-2">Opening {selectedBox.name}...</h2>
                            <p className="text-xl text-slate-400">Revealing your rewards!</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const GameDetailsPanel = ({ game, isStreaming, onShowRecentlyAchieved, onShowAchievements, onShowGameDetails, onPlay, onStream }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [overviewSubTab, setOverviewSubTab] = useState('general');
    const [communitySubTab, setCommunitySubTab] = useState('posts');
    const [achievedSubTab, setAchievedSubTab] = useState('recent'); // New state for achieved sub-tabs

    if (!game) {
        return (
            <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                    <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Select a game to view details</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-black text-white">{game.title}</h2>
                        
                        <Button size="sm" onClick={() => onPlay(game)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105">
                            <Play className="w-4 h-4" />
                            Play
                        </Button>

                        <Button size="sm" onClick={() => onStream && onStream(game)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105 border border-purple-400/30">
                            <Wifi className="w-4 h-4" />
                            Stream
                        </Button>
                        
                        <Button size="sm" variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105">
                            <Bot className="w-4 h-4" />
                            AI Play
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={onShowAchievements} className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 p-2 rounded-lg transition-all hover:scale-110">
                            <Trophy className="w-6 h-6" />
                        </button>
                        <button onClick={onShowGameDetails} className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 p-2 rounded-lg transition-all hover:scale-110">
                            <Eye className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-300 mb-4">
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                        Installed
                    </Badge>
                    <span className="capitalize">{game.genre}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        12.5h played
                    </div>
                </div>

                <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-all ${
                            activeTab === 'overview' 
                                ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                    >
                        Game Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-all ${
                            activeTab === 'community' 
                                ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                    >
                        Community
                    </button>
                    <button
                        onClick={() => setActiveTab('discussion')}
                        className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-all ${
                            activeTab === 'discussion' 
                                ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                    >
                        Discussion
                    </button>
                    <button
                        onClick={() => setActiveTab('achieved')}
                        className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-all ${
                            activeTab === 'achieved' 
                                ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                    >
                        Achievements
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto game-list-scrollable pr-2">
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* Sub-tabs for Overview */}
                        <div className="flex items-center gap-2 border-b border-slate-600/50 pb-2">
                            <button
                                onClick={() => setOverviewSubTab('general')}
                                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                                    overviewSubTab === 'general' 
                                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                General Information
                            </button>
                            <button
                                onClick={() => setOverviewSubTab('updates')}
                                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                                    overviewSubTab === 'updates' 
                                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                Updates & DLC
                            </button>
                        </div>

                        {/* General Information Sub-tab */}
                        {overviewSubTab === 'general' && (
                            <div className="space-y-6">
                                <div className="relative h-64 rounded-xl overflow-hidden">
                                    <img 
                                        src={game.banner || game.cover_image || game.cover} 
                                        alt={game.title} 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    {isStreaming && (
                                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
                                            <Radio className="w-4 h-4 animate-pulse" />
                                            LIVE STREAMING
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-white mb-3">About This Game</h3>
                                    <p className="text-slate-300 leading-relaxed">
                                        {game.description || 'An epic adventure awaits in this groundbreaking title that redefines the genre. Explore vast worlds, engage in intense combat, and uncover secrets that will change everything.'}
                                    </p>
                                </div>

                                <div className="bg-slate-800/50 rounded-xl p-4">
                                    <h4 className="font-semibold text-white mb-3">Your Stats</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Total Playtime:</span>
                                            <span className="text-white font-semibold">12.5 hours</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Achievements:</span>
                                            <span className="text-white font-semibold">8 / 15</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Last Played:</span>
                                            <span className="text-white font-semibold">2 hours ago</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Install Date:</span>
                                            <span className="text-white font-semibold">December 15, 2024</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-white mb-3">Game Trailer</h4>
                                    <div className="relative h-64 rounded-xl overflow-hidden bg-slate-800/50">
                                        <video 
                                            className="w-full h-full object-cover"
                                            controls
                                            poster={game.banner || game.cover_image}
                                        >
                                            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                                        </video>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-white mb-3">Screenshots</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[game.cover, game.banner, game.cover_image, game.cover].filter(Boolean).slice(0, 4).map((img, i) => (
                                            <img
                                                key={i}
                                                src={img}
                                                alt={`Screenshot ${i + 1}`}
                                                className="w-full aspect-video object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Updates & DLC Sub-tab */}
                        {overviewSubTab === 'updates' && (
                            <div className="space-y-4">
                                <div className="space-y-4">
                                    {/* Latest Update */}
                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-green-500/30">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1">Version 2.5.0 - Major Update</h4>
                                                <p className="text-xs text-slate-400">December 18, 2024 at 3:45 PM</p>
                                            </div>
                                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                                Latest
                                            </Badge>
                                        </div>
                                        <p className="text-slate-300 text-sm mb-3">
                                            Major gameplay overhaul including new combat system, improved AI, and performance optimizations. Added support for ray tracing and DLSS 3.0.
                                        </p>
                                        <div className="text-xs text-slate-400">
                                            • New Combat Mechanics<br />
                                            • Ray Tracing Support<br />
                                            • 50+ Bug Fixes<br />
                                            • Performance Improvements
                                        </div>
                                    </div>

                                    {/* DLC */}
                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-purple-500/30">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1">Expansion: Shadow Realms</h4>
                                                <p className="text-xs text-slate-400">December 1, 2024</p>
                                            </div>
                                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                                                DLC
                                            </Badge>
                                        </div>
                                        <p className="text-slate-300 text-sm mb-3">
                                            Explore the mysterious Shadow Realms with 20+ hours of new content, new storyline, weapons, and boss encounters.
                                        </p>
                                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                            Purchase DLC - $19.99
                                        </Button>
                                    </div>

                                    {/* Patch */}
                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-blue-500/30">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1">Hotfix 2.4.3</h4>
                                                <p className="text-xs text-slate-400">November 28, 2024 at 10:20 AM</p>
                                            </div>
                                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                                Patch
                                            </Badge>
                                        </div>
                                        <p className="text-slate-300 text-sm">
                                            Fixed critical save game corruption bug. Resolved multiplayer connection issues. Minor balance adjustments.
                                        </p>
                                    </div>

                                    {/* Future Update */}
                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-yellow-500/30">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1">Coming Soon: Multiplayer Mode</h4>
                                                <p className="text-xs text-slate-400">Expected: January 2025</p>
                                            </div>
                                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                                                Upcoming
                                            </Badge>
                                        </div>
                                        <p className="text-slate-300 text-sm">
                                            Co-op multiplayer mode with up to 4 players. New multiplayer-exclusive quests and rewards. Cross-platform support.
                                        </p>
                                    </div>

                                    {/* Expansion Pack */}
                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-orange-500/30">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1">Season Pass: Year 1</h4>
                                                <p className="text-xs text-slate-400">November 15, 2024</p>
                                            </div>
                                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                                                Expansion
                                            </Badge>
                                        </div>
                                        <p className="text-slate-300 text-sm mb-3">
                                            Get access to all Year 1 content including 3 major expansions, exclusive weapons, and cosmetic items.
                                        </p>
                                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                                            Purchase Season Pass - $39.99
                                        </Button>
                                    </div>

                                    {/* Bug Fix */}
                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-600/30">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1">Patch 2.4.0</h4>
                                                <p className="text-xs text-slate-400">November 10, 2024 at 2:15 PM</p>
                                            </div>
                                            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">
                                                Bug Fixes
                                            </Badge>
                                        </div>
                                        <p className="text-slate-300 text-sm">
                                            General stability improvements. Fixed texture loading issues. Improved controller support. Balance adjustments to weapons and abilities.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'community' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-600/50 pb-2">
                            <button
                                onClick={() => setCommunitySubTab('posts')}
                                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                                    communitySubTab === 'posts' 
                                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                Community Posts
                            </button>
                            <button
                                onClick={() => setCommunitySubTab('chat')}
                                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                                    communitySubTab === 'chat' 
                                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                Community Chat
                            </button>
                        </div>

                        {communitySubTab === 'posts' && <CommunityPostsTab game={game} />}
                        {communitySubTab === 'chat' && <CommunityChatTab game={game} />}
                    </div>
                )}

                {activeTab === 'discussion' && (
                    <div className="space-y-6">
                        <div className="text-center py-12">
                            <MessageSquare className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-2">Game Discussions</h3>
                            <p className="text-slate-400">Join conversations, ask questions, and share your experiences</p>
                        </div>

                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800/70 transition-colors cursor-pointer">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-white">Discussion Topic {i}</h4>
                                        <span className="text-xs text-slate-500">2h ago</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span>👤 User{i}</span>
                                        <span>💬 {12 + i} replies</span>
                                        <span>👍 {45 + i * 10} likes</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'achieved' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-600/50 pb-2">
                            <button
                                onClick={() => setAchievedSubTab('recent')}
                                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                                    achievedSubTab === 'recent' 
                                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                Recently Achieved
                            </button>
                            <button
                                onClick={() => setAchievedSubTab('lootbox')}
                                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                                    achievedSubTab === 'lootbox' 
                                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                Achievement Loot Box
                            </button>
                        </div>

                        {achievedSubTab === 'recent' && <RecentlyAchievedTab game={game} />}
                        {achievedSubTab === 'lootbox' && <AchievementLootBoxTab game={game} />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Library() {
    const { user, isAuthenticated } = useAuth();
    const [ownedGames, setOwnedGames] = useState([]);
    const [favoriteGames, setFavoriteGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [viewMode, setViewMode] = useState('collapsed');
    const [isListening, setIsListening] = useState(false);
    const [streamingGameId, setStreamingGameId] = useState(localStorage.getItem('streaming_game_id'));
    const [selectedGame, setSelectedGame] = useState(null);
    const [showRecentlyAchieved, setShowRecentlyAchieved] = useState(false);
    const [showAchievementsOverlay, setShowAchievementsOverlay] = useState(false);
    const [showGameDetailsOverlay, setShowGameDetailsOverlay] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('midnight_library');
    const [launchingGame, setLaunchingGame] = useState(null);
    const [streamingSession, setStreamingSession] = useState(null);
    const canvasRef = useRef(null);

    const handleStreamGame = async (game) => {
        try {
            const res = await base44.functions.invoke('initiateRemotePlay', { game_id: game.id });
            if (res.data && res.data.success) {
                setStreamingSession({ game, session: res.data.session });
            } else {
                console.error("Failed to start stream", res);
                // Fallback for UI demo
                setStreamingSession({ game, session: { status: 'initializing' } });
            }
        } catch (e) {
            console.error(e);
            setStreamingSession({ game, session: { status: 'initializing' } });
        }
    };

    const handleLaunchGame = (game) => {
        setLaunchingGame(game);
    };

    useEffect(() => {
        const fetchOwnedGames = async () => {
            let userGames = [];
            const testGameAlpha = allMockGames['test_game_alpha'];

            if (isAuthenticated) {
                const allGamesFromDb = await base44.entities.Game.list();
                const combinedGamePool = { ...allMockGames, ...Object.fromEntries(allGamesFromDb.map(g => [g.id, g])) };
                
                const ownedIds = user?.purchased_items || [];
                userGames = ownedIds.map(id => combinedGamePool[id]).filter(Boolean);

                if (testGameAlpha) {
                    userGames.unshift(testGameAlpha);
                }
            } else {
                 if (testGameAlpha) {
                    userGames.push(testGameAlpha);
                 }
            }
            
            setOwnedGames(Array.from(new Map(userGames.map(g => [g.id, g])).values()));
            setFavoriteGames(userGames.slice(0, 3));
            if (userGames.length > 0) {
              setSelectedGame(userGames[0]);
            }
            setLoading(false);
        };

        fetchOwnedGames();

        const handleStorageChange = () => {
            setStreamingGameId(localStorage.getItem('streaming_game_id'));
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [user, isAuthenticated]);

    // Animated background for library & per-game themes
    useEffect(() => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;
        
        const currentLibraryTheme = LIBRARY_THEMES[selectedTheme];
        const currentGameTheme = selectedGame && GAME_THEMES[selectedGame.title];

        // Determine the animation settings based on whether a game theme is active
        const animationSettings = currentGameTheme ? {
            animationType: currentGameTheme.animation,
            particleConfig: currentGameTheme.particles
        } : {
            animationType: currentLibraryTheme.animation,
            particleConfig: {
                count: 100,
                type: currentLibraryTheme.animation === 'snow' ? 'snow' : currentLibraryTheme.animation, // Use general type for base library animations
                colors: ['rgba(255, 255, 255, 0.6)'] // Default white for most general animations
            }
        };

        let particles = [];

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Initialize particles based on animation type
        const initializeParticles = () => {
            particles = []; // Clear existing particles
            const { count, type, colors } = animationSettings.particleConfig;
            for (let i = 0; i < count; i++) {
                let p = {
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 2 + 1,
                    speed: Math.random() * 0.5 + 0.1,
                    opacity: Math.random(),
                    color: colors[Math.floor(Math.random() * colors.length)],
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 0.5 + 0.1,
                    angle: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.05
                };

                if (type === 'snow') {
                    p.vy = Math.random() * 2 + 1;
                } else if (type === 'petals') {
                    p.vy = Math.random() * 1.5 + 0.5;
                } else if (type === 'embers') {
                    p.vy = -(Math.random() * 1 + 0.5); // Embers float upwards
                    p.x = canvas.width / 2 + (Math.random() - 0.5) * 100; // Start near center bottom
                } else if (type === 'rain' || animationSettings.animationType === 'cyber_rain') {
                    p.length = Math.random() * 20 + 10;
                    p.speed = Math.random() * 5 + 2;
                    p.opacity = Math.random() * 0.5 + 0.3;
                    p.color = colors[Math.floor(Math.random() * colors.length)];
                } else if (type === 'matrix' || animationSettings.animationType === 'matrix') {
                    p.char = String.fromCharCode(0x30A0 + Math.random() * 96);
                    p.font_size = 14;
                    p.speed = 3;
                    p.x = Math.floor(Math.random() * canvas.width / p.font_size) * p.font_size;
                    p.y = Math.random() * canvas.height;
                }

                particles.push(p);
            }
        };

        initializeParticles();

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const { animationType } = animationSettings;
            const time = Date.now() * 0.001; // Global time for animations

            // General particle effects
            if (['stars', 'particles', 'magic', 'fireflies', 'snow', 'embers', 'crystals', 'petals', 'fantasy_particles'].includes(animationType)) {
                particles.forEach(p => {
                    ctx.beginPath();
                    if (animationType === 'petals') {
                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate(p.angle);
                        ctx.fillStyle = p.color;
                        ctx.fillRect(-p.radius, -p.radius/2, p.radius * 2, p.radius);
                        ctx.restore();
                    } else if (animationType === 'crystals') {
                        ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 2;
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = p.color;
                        ctx.stroke();
                    } else {
                        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                        ctx.fillStyle = p.color;
                        if (['fireflies', 'magic', 'fantasy_particles'].includes(animationType)) {
                            ctx.shadowBlur = 10;
                            ctx.shadowColor = p.color;
                        }
                        ctx.fill();
                    }
                    
                    p.y += p.vy;
                    p.x += p.vx * 0.1; // Slight horizontal drift
                    p.opacity = Math.sin(time + p.x) * 0.2 + 0.8; // Subtle flicker
                    
                    if (animationType === 'snow') {
                        p.x += Math.sin(p.y * 0.01) * 0.5;
                        if (p.y > canvas.height) { p.y = 0; p.x = Math.random() * canvas.width; }
                    } else if (animationType === 'embers') {
                        if (p.y < 0) { p.y = canvas.height; p.x = canvas.width / 2 + (Math.random() - 0.5) * 100; }
                    } else if (animationType === 'petals') {
                        p.x += Math.sin(p.y * 0.01) * 0.3;
                        p.angle += p.rotationSpeed;
                        if (p.y > canvas.height) { p.y = 0; p.x = Math.random() * canvas.width; }
                    } else { // stars, particles, magic, fireflies, fantasy_particles
                        if (p.y > canvas.height) { p.y = 0; p.x = Math.random() * canvas.width; }
                    }
                });
                ctx.shadowBlur = 0;
            }

            if (animationType === 'grid' || animationType === 'tactical_grid') {
                const gridSize = 50;
                const dynamicOpacity = Math.sin(time * 0.5) * 0.1 + 0.2;
                ctx.strokeStyle = `rgba(59, 130, 246, ${dynamicOpacity})`;
                ctx.lineWidth = 1;

                for (let x = 0; x < canvas.width; x += gridSize) {
                    const wave = Math.sin(x * 0.01 + time) * 10;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height + wave);
                    ctx.stroke();
                }

                for (let y = 0; y < canvas.height; y += gridSize) {
                    const wave = Math.sin(y * 0.01 + time) * 10;
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width + wave, y);
                    ctx.stroke();
                }
            }

            if (animationType === 'aurora') {
                const gradient = ctx.createLinearGradient(
                    0, 
                    Math.sin(time) * canvas.height * 0.5, 
                    canvas.width, 
                    canvas.height
                );
                gradient.addColorStop(0, 'rgba(0, 255, 127, 0.1)');
                gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
                gradient.addColorStop(1, 'rgba(168, 85, 247, 0.1)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            if (animationType === 'nebula') {
                const nebulaTime = Date.now() * 0.0003;
                for (let i = 0; i < 3; i++) {
                    const gradient = ctx.createRadialGradient(
                        canvas.width / 2 + Math.sin(nebulaTime + i) * 200,
                        canvas.height / 2 + Math.cos(nebulaTime + i) * 200,
                        0,
                        canvas.width / 2 + Math.sin(nebulaTime + i) * 200,
                        canvas.height / 2 + Math.cos(nebulaTime + i) * 200,
                        400
                    );
                    const colors = [
                        ['rgba(255, 0, 255, 0.1)', 'rgba(128, 0, 255, 0)'],
                        ['rgba(0, 255, 255, 0.1)', 'rgba(0, 128, 255, 0)'],
                        ['rgba(255, 0, 128, 0.1)', 'rgba(255, 0, 255, 0)']
                    ];
                    gradient.addColorStop(0, colors[i][0]);
                    gradient.addColorStop(1, colors[i][1]);
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }

            if (animationType === 'neon') {
                ctx.strokeStyle = `hsla(${(time * 50) % 360}, 100%, 70%, 0.3)`;
                ctx.lineWidth = 2;
                for (let i = 0; i < 20; i++) {
                    const x = (i / 20) * canvas.width;
                    const y = Math.sin(x * 0.01 + time) * 50 + canvas.height / 2;
                    if (i === 0) ctx.beginPath(), ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            if (animationType === 'matrix') {
                ctx.font = `${particles[0]?.font_size || 14}px monospace`;
                particles.forEach(p => {
                    ctx.fillStyle = p.color;
                    ctx.fillText(p.char, p.x, p.y);
                    p.y += p.speed;
                    if (p.y > canvas.height) {
                        p.y = 0;
                        p.x = Math.floor(Math.random() * canvas.width / p.font_size) * p.font_size;
                        p.char = String.fromCharCode(0x30A0 + Math.random() * 96);
                    }
                });
            }

            if (animationType === 'lightning') {
                if (Math.random() > 0.98) { // 2% chance to draw a lightning bolt each frame
                    const x1 = Math.random() * canvas.width;
                    const y1 = 0;
                    const length = canvas.height * (0.8 + Math.random() * 0.2); // Random length
                    const branchCount = Math.floor(Math.random() * 3) + 1;

                    ctx.strokeStyle = `rgba(200, 200, 255, ${Math.random() * 0.5 + 0.5})`;
                    ctx.lineWidth = 2 + Math.random() * 2;
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = 'rgba(200, 200, 255, 0.8)';
                    ctx.lineCap = 'round';

                    function drawLightningBranch(startX, startY, len, angle, depth) {
                        if (len < 5 || depth > 3) return;

                        const endX = startX + Math.cos(angle) * len;
                        const endY = startY + Math.sin(angle) * len;
                        
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(endX, endY);
                        ctx.stroke();

                        if (Math.random() > 0.5) { // Chance to branch
                            drawLightningBranch(endX, endY, len * 0.6, angle + (Math.random() - 0.5) * 0.8, depth + 1);
                        }
                        if (Math.random() > 0.5) { // Another chance
                            drawLightningBranch(endX, endY, len * 0.6, angle - (Math.random() - 0.5) * 0.8, depth + 1);
                        }
                    }
                    drawLightningBranch(x1, y1, length, Math.PI / 2 + (Math.random() - 0.5) * 0.3, 0);
                    ctx.shadowBlur = 0;
                }
            }
            
            if (animationType === 'smoke') {
                particles.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(100, 100, 100, ${p.opacity * 0.3})`;
                    ctx.fill();
                    
                    p.y -= p.speed * 0.3;
                    p.x += (Math.random() - 0.5) * 1;
                    p.radius += 0.1;
                    p.opacity -= 0.005;
                    if (p.y < 0 || p.opacity <= 0) {
                        p.y = canvas.height;
                        p.x = Math.random() * canvas.width;
                        p.radius = Math.random() * 2 + 1;
                        p.opacity = Math.random();
                    }
                });
            }

            if (animationType === 'cyber_rain') {
                particles.forEach(p => {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x, p.y + p.length);
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 1.5;
                    ctx.globalAlpha = p.opacity;
                    ctx.stroke();
                    ctx.globalAlpha = 1; // Reset global alpha

                    p.y += p.speed;
                    if (p.y > canvas.height) {
                        p.y = -p.length;
                        p.x = Math.random() * canvas.width;
                    }
                });
            }

            animationId = requestAnimationFrame(animate);
        }

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initializeParticles(); // Re-initialize particles on resize
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, [selectedTheme, selectedGame]); // Dependencies: Re-run effect when theme or selected game changes

    const startVoiceSearch = () => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setSearchTerm(transcript);
            };

            recognition.start();
        }
    };

    const getFilteredGames = () => {
        let games = [];
        switch (activeTab) {
            case 'installed':
                games = ownedGames.slice(0, Math.ceil(ownedGames.length / 2));
                break;
            case 'favorites':
                games = favoriteGames;
                break;
            default:
                games = ownedGames;
        }

        if (searchTerm) {
            games = games.filter(game =>
                game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                game.genre.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return games;
    };

    const filteredGames = getFilteredGames();

    const handleSelectGame = (game) => {
        setSelectedGame(game);
    };

    const currentTheme = LIBRARY_THEMES[selectedTheme];
    const gameTheme = selectedGame && GAME_THEMES[selectedGame.title];

    if (!isAuthenticated && filteredGames.length <= 1) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
                <LibraryIcon className="w-20 h-20 text-slate-600 mb-6" />
                <h1 className="text-3xl font-bold mb-2">Your Library is Empty</h1>
                <p className="text-slate-400 mb-6 max-w-md text-center">Sign in to see your purchased games. All your digital adventures, in one place.</p>
                <Button asChild>
                    <Link to={createPageUrl('Store')}>Explore Games</Link>
                </Button>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden relative">
            <style>{`
                .game-list-scrollable {
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(59, 130, 246, 0.5) rgba(51, 65, 85, 0.3);
                }
                .game-list-scrollable::-webkit-scrollbar {
                    width: 6px;
                }
                .game-list-scrollable::-webkit-scrollbar-track {
                    background: rgba(51, 65, 85, 0.3);
                    border-radius: 3px;
                }
                .game-list-scrollable::-webkit-scrollbar-thumb {
                    background: rgba(59, 130, 246, 0.5);
                    border-radius: 3px;
                }
            `}</style>

            {/* Animated Background Layer */}
            <div className={`absolute inset-0 ${currentTheme?.css || ''}`}> {/* Base gradient */}
                {/* If game theme exists, this covers the base gradient */}
                {gameTheme && selectedGame ? (
                    <img 
                        src={gameTheme.background}
                        alt={selectedGame.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : null}
                {/* Overlay for the game theme background, if present */}
                {gameTheme && selectedGame ? (
                    <div className={`absolute inset-0 bg-gradient-to-r ${gameTheme.overlayColor}`} />
                ) : null}
                {/* Canvas for animations, always on top with opacity */}
                <canvas ref={canvasRef} className="absolute inset-0 opacity-20" />
            </div>

            {/* Header Section - Fixed */}
            <div className="relative z-10 flex-shrink-0 px-6 pt-6 pb-4">
                <header className="mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white flex items-center gap-4">
                                <LibraryIcon className="w-10 h-10 text-blue-400" />
                                My Library
                            </h1>
                            <p className="text-slate-400 mt-2">All your purchased games, ready to play.</p>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/5 hover:bg-white/10 border border-white/10">
                                    <Palette className="w-5 h-5 text-white" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                                className="bg-slate-900/95 backdrop-blur-xl border-slate-700"
                                style={{ width: '650px', maxHeight: '550px' }}
                                align="end"
                            >
                                <div className="p-6">
                                    <div className="mb-4">
                                        <h4 className="text-white font-bold text-lg mb-1">Library Themes</h4>
                                        <p className="text-slate-400 text-sm">Customize your library background</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 gap-4 max-h-[420px] overflow-y-auto pr-2">
                                        {Object.values(LIBRARY_THEMES).map(theme => {
                                            const isSelected = selectedTheme === theme.id;
                                            return (
                                                <motion.button
                                                    key={theme.id}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setSelectedTheme(theme.id)}
                                                    className={`relative p-3 rounded-xl border-2 transition-all ${
                                                        isSelected 
                                                            ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/30' 
                                                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70'
                                                    }`}
                                                >
                                                    <div className={`w-full aspect-video rounded-lg mb-2 ${theme.css} relative overflow-hidden`}>
                                                        {isSelected && (
                                                            <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white rounded-full p-1">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-semibold text-center text-white">
                                                        {theme.name}
                                                    </p>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => setActiveTab('all')}
                            variant={activeTab === 'all' ? 'default' : 'ghost'}
                        >
                            All
                        </Button>
                        <Button
                            onClick={() => setActiveTab('installed')}
                            variant={activeTab === 'installed' ? 'default' : 'ghost'}
                        >
                            Installed
                        </Button>
                        <Button
                            onClick={() => setActiveTab('favorites')}
                            variant={activeTab === 'favorites' ? 'default' : 'ghost'}
                        >
                            <Heart className="w-4 h-4 mr-2" />
                            Favorites
                        </Button>
                    </div>
                    <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700 gap-1">
                        <Button
                            variant={viewMode === 'collapsed' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={`h-8 px-3 ${viewMode === 'collapsed' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setViewMode('collapsed')}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'expanded' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={`h-8 px-3 ${viewMode === 'expanded' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setViewMode('expanded')}
                            title="Grid View"
                        >
                            <Grid className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Flexible */}
            <div className="relative z-10 flex-1 overflow-hidden px-6 pb-6">
                {filteredGames.length > 0 ? (
                    viewMode === 'collapsed' ? (
                        <div className="flex gap-6 h-full">
                            {/* Left Sidebar - Search + Game List */}
                            <div className="w-[14%] flex flex-col gap-4">
                                {/* Compact Search Box */}
                                <div className="flex-shrink-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-3">
                                    <label className="text-[10px] text-slate-400 mb-1.5 block font-semibold">Search for your games</label>
                                    <div className="relative mb-2">
                                        <Input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="bg-slate-900/50 border-slate-700 pl-2 pr-12 py-1.5 text-xs text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg"
                                        />
                                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                            <Button
                                                onClick={startVoiceSearch}
                                                variant="ghost"
                                                size="icon"
                                                className={`h-5 w-5 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                {isListening ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                                            </Button>
                                            <Search className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] text-slate-400">View:</span>
                                            <Button
                                                onClick={() => setViewMode('collapsed')}
                                                variant={viewMode === 'collapsed' ? 'default' : 'ghost'}
                                                size="sm"
                                                className="text-[9px] h-5 px-1.5"
                                            >
                                                <List className="w-2.5 h-2.5 mr-0.5" />
                                                List
                                            </Button>
                                            <Button
                                                onClick={() => setViewMode('expanded')}
                                                variant={viewMode === 'expanded' ? 'default' : 'ghost'}
                                                size="sm"
                                                className="text-[9px] h-5 px-1.5"
                                            >
                                                <Grid className="w-2.5 h-2.5 mr-0.5" />
                                                Grid
                                            </Button>
                                        </div>
                                        <div className="text-[9px] text-slate-400">
                                            {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Game List */}
                                <div className="flex-1 bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col">
                                    <div className="p-3 border-b border-slate-700/50">
                                        <h3 className="font-semibold text-white text-xs">Your Games</h3>
                                    </div>
                                    <div className="flex-1 game-list-scrollable">
                                        {filteredGames.map(game => (
                                            <GameCard 
                                                key={game.id}
                                                game={game}
                                                isStreaming={game.id === streamingGameId}
                                                viewMode="collapsed"
                                                onSelect={handleSelectGame}
                                                isSelected={selectedGame?.id === game.id}
                                                onPlay={handleLaunchGame}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Vertical Separator */}
                            <div className="w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />

                            {/* Right Panel - Game Details */}
                            <div className="flex-1 overflow-y-auto game-list-scrollable pr-2">
                                <GameDetailsPanel 
                                    game={selectedGame} 
                                    isStreaming={selectedGame?.id === streamingGameId}
                                    onShowRecentlyAchieved={() => setShowRecentlyAchieved(true)}
                                    onShowAchievements={() => setShowAchievementsOverlay(true)}
                                    onShowGameDetails={() => setShowGameDetailsOverlay(true)}
                                    onPlay={handleLaunchGame}
                                    onStream={handleStreamGame}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto game-list-scrollable">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {filteredGames.map(game => (
                                    <GameCard 
                                        key={game.id} 
                                        game={game} 
                                        isStreaming={game.id === streamingGameId}
                                        viewMode={viewMode}
                                        onSelect={handleSelectGame}
                                        onPlay={handleLaunchGame}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 max-w-2xl mx-auto">
                            <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white">No Games Found</h2>
                            <p className="text-slate-400 mt-2 mb-6">
                                {searchTerm ? `No games match "${searchTerm}"` : 'No games in this category'}
                            </p>
                            {searchTerm ? (
                                <Button onClick={() => setSearchTerm('')} variant="outline">
                                    Clear Search
                                </Button>
                            ) : (
                                <Button asChild>
                                    <Link to={createPageUrl('Store')}>Explore the Store</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <RecentlyAchievedOverlay
                isVisible={showRecentlyAchieved}
                onClose={() => setShowRecentlyAchieved(false)}
                gameTitle={selectedGame?.title}
            />

            {showAchievementsOverlay && selectedGame && (
                <GameAchievementsOverlay
                    gameTitle={selectedGame.title}
                    onClose={() => setShowAchievementsOverlay(false)}
                />
            )}

            {showGameDetailsOverlay && selectedGame && (
                <OwnedGameOverlay
                    game={selectedGame}
                    onClose={() => setShowGameDetailsOverlay(false)}
                />
            )}

            <AnimatePresence>
                {launchingGame && (
                    <GameLauncherOverlay 
                        game={launchingGame} 
                        onClose={() => setLaunchingGame(null)} 
                    />
                )}
                {streamingSession && (
                    <RemotePlayOverlay 
                        game={streamingSession.game}
                        session={streamingSession.session}
                        onClose={() => setStreamingSession(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}