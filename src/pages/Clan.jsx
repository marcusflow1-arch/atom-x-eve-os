import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { Shield, Plus, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ServerList from '../components/clan/ServerList';
import ChannelList from '../components/clan/ChannelList';
import ChatArea from '../components/clan/ChatArea';
import MemberList from '../components/clan/MemberList';
import ClanDashboard from '../components/clan/ClanDashboard';
import ClanVault from '../components/clan/ClanVault';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ClanPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedClanId, setSelectedClanId] = useState(null);
    const [selectedChannelId, setSelectedChannelId] = useState('overview'); // Default to dashboard
    const [isCreateClanOpen, setIsCreateClanOpen] = useState(false);
    const [newClanData, setNewClanData] = useState({ name: '', description: '' });

    // Fetch user memberships
    const { data: memberships, isLoading } = useQuery({
        queryKey: ['myClanMembershipsInitial', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const members = await base44.entities.ClanMember.filter({ userId: user.id });
            const divisions = await Promise.all(members.map(async (m) => {
                return await base44.entities.Division.get(m.divisionId);
            }));
            const validDivisions = divisions.filter(d => d);
            if (validDivisions.length > 0 && !selectedClanId) {
                setSelectedClanId(validDivisions[0].id);
            }
            return validDivisions;
        },
        enabled: !!user
    });

    const activeClan = memberships?.find(c => c.id === selectedClanId) || memberships?.[0];

    // Fetch channels
    const { data: channels } = useQuery({
        queryKey: ['clanChannelsInitial', activeClan?.id],
        queryFn: async () => {
            if (!activeClan) return [];
            return await base44.entities.ClanChannel.filter({ divisionId: activeClan.id });
        },
        enabled: !!activeClan
    });
    
    // Fetch Events for Dashboard
    const { data: events } = useQuery({
        queryKey: ['clanEventsDashboard', activeClan?.id],
        queryFn: async () => {
            if (!activeClan) return [];
            return await base44.entities.ClanEvent.filter({ divisionId: activeClan.id });
        },
        enabled: !!activeClan
    });

    const createClanMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('clanSystem', { action: 'create_clan', data }),
        onSuccess: (res) => {
            if (res.data.success) {
                queryClient.invalidateQueries(['myClanMembershipsInitial']);
                setIsCreateClanOpen(false);
                setSelectedClanId(res.data.division.id); 
                base44.functions.invoke('clanSystem', { action: 'create_channel', data: { divisionId: res.data.division.id, name: 'general', type: 'text' } });
            }
        }
    });

    const activeChannel = channels?.find(c => c.id === selectedChannelId);
    
    // Background style
    const bgStyle = {
        backgroundImage: 'url("https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    if (isLoading) return <div className="h-screen bg-black flex items-center justify-center text-white">Initializing Interface...</div>;

    // NO CLANS STATE
    if (!memberships || memberships.length === 0) {
        return (
            <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-8 relative overflow-hidden">
                {/* Background Noise/Gradient */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6 border border-white/10">
                        <Shield className="w-16 h-16 text-white" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight text-center">No Active Divisions</h2>
                    <p className="max-w-md text-center text-lg mt-2 mb-8 text-slate-400">You are not affiliated with any elite units. Establish your own legacy today.</p>
                    <Button 
                        onClick={() => setIsCreateClanOpen(true)}
                        className="bg-white text-black hover:bg-slate-200 px-10 py-6 text-lg rounded-full font-bold shadow-xl hover:scale-105 transition-all"
                    >
                        Establish Division
                    </Button>
                </div>
                
                {/* Create Modal */}
                <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                    <DialogContent className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 text-white rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <DialogHeader>
                            <DialogTitle className="text-center text-2xl font-black tracking-tight">Initialize New Division</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-6">
                             <div className="flex justify-center">
                                 <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center flex-col gap-2 cursor-pointer hover:bg-white/5 transition-colors group">
                                     <Upload className="w-6 h-6 text-white/40 group-hover:text-white" />
                                     <span className="text-[10px] font-bold uppercase text-white/40 group-hover:text-white tracking-widest">Icon</span>
                                 </div>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Division Name</label>
                                 <Input 
                                    value={newClanData.name}
                                    onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                    className="bg-black/40 border-white/10 text-white h-12 rounded-xl focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="e.g. Solar Vanguard"
                                 />
                             </div>
                        </div>
                        <DialogFooter className="flex justify-between items-center">
                            <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)} className="text-white/60 hover:text-white">Cancel</Button>
                            <Button 
                                onClick={() => createClanMutation.mutate(newClanData)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                                disabled={!newClanData.name}
                            >
                                Create Division
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden font-sans bg-slate-950 text-white relative">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
                <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={bgStyle} />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" /> 
            </div>

            {/* 1. Server List (Left) */}
            <ServerList 
                activeClanId={activeClan?.id} 
                onSelectClan={(clan) => {
                    setSelectedClanId(clan.id);
                    setSelectedChannelId('overview'); // Reset to dashboard on switch
                }}
                onCreateClan={() => setIsCreateClanOpen(true)}
            />

            {/* 2. Channel List */}
            {activeClan && (
                <ChannelList 
                    clan={activeClan}
                    activeChannelId={selectedChannelId}
                    onSelectChannel={(channel) => setSelectedChannelId(channel.id)}
                    onSelectSpecial={(id) => setSelectedChannelId(id)}
                />
            )}

            {/* 3. Main Content Area */}
            <div className="flex-1 flex min-w-0 relative z-10 bg-black/20 backdrop-blur-sm">
                {selectedChannelId === 'overview' && activeClan ? (
                    <ClanDashboard clan={activeClan} events={events} />
                ) : selectedChannelId === 'vault' && activeClan ? (
                    <ClanVault />
                ) : activeClan && activeChannel ? (
                    <div className="flex flex-1 min-w-0">
                        <ChatArea channel={activeChannel} clan={activeClan} />
                        <MemberList clan={activeClan} />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-white/20">
                        <div className="text-center">
                            <h2 className="text-xl font-bold">Welcome to {activeClan?.name}</h2>
                            <p>Select a channel to begin communication.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Clan Modal (Global) */}
            <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                <DialogContent className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 text-white rounded-3xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-black tracking-tight">Initialize New Division</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                            <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center flex-col gap-2 cursor-pointer hover:bg-white/5 transition-colors group">
                                    <Upload className="w-6 h-6 text-white/40 group-hover:text-white" />
                                    <span className="text-[10px] font-bold uppercase text-white/40 group-hover:text-white tracking-widest">Icon</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Division Name</label>
                                <Input 
                                value={newClanData.name}
                                onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                className="bg-black/40 border-white/10 text-white h-12 rounded-xl focus:ring-2 focus:ring-blue-500/50"
                                placeholder="e.g. Solar Vanguard"
                                />
                            </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)} className="text-white/60 hover:text-white">Cancel</Button>
                        <Button 
                            onClick={() => createClanMutation.mutate(newClanData)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                            disabled={!newClanData.name}
                        >
                            Create Division
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}