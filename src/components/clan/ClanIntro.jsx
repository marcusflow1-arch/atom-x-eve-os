import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, Users, Search, Plus, ArrowRight, 
    Trophy, Target, Zap, Crown, Lock, Unlock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthContext';

export default function ClanIntro({ onClanCreated, onClanJoined }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [viewState, setViewState] = useState('hero'); // 'hero' | 'browse'
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newClanData, setNewClanData] = useState({ 
        name: '', tag: '', motto: '', description: '',
        playstyles: [], genres: [], gameTags: [], activities: [],
        icon: '', banner: '', primaryColor: '#0f1419', secondaryColor: '#22d3ee',
        recruitmentStatus: 'Public', sizeLimit: '100', customRoles: [],
        searchTags: [], enableStronghold: false,
        clanAchievements: [
            { title: 'First Steps', description: 'Create your division', completed: true },
            { title: 'Gather the Squad', description: 'Reach 10 members', completed: false }
        ]
    });

    const PREDEFINED_PLAYSTYLES = ['Casual', 'Hardcore', 'Competitive', 'Social', 'Roleplay', 'PvP', 'PvE', 'Achievement Hunting', 'Speedrunning'];
    const PREDEFINED_GENRES = ['RPG', 'Shooter', 'Strategy', 'MMO', 'Adventure', 'Fighting', 'Horror', 'Racing', 'Simulation'];
    const PREDEFINED_ACTIVITIES = ['Achievement Farming', 'Questing', 'PvP Battles', 'Dungeon Runs', 'Exploration', 'Speedruns', 'Competitive Rankings', 'Story Progression'];

    const toggleArrayItem = (arrayField, item) => {
        setNewClanData(prev => {
            const arr = prev[arrayField];
            if (arr.includes(item)) return { ...prev, [arrayField]: arr.filter(i => i !== item) };
            return { ...prev, [arrayField]: [...arr, item] };
        });
    };
    const [selectedClan, setSelectedClan] = useState(null);
    const [selectedGameFilter, setSelectedGameFilter] = useState('All');

    // Check membership status - if user is already in a clan, redirect them
    const { data: myMemberships, isLoading: membershipsLoading } = useQuery({
        queryKey: ['myClanMemberships', user?.id],
        queryFn: async () => {
            if (!user) return [];
            return await base44.entities.ClanMember.filter({ user_id: user.id });
        },
        enabled: !!user
    });

    // Auto-redirect if user already has a clan membership
    React.useEffect(() => {
        // Do not auto-redirect here; ClanPage controls entry based on activeClanId
    }, [myMemberships, onClanJoined]);


    // Fetch all clans for browsing
    const { data: clans, isLoading } = useQuery({
        queryKey: ['allClans'],
        queryFn: async () => {
            const allClans = await base44.entities.Division.list();
            // Filter out development/test clans
            return allClans.filter(clan => !clan.is_development);
        },
        enabled: !membershipsLoading && (!myMemberships || myMemberships.length === 0)
    });

    // Fetch games for selection
    const { data: allGames } = useQuery({
        queryKey: ['allGamesClanIntro'],
        queryFn: async () => {
            return await base44.entities.Game.list();
        }
    });

    // Define mutations before any early returns to keep hook order stable
    const createClanMutation = useMutation({
        mutationFn: async (clanData) => {
            const res = await base44.functions.invoke('clanSystem', { action: 'create_clan', data: clanData });
            return res.data;
        },
        onSuccess: (data) => {
            if (data.success && data.clanId) {
                setIsCreateOpen(false);
                setNewClanData({ name: '', description: '', isPrivate: false });
                if (onClanCreated) onClanCreated(data.clanId);
                // Defer membership validation to ClanPage after entry
                queryClient.invalidateQueries(['myClanMemberships']);
                queryClient.invalidateQueries(['allClans']);
            } else {
                alert(data.error || 'Failed to create clan');
            }
        },
        onError: (error) => {
            console.error('Create clan error:', error);
            alert('Failed to create clan. Please try again.');
        }
    });

    const joinClanMutation = useMutation({
        mutationFn: async ({ clanId, isPrivate }) => {
            const action = isPrivate ? 'request_join' : 'join_clan';
            const res = await base44.functions.invoke('clanSystem', { action, data: { divisionId: clanId } });
            return { ...res.data, clanId, isPrivate };
        },
        onSuccess: async (data) => {
            if (data.success) {
                if (data.isPrivate) {
                    alert("Application sent successfully!");
                } else {
                    if (onClanJoined) onClanJoined(data.clanId);
                    // Defer membership validation to ClanPage after entry
                    queryClient.invalidateQueries(['myClanMemberships']);
                    queryClient.invalidateQueries(['allClans']);
                }
            } else {
                alert(data.error || 'Failed to join clan');
            }
        },
        onError: (error) => {
            console.error('Join clan error:', error);
            alert('Failed to join clan. Please try again.');
        }
    });


    const allGameTags = useMemo(() => {
        return Array.from(new Set((clans || []).flatMap(c => c.gameTags || []))).sort();
    }, [clans]);

    const filteredClans = clans?.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGame = selectedGameFilter === 'All' || (c.gameTags && c.gameTags.includes(selectedGameFilter));
        return matchesSearch && matchesGame;
    }) || [];

    const isMember = (clanId) => myMemberships?.some(m => m.clan_id === clanId);

    // Show loading while checking membership
    if (membershipsLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0c10] text-white">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/50">Checking clan status...</p>
                </div>
            </div>
        );
    }

    // If user is in a clan, show brief loading while redirect happens
    if (myMemberships && myMemberships.length > 0) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0c10] text-white">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-white/50">Entering your clan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-[#0a0c10] text-white font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-[#0a0c10] to-black" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
                
                {/* Animated Orbs */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[100px]" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[100px]" 
                />
            </div>

            <AnimatePresence mode="wait">
                {viewState === 'hero' ? (
                    <motion.div 
                        key="hero"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="relative z-10 h-screen flex flex-col items-center justify-center text-center px-6"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-8 relative"
                        >
                            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
                            <Shield className="w-32 h-32 text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                        </motion.div>

                        <motion.h1 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40"
                        >
                            ATOM <span className="text-cyan-400">×</span> EVE
                            <br />
                            <span className="text-4xl md:text-5xl font-bold tracking-widest text-white/20 mt-2 block">CLAN NETWORK</span>
                        </motion.h1>

                        <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl text-white/50 max-w-2xl mb-12"
                        >
                            Join elite divisions, compete in global events, and forge your legacy in the connected metaverse.
                        </motion.p>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Button 
                                onClick={() => setViewState('browse')}
                                size="lg"
                                className="bg-white text-black hover:bg-white/90 text-lg px-8 py-6 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                            >
                                Enter Clan Network <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="browse"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 container mx-auto px-6 py-12 max-w-7xl h-screen flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
                            <div>
                                <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                    <Shield className="w-8 h-8 text-cyan-400" />
                                    Active Divisions
                                </h2>
                                <p className="text-white/50">Find a clan that matches your playstyle or establish your own.</p>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <Select value={selectedGameFilter} onValueChange={setSelectedGameFilter}>
                                    <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-cyan-500/50">
                                        <SelectValue placeholder="Filter by Game" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#12141a] border-white/10 text-white">
                                        <SelectItem value="All">All Games</SelectItem>
                                        {allGameTags.map(tag => (
                                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="relative group w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-cyan-400 transition-colors" />
                                    <Input 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search clans..." 
                                        className="pl-10 bg-white/5 border-white/10 text-white focus:border-cyan-400/50 h-12 rounded-xl"
                                    />
                                </div>
                                <Button 
                                    onClick={() => setIsCreateOpen(true)}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white h-12 px-6 rounded-xl font-bold shadow-lg shadow-cyan-900/20 whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Establish Clan
                                </Button>
                            </div>
                        </div>

                        {/* Split View */}
                        <div className="flex flex-col md:flex-row gap-6 overflow-hidden h-[calc(100vh-220px)] pb-10">
                            {/* Left List */}
                            <div className="flex-1 max-w-md overflow-y-auto pr-4 custom-scrollbar space-y-3">
                                {isLoading ? (
                                    [1,2,3,4].map(i => (
                                        <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                                    ))
                                ) : (
                                    filteredClans.map((clan) => (
                                        <div 
                                            key={clan.id}
                                            onClick={() => setSelectedClan(clan)}
                                            className={`group relative rounded-2xl border p-4 flex items-center gap-4 cursor-pointer transition-all ${
                                                selectedClan?.id === clan.id 
                                                    ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.15)]' 
                                                    : 'bg-[#12141a]/80 border-white/5 hover:border-cyan-400/30 hover:bg-[#12141a]'
                                            }`}
                                        >
                                            <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center relative">
                                                {clan.icon ? (
                                                    <img src={clan.icon} alt={clan.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Shield className="w-8 h-8 text-white/20" />
                                                )}
                                                {clan.isPrivate && (
                                                    <div className="absolute top-1 right-1 bg-black/80 rounded p-0.5">
                                                        <Lock className="w-3 h-3 text-white/50" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className={`font-bold truncate ${selectedClan?.id === clan.id ? 'text-cyan-400' : 'text-white group-hover:text-cyan-300'}`}>
                                                        {clan.name}
                                                    </h3>
                                                    <div className="flex flex-col items-end">
                                                        <Badge variant="secondary" className="bg-black/40 text-[10px] px-1.5 py-0 text-white/80 border-white/10">
                                                            LVL {clan.level || 1}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-white/50">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" /> {clan.memberCount || 1}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Trophy className="w-3 h-3 text-amber-500/70" /> {clan.reputation || 0}
                                                    </span>
                                                </div>
                                                {clan.gameTags && clan.gameTags.length > 0 && (
                                                    <div className="mt-2 flex gap-1 overflow-hidden">
                                                        {clan.gameTags.slice(0, 3).map((tag, i) => (
                                                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 truncate max-w-[80px]">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {clan.gameTags.length > 3 && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                                                                +{clan.gameTags.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Right Details Pane */}
                            <div className="flex-1 bg-[#12141a]/90 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden relative flex flex-col">
                                {selectedClan ? (
                                    <>
                                        <div className="h-48 relative flex-shrink-0">
                                            {selectedClan.banner ? (
                                                <img src={selectedClan.banner} alt="Banner" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-slate-900/80" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#12141a] to-transparent" />
                                            
                                            <div className="absolute -bottom-6 left-8 flex items-end gap-5">
                                                <div className="w-24 h-24 rounded-2xl bg-[#12141a] p-1.5 shadow-2xl border border-white/10">
                                                    <div className="w-full h-full rounded-xl bg-white/5 overflow-hidden flex items-center justify-center">
                                                        {selectedClan.icon ? (
                                                            <img src={selectedClan.icon} alt="Icon" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Shield className="w-10 h-10 text-white/20" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mb-2 pb-6">
                                                    <h2 className="text-3xl font-bold text-white tracking-wide">{selectedClan.name}</h2>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {selectedClan.isPrivate ? (
                                                            <Badge variant="outline" className="text-orange-400 border-orange-500/30 bg-orange-500/10">Private</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">Public</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 pt-10 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                                            {/* Score Box & Stats */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                                                    <Crown className="w-6 h-6 text-amber-400 mb-2" />
                                                    <p className="text-2xl font-bold text-white">{selectedClan.level || 1}</p>
                                                    <p className="text-xs text-white/50 uppercase tracking-widest">Clan Level</p>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                                                    <Users className="w-6 h-6 text-cyan-400 mb-2" />
                                                    <p className="text-2xl font-bold text-white">{selectedClan.memberCount || 1}</p>
                                                    <p className="text-xs text-white/50 uppercase tracking-widest">Members</p>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                                                    <Trophy className="w-6 h-6 text-purple-400 mb-2" />
                                                    <p className="text-2xl font-bold text-white">{selectedClan.reputation || 0}</p>
                                                    <p className="text-xs text-white/50 uppercase tracking-widest">Reputation</p>
                                                </div>
                                            </div>

                                            {/* About */}
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-3">Manifesto</h3>
                                                <p className="text-white/70 leading-relaxed text-sm">
                                                    {selectedClan.description || "No manifesto provided by the division leaders."}
                                                </p>
                                            </div>

                                            {/* Games */}
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-3">Active Operations</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedClan.gameTags && selectedClan.gameTags.length > 0 ? (
                                                        selectedClan.gameTags.map((tag, idx) => (
                                                            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                                                <Target className="w-3 h-3 text-cyan-500" />
                                                                <span className="text-sm text-white/80">{tag}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-white/40 text-sm italic">No specific games listed.</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Focus */}
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-3">Division Focus</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedClan.focusTags && selectedClan.focusTags.length > 0 ? (
                                                        selectedClan.focusTags.map((tag, idx) => (
                                                            <div key={idx} className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                                                <Zap className="w-3 h-3 text-purple-400" />
                                                                <span className="text-sm text-purple-200">{tag}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-white/40 text-sm italic">No specific focus tags listed.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-md mt-auto">
                                            <Button 
                                                size="lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isMember(selectedClan.id)) {
                                                        if (onClanJoined) onClanJoined(selectedClan.id);
                                                    } else {
                                                        joinClanMutation.mutate({ clanId: selectedClan.id, isPrivate: selectedClan.isPrivate });
                                                    }
                                                }}
                                                disabled={joinClanMutation.isPending}
                                                className={`w-full font-bold text-lg h-14 ${isMember(selectedClan.id) ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
                                            >
                                                {isMember(selectedClan.id) 
                                                    ? 'Enter Division' 
                                                    : joinClanMutation.isPending 
                                                        ? 'Processing...' 
                                                        : (selectedClan.isPrivate ? 'Request to Join' : 'Join Division')
                                                }
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                                            <Shield className="w-12 h-12 text-white/20" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Select a Division</h3>
                                        <p className="text-white/50 max-w-sm">
                                            Click on any clan from the list to view their stats, current operations, and manifesto.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Clan Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-[#12141a] border-white/10 text-white rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <div className="p-6 border-b border-white/10 bg-black/40 flex-shrink-0">
                        <DialogTitle className="text-3xl font-black tracking-widest text-center">CREATE CLAN</DialogTitle>
                        <DialogDescription className="text-center text-white/50 mt-2">
                            Define your division's identity, focus, and visual presence in the Atom X Eve network.
                        </DialogDescription>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                        
                        {/* 1. Clan Identity */}
                        <section>
                            <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                                <Shield className="w-5 h-5" /> Clan Identity
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Clan Name *</label>
                                    <Input 
                                        value={newClanData.name}
                                        onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                        placeholder="e.g. Shadow Vanguard"
                                        className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Clan Tag (3-5 chars)</label>
                                    <Input 
                                        value={newClanData.tag}
                                        onChange={e => setNewClanData({...newClanData, tag: e.target.value})}
                                        placeholder="e.g. [AXE]"
                                        maxLength={5}
                                        className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 uppercase"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-white/70">Clan Motto</label>
                                    <Input 
                                        value={newClanData.motto}
                                        onChange={e => setNewClanData({...newClanData, motto: e.target.value})}
                                        placeholder="e.g. Masters of Every World"
                                        className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-white/70">Clan Description</label>
                                    <textarea 
                                        value={newClanData.description}
                                        onChange={e => setNewClanData({...newClanData, description: e.target.value})}
                                        placeholder="Describe your clan's goals, culture, and requirements..."
                                        className="w-full h-32 rounded-md bg-white/5 border border-white/10 text-white focus:border-cyan-500/50 p-3 resize-none text-sm"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 2. Clan Playstyle */}
                        <section>
                            <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                                <Target className="w-5 h-5" /> Clan Playstyle
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {PREDEFINED_PLAYSTYLES.map(style => (
                                    <button
                                        key={style}
                                        onClick={() => toggleArrayItem('playstyles', style)}
                                        className={`px-4 py-2 rounded-full border transition-all text-sm font-medium ${
                                            newClanData.playstyles.includes(style)
                                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 3. Games and Genres */}
                        <section>
                            <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                                <Zap className="w-5 h-5" /> Games & Genres
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm font-medium text-white/70 mb-3">Preferred Genres</p>
                                    <div className="flex flex-wrap gap-2">
                                        {PREDEFINED_GENRES.map(genre => (
                                            <button
                                                key={genre}
                                                onClick={() => toggleArrayItem('genres', genre)}
                                                className={`px-3 py-1.5 rounded border transition-all text-xs font-medium ${
                                                    newClanData.genres.includes(genre)
                                                        ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                                                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                                }`}
                                            >
                                                {genre}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white/70 mb-3">Preferred Atom XE Games (Select from library)</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 border border-white/5 rounded-xl bg-black/20">
                                        {allGames?.map(game => (
                                            <div 
                                                key={game.id}
                                                onClick={() => toggleArrayItem('gameTags', game.title)}
                                                className={`p-2 rounded border cursor-pointer flex items-center gap-2 transition-all ${
                                                    newClanData.gameTags.includes(game.title)
                                                        ? 'bg-cyan-900/30 border-cyan-500/50'
                                                        : 'bg-white/5 border-transparent hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-slate-800">
                                                    {game.cover_image && <img src={game.cover_image} alt="" className="w-full h-full object-cover" />}
                                                </div>
                                                <span className="text-xs font-medium truncate text-white/90">{game.title}</span>
                                            </div>
                                        ))}
                                        {(!allGames || allGames.length === 0) && <p className="text-xs text-white/40 col-span-full">No games available in library</p>}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 4. Clan Activities */}
                        <section>
                            <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                                <Trophy className="w-5 h-5" /> Primary Clan Activities
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {PREDEFINED_ACTIVITIES.map(activity => (
                                    <button
                                        key={activity}
                                        onClick={() => toggleArrayItem('activities', activity)}
                                        className={`px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
                                            newClanData.activities.includes(activity)
                                                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {activity}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 5. Visual Identity */}
                        <section>
                            <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                                <Shield className="w-5 h-5" /> Visual Identity
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Banner Image URL</label>
                                    <Input 
                                        value={newClanData.banner}
                                        onChange={e => setNewClanData({...newClanData, banner: e.target.value})}
                                        placeholder="https://... (1920x500 recommended)"
                                        className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50"
                                    />
                                    {newClanData.banner && (
                                        <div className="mt-2 h-20 rounded-lg overflow-hidden border border-white/10">
                                            <img src={newClanData.banner} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Emblem Image URL</label>
                                    <Input 
                                        value={newClanData.icon}
                                        onChange={e => setNewClanData({...newClanData, icon: e.target.value})}
                                        placeholder="https://... (Square recommended)"
                                        className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50"
                                    />
                                    {newClanData.icon && (
                                        <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-white/10 mx-auto">
                                            <img src={newClanData.icon} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Primary Color</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color" 
                                            value={newClanData.primaryColor}
                                            onChange={e => setNewClanData({...newClanData, primaryColor: e.target.value})}
                                            className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                                        />
                                        <Input 
                                            value={newClanData.primaryColor}
                                            onChange={e => setNewClanData({...newClanData, primaryColor: e.target.value})}
                                            className="bg-white/5 border-white/10 text-white flex-1 uppercase font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Secondary Color</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color" 
                                            value={newClanData.secondaryColor}
                                            onChange={e => setNewClanData({...newClanData, secondaryColor: e.target.value})}
                                            className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                                        />
                                        <Input 
                                            value={newClanData.secondaryColor}
                                            onChange={e => setNewClanData({...newClanData, secondaryColor: e.target.value})}
                                            className="bg-white/5 border-white/10 text-white flex-1 uppercase font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 6. Clan Roles & Tags */}
                        <section>
                            <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                                <Users className="w-5 h-5" /> Roles & Tags
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-white/70">Custom Clan Roles</label>
                                    <p className="text-xs text-white/40 mb-2">Default roles: Leader, Officer, Veteran, Member, Recruit</p>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="e.g. Raid Leader" 
                                            id="newRoleInput"
                                            className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (e.target.value.trim()) {
                                                        toggleArrayItem('customRoles', e.target.value.trim());
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <Button 
                                            variant="outline" 
                                            className="border-white/10 text-white/70 hover:text-white"
                                            onClick={(e) => {
                                                const input = document.getElementById('newRoleInput');
                                                if (input && input.value.trim()) {
                                                    toggleArrayItem('customRoles', input.value.trim());
                                                    input.value = '';
                                                }
                                            }}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {newClanData.customRoles.map(role => (
                                            <Badge key={role} variant="secondary" className="bg-white/10 text-white flex items-center gap-1">
                                                {role}
                                                <button onClick={() => toggleArrayItem('customRoles', role)} className="ml-1 text-white/50 hover:text-red-400">
                                                    ×
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-white/70">Search Tags</label>
                                    <p className="text-xs text-white/40 mb-2">Help players find you (e.g. retro-games, speedrun)</p>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Add tag..." 
                                            id="newTagInput"
                                            className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (e.target.value.trim()) {
                                                        const val = e.target.value.trim().toLowerCase().replace(/\s+/g, '-');
                                                        toggleArrayItem('searchTags', val);
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <Button 
                                            variant="outline" 
                                            className="border-white/10 text-white/70 hover:text-white"
                                            onClick={() => {
                                                const input = document.getElementById('newTagInput');
                                                if (input && input.value.trim()) {
                                                    const val = input.value.trim().toLowerCase().replace(/\s+/g, '-');
                                                    toggleArrayItem('searchTags', val);
                                                    input.value = '';
                                                }
                                            }}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {newClanData.searchTags.map(tag => (
                                            <Badge key={tag} variant="outline" className="border-cyan-500/30 text-cyan-300 flex items-center gap-1">
                                                #{tag}
                                                <button onClick={() => toggleArrayItem('searchTags', tag)} className="ml-1 text-cyan-500/50 hover:text-red-400">
                                                    ×
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 7. Recruitment & Settings */}
                        <section>
                            <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                                <Users className="w-5 h-5" /> Privacy & Recruitment
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-white/70">Recruitment Status</label>
                                    <div className="flex flex-col gap-2">
                                        {['Public', 'Request to Join', 'Invite Only'].map(status => (
                                            <div 
                                                key={status}
                                                onClick={() => setNewClanData({...newClanData, recruitmentStatus: status})}
                                                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${
                                                    newClanData.recruitmentStatus === status
                                                        ? 'bg-cyan-900/30 border-cyan-500 text-white'
                                                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newClanData.recruitmentStatus === status ? 'border-cyan-400' : 'border-white/30'}`}>
                                                    {newClanData.recruitmentStatus === status && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                                                </div>
                                                <span className="font-medium">{status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Member Limit</label>
                                        <Select 
                                            value={newClanData.sizeLimit} 
                                            onValueChange={(val) => setNewClanData({...newClanData, sizeLimit: val})}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#12141a] border-white/10 text-white">
                                                <SelectItem value="50">50 Members</SelectItem>
                                                <SelectItem value="100">100 Members</SelectItem>
                                                <SelectItem value="250">250 Members</SelectItem>
                                                <SelectItem value="9999">Unlimited</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div 
                                        className="mt-6 p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3 cursor-pointer hover:bg-white/10 transition-colors"
                                        onClick={() => setNewClanData({...newClanData, enableStronghold: !newClanData.enableStronghold})}
                                    >
                                        <div className={`w-5 h-5 mt-0.5 rounded border flex flex-shrink-0 items-center justify-center ${newClanData.enableStronghold ? 'bg-cyan-500 border-cyan-400' : 'border-white/30'}`}>
                                            {newClanData.enableStronghold && <span className="text-black font-bold text-xs">✓</span>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white mb-1">Enable Clan Stronghold</p>
                                            <p className="text-xs text-white/50">Provisions a 3D persistent lobby environment for your division to gather.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                    
                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/10 bg-black/60 flex justify-end gap-4 flex-shrink-0">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsCreateOpen(false)} 
                            className="text-white/50 hover:text-white hover:bg-white/5 px-6"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => createClanMutation.mutate(newClanData)}
                            disabled={createClanMutation.isPending || !newClanData.name}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-black tracking-wider px-10 h-12 shadow-[0_0_20px_rgba(8,145,178,0.4)]"
                        >
                            {createClanMutation.isPending ? 'ESTABLISHING...' : 'CREATE CLAN'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}