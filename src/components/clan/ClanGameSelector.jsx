import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Gamepad2, Users, Target, Clock, Zap, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function ClanGameSelector({ clanId, userId, onSelectGame }) {
    const { user } = useAuth();
    const [filters, setFilters] = useState([]); // Array of active filters
    const [search, setSearch] = useState('');

  // Default global chat pseudo-game
  const defaultChatGame = {
      id: 'global_chat',
      title: 'Adam X Eve',
      genre: 'Social',
      cover_image: 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=1200',
      isGlobalChat: true
  };

    const { data: games, isLoading } = useQuery({
        queryKey: ['clanGamesSelector', clanId, user?.id],
        queryFn: async () => {
            // 1. Fetch User Data for Owned Games
            const ownedIds = user?.purchased_items || [];

            // 2. Fetch Assignments for this user (or all)
            // We fetch assignments to know which games are "Assigned"
            const assignments = await base44.entities.ClanAssignment.filter({ 
                clanId: clanId,
                type: 'game'
            });
            
            // Filter assignments relevant to this user
            const myAssignments = assignments.filter(a => 
                a.assigneeId === 'all' || a.assigneeId === user?.id
            );
            const assignedGameIds = myAssignments.map(a => a.targetId);

            // 3. Fetch All Games (Optimization: In a real large app, we would fetch only by IDs)
            // For now, we fetch a reasonable list or all to filter on client
            const allGames = await base44.entities.Game.list();

            // 4. Merge and Filter
            const relevantGames = allGames.filter(g => 
                ownedIds.includes(g.id) || assignedGameIds.includes(g.id)
            ).map(g => {
                const assignment = myAssignments.find(a => a.targetId === g.id);
                // Mock statuses for demonstration
                const activePlayers = Math.floor(Math.random() * 25);
                const isFarming = Math.random() > 0.8; 
                const isRecruiting = Math.random() > 0.7;

                return {
                    ...g,
                    isAssigned: !!assignment,
                    assignmentPriority: assignment?.priority,
                    isOwned: ownedIds.includes(g.id),
                    activePlayers,
                    isFarming,
                    isRecruiting
                };
            });

            // Sort: Assigned first, then owned
            return relevantGames.sort((a, b) => {
                if (a.isAssigned && !b.isAssigned) return -1;
                if (!a.isAssigned && b.isAssigned) return 1;
                return 0;
            });
        },
        enabled: !!user && !!clanId
    });

    const filteredGames = useMemo(() => {
        if (!games) return [];
        return games.filter(game => {
            const matchesSearch = game.title.toLowerCase().includes(search.toLowerCase());
            
            // Check all active filters
            const matchesFilters = filters.length === 0 || filters.every(f => {
                if (f === 'assigned') return game.isAssigned;
                if (f === 'active') return game.activePlayers > 0;
                if (f === 'farming') return game.isFarming;
                if (f === 'recruiting') return game.isRecruiting;
                return true;
            });
            
            return matchesSearch && matchesFilters;
        });
    }, [games, search, filters]);

    const availableFilters = [
        { id: 'assigned', label: 'Assigned to me', icon: Target },
        { id: 'active', label: 'Active now', icon: Zap },
        { id: 'farming', label: 'Farming', icon: Clock },
        { id: 'recruiting', label: 'Recruiting', icon: Users },
    ];

    const toggleFilter = (id) => {
        setFilters(prev => 
            prev.includes(id) 
                ? prev.filter(f => f !== id)
                : [...prev, id]
        );
    };

    if (isLoading) return <div className="text-white/40 text-center p-8">Loading Game Library...</div>;

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                    {availableFilters.map(f => {
                        const isActive = filters.includes(f.id);
                        return (
                            <button
                                key={f.id}
                                onClick={() => toggleFilter(f.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                                        : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                {f.icon && <f.icon className="w-3.5 h-3.5" />}
                                {f.label}
                            </button>
                        );
                    })}
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
                    {/* Default Global Chat Card */}
                    <motion.div
                        key={defaultChatGame.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onSelectGame(defaultChatGame)}
                        className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer bg-slate-900 border border-white/10 hover:border-cyan-400/50 transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
                    >
                        <div className="absolute inset-0">
                            <img 
                                src={defaultChatGame.cover_image} 
                                alt={defaultChatGame.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md leading-tight">{defaultChatGame.title}</h3>
                            <p className="text-white/60 text-xs mb-3 flex items-center gap-1">
                                <Badge variant="outline" className="border-white/20 text-white/50 text-[10px] h-5 px-1.5">
                                    {defaultChatGame.genre}
                                </Badge>
                            </p>
                            <div className="text-[11px] text-white/50">Open community chat</div>
                        </div>
                        <div className="absolute inset-0 border-2 border-cyan-400/0 group-hover:border-cyan-400/50 rounded-2xl transition-all duration-300 pointer-events-none" />
                    </motion.div>

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
                            {game.isFarming && (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 backdrop-blur-md">
                                    <Clock className="w-3 h-3 mr-1" /> FARMING
                                </Badge>
                            )}
                            {game.isRecruiting && (
                                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 backdrop-blur-md">
                                    <Users className="w-3 h-3 mr-1" /> RECRUITING
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