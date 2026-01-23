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
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// XMB Mode Items Configuration
// Only Overview and Games Chat are visible as requested
const XMB_MODES = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'games_chat', label: 'Games Chat', icon: MessageSquare },
];

export default function ClanPage() {
    const { user, updatePresenceContext, sessionConflict, claimSession } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // Initialize activeClanId from localStorage if available
    const [activeClanId, setActiveClanId] = useState(() => {
        return localStorage.getItem('activeClanId') || null;
    });
    const [activeModeIndex, setActiveModeIndex] = useState(0); // Index in XMB_MODES
    const [selectedGame, setSelectedGame] = useState(null); // Track selected game for workspace
    const [initialZone, setInitialZone] = useState(null);

    // Persist activeClanId to localStorage
    useEffect(() => {
        if (activeClanId) {
            localStorage.setItem('activeClanId', activeClanId);
        } else {
            localStorage.removeItem('activeClanId');
        }
    }, [activeClanId]);

    // Fetch Memberships
    const { data: memberships, isLoading } = useQuery({
        queryKey: ['myClanMemberships', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const members = await base44.entities.ClanMember.filter({ user_id: user.id });
            const divisions = await Promise.all(members.map(async (m) => {
                const d = await base44.entities.Division.get(m.clan_id);
                return d ? { ...d, divisionId: d.id } : null;
            }));
            return divisions.filter(d => d);
        },
        enabled: !!user
    });

    useEffect(() => {
        if (memberships?.length > 0) {
            // If no active clan, or current active clan is not in memberships (kicked), default to first
            if (!activeClanId || !memberships.find(c => c.divisionId === activeClanId)) {
                setActiveClanId(memberships[0].divisionId);
            }
        } else if (memberships && memberships.length === 0) {
             // If memberships loaded and empty, clear active clan
             setActiveClanId(null);
        }
    }, [memberships, activeClanId]);

    const activeClan = memberships?.find(c => c.divisionId === activeClanId);

    // Fetch Members for active clan
    const { data: members } = useQuery({
        queryKey: ['clanMembers', activeClan?.id],
        queryFn: async () => {
            if (!activeClan) return [];
            return await base44.entities.ClanMember.filter({ clan_id: activeClan.id });
        },
        enabled: !!activeClan
    });

    // Check for leader/officer status for management access
    const currentUserRole = members?.find(m => m.user_id === user?.id)?.role;
    const isPrivileged = currentUserRole === 'leader' || currentUserRole === 'officer';
    const isLeader = currentUserRole === 'leader';

    const leaveClanMutation = useMutation({
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'leave_clan', data: { divisionId: activeClan.id } }),
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
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'delete_clan', data: { divisionId: activeClan.id } }),
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
        if (activeClan && !selectedGame) {
            updatePresenceContext({
                type: 'clan',
                name: activeClan.name,
                id: activeClan.id
            });
        }
    }, [activeClan?.id, selectedGame]);

    // Restore state logic (Navigation OR Last Known State)
    useEffect(() => {
        const restoreState = async () => {
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
        
        if (activeClan && user) {
            restoreState();
        }
    }, [location.state, activeClan?.id, user?.id]); // Only run when clan/user loads

    // Keyboard Navigation for XMB
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!activeClan) return;

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

    // Conflict Warning
    if (sessionConflict) {
        return (
            <div className="h-screen flex items-center justify-center bg-black/90 z-50 text-center">
                <div className="max-w-md p-8 bg-[#12141a] border border-red-500/30 rounded-2xl">
                    <Activity className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold text-white mb-2">Connection Paused</h2>
                    <p className="text-white/60 mb-6">
                        You are active in another window or device. We've paused this session to prevent state conflicts.
                    </p>
                    <Button 
                        onClick={() => {
                            claimSession();
                            window.location.reload();
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white w-full"
                    >
                        Resume Here
                    </Button>
                </div>
            </div>
        );
    }

    // Render Logic
    if (isLoading) return <div className="h-screen flex items-center justify-center text-white/50">Accessing Clan Network...</div>;

    if (!activeClan) {
        return <ClanIntro onClanCreated={(clanId) => setActiveClanId(clanId)} onClanJoined={(clanId) => setActiveClanId(clanId)} />;
    }

    return (
        <div className="h-screen w-full relative overflow-hidden bg-[#0a0c10] text-white font-sans selection:bg-cyan-500/30">
            
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
                            clan={activeClan} 
                            initialZone={initialZone}
                            onBack={() => {
                                setSelectedGame(null);
                                setInitialZone(null);
                            }} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 1. Dynamic Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
                {activeClan.banner && (
                    <img 
                        src={activeClan.banner} 
                        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110" 
                        alt="Background" 
                    />
                )}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
            </div>

            {/* 2. Top Header - Removed clan identity info, now shown in ClanOverview */}

            {/* 3. XMB Horizontal Navigation Axis - Moved to top */}
            <div className="absolute top-[8%] left-0 right-0 z-30 flex items-center justify-center h-16">
                <div className="flex items-center gap-12 px-12">
                    {XMB_MODES.map((mode, index) => {
                        const isActive = index === activeModeIndex;
                        const distance = Math.abs(index - activeModeIndex);
                        const opacity = Math.max(0.3, 1 - (distance * 0.4));
                        const scale = isActive ? 1.4 : Math.max(0.8, 1 - (distance * 0.1));
                        
                        // Hide items too far away to cleaner look
                        if (distance > 3) return null;

                        // Filter restricted items if not privileged (leader/officer)
                        if (mode.restricted && !isPrivileged) return null;

                        return (
                            <div 
                                key={mode.id}
                                onClick={() => setActiveModeIndex(index)}
                                className={`flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer group ${isActive ? 'z-10' : 'z-0'}`}
                                style={{ opacity, transform: `scale(${scale})` }}
                            >
                                <div className={`
                                    w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 relative
                                    ${isActive 
                                        ? 'bg-white/10 border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.15)] text-white backdrop-blur-xl' 
                                        : 'bg-transparent text-white/40 group-hover:text-white/70'}
                                `}>
                                    <mode.icon className="w-7 h-7" />
                                    {isActive && (
                                        <motion.div 
                                            layoutId="activeGlow"
                                            className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                        />
                                    )}
                                </div>
                                <span className={`text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-white' : 'text-transparent'}`}>
                                    {mode.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
                
                {/* Horizontal Axis Line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />
            </div>

            {/* 4. Vertical Contextual Axis (Content Area) - Now starts closer to top */}
            <div className="absolute top-[18%] left-0 right-0 bottom-0 z-20 overflow-hidden">
                <div className="h-full w-full mx-auto px-4 py-2 flex flex-col items-center">
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
                                <div className="w-full max-w-6xl h-full">
                                    <ClanOverview 
                                        clan={activeClan} 
                                        activeVoiceRooms={activeVoiceRooms}
                                        onChangeTab={(tab) => {
                                            // Handle internal navigation if needed, or simple scrolling
                                            console.log("Navigating to", tab);
                                        }} 
                                    />
                                </div>
                            )}

                            {XMB_MODES[activeModeIndex].id === 'games_chat' && (
                                <div className="w-full mt-4">
                                    <ClanGameSelector 
                                        clanId={activeClan.id} 
                                        userId={user?.id}
                                        onSelectGame={(game) => {
                                            setSelectedGame(game);
                                        }} 
                                    />
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
                    {activeClan && (
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
    );
}