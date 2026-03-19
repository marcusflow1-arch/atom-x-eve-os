import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { 
    Shield, Gamepad2, MessageSquare, Mic, 
    ClipboardList, Settings, Crown, Users, 
    Wifi, Activity, Zap, Search, Plus, ArrowLeft
} from 'lucide-react';
import ClanGameSelector from '@/components/clan/ClanGameSelector';
import GameWorkspace from '@/components/clan/GameWorkspace';
import AssignmentList from '@/components/clan/assignments/AssignmentList';
import AssignmentManager from '@/components/clan/assignments/AssignmentManager';
import ClanOverview from '@/components/clan/ClanOverview';
import ClanChat from '@/components/clan/ClanChat';
import VoiceRoomManager from '@/components/clan/voice/VoiceRoomManager';
import ClanIntro from '@/components/clan/ClanIntro';
import ClanTreasuryPage from '@/components/clan/ClanTreasuryPage.jsx';
import ClanSchedulePage from '@/components/clan/ClanSchedulePage.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

// XMB Mode Items Configuration
const XMB_MODES = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'games_chat', label: 'Games Chat', icon: MessageSquare },
    { id: 'treasury', label: 'Treasury', icon: Zap },
    { id: 'schedule', label: 'Schedule', icon: ClipboardList },
];

export default function ClanPage() {
    const { user, updatePresenceContext } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // Active clan is derived from confirmed memberships only
    const [activeClanId, setActiveClanId] = useState(null);
    const [activeModeIndex, setActiveModeIndex] = useState(0); // Index in XMB_MODES
    const [selectedGame, setSelectedGame] = useState(null); // Track selected game for workspace
  const [lastChatGame, setLastChatGame] = useState(null); // For quick switch back from global chat
    const [initialZone, setInitialZone] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    // Entry gate state (authoritative)
    const [entryState, setEntryState] = useState('pending'); // 'pending' | 'intro' | 'clan'
    const [preselectedClanId, setPreselectedClanId] = useState(null);

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
                // Find game by name
                const games = await base44.entities.Game.filter({ title: gameQuery });
                if (games.length > 0) {
                    const gamesIndex = XMB_MODES.findIndex(m => m.id === 'games_chat');
                    if (gamesIndex !== -1) setActiveModeIndex(gamesIndex);
                    setSelectedGame(games[0]);
                    
                    // Add to recent clan games
                    const recent = JSON.parse(localStorage.getItem('recent_clan_games') || '[]');
                    const newRecent = [games[0], ...recent.filter(g => g.id !== games[0].id)].slice(0, 5);
                    localStorage.setItem('recent_clan_games', JSON.stringify(newRecent));
                    // Dispatch event for sidebar to update
                    window.dispatchEvent(new Event('recentClanGamesUpdated'));
                    
                    // Clear the query param so back button works without refreshing
                    navigate('/Clan', { replace: true });
                }
                return;
            }

            // 1. Priority: Explicit Navigation State (Returning from Farm Page)
            if (location.state?.restoreGameId) {
                const gamesIndex = XMB_MODES.findIndex(m => m.id === 'games');
                if (gamesIndex !== -1) setActiveModeIndex(gamesIndex);

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
                        const gamesIndex = XMB_MODES.findIndex(m => m.id === 'games');
                        if (gamesIndex !== -1) setActiveModeIndex(gamesIndex);
                        
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
    }, [location.state, clanForRender?.id, user?.id]); // Only run when clan/user loads

    // Keyboard Navigation for XMB
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!clanForRender?.id) return;

            if (e.key === 'ArrowRight') {
                setActiveModeIndex(prev => {
                    let next = prev + 1;
                    if (next >= XMB_MODES.length) return prev;
                    if (XMB_MODES[next].restricted && !isPrivileged) return prev;
                    return next;
                });
            } else if (e.key === 'ArrowLeft') {
                setActiveModeIndex(prev => Math.max(prev - 1, 0));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeClan, isPrivileged]);

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
        <GlassPageFrame>
        <div className="h-screen w-full relative overflow-hidden text-white font-sans selection:bg-cyan-500/30" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>

            {/* Ambient Glow Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-300/5 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-200/3 rounded-full blur-[180px]" />
            </div>

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

            {/* 1. Dynamic Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
                {clanForRender?.banner && (
                    <img 
                        src={clanForRender.banner} 
                        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110" 
                        alt="Background" 
                    />
                )}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
            </div>

            {/* 2. Clan Info - Top Left under header */}
            <div className="absolute top-20 left-8 z-30">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md overflow-hidden">
                        {clanForRender?.icon ? <img src={clanForRender.icon} className="w-full h-full object-cover" /> : <Shield className="w-6 h-6 text-white/50" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{clanForRender?.name || 'Entering Division'}</h2>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-amber-500" /> LVL {clanForRender?.level || 1}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3 text-cyan-500" /> {members?.length || 0}</span>
                        </div>
                    </div>
                </div>
                

            </div>

            {/* 3. XMB Horizontal Navigation Axis - Centered top */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
                <div className="flex items-center gap-8">
                    {XMB_MODES.map((mode, index) => {
                        const isActive = index === activeModeIndex;

                        if (mode.restricted && !isPrivileged) return null;

                        return (
                            <button 
                                key={mode.id}
                                onClick={() => setActiveModeIndex(index)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                                    isActive 
                                        ? 'bg-white/15 text-white border border-white/20' 
                                        : 'text-white/50 hover:text-white/80'
                                }`}
                            >
                                <mode.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{mode.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. Vertical Contextual Axis (Content Area) - Starts just under nav tabs */}
            <div className="absolute top-36 left-0 right-0 bottom-20 z-20 overflow-hidden">
                <div className="h-full w-full mx-auto px-4 flex flex-col items-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeModeIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full flex flex-col items-center"
                        >
                            {/* Content based on Active Mode */}
                            {XMB_MODES[activeModeIndex].id === 'overview' && (
                                <div className="w-full h-full">
                                    <ClanOverview 
                                       clan={clanForRender} 
                                       activeVoiceRooms={activeVoiceRooms}
                                       onChangeTab={(tab) => {
                                            console.log("Navigating to", tab);
                                        }} 
                                    />
                                </div>
                            )}

                            {XMB_MODES[activeModeIndex].id === 'games_chat' && (
                                <div className="w-full h-full">
                                    <ClanGameSelector 
                                       clanId={clanForRender?.id} 
                                       userId={user?.id}
                                       onSelectGame={(game) => {
                                            setSelectedGame(game);
                                            // Add to recent clan games
                                            const recent = JSON.parse(localStorage.getItem('recent_clan_games') || '[]');
                                            const newRecent = [game, ...recent.filter(g => g.id !== game.id)].slice(0, 5);
                                            localStorage.setItem('recent_clan_games', JSON.stringify(newRecent));
                                            window.dispatchEvent(new Event('recentClanGamesUpdated'));
                                        }} 
                                    />
                                </div>
                            )}

                            {XMB_MODES[activeModeIndex].id === 'treasury' && (
                                <div className="w-full h-full">
                                    <ClanTreasuryPage clan={clanForRender} />
                                </div>
                            )}

                            {XMB_MODES[activeModeIndex].id === 'schedule' && (
                                <div className="w-full h-full">
                                    <ClanSchedulePage clan={clanForRender} />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

                    {/* 5. Bottom Status Bar & Global Actions */}
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
                <div className="flex gap-6 text-xs font-medium text-white/30">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500/50" /> Voice Systems Normal</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500/50" /> Network Stable</span>
                </div>
                
                <div className="flex items-center gap-4 pointer-events-auto">
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
                                className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/20 text-xs"
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
                                className="bg-white/5 hover:bg-white/10 text-white/60 border-white/10 text-xs"
                            >
                                Leave Clan
                            </Button>
                        )
                    )}
                    
                    <div className="text-right">
                        <p className="text-white/20 text-[10px] uppercase tracking-[0.2em]">Atom x Eve System OS</p>
                    </div>
                </div>
            </div>
        </div>
        </GlassPageFrame>
    );
}