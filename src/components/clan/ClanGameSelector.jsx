import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Gamepad2, Users, Target, Clock, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function ClanGameSelector({ clanId, userId, onSelectGame }) {
    const [filter, setFilter] = useState('all'); // all, assigned, active, recruiting
    const [search, setSearch] = useState('');

    // Fetch Games associated with Clan (Mock logic for now as we don't have a direct link in schema yet, 
    // but we can list all games and pretend they are clan games or use a specific list if available)
    // In a real app, we'd fetch clan.supported_games or similar. 
    // For now, we'll list all games and add some mock status.
    const { data: games, isLoading } = useQuery({
        queryKey: ['clanGames', clanId],
        queryFn: async () => {
            const response = await base44.entities.Game.list();
            // Mocking clan-specific data for these games
            return response.map(g => ({
                ...g,
                activePlayers: Math.floor(Math.random() * 20),
                isAssigned: Math.random() > 0.8,
                status: ['active', 'farming', 'recruiting'][Math.floor(Math.random() * 3)],
                clanPriority: Math.floor(Math.random() * 5) + 1
            })).sort((a, b) => b.clanPriority - a.clanPriority);
        }
    });

    const filteredGames = useMemo(() => {
        if (!games) return [];
        return games.filter(game => {
            const matchesSearch = game.title.toLowerCase().includes(search.toLowerCase());
            const matchesFilter = 
                filter === 'all' ? true :
                filter === 'assigned' ? game.isAssigned :
                filter === 'active' ? game.activePlayers > 5 :
                filter === 'recruiting' ? game.status === 'recruiting' : true;
            
            return matchesSearch && matchesFilter;
        });
    }, [games, search, filter]);

    const filters = [
        { id: 'all', label: 'All Games' },
        { id: 'assigned', label: 'Assigned', icon: Target },
        { id: 'active', label: 'Active Now', icon: Zap },
        { id: 'recruiting', label: 'Recruiting', icon: Users },
    ];

    if (isLoading) return <div className="text-white/40 text-center p-8">Loading Game Library...</div>;

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filter === f.id 
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            {f.icon && <f.icon className="w-3.5 h-3.5" />}
                            {f.label}
                        </button>
                    ))}
                </div>
                
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter games..." 
                        className="bg-white/5 border-white/10 pl-9 text-white placeholder:text-white/30 rounded-xl"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredGames.map((game, idx) => (
                        <motion.div
                            key={game.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            onClick={() => onSelectGame(game)}
                            className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer bg-slate-900 border border-white/10 hover:border-cyan-400/50 transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0">
                                <img 
                                    src={game.cover_image || game.cover} 
                                    alt={game.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                            </div>

                            {/* Status Badges */}
                            <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                                {game.isAssigned && (
                                    <Badge className="bg-amber-500/90 text-black border-none font-bold shadow-lg animate-pulse">
                                        <Target className="w-3 h-3 mr-1" /> ASSIGNED
                                    </Badge>
                                )}
                                {game.status === 'recruiting' && (
                                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 backdrop-blur-md">
                                        RECUITING
                                    </Badge>
                                )}
                            </div>

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md leading-tight">{game.title}</h3>
                                <p className="text-white/60 text-xs mb-3 flex items-center gap-1">
                                    <Badge variant="outline" className="border-white/20 text-white/50 text-[10px] h-5 px-1.5">
                                        {game.genre}
                                    </Badge>
                                </p>

                                {/* Hover Stats */}
                                <div className="grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                    <div className="bg-black/40 backdrop-blur-md rounded-lg p-2 border border-white/10">
                                        <p className="text-[10px] text-white/40 uppercase">Active</p>
                                        <div className="flex items-center gap-1 text-cyan-300 font-bold text-sm">
                                            <Users className="w-3 h-3" /> {game.activePlayers}
                                        </div>
                                    </div>
                                    <div className="bg-black/40 backdrop-blur-md rounded-lg p-2 border border-white/10">
                                        <p className="text-[10px] text-white/40 uppercase">Events</p>
                                        <div className="flex items-center gap-1 text-purple-300 font-bold text-sm">
                                            <Clock className="w-3 h-3" /> 2
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Selection Highlight */}
                            <div className="absolute inset-0 border-2 border-cyan-400/0 group-hover:border-cyan-400/50 rounded-2xl transition-all duration-300 pointer-events-none" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}