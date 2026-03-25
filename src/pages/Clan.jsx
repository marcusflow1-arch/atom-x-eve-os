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
            <div className="flex-1 relative h-full pt-16">

                {bottomTab === 'home' && (
                    <>
                        {/* Clan Info & Stats - Top Left under header */}
                        <div className="absolute top-20 left-8 z-30 pointer-events-auto">
                            <div className="flex items-center gap-6 mb-3">
                                <div className="flex items-center gap-5 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-4 pr-8 shadow-lg">
                                    <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                                        {clanForRender?.icon ? <img src={clanForRender.icon} className="w-full h-full object-cover" /> : <Shield className="w-10 h-10 text-white/50" />}
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h2 className="text-2xl font-black text-white tracking-wider uppercase leading-tight mb-2">{clanForRender?.name || 'Entering Division'}</h2>
                                        <div className="flex items-center gap-4 text-sm font-medium text-white/60">
                                            <span className="flex items-center gap-1.5"><Crown className="w-4 h-4 text-amber-500" /> LVL {clanForRender?.level || 1}</span>
                                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-cyan-500" /> {members?.length || 0}/50</span>
                                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> 12 Online</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Central Stats - Top Middle */}
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto hidden lg:flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-3 shadow-lg flex flex-col items-center min-w-[120px]">
                                <span className="text-xs text-white/60 uppercase tracking-widest mb-1.5 font-medium">Treasury</span>
                                <span className="text-xl font-black text-amber-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"><Zap className="w-5 h-5" /> 1.45M</span>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-3 shadow-lg flex flex-col items-center min-w-[120px]">
                                <span className="text-xs text-white/60 uppercase tracking-widest mb-1.5 font-medium">Power</span>
                                <span className="text-xl font-black text-cyan-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"><Activity className="w-5 h-5" /> {Math.floor((members?.length || 1) * 1250).toLocaleString()}</span>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-3 shadow-lg flex flex-col items-center min-w-[120px]">
                                <span className="text-xs text-white/60 uppercase tracking-widest mb-1.5 font-medium">Rank</span>
                                <span className="text-xl font-black text-purple-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"><Shield className="w-5 h-5" /> Gold III</span>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-3 shadow-lg flex flex-col items-center min-w-[120px]">
                                <span className="text-xs text-white/60 uppercase tracking-widest mb-1.5 font-medium">Resources</span>
                                <span className="text-xl font-black text-green-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">3,240</span>
                            </div>
                        </div>
                    </>
                )}

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
                            className="absolute top-0 left-0 right-0 bottom-20 overflow-hidden bg-[#0A0D14]"
                        >
                            <div className="flex h-full">
                                {/* Left Side - Environments */}
                                <div className="w-[300px] border-r border-white/5 flex flex-col pt-20">
                                    <div className="p-6 pb-2">
                                        <div className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-4">Stronghold Environments</div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-4 space-y-2">
                                        <button 
                                            className="w-full relative rounded-2xl overflow-hidden group text-left border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                                            onClick={() => window.dispatchEvent(new CustomEvent('changeStrongholdEnv', { detail: 'virtual_room_7.glb' }))}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10" />
                                            <img src="https://images.unsplash.com/photo-1515630278258-407f66498911?w=400&q=80" alt="Room 7" className="w-full h-[100px] object-cover" />
                                            <div className="absolute bottom-0 left-0 p-3 z-20 w-full">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-white">Room 7</span>
                                                </div>
                                                <div className="h-1 bg-white/10 rounded-full w-full overflow-hidden">
                                                    <div className="h-full bg-cyan-400 w-[92%]" />
                                                </div>
                                                <div className="text-[9px] text-white/40 mt-1 uppercase tracking-wider">Level 1 • 4617 / 5000 XP</div>
                                            </div>
                                        </button>

                                        <button 
                                            className="w-full relative rounded-2xl overflow-hidden group text-left border-2 border-transparent hover:border-white/10"
                                            onClick={() => window.dispatchEvent(new CustomEvent('changeStrongholdEnv', { detail: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx' }))}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10" />
                                            <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80" alt="Hangar" className="w-full h-[100px] object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute bottom-0 left-0 p-3 z-20 w-full">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-white">Base Hangar</span>
                                                </div>
                                                <div className="h-1 bg-white/10 rounded-full w-full overflow-hidden">
                                                    <div className="h-full bg-white/20 w-[45%]" />
                                                </div>
                                                <div className="text-[9px] text-white/40 mt-1 uppercase tracking-wider">Level 2</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Middle Content - Upgrade Tree */}
                                <div className="flex-1 flex flex-col pt-20 border-r border-white/5">
                                    <div className="px-10 py-6 border-b border-white/5 flex items-end justify-between bg-black/20">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                                                    <Shield className="w-5 h-5 text-cyan-400" />
                                                </div>
                                                <h2 className="text-3xl font-black text-white uppercase tracking-widest">Room 7</h2>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                                                <span className="text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">Level 1</span>
                                                <span className="text-white/40">4617 / 5000 XP</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-8 text-right">
                                            <div>
                                                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Capacity</div>
                                                <div className="text-xl font-bold text-white">8/10</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-amber-500/60 uppercase tracking-widest mb-1">Energy</div>
                                                <div className="text-xl font-bold text-amber-400">450/500</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Slots</div>
                                                <div className="text-xl font-bold text-white">3/5</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-10 overflow-y-auto">
                                        <div className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-6 flex items-center gap-2">
                                            <Settings className="w-3 h-3" /> Facility Upgrades
                                        </div>

                                        <div className="flex gap-10 h-full">
                                            {/* Categories */}
                                            <div className="w-[240px] space-y-2">
                                                <button className="w-full text-left px-5 py-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-sm tracking-wider flex items-center gap-3">
                                                    <Crown className="w-4 h-4" /> Command Center
                                                </button>
                                                <button className="w-full text-left px-5 py-4 rounded-xl hover:bg-white/5 border border-transparent text-white/50 hover:text-white font-bold text-sm tracking-wider flex items-center gap-3 transition-colors">
                                                    <Shield className="w-4 h-4" /> Armory
                                                </button>
                                                <button className="w-full text-left px-5 py-4 rounded-xl hover:bg-white/5 border border-transparent text-white/50 hover:text-white font-bold text-sm tracking-wider flex items-center gap-3 transition-colors">
                                                    <Users className="w-4 h-4" /> Barracks
                                                </button>
                                                <button className="w-full text-left px-5 py-4 rounded-xl hover:bg-white/5 border border-transparent text-white/50 hover:text-white font-bold text-sm tracking-wider flex items-center gap-3 transition-colors">
                                                    <Zap className="w-4 h-4" /> Power Grid
                                                </button>
                                            </div>

                                            {/* Upgrades */}
                                            <div className="flex-1 space-y-3">
                                                <div className="bg-[#1A1F2A] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                                        <span className="font-bold text-white tracking-wide text-sm">Expand Command Desk</span>
                                                    </div>
                                                    <div className="text-xs font-bold text-white/40">Tier 1 • Active</div>
                                                </div>
                                                
                                                <div className="bg-[#1A1F2A] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                                        <span className="font-bold text-white tracking-wide text-sm">Holographic Tactical Map</span>
                                                    </div>
                                                    <div className="text-xs font-bold text-white/40">Tier 2 • Active</div>
                                                </div>

                                                <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center justify-between opacity-50">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-2 h-2 rounded-full bg-white/20" />
                                                        <span className="font-bold text-white tracking-wide text-sm">Advanced Communications Array</span>
                                                    </div>
                                                    <div className="text-xs font-bold text-white/20">Tier 3 • Locked</div>
                                                </div>
                                                
                                                <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center justify-between opacity-50">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-2 h-2 rounded-full bg-white/20" />
                                                        <span className="font-bold text-white tracking-wide text-sm">AI Strategic Advisor</span>
                                                    </div>
                                                    <div className="text-xs font-bold text-white/20">Tier 4 • Locked</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Preview & Active Modules */}
                                <div className="w-[380px] bg-black/40 flex flex-col pt-20">
                                    <div className="p-6 flex items-center gap-2 text-xs font-bold text-green-400 uppercase tracking-widest">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Preview
                                    </div>
                                    
                                    <div className="flex-1 relative flex items-center justify-center">
                                        {/* Mockup crosshair for preview */}
                                        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center absolute">
                                            <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <Button className="w-full bg-white hover:bg-white/90 text-black font-bold h-12 text-sm tracking-widest rounded-xl">
                                            ENTER STRONGHOLD
                                        </Button>
                                        <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/5 font-bold h-12 text-sm tracking-widest rounded-xl">
                                            EDIT MODE
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
                {bottomTab === 'home' && (
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
                )}

                {/* Bottom Header Bar - Handled by GlassPageFrame bottomContent */}
            </div>
        </div>
        </GlassPageFrame>
    );
}