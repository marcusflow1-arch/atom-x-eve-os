import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// XMB Mode Items Configuration
const XMB_MODES = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'chat', label: 'Clan Chat', icon: MessageSquare },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'management', label: 'Management', icon: Settings, leaderOnly: true },
];

export default function ClanPage() {
    const { user } = useAuth();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [selectedClanId, setSelectedClanId] = useState(null);
    const [activeModeIndex, setActiveModeIndex] = useState(0); // Index in XMB_MODES
    const [contextIndex, setContextIndex] = useState(0); // Vertical selection index
    const [isCreateClanOpen, setIsCreateClanOpen] = useState(false);
    const [newClanData, setNewClanData] = useState({ name: '', description: '' });
    const [selectedGame, setSelectedGame] = useState(null); // Track selected game for workspace
    const [initialZone, setInitialZone] = useState(null);
    const { updatePresenceContext } = useAuth();

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

    // Restore state from navigation (e.g. returning from Farm page)
    useEffect(() => {
        const restoreState = async () => {
            if (location.state?.restoreGameId) {
                // Ensure we are on the 'games' tab
                const gamesIndex = XMB_MODES.findIndex(m => m.id === 'games');
                if (gamesIndex !== -1) setActiveModeIndex(gamesIndex);

                // Fetch the game details to restore the workspace
                const game = await base44.entities.Game.get(location.state.restoreGameId);
                if (game) {
                    setSelectedGame(game);
                    if (location.state.restoreZone) {
                        setInitialZone(location.state.restoreZone);
                    }
                }
                
                // Clear state to prevent re-running
                window.history.replaceState({}, document.title);
            }
        };
        restoreState();
    }, [location.state]);

    // Fetch Memberships
    const { data: memberships, isLoading } = useQuery({
        queryKey: ['myClanMemberships', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const members = await base44.entities.ClanMember.filter({ userId: user.id });
            const divisions = await Promise.all(members.map(async (m) => {
                const d = await base44.entities.Division.get(m.divisionId);
                return d ? { ...d, divisionId: d.id } : null;
            }));
            return divisions.filter(d => d);
        },
        enabled: !!user
    });

    useEffect(() => {
        if (memberships?.length > 0 && !selectedClanId) {
            setSelectedClanId(memberships[0].divisionId);
        }
    }, [memberships]);

    const activeClan = memberships?.find(c => c.divisionId === selectedClanId);

    // Fetch Members for active clan
    const { data: members } = useQuery({
        queryKey: ['clanMembers', activeClan?.id],
        queryFn: async () => {
            if (!activeClan) return [];
            return await base44.entities.ClanMember.filter({ divisionId: activeClan.id });
        },
        enabled: !!activeClan
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

    // Create Clan Mutation
    const createClanMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('clanSystem', { action: 'create_clan', data }),
        onSuccess: (res) => {
            if (res.data.success) {
                queryClient.invalidateQueries(['myClanMemberships']);
                setIsCreateClanOpen(false);
                setSelectedClanId(res.data.division.id);
            }
        }
    });

    // Check for leader status for management access
    const isLeader = members?.find(m => m.userId === user?.id)?.role === 'leader';

    // Keyboard Navigation for XMB
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!activeClan) return;

            if (e.key === 'ArrowRight') {
                setActiveModeIndex(prev => {
                    let next = prev + 1;
                    if (next >= XMB_MODES.length) return prev;
                    if (XMB_MODES[next].leaderOnly && !isLeader) return prev;
                    return next;
                });
            } else if (e.key === 'ArrowLeft') {
                setActiveModeIndex(prev => Math.max(prev - 1, 0));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeClan, isLeader]);

    // Render Logic
    if (isLoading) return <div className="h-screen flex items-center justify-center text-white/50">Accessing Clan Network...</div>;

    if (!activeClan) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-white relative overflow-hidden bg-[#0f1419]">
                <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0f1419] to-black z-0" />
                <div className="relative z-10 text-center max-w-lg px-8">
                    <Shield className="w-20 h-20 text-white/20 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold mb-4">No Clan Affiliation</h1>
                    <p className="text-white/50 mb-8">Initialize a new division or await recruitment.</p>
                    <Button 
                        onClick={() => setIsCreateClanOpen(true)}
                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-6 rounded-xl"
                    >
                        Found New Clan
                    </Button>
                </div>
                
                <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                    <DialogContent className="bg-[#12141a] border-white/10 text-white rounded-2xl">
                        <DialogHeader><DialogTitle>Establish New Division</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input 
                                value={newClanData.name}
                                onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                placeholder="Division Name"
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Input 
                                value={newClanData.description}
                                onChange={e => setNewClanData({...newClanData, description: e.target.value})}
                                placeholder="Manifesto / Description"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={() => createClanMutation.mutate(newClanData)}>Initialize</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
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
                        className="absolute inset-0 z-50 bg-[#0a0c10] flex flex-col"
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

            {/* 2. Top Header (Clan Identity) */}
            <div className="absolute top-0 left-0 right-0 h-32 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        {activeClan.icon ? <img src={activeClan.icon} className="w-full h-full object-cover rounded-xl" /> : <Shield className="w-6 h-6 text-white/50" />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                            {activeClan.name}
                        </h1>
                        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-widest text-white/40">
                            <span className="flex items-center gap-1.5"><Crown className="w-3 h-3 text-amber-500" /> LVL {activeClan.level || 1}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-cyan-500" /> {members?.length || 0} Members</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="flex items-center gap-1.5"><Wifi className="w-3 h-3 text-green-500" /> {members?.filter(m => {
                                // Mock online check - normally we check m.user.last_seen
                                return Math.random() > 0.6; 
                            }).length || 0} Online</span>
                            {activeVoiceRooms?.length > 0 && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="flex items-center gap-1.5 text-green-400 animate-pulse">
                                        <Mic className="w-3 h-3" /> {activeVoiceRooms.length} Active Voice
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. XMB Horizontal Navigation Axis */}
            <div className="absolute top-[35%] left-0 right-0 z-30 flex items-center justify-center h-20">
                <div className="flex items-center gap-12 px-12">
                    {XMB_MODES.map((mode, index) => {
                        const isActive = index === activeModeIndex;
                        const distance = Math.abs(index - activeModeIndex);
                        const opacity = Math.max(0.3, 1 - (distance * 0.4));
                        const scale = isActive ? 1.4 : Math.max(0.8, 1 - (distance * 0.1));
                        
                        // Hide items too far away to cleaner look
                        if (distance > 3) return null;

                        // Filter management if not leader
                        if (mode.leaderOnly && !isLeader) return null;

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

            {/* 4. Vertical Contextual Axis (Content Area) */}
            <div className="absolute top-[calc(35%+80px)] left-0 right-0 bottom-0 z-20 overflow-hidden">
                <div className="h-full w-full max-w-5xl mx-auto px-8 py-8 flex flex-col items-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeModeIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full flex flex-col items-center"
                        >
                            {/* Content based on Active Mode */}
                            {XMB_MODES[activeModeIndex].id === 'overview' && (
                                <div className="w-full max-w-6xl">
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

                            {XMB_MODES[activeModeIndex].id === 'games' && (
                                <div className="w-full mt-4">
                                    <ClanGameSelector 
                                        clanId={activeClan.id} 
                                        userId={user?.id}
                                        onSelectGame={(game) => setSelectedGame(game)} 
                                    />
                                </div>
                            )}

                            {XMB_MODES[activeModeIndex].id === 'assignments' && (
                                <div className="w-full mt-4">
                                    {/* If Leader, show Manager toggle? For now, we put Manager in Settings/Management tab or split view. 
                                        Let's just show List for everyone here, and Management in the Management tab as requested. 
                                    */}
                                    <AssignmentList 
                                        clanId={activeClan.id} 
                                        userId={user?.id} 
                                        onSelectGame={(game) => setSelectedGame(game)}
                                    />
                                </div>
                            )}

                            {XMB_MODES[activeModeIndex].id === 'chat' && (
                                <div className="w-full max-w-4xl h-[600px] mt-4">
                                    {/* Pass a default 'general' channel object since we don't have channels yet */}
                                    <ClanChat clan={activeClan} channel={{ id: 'general', name: 'General' }} />
                                </div>
                            )}

                            {XMB_MODES[activeModeIndex].id === 'voice' && (
                                <div className="w-full max-w-4xl h-[600px] mt-4 bg-black/20 rounded-2xl border border-white/10 overflow-hidden">
                                    <VoiceRoomManager clanId={activeClan.id} gameId={null} />
                                </div>
                            )}

                            {XMB_MODES[activeModeIndex].id === 'management' && (
                                <div className="w-full max-w-4xl mt-4">
                                    <AssignmentManager clanId={activeClan.id} members={members} />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* 5. Bottom Status Bar */}
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
                <div className="flex gap-6 text-xs font-medium text-white/30">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500/50" /> Voice Systems Normal</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500/50" /> Network Stable</span>
                </div>
                <div className="text-right">
                    <p className="text-white/20 text-[10px] uppercase tracking-[0.2em]">Atom x Eve System OS</p>
                </div>
            </div>
        </div>
    );
}