import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, Search, TrendingUp, Users, Eye, Star, ChevronRight, 
  Gamepad2, Radio, Clock, Filter, Trophy, Settings 
} from 'lucide-react'; // Added Trophy icon
import StreamerTools from '../components/streaming/StreamerTools';
import { motion, AnimatePresence } from 'framer-motion';

export default function StreamingHub() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [streams, setStreams] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for streams
    const mockStreams = [
      {
        id: 1,
        streamer_id: '1',
        title: 'Cyberpunk 2088 - Night City Exploration | Road to Level 50',
        game_id: 'cyberpunk_2088',
        game_name: 'Cyberpunk 2088',
        tags: ['RPG', 'Open World', 'Story'],
        is_live: true,
        viewer_count: 1247,
        preview_image_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=450&fit=crop',
        streamer: {
          username: 'NeonRider',
          avatar_url: 'https://i.pravatar.cc/150?u=neon',
          followers: 12500
        },
        started_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 2,
        streamer_id: '2',
        title: 'Speedrun - Elder Scrolls Any% World Record Attempt',
        game_id: 'elder_scrolls',
        game_name: 'Elder Scrolls VI',
        tags: ['Speedrun', 'RPG'],
        is_live: true,
        viewer_count: 823,
        preview_image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=450&fit=crop',
        streamer: {
          username: 'SpeedDemon',
          avatar_url: 'https://i.pravatar.cc/150?u=speed',
          followers: 8900
        },
        started_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 3,
        streamer_id: '3',
        title: 'Just Chatting - Q&A with Community + Giveaways',
        game_id: 'just_chatting',
        game_name: 'Just Chatting',
        tags: ['Talk Show', 'Community'],
        is_live: true,
        viewer_count: 456,
        preview_image_url: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&h=450&fit=crop',
        streamer: {
          username: 'TechGuru',
          avatar_url: 'https://i.pravatar.cc/150?u=tech',
          followers: 5600
        },
        started_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 4,
        streamer_id: '4',
        title: 'Vanguard Ops Ranked Grind - Diamond Push',
        game_id: 'vanguard_ops',
        game_name: 'Vanguard Ops',
        tags: ['FPS', 'Competitive', 'Ranked'],
        is_live: true,
        viewer_count: 2341,
        preview_image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=450&fit=crop',
        streamer: {
          username: 'TacticalAce',
          avatar_url: 'https://i.pravatar.cc/150?u=tactical',
          followers: 18200
        },
        started_at: new Date(Date.now() - 5400000).toISOString()
      },
      {
        id: 5,
        streamer_id: '5',
        title: 'Cyberpunk 2088 - Side Quest Marathon',
        game_id: 'cyberpunk_2088',
        game_name: 'Cyberpunk 2088',
        tags: ['RPG', 'Chill'],
        is_live: true,
        viewer_count: 567,
        preview_image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop',
        streamer: {
          username: 'ChillGamer',
          avatar_url: 'https://i.pravatar.cc/150?u=chill',
          followers: 4300
        },
        started_at: new Date(Date.now() - 9000000).toISOString()
      },
      {
        id: 6,
        streamer_id: '6',
        title: 'Elder Scrolls VI - New Character Playthrough',
        game_id: 'elder_scrolls',
        game_name: 'Elder Scrolls VI',
        tags: ['RPG', 'Adventure'],
        is_live: true,
        viewer_count: 389,
        preview_image_url: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&h=450&fit=crop',
        streamer: {
          username: 'FantasyFan',
          avatar_url: 'https://i.pravatar.cc/150?u=fantasy',
          followers: 3100
        },
        started_at: new Date(Date.now() - 4500000).toISOString()
      }
    ];

    // Mock data for games
    const mockGames = [
      {
        id: 'cyberpunk_2088',
        name: 'Cyberpunk 2088',
        cover_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&h=400&fit=crop',
        viewer_count: 1814,
        streamer_count: 2,
        genre: 'RPG'
      },
      {
        id: 'vanguard_ops',
        name: 'Vanguard Ops',
        cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop',
        viewer_count: 2341,
        streamer_count: 1,
        genre: 'FPS'
      },
      {
        id: 'elder_scrolls',
        name: 'Elder Scrolls VI',
        cover_image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&h=400&fit=crop',
        viewer_count: 1212,
        streamer_count: 2,
        genre: 'RPG'
      },
      {
        id: 'just_chatting',
        name: 'Just Chatting',
        cover_image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=300&h=400&fit=crop',
        viewer_count: 456,
        streamer_count: 1,
        genre: 'Talk Show'
      },
      {
        id: 'resident_evil_4',
        name: 'Resident Evil 4 Remake',
        cover_image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&h=400&fit=crop',
        viewer_count: 0,
        streamer_count: 0,
        genre: 'Horror'
      },
      {
        id: 'diablo_eternal',
        name: 'Diablo II: Eternal',
        cover_image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=400&fit=crop',
        viewer_count: 0,
        streamer_count: 0,
        genre: 'ARPG'
      }
    ];

    setStreams(mockStreams);
    setGames(mockGames);
    setLoading(false);
  }, []);

  const featuredStream = streams.length > 0 ? streams[0] : null;
  const featuredGames = games.filter(g => g.viewer_count > 0).slice(0, 4);

  // Top Streamers (sorted by followers)
  const topStreamers = [
    { id: 1, username: 'TacticalAce', avatar: 'https://i.pravatar.cc/150?u=tactical', followers: 18200, isLive: true, viewers: 2341, game: 'Vanguard Ops' },
    { id: 2, username: 'NeonRider', avatar: 'https://i.pravatar.cc/150?u=neon', followers: 12500, isLive: true, viewers: 1247, game: 'Cyberpunk 2088' },
    { id: 3, username: 'SpeedDemon', avatar: 'https://i.pravatar.cc/150?u=speed', followers: 8900, isLive: true, viewers: 823, game: 'Elder Scrolls' },
    { id: 4, username: 'ProGamer99', avatar: 'https://i.pravatar.cc/150?u=pro99', followers: 7200, isLive: false, viewers: 0, game: null },
    { id: 5, username: 'ElitePlayer', avatar: 'https://i.pravatar.cc/150?u=elite', followers: 6800, isLive: false, viewers: 0, game: null },
  ];

  // Streamer Spotlight
  const spotlightStreamer = {
    username: 'TechGuru',
    avatar: 'https://i.pravatar.cc/150?u=tech',
    followers: 5600,
    bio: 'Tech enthusiast and gaming veteran. Streaming daily!',
    isLive: true,
    viewers: 456,
    game: 'Just Chatting'
  };

  // New Upcoming Streamers
  const upcomingStreamers = [
    { id: 1, username: 'ChillGamer', avatar: 'https://i.pravatar.cc/150?u=chill', followers: 4300, isLive: true, viewers: 567, game: 'Cyberpunk 2088' },
    { id: 2, username: 'FantasyFan', avatar: 'https://i.pravatar.cc/150?u=fantasy', followers: 3100, isLive: true, viewers: 389, game: 'Elder Scrolls' },
    { id: 3, username: 'RisingStarGG', avatar: 'https://i.pravatar.cc/150?u=rising', followers: 1800, isLive: false, viewers: 0, game: null },
    { id: 4, username: 'NewStreamer', avatar: 'https://i.pravatar.cc/150?u=newbie', followers: 950, isLive: false, viewers: 0, game: null },
  ];

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStreamersForGame = (gameId) => {
    return streams.filter(stream => stream.game_id === gameId);
  };

  const formatUptime = (startedAt) => {
    const now = new Date();
    const start = new Date(startedAt);
    const diff = Math.floor((now - start) / 1000 / 60);
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading streams...</p>
        </div>
      </div>
    );
  }

  // If a game is selected, show streamers for that game
  if (selectedGame) {
    const gameStreamers = getStreamersForGame(selectedGame.id);
    
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setSelectedGame(null)}
            className="mb-6 text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Games
          </Button>

          {/* Game Header */}
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-700">
            <img
              src={selectedGame.cover_image}
              alt={selectedGame.name}
              className="w-32 h-44 object-cover rounded-lg"
            />
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{selectedGame.name}</h1>
              <div className="flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-red-400" />
                  <span>{selectedGame.viewer_count.toLocaleString()} viewers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-green-400" />
                  <span>{selectedGame.streamer_count} live channels</span>
                </div>
                <Badge variant="outline">{selectedGame.genre}</Badge>
              </div>
            </div>
          </div>

          {/* Live Streamers */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Live Channels</h2>
            {gameStreamers.length === 0 ? (
              <div className="text-center py-16">
                <Radio className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No one is currently streaming this game</p>
                <p className="text-slate-500 text-sm mt-2">Be the first to go live!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gameStreamers.map(stream => (
                  <Link key={stream.id} to={createPageUrl('StreamDetail') + `?id=${stream.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 hover:border-purple-500 transition-all cursor-pointer"
                    >
                      <div className="relative aspect-video">
                        <img
                          src={stream.preview_image_url}
                          alt={stream.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <Badge className="bg-red-600 text-white flex items-center gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            LIVE
                          </Badge>
                          <Badge variant="secondary" className="bg-black/70 text-white">
                            {stream.viewer_count.toLocaleString()}
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="secondary" className="bg-black/70 text-white">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatUptime(stream.started_at)}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={stream.streamer.avatar_url}
                            alt={stream.streamer.username}
                            className="w-12 h-12 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold mb-1 line-clamp-2">
                              {stream.title}
                            </h3>
                            <p className="text-slate-400 text-sm">{stream.streamer.username}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {stream.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main streaming hub view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0B1120] to-black text-white">
      {/* Twitch-Style Top Navigation */}
      <div className="bg-[#18181b] border-b border-slate-800/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Radio className="w-7 h-7 text-purple-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">STREAM HUB</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <button className="px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700/50 rounded transition-colors">
                Browse
              </button>
              <button className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors">
                Following
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0e0e10] border-slate-700 text-sm h-9 rounded-md focus:border-purple-500"
              />
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700 h-9 px-6">
              <Play className="w-4 h-4 mr-2" />
              Go Live
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar - Followed Channels */}
        <div className="w-60 bg-[#18181b]/80 backdrop-blur-sm border-r border-slate-800/50 h-[calc(100vh-60px)] overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
              Followed Channels
            </h3>
            <div className="space-y-1">
              {topStreamers.slice(0, 3).map((streamer) => (
                <div key={streamer.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/30 cursor-pointer transition-colors">
                  <div className="relative">
                    <img src={streamer.avatar} alt={streamer.username} className="w-8 h-8 rounded-full" />
                    {streamer.isLive && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-600 rounded-full border-2 border-[#18181b]"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{streamer.username}</p>
                    {streamer.isLive && (
                      <p className="text-slate-400 text-xs truncate">{streamer.game}</p>
                    )}
                  </div>
                  {streamer.isLive && (
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 mt-6">
              Recommended
            </h3>
            <div className="space-y-1">
              {upcomingStreamers.slice(0, 3).map((streamer) => (
                <div key={streamer.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/30 cursor-pointer transition-colors">
                  <img src={streamer.avatar} alt={streamer.username} className="w-8 h-8 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-sm truncate">{streamer.username}</p>
                    <p className="text-slate-500 text-xs">{streamer.followers.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto h-[calc(100vh-60px)]">
          <div className="p-6 space-y-8">
            {/* Header Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Live Channels</h2>
              <p className="text-slate-400 text-sm">Channels we think you'll like</p>
            </div>

            {/* Live Streams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {streams.map(stream => (
                <Link key={stream.id} to={createPageUrl('StreamDetail') + `?id=${stream.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 mb-2">
                      <img
                        src={stream.preview_image_url}
                        alt={stream.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <Badge className="bg-red-600 text-white text-xs px-1.5 py-0.5 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          LIVE
                        </Badge>
                        <Badge className="bg-black/80 text-white text-xs px-1.5 py-0.5">
                          {stream.viewer_count.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="flex gap-2">
                      <img
                        src={stream.streamer.avatar_url}
                        alt={stream.streamer.username}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-sm font-semibold mb-0.5 line-clamp-1 group-hover:text-purple-400 transition-colors">
                          {stream.streamer.username}
                        </h3>
                        <p className="text-slate-400 text-xs mb-1 line-clamp-2">
                          {stream.title}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {stream.game_name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {stream.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="bg-slate-700/50 text-slate-300 text-[10px] px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Categories Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {featuredGames.map(game => (
                  <motion.div
                    key={game.id}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setSelectedGame(game)}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-slate-800 mb-2">
                      <img
                        src={game.cover_image}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                      {game.streamer_count > 0 && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-red-600 text-white text-xs px-1.5 py-0.5">
                            {game.streamer_count} Live
                          </Badge>
                        </div>
                      )}
                    </div>
                    <h3 className="text-white text-sm font-semibold mb-0.5 line-clamp-1 group-hover:text-purple-400 transition-colors">
                      {game.name}
                    </h3>
                    {game.viewer_count > 0 && (
                      <p className="text-slate-500 text-xs">
                        {game.viewer_count.toLocaleString()} viewers
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}