import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, Filter, Grid, Users, Mic2, Gamepad2, ChevronRight, Hash, Shield, Trophy, Target, Sparkles, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';

import { MOCK_FARM_GAMES } from './farmData';

export default function FarmHub({ onSelectGame }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all'); // all, owned, trending
    
    const filteredGames = MOCK_FARM_GAMES.filter(g => {
        const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'all' || 
                              (activeFilter === 'owned' && g.tags.includes('Owned')) ||
                              (activeFilter === 'trending' && g.activeUsers > 10000);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex flex-col gap-8 h-full">
            {/* Hero Search Section */}
            <div className="flex flex-col items-center justify-center pt-12 pb-6 gap-6 text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                >
                    <h1 className="text-4xl font-bold text-white tracking-tight">Global Farm Hub</h1>
                    <p className="text-white/40 text-lg">Find your community. Join the harvest.</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="w-full max-w-2xl relative"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Input 
                            className="w-full h-14 pl-12 pr-12 rounded-full bg-white/5 border-white/10 text-lg text-white placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/10 transition-all shadow-xl"
                            placeholder="Search for a game..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                        <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors group/mic">
                            <Mic className="text-white/40 group-hover/mic:text-white w-5 h-5" />
                        </button>
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2"
                >
                    {['all', 'owned', 'trending'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                activeFilter === filter 
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                                    : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10'
                            }`}
                        >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                    <button 
                        onClick={() => setFilterOpen(!filterOpen)}
                        className="p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                </motion.div>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 px-4">
                {filteredGames.length > 0 ? (
                    filteredGames.map((game, i) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <LiquidGlassCard 
                                className="h-full flex flex-col group cursor-pointer hover:border-blue-500/30 transition-all overflow-hidden"
                                onClick={() => onSelectGame(game)}
                            >
                                {/* Card Image */}
                                <div className="h-40 w-full relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] to-transparent z-10" />
                                    <img 
                                        src={game.image} 
                                        alt={game.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {game.tags.includes('Owned') && (
                                        <div className="absolute top-2 right-2 z-20">
                                            <Badge className="bg-blue-500/80 hover:bg-blue-500 backdrop-blur-sm border-0">OWNED</Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Card Content */}
                                <div className="p-5 flex flex-col gap-4 flex-1">
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{game.title}</h3>
                                        <p className="text-white/40 text-sm">{game.genre}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-white/60 text-xs font-medium">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            {game.activeUsers.toLocaleString()} online
                                        </div>
                                        <div className="flex items-center gap-2 text-white/40 text-xs">
                                            <Mic2 className="w-3 h-3" />
                                            {game.voiceRooms} rooms
                                        </div>
                                    </div>
                                </div>
                            </LiquidGlassCard>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/30">
                        <Gamepad2 className="w-12 h-12 mb-4 opacity-50" />
                        <p>No games found matching your search.</p>
                        <Button 
                            variant="link" 
                            className="text-blue-400"
                            onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                        >
                            Clear filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}