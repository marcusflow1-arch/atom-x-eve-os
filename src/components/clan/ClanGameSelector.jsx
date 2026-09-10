import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Gamepad2, Users, Target, Clock, Zap, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { allMockGames } from '../store/mockData';

export default function ClanGameSelector({ clanId, userId, onSelectGame }) {
    const { user } = useAuth();
    const [filters, setFilters] = useState([]); // Array of active filters
    const [search, setSearch] = useState('');

  // Default global chat pseudo-game
  const defaultChatGame = {
      id: 'global_chat',
      title: 'ATOM X EVE',
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

            // 3. Use All Mock Games from Store
            const allStoreGames = Object.values(allMockGames);

            // 4. Merge and Map
            const relevantGames = allStoreGames.map(g => {
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

            // Sort: Assigned first, then by title
            return relevantGames.sort((a, b) => {
                if (a.isAssigned && !b.isAssigned) return -1;
                if (!a.isAssigned && b.isAssigned) return 1;
                return a.title.localeCompare(b.title);
            });
        },
        enabled: !!user && !!clanId
    });

    // Separate Owned Games and Directory Games
    const { ownedGames, directoryGames } = useMemo(() => {
        if (!games) return { ownedGames: [], directoryGames: [] };
        
        const owned = [];
        const directory = [];

        games.forEach(game => {
            if (game.isOwned) {
                owned.push(game);
            } else {
                directory.push(game);
            }
        });

        return { ownedGames: owned, directoryGames: directory };
    }, [games]);

    const filteredDirectoryGames = useMemo(() => {
        return directoryGames.filter(game => {
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
    }, [directoryGames, search, filters]);

    const availableFilters = [
        { id: 'assigned', label: 'Assigned', icon: Target },
        { id: 'active', label: 'Active', icon: Zap },
        { id: 'farming', label: 'Farming', icon: Clock },
    ];

    const toggleFilter = (id) => {
        setFilters(prev => 
            prev.includes(id) 
                ? prev.filter(f => f !== id)
                : [...prev, id]
        );
    };

    if (isLoading) return <div className="text-white/40 text-center p-8">Loading Game Library...</div>;

    const GameListItem = ({ game, onSelect }) => (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onSelect(game)}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group"
        >
            <div className="w-12 h-16 rounded-lg overflow-hidden bg-black/50 flex-shrink-0 border border-white/5">
                <img src={game.cover_image || game.cover} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">{game.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] h-4 px-1 border-white/10 text-white/40">{game.genre}</Badge>
                    {game.isAssigned && <Target className="w-3 h-3 text-amber-500" />}
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="w-full h-full flex overflow-hidden">
            {/* LEFT COLUMN: ADAM X EVE & OWNED GAMES */}
            <div className="w-80 flex flex-col border-r border-white/10 pr-6 mr-6 overflow-hidden">
                {/* Adam X Eve (Global Chat) */}
                <div className="mb-4 flex-shrink-0">
                    <div 
                        onClick={() => onSelectGame(defaultChatGame)}
                        className="group relative h-20 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all"
                    >
                        <img 
                            src={defaultChatGame.cover_image} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
                        <div className="absolute inset-0 px-4 flex flex-col justify-center">
                            <h2 className="text-xl font-black text-white leading-none mb-1 group-hover:text-cyan-400 transition-colors">ATOM X EVE</h2>
                            <p className="text-[10px] text-white/50 font-medium tracking-wider uppercase">Global Division Comms</p>
                        </div>
                    </div>
                </div>

                {/* Divider Line with Label */}
                <div className="flex items-center gap-4 mb-4 flex-shrink-0">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Your Games</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Owned Games List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {ownedGames.length > 0 ? (
                        ownedGames.map(game => (
                            <GameListItem key={game.id} game={game} onSelect={onSelectGame} />
                        ))
                    ) : (
                        <div className="text-center py-8 text-white/30 text-xs">
                            No games owned yet.
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: DIRECTORY OF OTHER GAMES */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Directory Header & Controls */}
                <div className="flex items-center justify-between gap-4 mb-6 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-white/50" />
                        Game Directory
                    </h2>
                    
                    <div className="flex items-center gap-3">
                        {/* Filters */}
                        <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                            {availableFilters.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => toggleFilter(f.id)}
                                    className={`p-1.5 rounded-md transition-all ${
                                        filters.includes(f.id)
                                            ? 'bg-cyan-500/20 text-cyan-300' 
                                            : 'text-white/30 hover:text-white'
                                    }`}
                                    title={f.label}
                                >
                                    <f.icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                            <Input 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search directory..." 
                                className="bg-white/5 border-white/10 pl-9 h-9 text-sm text-white placeholder:text-white/30 rounded-lg focus:bg-white/10"
                            />
                        </div>
                    </div>
                </div>

                {/* Directory Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 pb-8">
                        <AnimatePresence mode="popLayout">
                            {filteredDirectoryGames.map((game, idx) => (
                                <motion.div
                                    key={game.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                                    onClick={() => onSelectGame(game)}
                                    className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer bg-slate-900 border border-white/10 hover:border-white/30 transition-all hover:-translate-y-1"
                                >
                                    {/* Cover */}
                                    <img 
                                        src={game.cover_image || game.cover} 
                                        alt={game.title} 
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                    
                                    {/* Info Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <h4 className="text-sm font-bold text-white leading-tight truncate">{game.title}</h4>
                                        <p className="text-[10px] text-white/50 truncate">{game.genre}</p>
                                    </div>

                                    {/* Status Dots */}
                                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                                        {game.isAssigned && <div className="w-2 h-2 rounded-full bg-amber-500 shadow-lg" title="Assigned" />}
                                        {game.isFarming && <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg" title="Farming" />}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}