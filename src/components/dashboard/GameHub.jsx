
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus, Send, Plus, Mic, MicOff, Search, Users, Gamepad2,
  ChevronLeft, ChevronRight, Play, Eye, Video
} from 'lucide-react';
import { allMockGames } from '../store/mockData';

const GameHub = ({ onShowClipsOverlay, onShowGameHubOverlay }) => { // NEW: Add onShowGameHubOverlay prop
  // Friends data
  const friends = [
    { id: 1, name: 'Shadow_Stryker', status: 'online', activity: 'Playing Cyberpunk 2088', avatar: 'https://i.pravatar.cc/150?u=shadow' },
    { id: 2, name: 'Glitch_Witch', status: 'away', activity: 'Away', avatar: 'https://i.pravatar.cc/150?u=glitch' },
    { id: 3, name: 'Cortex', status: 'offline', activity: "Last seen 2h ago", avatar: 'https://i.pravatar.cc/150?u=cortex' },
    { id: 4, name: 'Vexia', status: 'online', activity: 'In Library', avatar: 'https://i.pravatar.cc/150?u=vexia' },
    { id: 5, name: 'NeonRider', status: 'online', activity: 'Streaming', avatar: 'https://i.pravatar.cc/150?u=neon' },
    { id: 6, name: 'CyberMage', status: 'online', activity: 'Playing Elder Scrolls', avatar: 'https://i.pravatar.cc/150?u=cyber' },
    { id: 7, name: 'QuantumHacker', status: 'away', activity: 'AFK', avatar: 'https://i.pravatar.cc/150?u=quantum' },
    { id: 8, name: 'VoidWalker', status: 'online', activity: 'In Marketplace', avatar: 'https://i.pravatar.cc/150?u=void' }
  ];

  // States
  const [activeTab, setActiveTab] = useState('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hoveredFriend, setHoveredFriend] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [games, setGames] = useState([]);

  const ITEMS_PER_PAGE = 8; // Increased for better space utilization

  // Initialize games list
  useEffect(() => {
    const gamesList = Object.values(allMockGames);
    setGames(gamesList);
  }, []);

  // Voice search functionality
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  // Filter friends based on search
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.activity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter and paginate games
  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (game.genre && game.genre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredGames.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGames = filteredGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const renderPaginationNumbers = () => {
    const numbers = [];
    const maxNumbers = Math.min(10, totalPages);

    for (let i = 1; i <= maxNumbers; i++) {
      numbers.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`w-6 h-6 text-xs rounded transition-colors ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {i}
        </button>
      );
    }

    return numbers;
  };

  const handleClipsTab = () => {
    // This function no longer opens the overlay on single click.
    // It's kept in case other logic needs to be added for the tab switch.
    setActiveTab('clips');
  };

  return (
    <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 flex flex-col" style={{ height: '60%', minHeight: '300px', maxHeight: '400px' }}>
      <style jsx>{`
        .invisible-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .invisible-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div
        className="flex items-center justify-between mb-4 cursor-pointer"
        // onDoubleClick={onShowGameHubOverlay} // REMOVED: Trigger moved from here
      >
        <h4 className="text-white font-semibold">GameHub</h4>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
          <UserPlus className="w-4 h-4" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Input
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-700/50 border-slate-600 pl-10 pr-12"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Button
          onClick={startVoiceSearch}
          variant="ghost"
          size="icon"
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 ${
            isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-white'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 mb-4">
          <TabsTrigger value="friends" className="text-sm">
            <Users className="w-4 h-4 mr-1" />
            Friends
          </TabsTrigger>
          <TabsTrigger
            value="games"
            className="text-sm"
            onDoubleClick={onShowGameHubOverlay} // ADDED: Trigger is now here
          >
            <Gamepad2 className="w-4 h-4 mr-1" />
            Games
          </TabsTrigger>
          <TabsTrigger
            value="clips"
            className="text-sm"
            onDoubleClick={() => onShowClipsOverlay(true)} // MODIFIED: Changed from onClick to onDoubleClick
            onClick={handleClipsTab} // MODIFIED: Single click now just changes the tab
          >
            <Video className="w-4 h-4 mr-1" />
            Clips
          </TabsTrigger>
        </TabsList>

        {/* Friends Tab */}
        <TabsContent value="friends" className="flex-1 flex flex-col mt-0">
          <div className="flex-1 space-y-2 invisible-scrollbar" style={{ overflowY: 'auto', maxHeight: '180px' }}>
            {filteredFriends.map(friend => (
              <div
                key={friend.id}
                className="relative flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredFriend(friend.id)}
                onMouseLeave={() => setHoveredFriend(null)}
              >
                <div className="relative">
                  <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(friend.status)} rounded-full border-2 border-slate-800`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{friend.name}</p>
                  <p className="text-slate-400 text-xs truncate">{friend.activity}</p>
                </div>

                {/* Hover Actions */}
                <AnimatePresence>
                  {hoveredFriend === friend.id && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex gap-1"
                    >
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white">
                        <Send className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Games Tab - Layout Fix with reduced height */}
        <TabsContent value="games" className="flex-1 flex flex-col mt-0">
            {/* Games List - reduced max height */}
            <div className="flex-1 invisible-scrollbar" style={{ overflowY: 'auto', maxHeight: '180px' }}>
              <div className="space-y-2">
                {paginatedGames.map(game => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer w-full"
                  >
                    {/* Game name on left */}
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-white font-medium text-sm truncate">{game.title}</p>
                      <p className="text-slate-400 text-xs">{game.genre}</p>
                    </div>

                    {/* Game image on right */}
                    <div className="relative w-12 h-8 rounded overflow-hidden bg-slate-700 flex-shrink-0">
                      <img
                        src={game.cover_image || game.cover}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                ))}

                {paginatedGames.length === 0 && (
                  <div className="text-center py-4 text-slate-400">
                    <Gamepad2 className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No games found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination Numbers - flex-shrink-0 prevents it from growing */}
            {totalPages > 1 && (
              <div className="flex-shrink-0 flex justify-center items-center gap-1 pt-2 border-t border-slate-700/50">
                <div className="flex gap-1 flex-wrap">
                  {renderPaginationNumbers()}
                </div>
              </div>
            )}
        </TabsContent>

        {/* Clips Tab (content is now shown, as single click is enabled) */}
        <TabsContent value="clips" className="flex-1 flex flex-col items-center justify-center mt-0">
          <div className="text-center py-4 text-slate-400">
            <Video className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-semibold">Clip Editor</p>
            <p className="text-xs">Double-click the 'Clips' tab to open.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameHub;
