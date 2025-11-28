
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
  Gamepad2, Radio, Clock, Filter, Trophy 
} from 'lucide-react'; // Added Trophy icon
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
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Streaming Hub</h1>
                <p className="text-slate-400">Watch live streams and discover new content</p>
              </div>
            </div>

            {/* Featured Stream */}
            {featuredStream && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-2xl font-bold text-white">Featured Stream</h2>
                </div>
                <Link to={createPageUrl('StreamDetail') + `?id=${featuredStream.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="relative rounded-xl overflow-hidden border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                  >
                    <div className="relative aspect-[21/9]">
                      <img
                        src={featuredStream.preview_image_url}
                        alt={featuredStream.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Live Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-600 text-white flex items-center gap-2 px-3 py-1 text-sm">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          LIVE
                        </Badge>
                      </div>

                      {/* Viewer Count */}
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-black/70 text-white flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          {featuredStream.viewer_count.toLocaleString()} watching
                        </Badge>
                      </div>

                      {/* Stream Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-end justify-between">
                          <div className="flex-1">
                            <Badge className="bg-purple-600 text-white mb-3">
                              {featuredStream.game_name}
                            </Badge>
                            <h3 className="text-2xl font-bold text-white mb-2">
                              {featuredStream.title}
                            </h3>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <img
                                  src={featuredStream.streamer.avatar_url}
                                  alt={featuredStream.streamer.username}
                                  className="w-10 h-10 rounded-full border-2 border-white"
                                />
                                <div>
                                  <p className="text-white font-semibold">
                                    {featuredStream.streamer.username}
                                  </p>
                                  <p className="text-slate-300 text-sm">
                                    {featuredStream.streamer.followers.toLocaleString()} followers
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                            <Play className="w-5 h-5 mr-2" />
                            Watch Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </div>
            )}

            {/* Featured Games */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h2 className="text-2xl font-bold text-white">Featured Games</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuredGames.map(game => (
                  <motion.div
                    key={game.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedGame(game)}
                    className="relative rounded-lg overflow-hidden border border-slate-700 hover:border-purple-500 transition-all cursor-pointer group"
                  >
                    <div className="relative aspect-[3/4]">
                      <img
                        src={game.cover_image}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      
                      {/* Stats */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        <Badge className="bg-red-600 text-white flex items-center gap-1">
                          <Radio className="w-3 h-3" />
                          {game.streamer_count}
                        </Badge>
                        <Badge variant="secondary" className="bg-black/70 text-white flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {game.viewer_count.toLocaleString()}
                        </Badge>
                      </div>

                      {/* Game Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold mb-1">{game.name}</h3>
                        <Badge variant="outline" className="text-xs">{game.genre}</Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* All Games */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">Browse Games</h2>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {filteredGames.map(game => (
                  <motion.div
                    key={game.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedGame(game)}
                    className="relative rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 transition-all cursor-pointer group"
                  >
                    <div className="relative aspect-[3/4]">
                      <img
                        src={game.cover_image}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                      
                      {game.streamer_count > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-red-600 text-white text-xs flex items-center gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            {game.streamer_count}
                          </Badge>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                          {game.name}
                        </h3>
                        {game.viewer_count > 0 && (
                          <p className="text-slate-300 text-xs">
                            {game.viewer_count.toLocaleString()} viewers
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredGames.length === 0 && (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No games found</p>
                  <p className="text-slate-500 text-sm mt-2">Try a different search term</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 flex-shrink-0 space-y-6">
            {/* Go Live Button */}
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Play className="w-4 h-4 mr-2" />
              Go Live
            </Button>

            {/* Top Streamers */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Top Streamers
              </h3>
              <div className="space-y-3">
                {topStreamers.map((streamer, index) => (
                  <div key={streamer.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <div className="text-slate-400 font-bold text-sm w-6">#{index + 1}</div>
                    <div className="relative">
                      <img src={streamer.avatar} alt={streamer.username} className="w-10 h-10 rounded-full" />
                      {streamer.isLive && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-slate-800"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{streamer.username}</p>
                      <p className="text-slate-400 text-xs">{streamer.followers.toLocaleString()} followers</p>
                    </div>
                    {streamer.isLive && (
                      <Badge className="bg-red-600 text-white text-xs">
                        {streamer.viewers.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Streamer Spotlight */}
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl border border-purple-500/50 p-4">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-400" />
                Streamer Spotlight
              </h3>
              <div className="text-center">
                <div className="relative inline-block mb-3">
                  <img 
                    src={spotlightStreamer.avatar} 
                    alt={spotlightStreamer.username} 
                    className="w-20 h-20 rounded-full border-4 border-purple-500"
                  />
                  {spotlightStreamer.isLive && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-2 border-slate-800 flex items-center justify-center">
                      <Radio className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <h4 className="text-white font-bold text-lg mb-1">{spotlightStreamer.username}</h4>
                <p className="text-purple-300 text-sm mb-2">{spotlightStreamer.followers.toLocaleString()} followers</p>
                <p className="text-slate-300 text-sm mb-4">{spotlightStreamer.bio}</p>
                {spotlightStreamer.isLive && (
                  <div className="mb-4">
                    <Badge className="bg-red-600 text-white">
                      LIVE • {spotlightStreamer.viewers} viewers
                    </Badge>
                    <p className="text-slate-400 text-xs mt-1">Playing: {spotlightStreamer.game}</p>
                  </div>
                )}
                <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                  {/* Assuming a UserProfile page exists */}
                  <Link to={createPageUrl('UserProfile') + `?username=${spotlightStreamer.username}`}>
                    View Channel
                  </Link>
                </Button>
              </div>
            </div>

            {/* New Upcoming Streamers */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                New & Upcoming
              </h3>
              <div className="space-y-3">
                {upcomingStreamers.map((streamer) => (
                  <div key={streamer.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <div className="relative">
                      <img src={streamer.avatar} alt={streamer.username} className="w-10 h-10 rounded-full" />
                      {streamer.isLive && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-slate-800"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{streamer.username}</p>
                      <p className="text-slate-400 text-xs">{streamer.followers.toLocaleString()} followers</p>
                    </div>
                    {streamer.isLive ? (
                      <Badge className="bg-red-600 text-white text-xs">
                        LIVE
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Offline
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
