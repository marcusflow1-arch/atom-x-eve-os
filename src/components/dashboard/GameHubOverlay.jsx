import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Play, Trophy, Star, Clock, Filter, ChevronDown, Sparkles, Zap, Award, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../CartContext';
import HeroGameBox from '../library/HeroGameBox';
import RecentlyAchievedOverlay from '../library/RecentlyAchievedOverlay';
import OwnedGameOverlay from '../library/OwnedGameOverlay';
import GameAchievementsOverlay from '../library/GameAchievementsOverlay';
import { allMockGames } from '../store/mockData';

const GameHubOverlay = ({ isVisible, onClose }) => {
    const { user } = useAuth();
    const { isPurchased } = useCart();
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('recently_played');
    const [filterGenre, setFilterGenre] = useState('all');
    const [selectedGame, setSelectedGame] = useState(null);
    const [showRecentlyAchieved, setShowRecentlyAchieved] = useState(false);
    const [showOwnedGame, setShowOwnedGame] = useState(false);
    const [showGameAchievements, setShowGameAchievements] = useState(false);
    const [selectedAchievementGame, setSelectedAchievementGame] = useState(null);

    // Get user's purchased games
    const userPurchasedGames = Object.values(allMockGames).filter(game => 
        isPurchased(game.id)
    );

    // Add test_game_alpha to library for demonstration
    const libraryGames = [
        ...userPurchasedGames,
        allMockGames['test_game_alpha']
    ].filter(Boolean);

    // Filter and sort games
    const filteredGames = libraryGames.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGenre = filterGenre === 'all' || game.genre === filterGenre;
        const matchesTab = activeTab === 'all' || 
            (activeTab === 'recently_played' && game.id === 'test_game_alpha') ||
            (activeTab === 'favorites' && game.featured);
        return matchesSearch && matchesGenre && matchesTab;
    });

    // Get unique genres
    const genres = ['all', ...new Set(libraryGames.map(g => g.genre))];

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showRecentlyAchieved) {
                    setShowRecentlyAchieved(false);
                } else if (showOwnedGame) {
                    setShowOwnedGame(false);
                    setSelectedGame(null);
                } else if (showGameAchievements) {
                    setShowGameAchievements(false);
                    setSelectedAchievementGame(null);
                } else {
                    onClose();
                }
            }
        };
        if (isVisible) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, showRecentlyAchieved, showOwnedGame, showGameAchievements, onClose]);

    const handleGameClick = (game) => {
        setSelectedGame(game);
        setShowOwnedGame(true);
    };

    const handleAchievementsClick = (game) => {
        setSelectedAchievementGame(game);
        setShowGameAchievements(true);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed top-0 right-0 h-full w-[95vw] z-50 bg-slate-900/95 backdrop-blur-lg border-l border-slate-700/50 flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="flex-shrink-0 p-6 border-b border-slate-700/50 bg-slate-800/50">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-1">My Library</h2>
                            <p className="text-slate-400">{libraryGames.length} games in your collection</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Search your library..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-slate-800/70 border-slate-700"
                            />
                        </div>
                        <Select value={filterGenre} onValueChange={setFilterGenre}>
                            <SelectTrigger className="w-[180px] bg-slate-800/70 border-slate-700">
                                <SelectValue placeholder="Genre" />
                            </SelectTrigger>
                            <SelectContent>
                                {genres.map(genre => (
                                    <SelectItem key={genre} value={genre}>
                                        {genre === 'all' ? 'All Genres' : genre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px] bg-slate-800/70 border-slate-700">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recently_played">Recently Played</SelectItem>
                                <SelectItem value="alphabetical">A-Z</SelectItem>
                                <SelectItem value="playtime">Playtime</SelectItem>
                                <SelectItem value="recent_achievement">Recent Achievement</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-6 pt-4">
                            <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-slate-800/50">
                                <TabsTrigger value="all">All Games</TabsTrigger>
                                <TabsTrigger value="recently_played">Recently Played</TabsTrigger>
                                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6">
                            <TabsContent value="all" className="mt-0">
                                {/* Recently Achieved Section */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Sparkles className="w-6 h-6 text-yellow-400" />
                                            Recently Achieved
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowRecentlyAchieved(true)}
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            View All
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {[...Array(6)].map((_, i) => (
                                            <Card key={i} className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-all cursor-pointer">
                                                <CardContent className="p-4 text-center">
                                                    <div className="text-4xl mb-2">🏆</div>
                                                    <p className="text-xs font-semibold text-white mb-1">Achievement {i + 1}</p>
                                                    <Badge className="text-xs bg-yellow-500/20 text-yellow-400">Legendary</Badge>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Continue Playing Section */}
                                {filteredGames.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                            <Clock className="w-6 h-6 text-blue-400" />
                                            Continue Playing
                                        </h3>
                                        <div className="grid gap-6">
                                            {filteredGames.slice(0, 1).map(game => (
                                                <HeroGameBox
                                                    key={game.id}
                                                    game={game}
                                                    onPlay={() => console.log('Playing:', game.title)}
                                                    onViewDetails={() => handleGameClick(game)}
                                                    onViewAchievements={() => handleAchievementsClick(game)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* All Games Grid */}
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Star className="w-6 h-6 text-purple-400" />
                                        All Games
                                    </h3>
                                    {filteredGames.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {filteredGames.map(game => (
                                                <motion.div
                                                    key={game.id}
                                                    whileHover={{ scale: 1.05, y: -5 }}
                                                    className="cursor-pointer"
                                                    onClick={() => handleGameClick(game)}
                                                >
                                                    <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all overflow-hidden">
                                                        <div className="relative aspect-[3/4]">
                                                            <img
                                                                src={game.cover_image || game.cover}
                                                                alt={game.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                                                                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                                                                    <Play className="w-4 h-4 mr-2" />
                                                                    Play
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <CardContent className="p-3">
                                                            <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                                                                {game.title}
                                                            </h4>
                                                            <div className="flex items-center justify-between text-xs text-slate-400">
                                                                <span>{game.genre}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <Trophy className="w-3 h-3" />
                                                                    <span>8/15</span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-slate-400 mb-4">No games found matching your filters</p>
                                            <Button onClick={() => { setSearchTerm(''); setFilterGenre('all'); }}>
                                                Clear Filters
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="recently_played" className="mt-0">
                                {filteredGames.length > 0 ? (
                                    <div className="space-y-6">
                                        {filteredGames.slice(0, 3).map(game => (
                                            <HeroGameBox
                                                key={game.id}
                                                game={game}
                                                onPlay={() => console.log('Playing:', game.title)}
                                                onViewDetails={() => handleGameClick(game)}
                                                onViewAchievements={() => handleAchievementsClick(game)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-400">No recently played games</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="favorites" className="mt-0">
                                <div className="text-center py-12">
                                    <Star className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400 mb-4">No favorite games yet</p>
                                    <p className="text-sm text-slate-500">Mark games as favorites to see them here</p>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Overlays */}
                <RecentlyAchievedOverlay
                    isVisible={showRecentlyAchieved}
                    onClose={() => setShowRecentlyAchieved(false)}
                />

                {showOwnedGame && selectedGame && (
                    <OwnedGameOverlay
                        game={selectedGame}
                        onClose={() => {
                            setShowOwnedGame(false);
                            setSelectedGame(null);
                        }}
                    />
                )}

                {showGameAchievements && selectedAchievementGame && (
                    <GameAchievementsOverlay
                        gameTitle={selectedAchievementGame.title}
                        onClose={() => {
                            setShowGameAchievements(false);
                            setSelectedAchievementGame(null);
                        }}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default GameHubOverlay;