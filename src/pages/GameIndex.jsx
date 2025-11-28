import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    Search, Filter, Trophy, FileText, Star, Gamepad2, 
    SortAsc, SortDesc, Loader2, LayoutGrid, List 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

export default function GameIndex() {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('name'); // name, memories, contracts, rating
    const [viewMode, setViewMode] = useState('grid');

    const { data: games, isLoading } = useQuery({
        queryKey: ['gameIndex'],
        queryFn: async () => {
            const res = await base44.functions.invoke('getGameIndex');
            return res.data.data;
        }
    });

    const filteredGames = useMemo(() => {
        if (!games) return [];
        
        let result = [...games];

        // Filter
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(g => g.title.toLowerCase().includes(q));
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'memories':
                    return b.stats.memoriesCount - a.stats.memoriesCount;
                case 'contracts':
                    return b.stats.contractsCount - a.stats.contractsCount;
                case 'rating':
                    return b.stats.averageRating - a.stats.averageRating;
                default:
                    return 0;
            }
        });

        return result;
    }, [games, search, sortBy]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Loading Game Index...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Gamepad2 className="w-8 h-8 text-blue-500" />
                        Game Index
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Browse games, view stats, and explore community content.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                    <Button 
                        variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant={viewMode === 'list' ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search games..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-slate-900/50 border-slate-600"
                    />
                </div>
                <div className="w-full md:w-48">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="bg-slate-900/50 border-slate-600">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Name (A-Z)</SelectItem>
                            <SelectItem value="memories">Most Memories</SelectItem>
                            <SelectItem value="contracts">Most Contracts</SelectItem>
                            <SelectItem value="rating">Highest Rating</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGames.map((game) => (
                        <Link 
                            key={game.id} 
                            to={`${createPageUrl('GameProfile')}?game=${encodeURIComponent(game.title)}`}
                        >
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden hover:border-blue-500/50 transition-colors h-full flex flex-col"
                            >
                                <div className="aspect-video relative bg-slate-900">
                                    {game.cover_image ? (
                                        <img 
                                            src={game.cover_image} 
                                            alt={game.title} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-600">
                                            <Gamepad2 className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <Badge className="bg-black/60 backdrop-blur-sm border-slate-700">
                                            {game.genre || 'Game'}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-white mb-3">{game.title}</h3>
                                    
                                    <div className="grid grid-cols-3 gap-2 mt-auto">
                                        <div className="bg-slate-900/50 rounded p-2 text-center">
                                            <Trophy className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                                            <span className="text-xs text-slate-300">{game.stats.memoriesCount}</span>
                                        </div>
                                        <div className="bg-slate-900/50 rounded p-2 text-center">
                                            <FileText className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                            <span className="text-xs text-slate-300">{game.stats.contractsCount}</span>
                                        </div>
                                        <div className="bg-slate-900/50 rounded p-2 text-center">
                                            <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                                            <span className="text-xs text-slate-300">{game.stats.averageRating}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="space-y-3">
                    {filteredGames.map((game) => (
                        <Link 
                            key={game.id} 
                            to={`${createPageUrl('GameProfile')}?game=${encodeURIComponent(game.title)}`}
                        >
                            <motion.div 
                                whileHover={{ x: 5 }}
                                className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 flex items-center gap-4 hover:border-blue-500/50 transition-colors"
                            >
                                <div className="w-16 h-16 rounded-lg bg-slate-900 flex-shrink-0 overflow-hidden">
                                    {game.cover_image ? (
                                        <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Gamepad2 className="w-6 h-6 text-slate-600" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white">{game.title}</h3>
                                    <p className="text-sm text-slate-400">{game.genre}</p>
                                </div>

                                <div className="flex items-center gap-6 mr-4">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Memories</p>
                                        <p className="text-purple-400 font-mono font-bold">{game.stats.memoriesCount}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Contracts</p>
                                        <p className="text-blue-400 font-mono font-bold">{game.stats.contractsCount}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Rating</p>
                                        <div className="flex items-center gap-1 text-yellow-400 font-mono font-bold">
                                            <Star className="w-3 h-3 fill-current" />
                                            {game.stats.averageRating}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}

            {filteredGames.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No games found</h3>
                    <p className="text-slate-400">Try adjusting your search filters.</p>
                </div>
            )}
        </div>
    );
}