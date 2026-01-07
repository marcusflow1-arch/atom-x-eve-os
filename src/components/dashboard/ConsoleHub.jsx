import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import {
  Gamepad2, Swords, Trophy, Users, ArrowLeftRight, Crown, Globe,
  Settings, Volume2, VolumeX, Palette, Play, Star, Zap, Target, ChevronRight, X,
  Search, Mic, Filter, TrendingUp, Clock, Sparkles, Eye, ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Available background themes
const BACKGROUND_THEMES = {
  retro_grid: {
    id: 'retro_grid',
    name: 'Retro Grid',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-purple-900 via-black to-blue-900',
    animation: 'grid'
  },
  neon_city: {
    id: 'neon_city',
    name: 'Neon City',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-pink-600 via-purple-900 to-blue-900',
    animation: 'neon'
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-teal-500 via-purple-600 to-pink-600',
    animation: 'aurora'
  },
  galaxy: {
    id: 'galaxy',
    name: 'Galaxy',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black',
    animation: 'stars'
  },
  matrix_rain: {
    id: 'matrix_rain',
    name: 'Matrix Rain',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-black via-green-950 to-black',
    animation: 'matrix'
  },
  starfield: {
    id: 'starfield',
    name: 'Starfield',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-slate-950 via-blue-950 to-black',
    animation: 'starfield'
  },
  cyberpunk_streets: {
    id: 'cyberpunk_streets',
    name: 'Cyberpunk Streets',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-red-900 via-purple-950 to-blue-950',
    animation: 'rain'
  },
  deep_ocean: {
    id: 'deep_ocean',
    name: 'Deep Ocean',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-cyan-900 via-blue-950 to-indigo-950',
    animation: 'bubbles'
  },
  fire_storm: {
    id: 'fire_storm',
    name: 'Fire Storm',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-orange-600 via-red-900 to-black',
    animation: 'embers'
  },
  digital_waves: {
    id: 'digital_waves',
    name: 'Digital Waves',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-blue-600 via-cyan-700 to-purple-900',
    animation: 'waves'
  },
  cosmic_nebula: {
    id: 'cosmic_nebula',
    name: 'Cosmic Nebula',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-fuchsia-900 via-purple-800 to-cyan-900',
    animation: 'nebula'
  },
  lightning_storm: {
    id: 'lightning_storm',
    name: 'Lightning Storm',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-slate-900 via-gray-800 to-zinc-900',
    animation: 'lightning'
  },
  pixel_art: {
    id: 'pixel_art',
    name: 'Pixel Art',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-blue-700 via-pink-600 to-yellow-500',
    animation: 'pixels'
  },
  vaporwave: {
    id: 'vaporwave',
    name: 'Vaporwave',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500',
    animation: 'vaporwave'
  },
  midnight_purple: {
    id: 'midnight_purple',
    name: 'Midnight Purple',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950',
    animation: 'stars'
  },
  emerald_forest: {
    id: 'emerald_forest',
    name: 'Emerald Forest',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-green-900 via-emerald-950 to-teal-950',
    animation: 'particles'
  },
  crimson_twilight: {
    id: 'crimson_twilight',
    name: 'Crimson Twilight',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-rose-900 via-red-950 to-orange-950',
    animation: 'embers'
  },
  arctic_frost: {
    id: 'arctic_frost',
    name: 'Arctic Frost',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-cyan-950 via-blue-950 to-slate-950',
    animation: 'bubbles'
  },
  golden_hour: {
    id: 'golden_hour',
    name: 'Golden Hour',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-amber-700 via-orange-800 to-red-900',
    animation: 'waves'
  },
  void_space: {
    id: 'void_space',
    name: 'Void Space',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-black via-slate-950 to-zinc-950',
    animation: 'starfield'
  },
  toxic_waste: {
    id: 'toxic_waste',
    name: 'Toxic Waste',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-lime-900 via-green-950 to-yellow-950',
    animation: 'bubbles'
  },
  blood_moon: {
    id: 'blood_moon',
    name: 'Blood Moon',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-red-950 via-black to-orange-950',
    animation: 'embers'
  },
  electric_blue: {
    id: 'electric_blue',
    name: 'Electric Blue',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-blue-600 via-cyan-700 to-sky-800',
    animation: 'lightning'
  },
  sunset_paradise: {
    id: 'sunset_paradise',
    name: 'Sunset Paradise',
    type: 'animated',
    locked: false,
    css: 'bg-gradient-to-br from-orange-500 via-pink-600 to-purple-700',
    animation: 'waves'
  }
};

// Ambient audio options
const AMBIENT_AUDIO = {
  console_hum: { name: 'Console Hum', url: '/audio/console-hum.mp3' },
  ambient_space: { name: 'Space Ambient', url: '/audio/space-ambient.mp3' },
  nostalgic_chimes: { name: 'Nostalgic Chimes', url: '/audio/chimes.mp3' },
  none: { name: 'None', url: null }
};

// PvP & PvE Combined Component
const PvPPvETab = () => {
  return (
    <Tabs defaultValue="pvp" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 mb-6">
        <TabsTrigger value="pvp" className="gap-2">
          <Swords className="w-4 h-4" />
          PvP Arena
        </TabsTrigger>
        <TabsTrigger value="pve" className="gap-2">
          <Target className="w-4 h-4" />
          PvE Events
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pvp">
        <Tabs defaultValue="quickmatch" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-700/50 mb-6">
            <TabsTrigger value="quickmatch">Quick Match</TabsTrigger>
            <TabsTrigger value="ranked">Ranked</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
            <TabsTrigger value="loadout">Loadout</TabsTrigger>
          </TabsList>

          <TabsContent value="quickmatch" className="mt-6">
            <div className="border-t border-slate-700/50 pt-8">
              <div className="text-center">
                <Swords className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Quick Match</h3>
                <p className="text-slate-400 mb-6">Jump into instant PvP action with skill-based matchmaking</p>
                <div className="flex justify-center gap-4 mb-8">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Play className="w-4 h-4 mr-2" />
                    Find Match
                  </Button>
                  <Button variant="outline">View Queue</Button>
                </div>
                <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto border-t border-slate-700/50 pt-6">
                  <div className="border-l-2 border-blue-400 pl-4">
                    <div className="text-3xl font-bold text-blue-400">247</div>
                    <div className="text-sm text-slate-400">Players Online</div>
                  </div>
                  <div className="border-l-2 border-green-400 pl-4">
                    <div className="text-3xl font-bold text-green-400">~2m</div>
                    <div className="text-sm text-slate-400">Avg Wait Time</div>
                  </div>
                  <div className="border-l-2 border-purple-400 pl-4">
                    <div className="text-3xl font-bold text-purple-400">1850</div>
                    <div className="text-sm text-slate-400">Your MMR</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ranked" className="mt-6">
            <div className="border-t border-slate-700/50 pt-8">
              <div className="text-center">
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Ranked Mode</h3>
                <p className="text-slate-400 mb-6">Compete for rank and glory in competitive matches</p>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 mb-6">
                  Current Rank: Diamond III
                </Badge>
                <div className="flex justify-center gap-4">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Play className="w-4 h-4 mr-2" />
                    Queue Ranked
                  </Button>
                  <Button variant="outline">View Rankings</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-6">
            <div className="border-t border-slate-700/50 pt-8">
              <div className="text-center">
                <Settings className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Custom Matches</h3>
                <p className="text-slate-400 mb-6">Create or join custom matches with your own rules</p>
                <div className="flex justify-center gap-4">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create Match
                  </Button>
                  <Button variant="outline">Browse Lobbies</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="loadout" className="mt-6">
            <div className="border-t border-slate-700/50 pt-8">
              <div className="text-center">
                <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">PvP Loadout</h3>
                <p className="text-slate-400 mb-6">Configure your abilities and equipment for PvP combat</p>
                <Button className="bg-yellow-600 hover:bg-yellow-700">
                  Customize Loadout
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="pve">
        <Tabs defaultValue="worldevents" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 mb-6">
            <TabsTrigger value="worldevents">World Events</TabsTrigger>
            <TabsTrigger value="dungeons">Dungeon Raids</TabsTrigger>
          </TabsList>

          <TabsContent value="worldevents" className="mt-6">
            <div className="border-t border-slate-700/50 pt-8">
              <div className="text-center">
                <Globe className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">World Events</h3>
                <p className="text-slate-400 mb-6">Join global PvE events with players worldwide</p>
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/50 mb-6">
                  Active Event: Dragon Siege
                </Badge>
                <div className="flex justify-center gap-4">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Play className="w-4 h-4 mr-2" />
                    Join Event
                  </Button>
                  <Button variant="outline">View Schedule</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dungeons" className="mt-6">
            <div className="border-t border-slate-700/50 pt-8">
              <div className="text-center">
                <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Dungeon Raids</h3>
                <p className="text-slate-400 mb-6">Challenge difficult dungeons with your party</p>
                <div className="flex justify-center gap-4">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Create Party
                  </Button>
                  <Button variant="outline">Find Group</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
};

// Leaderboards Tab - Now uses GenreLeaderboardSystem
import GenreLeaderboardSystem from './GenreLeaderboardSystem';

const LeaderboardsTab = () => {
  return (
    <div className="h-[600px]">
      <GenreLeaderboardSystem initialView="genres" />
    </div>
  );
};

// Tournament Tab
const TournamentTab = () => {
  return (
    <div className="border-t border-slate-700/50 pt-16">
      <div className="text-center">
        <Crown className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Tournaments</h3>
        <p className="text-slate-400 mb-6">
          Compete in organized tournaments for epic rewards and glory
        </p>
        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 mb-6">
          Next Tournament: Winter Championship
        </Badge>
        <div className="flex justify-center gap-4">
          <Button className="bg-purple-600 hover:bg-purple-700">
            Register Now
          </Button>
          <Button variant="outline">View Schedule</Button>
        </div>
      </div>
    </div>
  );
};

// Loadout Tab
const LoadoutTab = () => {
  return (
    <div className="border-t border-slate-700/50 pt-16">
      <div className="text-center">
        <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Loadout Manager</h3>
        <p className="text-slate-400 mb-6">
          Customize your gear, abilities, and stats for different game modes
        </p>
        <Button className="bg-yellow-600 hover:bg-yellow-700">
          Customize Loadout
        </Button>
      </div>
    </div>
  );
};

// Shop Tab - Simplified to avoid parsing issues
const ShopTab = () => {
  return (
    <div className="border-t border-slate-700/50 pt-16">
      <div className="text-center">
        <ShoppingCart className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Shop & Trading</h3>
        <p className="text-slate-400 mb-6">
          Browse marketplace items and create trade offers
        </p>
        <div className="flex justify-center gap-4">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Browse Marketplace
          </Button>
          <Button variant="outline">Trading Post</Button>
        </div>
      </div>
    </div>
  );
};

export default function ConsoleHub() {
  const { user } = useAuth();
  const [selectedThemes, setSelectedThemes] = useState({
    pvppve: 'aurora',
    leaderboards: 'galaxy',
    tournament: 'cosmic_nebula',
    loadout: 'neon_city',
    shop: 'digital_waves'
  });
  const [activeTab, setActiveTab] = useState('pvppve');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState('none');

  const currentTheme = BACKGROUND_THEMES[selectedThemes[activeTab]];

  const handleThemeChange = (themeId) => {
    setSelectedThemes(prev => ({
      ...prev,
      [activeTab]: themeId
    }));
  };

  const getTabDisplayName = (tabId) => {
    const names = {
      pvppve: 'PvP & PvE',
      leaderboards: 'Leaderboards',
      tournament: 'Tournament',
      loadout: 'Loadout',
      shop: 'Shop'
    };
    return names[tabId] || tabId;
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Background Layer */}
      <div className={`absolute inset-0 ${currentTheme?.css || ''}`}>
        <div className="absolute inset-0 opacity-20"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/10 bg-black/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-base font-bold text-white shadow-lg shadow-blue-500/50">
                {user?.username?.charAt(0) || 'P'}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">
                  {user?.username || 'Player'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs py-0 px-1.5">
                    <Star className="w-2.5 h-2.5 mr-0.5" />
                    Lv 42
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs py-0 px-1.5">
                    <Zap className="w-2.5 h-2.5 mr-0.5" />
                    5.2K XP
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/5 hover:bg-white/10">
                    <Palette className="w-4 h-4 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="bg-slate-900/95 backdrop-blur-xl border-slate-700"
                  style={{ width: '800px', maxHeight: '650px' }}
                  align="end"
                >
                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="text-white font-bold text-lg mb-1">Background Themes</h4>
                      <p className="text-slate-400 text-sm">
                        Customizing for: <span className="text-blue-400 font-semibold">{getTabDisplayName(activeTab)}</span>
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-4 max-h-[400px] overflow-y-auto pr-2">
                      {Object.values(BACKGROUND_THEMES).map(theme => {
                        const isSelected = selectedThemes[activeTab] === theme.id;
                        return (
                          <motion.button
                            key={theme.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => !theme.locked && handleThemeChange(theme.id)}
                            disabled={theme.locked}
                            className={`relative p-3 rounded-xl border-2 transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/30' 
                                : theme.locked
                                  ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
                                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70'
                            }`}
                          >
                            <div className={`w-full aspect-video rounded-lg mb-2 ${theme.css} relative overflow-hidden`}>
                              {theme.locked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                  <span className="text-2xl">🔒</span>
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className={`text-xs font-semibold text-center ${
                              theme.locked ? 'text-slate-500' : 'text-white'
                            }`}>
                              {theme.name}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-700">
                      <h5 className="text-white font-semibold text-sm mb-3">Current Tab Themes:</h5>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(selectedThemes).map(([tabId, themeId]) => {
                          const theme = BACKGROUND_THEMES[themeId];
                          return (
                            <div key={tabId} className="text-center">
                              <div className={`w-full aspect-video rounded-md mb-1 ${theme.css} border ${
                                activeTab === tabId ? 'border-blue-500' : 'border-slate-700'
                              }`} />
                              <p className="text-xs text-slate-400">{getTabDisplayName(tabId)}</p>
                              <p className="text-xs text-white font-medium">{theme.name}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/5 hover:bg-white/10">
                    {audioEnabled ? (
                      <Volume2 className="w-4 h-4 text-white" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-white" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-slate-900/95 backdrop-blur-xl border-slate-700">
                  <div className="p-3">
                    <h4 className="text-white font-semibold mb-3 text-sm">Ambient Audio</h4>
                    <div className="space-y-2">
                      {Object.entries(AMBIENT_AUDIO).map(([key, audio]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => {
                            setSelectedAudio(key);
                            setAudioEnabled(key !== 'none');
                          }}
                          className="flex items-center justify-between text-sm py-3 px-3 rounded-lg"
                        >
                          <span className="text-white">{audio.name}</span>
                          {selectedAudio === key && (
                            <Badge className="bg-blue-600 text-xs">Active</Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/5 hover:bg-white/10">
                <Settings className="w-4 h-4 text-white" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs 
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="border-b border-white/10 flex-shrink-0">
            <TabsList className="w-full h-auto grid grid-cols-5 bg-transparent rounded-none border-0 p-0">
              <TabsTrigger 
                value="pvppve" 
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white py-3 text-sm"
              >
                <Swords className="w-4 h-4" />
                PvP & PvE
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboards" 
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white py-3 text-sm"
              >
                <Trophy className="w-4 h-4" />
                Leaderboards
              </TabsTrigger>
              <TabsTrigger 
                value="tournament" 
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white py-3 text-sm"
              >
                <Crown className="w-4 h-4" />
                Tournament
              </TabsTrigger>
              <TabsTrigger 
                value="loadout" 
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white py-3 text-sm"
              >
                <Star className="w-4 h-4" />
                Loadout
              </TabsTrigger>
              <TabsTrigger 
                value="shop" 
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white py-3 text-sm"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Shop
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <TabsContent value="pvppve" className="h-full mt-0">
              <PvPPvETab />
            </TabsContent>

            <TabsContent value="leaderboards" className="h-full mt-0">
              <LeaderboardsTab />
            </TabsContent>

            <TabsContent value="tournament" className="h-full mt-0">
              <TournamentTab />
            </TabsContent>

            <TabsContent value="loadout" className="h-full mt-0">
              <LoadoutTab />
            </TabsContent>

            <TabsContent value="shop" className="h-full mt-0">
              <ShopTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}