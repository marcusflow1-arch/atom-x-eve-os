import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { Shield, Plus } from 'lucide-react';
import ServerList from '../components/clan/ServerList';
import ChannelList from '../components/clan/ChannelList';
import ChatArea from '../components/clan/ChatArea';
import MemberList from '../components/clan/MemberList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Use new components to build the page
export default function ClanPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedClanId, setSelectedClanId] = useState(null);
    const [selectedChannelId, setSelectedChannelId] = useState(null);
    const [isCreateClanOpen, setIsCreateClanOpen] = useState(false);
    const [newClanData, setNewClanData] = useState({ name: '', description: '' });

    // Fetch user memberships to determine initial state
    const { data: memberships, isLoading } = useQuery({
        queryKey: ['myClanMembershipsInitial', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const members = await base44.entities.ClanMember.filter({ userId: user.id });
            const divisions = await Promise.all(members.map(async (m) => {
                return await base44.entities.Division.get(m.divisionId);
            }));
            const validDivisions = divisions.filter(d => d);
            // Default select first clan
            if (validDivisions.length > 0 && !selectedClanId) {
                setSelectedClanId(validDivisions[0].id);
            }
            return validDivisions;
        },
        enabled: !!user
    });

    const activeClan = memberships?.find(c => c.id === selectedClanId) || memberships?.[0];

    // Fetch channels for active clan to default select
    const { data: channels } = useQuery({
        queryKey: ['clanChannelsInitial', activeClan?.id],
        queryFn: async () => {
            if (!activeClan) return [];
            return await base44.entities.ClanChannel.filter({ divisionId: activeClan.id });
        },
        enabled: !!activeClan
    });

    useEffect(() => {
        if (channels && channels.length > 0 && !selectedChannelId) {
            // Prefer 'general' if exists, otherwise first
            const general = channels.find(c => c.name === 'general');
            setSelectedChannelId(general ? general.id : channels[0].id);
        } else if (channels && channels.length === 0) {
            // No channels, maybe we should create one? Or handle in UI
            setSelectedChannelId(null);
        } else if (activeClan && channels && !channels.find(c => c.id === selectedChannelId)) {
             // If switched clan, reset channel
             const general = channels.find(c => c.name === 'general');
             setSelectedChannelId(general ? general.id : channels[0].id);
        }
    }, [channels, activeClan]);


    const createClanMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('clanSystem', { action: 'create_clan', data }),
        onSuccess: (res) => {
            if (res.data.success) {
                queryClient.invalidateQueries(['myClanMembershipsInitial']);
                setIsCreateClanOpen(false);
                setSelectedClanId(res.data.division.id); // Switch to new clan
                // Create default 'general' channel for new clan (optional, maybe backend should do it)
                base44.functions.invoke('clanSystem', { action: 'create_channel', data: { divisionId: res.data.division.id, name: 'general', type: 'text' } });
            }
        }
    });

    const activeChannel = channels?.find(c => c.id === selectedChannelId);

    if (isLoading) return <div className="h-screen bg-[#313338] flex items-center justify-center text-white">Loading...</div>;

    // NO CLANS STATE
    if (!memberships || memberships.length === 0) {
        return (
            <div className="h-screen bg-[#313338] flex flex-col items-center justify-center text-[#B5BAC1] gap-6">
                <Shield className="w-24 h-24 opacity-20" />
                <h2 className="text-2xl font-bold text-white">You are not in any divisions yet</h2>
                <Button 
                    onClick={() => setIsCreateClanOpen(true)}
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-6 text-lg rounded-md"
                >
                    Create Your First Division
                </Button>
                
                {/* Create Clan Modal (Reusable) */}
                <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                    <DialogContent className="bg-[#313338] border-none text-[#dbdee1]">
                        <DialogHeader>
                            <DialogTitle className="text-white text-center text-2xl font-bold">Customize Your Server</DialogTitle>
                            <p className="text-center text-[#B5BAC1]">Give your new server a personality with a name and an icon. You can always change it later.</p>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                             <div className="flex justify-center">
                                 <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#B5BAC1] flex items-center justify-center flex-col gap-2 cursor-pointer hover:bg-[#2B2D31]">
                                     <Plus className="w-8 h-8" />
                                     <span className="text-xs font-bold uppercase">Upload</span>
                                 </div>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-[#B5BAC1] uppercase">Server Name</label>
                                 <Input 
                                    value={newClanData.name}
                                    onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                    className="bg-[#1E1F22] border-none text-white mt-1 h-10"
                                    placeholder={`${user?.username || 'User'}'s Server`}
                                 />
                             </div>
                        </div>
                        <DialogFooter className="bg-[#2B2D31] -mx-6 -mb-6 p-4 flex justify-between items-center">
                            <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)} className="text-white hover:underline">Back</Button>
                            <Button 
                                onClick={() => createClanMutation.mutate(newClanData)}
                                className="bg-[#5865F2] hover:bg-[#4752C4] text-white w-24"
                                disabled={!newClanData.name}
                            >
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden font-sans">
            {/* 1. Server List (Left) */}
            <ServerList 
                activeClanId={activeClan?.id} 
                onSelectClan={(clan) => {
                    setSelectedClanId(clan.id);
                    // Reset channel when switching server
                    setSelectedChannelId(null); 
                }}
                onCreateClan={() => setIsCreateClanOpen(true)}
            />

            {/* 2. Channel List (Secondary Left) */}
            {activeClan && (
                <ChannelList 
                    clan={activeClan}
                    activeChannelId={selectedChannelId}
                    onSelectChannel={(channel) => setSelectedChannelId(channel.id)}
                />
            )}

            {/* 3. Main Chat Area */}
            {activeClan && (
                <ChatArea 
                    channel={activeChannel}
                    clan={activeClan}
                />
            )}

            {/* 4. Member List (Right) */}
            {activeClan && (
                <MemberList clan={activeClan} />
            )}


            {/* Create Clan Modal (Global) */}
            <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                <DialogContent className="bg-[#313338] border-none text-[#dbdee1]">
                    <DialogHeader>
                        <DialogTitle className="text-white text-center text-2xl font-bold">Customize Your Server</DialogTitle>
                        <p className="text-center text-[#B5BAC1]">Give your new server a personality with a name and an icon. You can always change it later.</p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                            <div className="flex justify-center">
                                <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#B5BAC1] flex items-center justify-center flex-col gap-2 cursor-pointer hover:bg-[#2B2D31]">
                                    <Plus className="w-8 h-8" />
                                    <span className="text-xs font-bold uppercase">Upload</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#B5BAC1] uppercase">Server Name</label>
                                <Input 
                                value={newClanData.name}
                                onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                className="bg-[#1E1F22] border-none text-white mt-1 h-10"
                                placeholder={`${user?.username || 'User'}'s Server`}
                                />
                            </div>
                    </div>
                    <DialogFooter className="bg-[#2B2D31] -mx-6 -mb-6 p-4 flex justify-between items-center">
                        <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)} className="text-white hover:underline">Back</Button>
                        <Button 
                            onClick={() => createClanMutation.mutate(newClanData)}
                            className="bg-[#5865F2] hover:bg-[#4752C4] text-white w-24"
                            disabled={!newClanData.name}
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}