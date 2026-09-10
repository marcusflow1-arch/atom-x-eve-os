import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Gamepad2, Users, Target, Clock, Zap, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { allMockGames } from '../store/mockData';
import ClanDirectoryTile from '@/components/clan/ClanDirectoryTile';

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

    return (
        <section className="clan-directory" data-testid="clan-game-chats">
            <header className="clan-directory-heading"><span className="clan-eyebrow">Clan / Conversations</span><h1>Game Chats</h1><p>Choose a game and join the conversation.</p></header>
            <div className="clan-directory-columns">
                <aside className="clan-owned-column">
                    <button type="button" className="clan-global-chat" onClick={() => onSelectGame(defaultChatGame)}><strong>ATOM X EVE</strong><small>Global Division Comms</small></button>
                    <h2>Your Games</h2>
                    {ownedGames.length ? ownedGames.map(game => <ClanDirectoryTile compact key={game.id} game={game} onSelect={onSelectGame} />) : <p className="text-xs text-muted-foreground">No games owned yet.</p>}
                </aside>
                <div className="clan-directory-main">
                    <div className="clan-directory-toolbar">
                        <label className="clan-directory-search"><Search size={16} /><input aria-label="Search game chats" placeholder="Search directory..." value={search} onChange={e => setSearch(e.target.value)} /></label>
                        <div className="clan-directory-filters" aria-label="Game filters">{availableFilters.map(f => <button type="button" key={f.id} aria-pressed={filters.includes(f.id)} onClick={() => toggleFilter(f.id)}>{f.label}</button>)}</div>
                    </div>
                    <div className="clan-directory-grid">{filteredDirectoryGames.map(game => <ClanDirectoryTile key={game.id} game={game} onSelect={onSelectGame} />)}</div>
                    {!filteredDirectoryGames.length && <p className="py-8 text-sm text-muted-foreground">No games match your search and filters.</p>}
                </div>
            </div>
        </section>
    );
}