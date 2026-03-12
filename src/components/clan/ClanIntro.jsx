import React, { useState } from 'react';
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
    const [newClanData, setNewClanData] = useState({ name: '', description: '', isPrivate: false });

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


    // (duplicate hooks removed)

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

    const filteredClans = clans?.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

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
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                            <div>
                                <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                    <Shield className="w-8 h-8 text-cyan-400" />
                                    Active Divisions
                                </h2>
                                <p className="text-white/50">Find a clan that matches your playstyle or establish your own.</p>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative group w-full md:w-80">
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

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20 pr-2 custom-scrollbar">
                            {/* Create New Card (Always first) */}
                            <div 
                                onClick={() => setIsCreateOpen(true)}
                                className="group relative aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 hover:border-cyan-400/50 bg-white/5 hover:bg-cyan-950/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 p-8 text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
                                    <Plus className="w-8 h-8 text-white/40 group-hover:text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400">Create Division</h3>
                                    <p className="text-sm text-white/40">Start your own legacy</p>
                                </div>
                            </div>

                            {isLoading ? (
                                [1,2,3].map(i => (
                                    <div key={i} className="aspect-[4/3] rounded-2xl bg-white/5 animate-pulse" />
                                ))
                            ) : (
                                filteredClans.map((clan) => (
                                    <div 
                                        key={clan.id}
                                        onClick={() => {
                                            if (isMember(clan.id) && onClanJoined) {
                                                onClanJoined(clan.id);
                                            }
                                        }}
                                        className="group relative rounded-2xl bg-[#12141a] border border-white/5 hover:border-cyan-400/30 overflow-hidden transition-all hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-900/10 cursor-pointer"
                                    >
                                        {/* Banner */}
                                        <div className="h-32 bg-black/50 relative">
                                            {clan.banner ? (
                                                <img src={clan.banner} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-black" />
                                            )}
                                            <div className="absolute top-4 right-4">
                                                <Badge variant="secondary" className="bg-black/50 backdrop-blur-md border border-white/10 text-white/80">
                                                    LVL {clan.level || 1}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 relative">
                                            <div className="absolute -top-10 left-6 w-20 h-20 rounded-2xl bg-[#12141a] p-1.5 shadow-xl">
                                                <div className="w-full h-full rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                                                    {clan.icon ? (
                                                        <img src={clan.icon} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Shield className="w-8 h-8 text-white/20" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors truncate pr-2">
                                                        {clan.name}
                                                    </h3>
                                                    {clan.isPrivate ? (
                                                        <Lock className="w-4 h-4 text-white/30" />
                                                    ) : (
                                                        <Unlock className="w-4 h-4 text-green-500/50" />
                                                    )}
                                                </div>
                                                
                                                <p className="text-sm text-white/50 line-clamp-2 mb-6 h-10">
                                                    {clan.description || "No manifesto provided."}
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 text-xs font-medium text-white/40">
                                                        <span className="flex items-center gap-1.5">
                                                            <Users className="w-3 h-3" /> {clan.memberCount || 1}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Trophy className="w-3 h-3" /> {clan.reputation || 0} Rep
                                                        </span>
                                                    </div>

                                                    <Button 
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isMember(clan.id)) {
                                                                if (onClanJoined) onClanJoined(clan.id);
                                                            } else {
                                                                joinClanMutation.mutate({ clanId: clan.id, isPrivate: clan.isPrivate });
                                                            }
                                                        }}
                                                        disabled={joinClanMutation.isPending}
                                                        className={`border ${isMember(clan.id) ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'}`}
                                                    >
                                                        {isMember(clan.id) 
                                                            ? 'Enter' 
                                                            : joinClanMutation.isPending 
                                                                ? 'Processing...' 
                                                                : (clan.isPrivate ? 'Request' : 'Join')
                                                        }
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Clan Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-[#12141a] border-white/10 text-white rounded-2xl sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Establish New Division</DialogTitle>
                        <DialogDescription className="text-white/50">
                            Create a new clan to rally your allies and compete for glory.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Division Name</label>
                            <Input 
                                value={newClanData.name}
                                onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                placeholder="e.g. Shadow Vanguard"
                                className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70">Manifesto</label>
                            <Input 
                                value={newClanData.description}
                                onChange={e => setNewClanData({...newClanData, description: e.target.value})}
                                placeholder="What does your clan stand for?"
                                className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-white/50 hover:text-white">Cancel</Button>
                        <Button 
                            onClick={() => createClanMutation.mutate(newClanData)}
                            disabled={createClanMutation.isPending || !newClanData.name}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                        >
                            {createClanMutation.isPending ? 'Establishing...' : 'Initialize Division'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}