import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, Play, Search, Clock, Star, Filter, MoreHorizontal, 
  Download, MessageSquare, Users, Trophy, Info, MonitorPlay, 
  Share2, Settings, ListFilter, Activity
} from 'lucide-react';
import { aiGamesList, otherSampleGames } from '../store/mockData';
import StreamAffiliateTab from '../gamedetail/StreamAffiliateTab';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function PinGamesContent() {
  const [selectedGameId, setSelectedGameId] = useState(aiGamesList[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'alpha'
  const [groupByGenre, setGroupByGenre] = useState(false);
  const [favorites, setFavorites] = useState(new Set([aiGamesList[0]?.id])); // Mock favorites
  const [filterType, setFilterType] = useState('all'); // 'all', 'favorites', 'recent'

  // Combine mock data
  const allGames = useMemo(() => [...aiGamesList, ...otherSampleGames], []);

  // Filter and Sort Logic
  const processedGames = useMemo(() => {
    let games = allGames.filter(g => 
      g.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterType === 'favorites') {
      games = games.filter(g => favorites.has(g.id));
    } else if (filterType === 'recent') {
      // Mock "recent" by taking first 5
      games = games.slice(0, 5);
    }

    if (sortBy === 'alpha') {
      games.sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'recent' sort is default order for now

    return games;
  }, [allGames, searchQuery, sortBy, filterType, favorites]);

  // Grouping Logic
  const groupedGames = useMemo(() => {
    if (!groupByGenre) return { 'All Games': processedGames };
    
    return processedGames.reduce((acc, game) => {
      const genre = game.genre || 'Uncategorized';
      if (!acc[genre]) acc[genre] = [];
      acc[genre].push(game);
      return acc;
    }, {});
  }, [processedGames, groupByGenre]);

  const selectedGame = allGames.find(g => g.id === selectedGameId);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-slate-950 rounded-lg overflow-hidden h-full flex flex-col md:flex-row shadow-2xl border border-white/10">
      
      {/* LEFT SIDEBAR: Game Library List */}
      <div className="w-full md:w-80 flex-shrink-0 bg-slate-900 flex flex-col border-r border-white/5">
        
        {/* Sidebar Header & Filters */}
        <div className="p-4 flex flex-col gap-3 bg-slate-900 z-10 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
             <div className="p-2 bg-blue-600 rounded-lg">
                <Gamepad2 className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-white tracking-wide">MY LIBRARY</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..." 
              className="bg-slate-800 border-none pl-9 h-9 text-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterType === 'all' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                All
            </button>
            <button 
                onClick={() => setFilterType('favorites')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterType === 'favorites' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-500 hover:text-white'}`}
            >
                Favorites
            </button>
            <button 
                onClick={() => setFilterType('recent')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterType === 'recent' ? 'bg-green-500/20 text-green-400' : 'text-slate-500 hover:text-white'}`}
            >
                Recent
            </button>
            
            <div className="h-4 w-px bg-white/10 mx-1" />

            <button 
                onClick={() => setGroupByGenre(!groupByGenre)}
                title="Group by Genre"
                className={`p-1 rounded hover:bg-white/10 ${groupByGenre ? 'text-blue-400' : 'text-slate-500'}`}
            >
                <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
            {/* Favorites Section (Always Top if not filtered out) */}
            {(filterType === 'all' || filterType === 'favorites') && favorites.size > 0 && !groupByGenre && (
                <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Star className="w-3 h-3 fill-slate-500" /> Favorites
                    </div>
                    {processedGames.filter(g => favorites.has(g.id)).map(game => (
                        <GameListItem 
                            key={`fav-${game.id}`} 
                            game={game} 
                            isActive={selectedGameId === game.id} 
                            onClick={() => setSelectedGameId(game.id)}
                            isFavorite={true}
                            onToggleFavorite={toggleFavorite}
                        />
                    ))}
                </div>
            )}

            {/* Main List */}
            {Object.entries(groupedGames).map(([group, games]) => {
                // If showing favorites separately, filter them out of "All Games" to avoid dupes in 'all' view
                // Actually steam duplicates them, but let's keep it simple
                const list = (!groupByGenre && filterType === 'all') 
                    ? games.filter(g => !favorites.has(g.id))
                    : games;
                
                if (list.length === 0) return null;

                return (
                    <div key={group} className="mb-4">
                         <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-900/95 backdrop-blur-sm z-0">
                            {group} ({list.length})
                        </div>
                        {list.map(game => (
                            <GameListItem 
                                key={game.id} 
                                game={game} 
                                isActive={selectedGameId === game.id} 
                                onClick={() => setSelectedGameId(game.id)}
                                isFavorite={favorites.has(game.id)}
                                onToggleFavorite={toggleFavorite}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
      </div>

      {/* RIGHT CONTENT: Game Details */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar relative">
        {selectedGame ? (
            <>
                {/* Hero Banner */}
                <div className="relative h-80 w-full flex-shrink-0">
                    <div className="absolute inset-0">
                        <img 
                            src={selectedGame.cover_image || selectedGame.image} 
                            alt={selectedGame.title} 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
                    </div>

                    <div className="absolute bottom-0 left-0 p-8 w-full">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border-white/10 uppercase tracking-wider text-[10px]">
                                    {selectedGame.genre}
                                </Badge>
                                {selectedGame.rating && (
                                    <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                                        <Star className="w-3 h-3 fill-current" />
                                        {selectedGame.rating}
                                    </div>
                                )}
                            </div>
                            
                            <h1 className="text-5xl font-black text-white drop-shadow-2xl max-w-2xl leading-tight">
                                {selectedGame.title}
                            </h1>

                            <div className="flex items-center gap-6 mt-4 p-4 bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/10 w-fit">
                                <Button size="lg" className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 shadow-lg shadow-green-900/20">
                                    <Play className="w-5 h-5 mr-2 fill-current" /> PLAY
                                </Button>
                                
                                <div className="flex gap-8 px-4 border-l border-white/10">
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Last Played</div>
                                        <div className="text-white font-mono text-sm">Today</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Play Time</div>
                                        <div className="text-white font-mono text-sm">42.5 hrs</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Achievements</div>
                                        <div className="text-white font-mono text-sm flex items-center gap-1">
                                            <Trophy className="w-3 h-3 text-yellow-500" /> 12/50
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="flex-1 p-8">
                    <Tabs defaultValue="overview" className="h-full flex flex-col">
                        <TabsList className="bg-transparent border-b border-white/10 w-full justify-start rounded-none p-0 h-auto mb-6 gap-6">
                            {['Overview', 'Discussions', 'Streamers', 'Guides', 'Support'].map(tab => (
                                <TabsTrigger 
                                    key={tab}
                                    value={tab.toLowerCase()}
                                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400 text-slate-400 rounded-none px-2 py-3 font-bold uppercase text-sm tracking-wide transition-all"
                                >
                                    {tab}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="flex-1">
                            <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Main Column */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Description */}
                                        <section>
                                            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                                                <Info className="w-5 h-5 text-blue-500" /> About This Game
                                            </h3>
                                            <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                                                {selectedGame.description || "Experience an epic journey in this critically acclaimed title. Explore vast worlds, fight challenging enemies, and uncover the secrets of the universe."}
                                            </p>
                                        </section>
                                        
                                        {/* Activity Feed (Mock) */}
                                        <section>
                                            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-green-500" /> Recent Activity
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                        <Trophy className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium text-sm">Achievement Unlocked: "First Steps"</div>
                                                        <div className="text-slate-500 text-xs mt-1">Unlocked 2 hours ago</div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                        <MessageSquare className="w-5 h-5 text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium text-sm">Dev Log #42: Upcoming Update Teaser</div>
                                                        <div className="text-slate-500 text-xs mt-1">Posted yesterday by Developer</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Side Column */}
                                    <div className="space-y-6">
                                        <div className="bg-slate-900 rounded-xl p-5 border border-white/5">
                                            <h4 className="text-white font-bold text-sm uppercase mb-4">Game Info</h4>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Developer</span>
                                                    <span className="text-blue-400">{selectedGame.developer || "Unknown Studio"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Release Date</span>
                                                    <span className="text-slate-300">{selectedGame.releaseDate || "2024"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Genre</span>
                                                    <span className="text-slate-300">{selectedGame.genre}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-xl p-5 border border-white/5">
                                            <h4 className="text-white font-bold text-sm uppercase mb-4">Friends Who Play</h4>
                                            <div className="flex -space-x-2">
                                                {[1,2,3,4].map(i => (
                                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs text-white">
                                                        U{i}
                                                    </div>
                                                ))}
                                                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs text-slate-400">
                                                    +5
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10">
                                                <Share2 className="w-4 h-4 mr-2" /> Share
                                            </Button>
                                            <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 px-3">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="streamers" className="mt-0 h-full">
                                <StreamAffiliateTab gameId={selectedGame.id} onStreamToggle={() => {}} />
                            </TabsContent>

                            <TabsContent value="discussions" className="mt-0">
                                <div className="bg-slate-900/50 rounded-xl border border-white/10 p-8 text-center">
                                    <MessageSquare className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Community Discussions</h3>
                                    <p className="text-slate-400 mb-6">Join the conversation with other players.</p>
                                    <Button>View Forum</Button>
                                </div>
                            </TabsContent>
                            
                             <TabsContent value="guides" className="mt-0">
                                <div className="bg-slate-900/50 rounded-xl border border-white/10 p-8 text-center">
                                    <Info className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Community Guides</h3>
                                    <p className="text-slate-400 mb-6">Learn strategies and tips from top players.</p>
                                    <Button>Browse Guides</Button>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <Gamepad2 className="w-24 h-24 mb-6 opacity-20" />
                <h2 className="text-2xl font-bold text-slate-400">Select a game to view details</h2>
            </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for Game List Item
function GameListItem({ game, isActive, onClick, isFavorite, onToggleFavorite }) {
    return (
        <div 
            onClick={onClick}
            className={`
                group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all mb-1
                ${isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-md' 
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }
            `}
        >
            <div className={`w-8 h-10 flex-shrink-0 bg-slate-800 rounded overflow-hidden relative ${isActive ? 'ring-1 ring-white/30' : ''}`}>
                {game.cover_image ? (
                    <img src={game.cover_image} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 opacity-50" />
                    </div>
                )}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}>
                    {game.title}
                </div>
                {game.downloading && (
                    <div className="text-[10px] text-blue-400 flex items-center gap-1">
                        <Download className="w-3 h-3" /> Downloading...
                    </div>
                )}
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => onToggleFavorite(game.id, e)}
                    className={`p-1 rounded hover:bg-black/20 ${isFavorite ? 'opacity-100 text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}
                >
                    <Star className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
            </div>
        </div>
    );
}