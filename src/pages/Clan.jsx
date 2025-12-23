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
    
    // Background style - Darker Light Gray
    const bgStyle = {
        backgroundColor: '#d1d5db', // gray-300
        backgroundImage: `
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(236, 72, 153, 0.04) 0px, transparent 50%)
        `,
    };

    if (isLoading) return <div className="h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading Headquarters...</div>;

    // NO CLANS STATE - LIGHT THEME
    if (!memberships || memberships.length === 0) {
        return (
            <div className="h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 gap-8 relative overflow-hidden font-sans">
                {/* Background Noise/Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50" />
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-32 h-32 rounded-3xl bg-white flex items-center justify-center shadow-xl shadow-blue-200/50 mb-6 border border-slate-100">
                        <Shield className="w-16 h-16 text-blue-600" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight text-center">No Active Divisions</h2>
                    <p className="max-w-md text-center text-lg mt-2 mb-8 text-slate-500">You are not affiliated with any elite units. Establish your own legacy today.</p>
                    <Button 
                        onClick={() => setIsCreateClanOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 text-lg rounded-full font-bold shadow-xl shadow-blue-600/20 hover:scale-105 transition-all"
                    >
                        Establish Division
                    </Button>
                </div>
                
                {/* Create Modal - Light Theme */}
                <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                    <DialogContent className="bg-white/95 backdrop-blur-2xl border border-slate-200 text-slate-900 rounded-3xl shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-center text-2xl font-black tracking-tight text-slate-900">Initialize New Division</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-6">
                             <div className="flex justify-center">
                                 <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center flex-col gap-2 cursor-pointer hover:bg-slate-50 transition-colors group">
                                     <Upload className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
                                     <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-600 tracking-widest">Icon</span>
                                 </div>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Division Name</label>
                                 <Input 
                                    value={newClanData.name}
                                    onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                    className="bg-slate-50 border-slate-200 text-slate-900 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                    placeholder="e.g. Solar Vanguard"
                                 />
                             </div>
                        </div>
                        <DialogFooter className="flex justify-between items-center">
                            <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">Cancel</Button>
                            <Button 
                                onClick={() => createClanMutation.mutate(newClanData)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20"
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
        <div className="flex h-screen w-full overflow-hidden font-sans text-slate-200 relative" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
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
            <div className="flex-1 flex min-w-0 relative z-10 shadow-inner border-l" style={{
              background: 'rgba(100, 120, 140, 0.08)',
              backdropFilter: 'blur(20px) saturate(120%)',
              WebkitBackdropFilter: 'blur(20px) saturate(120%)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                {selectedChannelId === 'overview' && activeClan ? (
                    <ClanDashboard clan={activeClan} events={events} />
                ) : selectedChannelId === 'vault' && activeClan ? (
                    <ClanVault clan={activeClan} />
                ) : activeClan && activeChannel ? (
                    <div className="flex flex-1 min-w-0">
                        <ChatArea channel={activeChannel} clan={activeClan} />
                        <MemberList clan={activeClan} />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-slate-700">Welcome to {activeClan?.name}</h2>
                            <p>Select a channel to begin communication.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Clan Modal (Global) */}
            <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                <DialogContent className="bg-white/95 backdrop-blur-2xl border border-slate-200 text-slate-900 rounded-3xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-black tracking-tight text-slate-900">Initialize New Division</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                            <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center flex-col gap-2 cursor-pointer hover:bg-slate-50 transition-colors group">
                                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
                                    <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-600 tracking-widest">Icon</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Division Name</label>
                                <Input 
                                value={newClanData.name}
                                onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                className="bg-slate-50 border-slate-200 text-slate-900 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                placeholder="e.g. Solar Vanguard"
                                />
                            </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">Cancel</Button>
                        <Button 
                            onClick={() => createClanMutation.mutate(newClanData)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20"
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