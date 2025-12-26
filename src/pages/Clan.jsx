import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Shield, Upload, LayoutGrid, MessageSquare, Users, Calendar, Target, Vote, Settings, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Components
import ClanLayout from '../components/clan/ClanLayout';
import ClanOverview from '../components/clan/ClanOverview';
import ClanChat from '../components/clan/ClanChat';
import ClanMembers from '../components/clan/ClanMembers';
import ClanEvents from '../components/clan/ClanEvents';
import ClanQuests from '../components/clan/ClanQuests';
import ClanVoting from '../components/clan/ClanVoting';

export default function ClanPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedClanId, setSelectedClanId] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [activeChannelId, setActiveChannelId] = useState(null); // For chat tab
    
    const [isCreateClanOpen, setIsCreateClanOpen] = useState(false);
    const [newClanData, setNewClanData] = useState({ name: '', description: '' });

    // 1. Fetch Memberships
    const { data: memberships, isLoading: isMembershipsLoading } = useQuery({
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

    // 2. Initial Selection Logic
    useEffect(() => {
        if (memberships?.length > 0 && !selectedClanId) {
            setSelectedClanId(memberships[0].divisionId);
        }
    }, [memberships]);

    const activeClan = memberships?.find(c => c.divisionId === selectedClanId);

    // 3. Fetch Channels (for Chat Tab)
    const { data: channels } = useQuery({
        queryKey: ['clanChannels', activeClan?.id],
        queryFn: () => base44.entities.ClanChannel.filter({ divisionId: activeClan.id }),
        enabled: !!activeClan
    });

    // Default to 'general' channel if available or ensure valid selection
    useEffect(() => {
        if (channels?.length > 0) {
            const isValid = activeChannelId && channels.find(c => c.id === activeChannelId);
            if (!isValid) {
                const general = channels.find(c => c.name === 'general') || channels[0];
                setActiveChannelId(general.id);
            }
        }
    }, [channels, activeChannelId]);

    // 4. Create Mutation
    const createClanMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('clanSystem', { action: 'create_clan', data }),
        onSuccess: (res) => {
            if (res.data.success) {
                queryClient.invalidateQueries(['myClanMemberships']);
                setIsCreateClanOpen(false);
                setSelectedClanId(res.data.division.id);
                // Also trigger channel creation on backend for 'general'
            }
        }
    });

    const TABS = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        { id: 'chat', label: 'Comms', icon: MessageSquare },
        { id: 'quests', label: 'Missions', icon: Target },
        { id: 'events', label: 'Calendar', icon: Calendar },
        { id: 'voting', label: 'Decisions', icon: Vote },
        { id: 'members', label: 'Roster', icon: Users },
    ];

    if (isMembershipsLoading) return <div className="h-screen bg-[#0f1419] flex items-center justify-center text-slate-500">Initializing Uplink...</div>;

    // --- EMPTY STATE (No Clans) ---
    if (!memberships || memberships.length === 0) {
        return (
            <div className="h-screen bg-[#0f1419] flex flex-col items-center justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center max-w-md text-center p-8">
                    <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl mb-8 backdrop-blur-xl">
                        <Shield className="w-12 h-12 text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4 tracking-tight">No Active Division</h1>
                    <p className="text-white/50 text-lg mb-8 leading-relaxed">
                        You are not currently affiliated with any operational units. Initialize a new division to begin.
                    </p>
                    <Button 
                        onClick={() => setIsCreateClanOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 text-lg rounded-xl font-bold shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all hover:scale-105"
                    >
                        Initialize Division
                    </Button>
                </div>

                {/* Create Modal */}
                <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                    <DialogContent className="bg-slate-900/95 border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>Initialize New Division</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input 
                                value={newClanData.name}
                                onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                placeholder="Division Name"
                                className="bg-slate-800 border-white/10"
                            />
                            <Input 
                                value={newClanData.description}
                                onChange={e => setNewClanData({...newClanData, description: e.target.value})}
                                placeholder="Manifesto / Description"
                                className="bg-slate-800 border-white/10"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)}>Cancel</Button>
                            <Button onClick={() => createClanMutation.mutate(newClanData)} className="bg-blue-600">Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <ClanLayout 
            activeClanId={selectedClanId} 
            onSelectClan={setSelectedClanId}
            onCreateClan={() => setIsCreateClanOpen(true)}
            userMemberships={memberships}
        >
            {activeClan ? (
                <>
                    {/* Header & Tabs */}
                    <div className="h-16 flex-shrink-0 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md z-20">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-white tracking-tight">{activeClan.name}</h1>
                            <div className="h-6 w-px bg-white/10" />
                            <nav className="flex items-center gap-1">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            activeTab === tab.id 
                                                ? 'bg-white/10 text-white' 
                                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <tab.icon className="w-3 h-3" />
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        
                        {/* Context Actions (Right) */}
                        <div className="flex items-center gap-2">
                            {/* Maybe status indicators or quick actions here */}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                                <Settings className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Main Viewport */}
                    <div className="flex-1 overflow-hidden relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                {activeTab === 'overview' && (
                                    <ClanOverview clan={activeClan} onChangeTab={setActiveTab} />
                                )}
                                {activeTab === 'chat' && channels && (
                                    <div className="flex h-full">
                                        <div className="w-48 border-r border-white/5 bg-slate-900/30 flex flex-col p-2 gap-1">
                                            {channels.map(channel => (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => setActiveChannelId(channel.id)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                                                        activeChannelId === channel.id 
                                                            ? 'bg-white/10 text-white' 
                                                            : 'text-white/40 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    <Hash className="w-3 h-3" />
                                                    {channel.name}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {channels.find(c => c.id === activeChannelId) ? (
                                                <ClanChat clan={activeClan} channel={channels.find(c => c.id === activeChannelId)} />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-white/30">Loading Channel...</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'members' && <ClanMembers clan={activeClan} />}
                                {activeTab === 'events' && <ClanEvents clan={activeClan} />}
                                {activeTab === 'quests' && <ClanQuests clan={activeClan} />}
                                {activeTab === 'voting' && <ClanVoting clan={activeClan} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-white/30">
                    <p>Select a Division</p>
                </div>
            )}

            {/* Create Modal Re-used */}
            <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                <DialogContent className="bg-slate-900/95 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Initialize New Division</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input 
                            value={newClanData.name}
                            onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                            placeholder="Division Name"
                            className="bg-slate-800 border-white/10"
                        />
                        <Input 
                            value={newClanData.description}
                            onChange={e => setNewClanData({...newClanData, description: e.target.value})}
                            placeholder="Manifesto / Description"
                            className="bg-slate-800 border-white/10"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)}>Cancel</Button>
                        <Button onClick={() => createClanMutation.mutate(newClanData)} className="bg-blue-600">Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ClanLayout>
    );
}