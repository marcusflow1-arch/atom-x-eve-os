import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { 
    Shield, Gamepad2, MessageSquare, Mic, 
    ClipboardList, Settings, Crown, Users, 
    Wifi, Activity, Zap, Search, Plus, ArrowLeft, BookOpen, ChevronLeft
} from 'lucide-react';
import ClanGameSelector from '@/components/clan/ClanGameSelector';
import GameWorkspace from '@/components/clan/GameWorkspace';
import AssignmentList from '@/components/clan/assignments/AssignmentList';
import AssignmentManager from '@/components/clan/assignments/AssignmentManager';
import ClanOverview from '@/components/clan/ClanOverview';
import ClanChat from '@/components/clan/ClanChat';
import VoiceRoomManager from '@/components/clan/voice/VoiceRoomManager';
import ClanIntro from '@/components/clan/ClanIntro';
import ClanStronghold from '@/components/clan/ClanStronghold';
import ClanBottomNav from '@/components/clan/ClanBottomNav';
import ClanTreasuryPage from '@/components/clan/ClanTreasuryPage';
import ClanSchedulePage from '@/components/clan/ClanSchedulePage';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

export default function ClanPage() {
    const { user, updatePresenceContext } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // Active clan is derived from confirmed memberships only
    const [activeClanId, setActiveClanId] = useState(null);
    const [bottomTab, setBottomTab] = useState('home'); // 'home' | 'games_chat'
    const [isRosterOpen, setIsRosterOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null); // Track selected game for workspace
  const [lastChatGame, setLastChatGame] = useState(null); // For quick switch back from global chat
    const [initialZone, setInitialZone] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    // Entry gate state (authoritative)
    const [entryState, setEntryState] = useState('pending'); // 'pending' | 'intro' | 'clan'
    const [preselectedClanId, setPreselectedClanId] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

    useEffect(() => {
        const handler = (e) => setIsSidebarCollapsed(e.detail);
        window.addEventListener('sidebarCollapseChange', handler);
        return () => window.removeEventListener('sidebarCollapseChange', handler);
    }, []);

    // Removed: do not persist activeClanId to localStorage

    // Fetch Memberships with fresh validation
    const { data: memberships, isLoading, refetch: refetchMemberships } = useQuery({
        queryKey: ['myClanMemberships', user?.id],
        queryFn: async () => {
            if (!user) return [];
            // Fresh fetch to verify membership is still valid
            const members = await base44.entities.ClanMember.filter({ user_id: user.id });
            
            // Validate each membership by checking if the clan still exists
            const validatedDivisions = await Promise.all(members.map(async (m) => {
                try {
                    const d = await base44.entities.Division.get(m.clan_id);
                    if (d) {
                        return { ...d, divisionId: d.id, membershipId: m.id };
                    }
                    // Clan no longer exists, membership is stale
                    return null;
                } catch (err) {
                    // Clan doesn't exist or access denied
                    console.warn('Clan membership validation failed for:', m.clan_id);
                    return null;
                }
            }));
            
            return validatedDivisions.filter(d => d);
        },
        enabled: !!user && !isTransitioning,
        staleTime: 0, // Always refetch on mount to ensure fresh data
        refetchOnMount: 'always'
    });

    // Handle Clan Entry (Success from Intro) - wait for backend confirmation
    const handleClanEntry = async (clanId) => {
        setIsTransitioning(true);
        let elapsed = 0;
        const interval = setInterval(async () => {
            const result = await refetchMemberships();
            const confirmed = result.data?.some(m => m.divisionId === clanId);
            if (confirmed) {
                setActiveClanId(clanId);
                setIsTransitioning(false);
                clearInterval(interval);
            }
        }, 500);
        const timeout = setInterval(() => {
            elapsed += 500;
            if (elapsed >= 10000) {
                clearInterval(interval);
                clearInterval(timeout);
                setIsTransitioning(false);
                alert('We could not confirm your clan membership yet. Please try again.');
            }
        }, 500);
    };

    // Transition completion handled inside handleClanEntry polling

    // Authoritative entry resolution
    useEffect(() => {
        let cancelled = false;
        const resolve = async () => {
            if (!user) { setEntryState('intro'); return; }
            try {
                const res = await base44.functions.invoke('clanSystem', { action: 'resolve_entry' });
                const payload = res.data || res;
                if (cancelled) return;
                if (payload.state === 'intro') {
                    setEntryState('intro');
                    setPreselectedClanId(null);
                } else if (payload.state === 'clan') {
                    setEntryState('clan');
                    setPreselectedClanId(payload.clanId);
                    setActiveClanId(payload.clanId);
                } else {
                    setEntryState('intro');
                }
            } catch (e) {
                console.warn('resolve_entry failed, falling back to local memberships', e);
                // Fallback: if we have validated memberships, allow entry
                if (memberships && memberships.length > 0) {
                    setEntryState('clan');
                    setActiveClanId(memberships[0].divisionId);
                } else {
                    setEntryState('intro');
                }
            }
        };
        resolve();
        return () => { cancelled = true; };
    }, [user?.id, memberships?.length]);

    // Re-validate membership when page becomes visible (tab switch, etc.)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                refetchMemberships();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [user, refetchMemberships]);

    useEffect(() => {
        if (memberships?.length > 0) {
            setActiveClanId(memberships[0].divisionId);
        } else {
            setActiveClanId(null);
        }
    }, [memberships]);

    const activeClan = memberships?.find(c => c.divisionId === activeClanId);
    // Guard: if no confirmed membership, block clan UI
    // (clanForRender below will be null until confirmed)

    // Removed: no UI render without confirmed membership

    const clanForRender = activeClan || null;

    // Fetch Members for active clan
    const { data: members } = useQuery({
        queryKey: ['clanMembers', clanForRender?.id],
        queryFn: async () => {
            if (!clanForRender?.id) return [];
            return await base44.entities.ClanMember.filter({ clan_id: clanForRender.id });
        },
        enabled: !!clanForRender?.id
    });

    // Check for leader/officer status for management access
    const currentUserRole = members?.find(m => m.user_id === user?.id)?.role;
    const isPrivileged = currentUserRole === 'leader' || currentUserRole === 'officer';
    const isLeader = currentUserRole === 'leader';

    const leaveClanMutation = useMutation({
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'leave_clan', data: { divisionId: clanForRender.id } }),
        onSuccess: (res) => {
            if (res.data.success) {
                queryClient.invalidateQueries(['myClanMemberships']);
                setActiveClanId(null);
            } else {
                alert(res.data.error || 'Failed to leave clan');
            }
        }
    });

    const disbandClanMutation = useMutation({
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'delete_clan', data: { divisionId: clanForRender.id } }),
        onSuccess: (res) => {
            if (res.data.success) {
                queryClient.invalidateQueries(['myClanMemberships']);
                setActiveClanId(null);
            } else {
                alert(res.data.error || 'Failed to disband clan');
            }
        }
    });

    // Fetch Active Voice Rooms
    const { data: activeVoiceRooms } = useQuery({
        queryKey: ['activeVoiceRooms', activeClan?.id],
        queryFn: async () => {
            if (!activeClan) return [];
            // Mocking active rooms for overview visibility
            // In production: base44.entities.VoiceRoom.filter({ clanId: activeClan.id, isEmpty: false })
            return [
                { id: '1', topic: 'General Lounge', participants: [1,2] },
                { id: '2', topic: 'Officer Meeting', participants: [] }
            ]; 
        },
        enabled: !!activeClan
    });

    // Create Clan Mutation removed - handled by ClanIntro

    // Update presence when viewing Clan Overview
    useEffect(() => {
        if (clanForRender?.id && clanForRender?.name && !selectedGame) {
            updatePresenceContext({
                type: 'clan',
                name: clanForRender?.name,
                id: clanForRender.id
            });
        }
    }, [clanForRender?.id, selectedGame]);

    // Restore state logic (Navigation OR Last Known State)
    useEffect(() => {
        const restoreState = async () => {
            // 0. Highest Priority: Query parameter ?game=
            const params = new URLSearchParams(location.search);
            const gameQuery = params.get('game');
            if (gameQuery) {
                let foundGame = null;
                
                if (gameQuery === 'global_chat') {
                    foundGame = {
                      id: 'global_chat',
                      title: 'ATOM X EVE',
                      genre: 'Social',
                      cover_image: 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=1200',
                      isGlobalChat: true
                    };
                } else {
                    // Find game by name (case insensitive)
                    const games = await base44.entities.Game.list();
                    foundGame = games.find(g => String(g.title).toLowerCase() === String(gameQuery).toLowerCase());
                    
                    if (!foundGame) {
                        // Fallback to a mock game if not found in DB
                        foundGame = {
                            id: 'mock_' + gameQuery.replace(/\s+/g, '_').toLowerCase(),
                            title: gameQuery,
                            genre: 'General',
                            cover_image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&q=80'
                        };
                    }
                }

                if (foundGame) {
                    setBottomTab('games_chat');
                    setSelectedGame(foundGame);
                    
                    if (!foundGame.isGlobalChat) {
                        // Add to recent clan games
                        const recent = JSON.parse(localStorage.getItem('recent_clan_games') || '[]');
                        const newRecent = [foundGame, ...recent.filter(g => g.id !== foundGame.id)].slice(0, 5);
                        localStorage.setItem('recent_clan_games', JSON.stringify(newRecent));
                        // Dispatch event for sidebar to update
                        window.dispatchEvent(new Event('recentClanGamesUpdated'));
                    }
                    
                    // Clear the query param so back button works without refreshing
                    navigate('/Clan', { replace: true });
                }
                return;
            }

            // 1. Priority: Explicit Navigation State (Returning from Farm Page)
            if (location.state?.restoreGameId) {
                setBottomTab('games_chat');

                const game = await base44.entities.Game.get(location.state.restoreGameId);
                if (game) {
                    setSelectedGame(game);
                    if (location.state.restoreZone) {
                        setInitialZone(location.state.restoreZone);
                    }
                }
                window.history.replaceState({}, document.title);
                return;
            }

            // 2. Fallback: Last Known Stable Context (Crash Recovery/Reload)
            // Only restore if we are 'idle' (not in a specific requested state) and have a saved context
            if (!selectedGame && user?.current_activity?.type === 'game' && user.current_activity.id) {
                // Check if the saved activity belongs to this clan (simple check)
                // In a real app we'd check if the game is associated with this clan context
                console.log("Restoring last stable context:", user.current_activity);
                
                try {
                    const game = await base44.entities.Game.get(user.current_activity.id);
                    if (game) {
                        // Switch to Games tab
                        setBottomTab('games_chat');
                        
                        setSelectedGame(game);
                        if (user.current_activity.zoneId) {
                            setInitialZone(user.current_activity.zoneId);
                        }
                    }
                } catch (e) {
                    console.error("Failed to restore context", e);
                }
            }
        };
        
        if (clanForRender && user) {
            restoreState();
        }
    }, [location.search, location.state, clanForRender?.id, user?.id]); // Re-run when query params change

    // Keyboard Navigation removed for Bottom Nav layout

    // Render Logic
    if (isTransitioning) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
                <Shield className="w-16 h-16 text-cyan-400 mb-6 animate-pulse" />
                <h2 className="text-xl font-bold tracking-widest mb-2">ACCESSING DIVISION</h2>
                <p className="text-white/40 text-sm">Synchronizing membership data...</p>
            </div>
        );
    }

    // Entry Gate - obey backend authority
    if (entryState === 'pending') {
        return (
            <div className="h-screen flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
                <div className="text-center">
                    <Shield className="w-16 h-16 text-cyan-400 mb-4 animate-pulse" />
                    <p className="text-white/50">Validating access...</p>
                </div>
            </div>
        );
    }

    if (entryState === 'intro') {
        return <ClanIntro onClanCreated={handleClanEntry} onClanJoined={handleClanEntry} />;
    }

    // Guard: wait for confirmed clan before rendering main UI
    if (!clanForRender) {
        return (
            <div className="h-screen flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
                <div className="text-center">
                    <Shield className="w-16 h-16 text-cyan-400 mb-4 animate-pulse" />
                    <p className="text-white/50">Preparing your division...</p>
                </div>
            </div>
        );
    }

    return (
        <GlassPageFrame bottomContent={
            <ClanBottomNav 
                activeTab={bottomTab} 
                onTabSelect={setBottomTab} 
                isRosterOpen={isRosterOpen}
                onToggleRoster={() => setIsRosterOpen(!isRosterOpen)}
            />
        }>
        <div className="h-screen w-full flex relative overflow-hidden text-white font-sans selection:bg-cyan-500/30" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>

            {/* 5% Left Area for Global Icons */}
            <div className={`transition-all duration-500 ${isSidebarCollapsed ? 'w-0 min-w-0 border-none opacity-0' : 'w-[5%] min-w-[80px] border-r border-white/20'} h-full bg-black/20 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm`}>
                {!isSidebarCollapsed && (
                    <button
                        onClick={() => {
                            localStorage.setItem('sidebarCollapsed', 'true');
                            window.dispatchEvent(new CustomEvent('sidebarCollapseChange', { detail: true }));
                        }}
                        className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-12 bg-black/60 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white text-white/50 transition-colors backdrop-blur-md z-50 shadow-lg"
                        title="Collapse Sidebar"
                    >
                        <ChevronLeft className="w-4 h-4 -ml-1" />
                    </button>
                )}
            </div>

            {/* 95% Main Clan Area */}
            <div className="flex-1 relative h-full">

                <AnimatePresence mode="wait">
                    {bottomTab === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                        >
                            <ClanStronghold 
                                clan={clanForRender} 
                                activeVoiceRooms={activeVoiceRooms} 
                                isRosterOpen={isRosterOpen} 
                            />
                        </motion.div>
                    )}
                    {bottomTab === 'treasury' && (
                        <motion.div
                            key="treasury"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-20 left-0 right-0 bottom-20 overflow-hidden"
                        >
                            <ClanTreasuryPage clan={clanForRender} />
                        </motion.div>
                    )}
                    {bottomTab === 'schedule' && (
                        <motion.div
                            key="schedule"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-20 left-0 right-0 bottom-20 overflow-hidden"
                        >
                            <ClanSchedulePage clan={clanForRender} />
                        </motion.div>
                    )}
                    {bottomTab === 'upgrades' && (
                        <motion.div
                            key="upgrades"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-20 left-0 right-0 bottom-20 overflow-hidden p-8 lg:p-12 max-w-[1200px] mx-auto"
                        >
                            {/* Render Upgrades section similar to overview */}
                            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-3xl p-8 h-full overflow-y-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                        <Activity className="w-6 h-6 text-blue-400" /> Research & Upgrades
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                                        <div className="text-sm text-white/50 mb-2 uppercase tracking-wider">Command Center</div>
                                        <div className="text-2xl font-bold text-white mb-4">Tier 3</div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                                            <div className="h-full w-[72%] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                        </div>
                                        <div className="flex justify-between text-xs text-white/50 mb-6">
                                            <span>72% to Tier 4</span>
                                            <span>Est. 3 days</span>
                                        </div>
                                        <Button className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30">
                                            Contribute Resources
                                        </Button>
                                    </div>
                                    <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                                        <div className="text-sm text-white/50 mb-2 uppercase tracking-wider">Armory</div>
                                        <div className="text-2xl font-bold text-white mb-4">Tier 2</div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                                            <div className="h-full w-[45%] bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                                        </div>
                                        <div className="flex justify-between text-xs text-white/50 mb-6">
                                            <span>45% to Tier 3</span>
                                            <span>Est. 5 days</span>
                                        </div>
                                        <Button className="w-full bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-500/30">
                                            Contribute Resources
                                        </Button>
                                    </div>
                                    <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                                        <div className="text-sm text-white/50 mb-2 uppercase tracking-wider">Barracks</div>
                                        <div className="text-2xl font-bold text-white mb-4">Tier 1</div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                                            <div className="h-full w-[15%] bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                        </div>
                                        <div className="flex justify-between text-xs text-white/50 mb-6">
                                            <span>15% to Tier 2</span>
                                            <span>Est. 12 days</span>
                                        </div>
                                        <Button className="w-full bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30">
                                            Contribute Resources
                                        </Button>
                                    </div>
                                    <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                                        <div className="text-sm text-white/50 mb-2 uppercase tracking-wider">Vault</div>
                                        <div className="text-2xl font-bold text-white mb-4">Tier 4 (Max)</div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                                            <div className="h-full w-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                        </div>
                                        <div className="flex justify-between text-xs text-white/50 mb-6">
                                            <span className="text-cyan-400">Max level reached</span>
                                        </div>
                                        <Button disabled className="w-full bg-white/5 text-white/30 border border-white/10">
                                            Fully Upgraded
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {bottomTab === 'games_chat' && (
                        <motion.div
                            key="games_chat"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-20 left-0 right-0 bottom-20 overflow-hidden"
                        >
                            <ClanGameSelector 
                               clanId={clanForRender?.id} 
                               userId={user?.id}
                               onSelectGame={(game) => {
                                    setSelectedGame(game);
                                    const recent = JSON.parse(localStorage.getItem('recent_clan_games') || '[]');
                                    const newRecent = [game, ...recent.filter(g => g.id !== game.id)].slice(0, 5);
                                    localStorage.setItem('recent_clan_games', JSON.stringify(newRecent));
                                    window.dispatchEvent(new Event('recentClanGamesUpdated'));
                                }} 
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Game Workspace Overlay */}
                <AnimatePresence>
                    {selectedGame && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-50 flex flex-col"
                        >
                            <GameWorkspace 
                                key={selectedGame.id}
                                game={selectedGame} 
                                clan={clanForRender} 
                                initialZone={initialZone}
                                onBack={() => {
                                    setSelectedGame(null);
                                    setInitialZone(null);
                                }} 
                                onGoMainChat={() => {
                                    if (selectedGame && !selectedGame.isGlobalChat) {
                                      setLastChatGame(selectedGame);
                                    }
                                    setSelectedGame({
                                      id: 'global_chat',
                                      title: 'Adam X Eve',
                                      genre: 'Social',
                                      cover_image: 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=1200',
                                      isGlobalChat: true
                                    });
                                }}
                                quickSwitchLabel={lastChatGame?.title}
                                onQuickSwitch={() => { if (lastChatGame) setSelectedGame(lastChatGame); }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Global Actions */}
                <div className="absolute bottom-[80px] left-6 z-30">
                    {/* Disband (Leader Only) or Leave (Everyone else) */}
                    {clanForRender && (
                        isLeader ? (
                            <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => {
                                    if(confirm("Are you sure you want to disband this clan? This cannot be undone.")) {
                                        disbandClanMutation.mutate();
                                    }
                                }}
                                className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/20 text-xs shadow-lg"
                            >
                                Disband Clan
                            </Button>
                        ) : (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                    if(confirm("Are you sure you want to leave this clan?")) {
                                        leaveClanMutation.mutate();
                                    }
                                }}
                                className="bg-black/50 backdrop-blur-md hover:bg-white/10 text-white/60 border-white/10 text-xs shadow-lg"
                            >
                                Leave Clan
                            </Button>
                        )
                    )}
                </div>

                {/* Bottom Header Bar - Handled by GlassPageFrame bottomContent */}
            </div>
        </div>
        </GlassPageFrame>
    );
}