import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hash, Volume2, Plus, ChevronDown, Settings, LogOut, Trash2, Home, Archive, Calendar, Crown, Users, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export default function ChannelList({ clan, activeChannelId, onSelectChannel, onSelectSpecial }) {
    const queryClient = useQueryClient();
    const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelType, setNewChannelType] = useState('text');

    const { data: channels } = useQuery({
        queryKey: ['clanChannels', clan.id],
        queryFn: async () => {
            const res = await base44.entities.ClanChannel.filter({ divisionId: clan.id });
            return res.sort((a, b) => a.position - b.position);
        }
    });

    const createChannelMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('clanSystem', { action: 'create_channel', data: { divisionId: clan.id, ...data } }),
        onSuccess: () => {
            queryClient.invalidateQueries(['clanChannels']);
            setIsCreateChannelOpen(false);
            setNewChannelName('');
        }
    });

    const deleteClanMutation = useMutation({
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'delete_clan', data: { divisionId: clan.id } }),
        onSuccess: () => {
             window.location.reload(); 
        }
    });

    const deleteChannelMutation = useMutation({
        mutationFn: (channelId) => base44.entities.ClanChannel.delete(channelId),
        onSuccess: () => {
            queryClient.invalidateQueries(['clanChannels']);
        }
    });

    // Fetch member count
    const { data: members } = useQuery({
        queryKey: ['clanMembersCount', clan.id],
        queryFn: async () => {
            return await base44.entities.ClanMember.filter({ divisionId: clan.id });
        }
    });

    const memberCount = members?.length || 0;

    const textChannels = channels?.filter(c => c.type === 'text') || [];
    const voiceChannels = channels?.filter(c => c.type === 'voice') || [];

    // Guild Features Section
    const renderGuildHall = () => (
        <div className="mb-4">
             <div className="flex items-center justify-between px-3 mb-2 group text-slate-400 hover:text-slate-800 cursor-pointer transition-colors">
                <div className="flex items-center text-[10px] font-black uppercase tracking-widest">
                    <ChevronDown className="w-3 h-3 mr-1" /> Guild Hall
                </div>
            </div>
            <div className="space-y-[2px]">
                 <button 
                    onClick={() => onSelectSpecial('overview')}
                    className={`w-full flex items-center px-3 py-1.5 rounded-lg group transition-all duration-200 ${
                        activeChannelId === 'overview' 
                            ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }`}
                >
                    <Home className={`w-4 h-4 mr-2 ${activeChannelId === 'overview' ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span className="text-sm">Dashboard</span>
                 </button>
                 <button 
                    onClick={() => onSelectSpecial('vault')}
                    className={`w-full flex items-center px-3 py-1.5 rounded-lg group transition-all duration-200 ${
                        activeChannelId === 'vault' 
                            ? 'bg-amber-50 text-amber-600 font-bold border border-amber-100 shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }`}
                >
                    <Archive className={`w-4 h-4 mr-2 ${activeChannelId === 'vault' ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span className="text-sm">Guild Vault</span>
                 </button>
            </div>
        </div>
    );

    return (
        <div className="w-64 bg-white/70 backdrop-blur-xl border-r border-slate-200/60 flex flex-col h-full relative z-10 shadow-sm">
            {/* Server Header */}
            <DropdownMenu>
                <DropdownMenuTrigger className="h-14 px-4 flex items-center justify-between border-b border-slate-200/60 hover:bg-slate-50/50 transition-colors font-black text-slate-800 shadow-sm cursor-pointer outline-none tracking-tight">
                     <span className="truncate text-lg">{clan.name}</span>
                     <ChevronDown className="w-4 h-4 opacity-50 text-slate-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 bg-white border-slate-200 text-slate-600 rounded-xl p-1 shadow-2xl">
                    <DropdownMenuLabel className="text-xs uppercase text-slate-400 tracking-widest px-2 py-2">Division Settings</DropdownMenuLabel>
                    <DropdownMenuItem className="hover:bg-blue-50 hover:text-blue-600 cursor-pointer rounded-lg mb-1 focus:bg-blue-50 focus:text-blue-600" onClick={() => setIsCreateChannelOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Create Channel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem className="text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer rounded-lg focus:bg-red-50 focus:text-red-600" onClick={() => {
                        if(confirm('Are you sure you want to delete this division? This action cannot be undone.')) {
                            deleteClanMutation.mutate();
                        }
                    }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Division
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Channels */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-4 space-y-6">
                
                {renderGuildHall()}

                {/* Text Channels */}
                <div>
                    <div className="flex items-center justify-between px-3 mb-2 group text-slate-400 hover:text-slate-800 cursor-pointer transition-colors">
                        <div className="flex items-center text-[10px] font-black uppercase tracking-widest">
                            <ChevronDown className="w-3 h-3 mr-1" /> Text Channels
                        </div>
                        <Plus className="w-3 h-3 hover:text-blue-600" onClick={() => {
                            setNewChannelType('text');
                            setIsCreateChannelOpen(true);
                        }} />
                    </div>
                    <div className="space-y-[2px]">
                        {textChannels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => onSelectChannel(channel)}
                                className={`w-full flex items-center px-3 py-1.5 rounded-lg group transition-all duration-200 ${
                                    activeChannelId === channel.id 
                                        ? 'bg-slate-100 text-slate-900 font-bold' 
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <Hash className={`w-4 h-4 mr-2 ${activeChannelId === channel.id ? 'text-slate-800' : 'text-slate-400'}`} />
                                <span className="text-sm truncate">{channel.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Voice Channels */}
                <div>
                    <div className="flex items-center justify-between px-3 mb-2 group text-slate-400 hover:text-slate-800 cursor-pointer transition-colors">
                        <div className="flex items-center text-[10px] font-black uppercase tracking-widest">
                            <ChevronDown className="w-3 h-3 mr-1" /> Voice Channels
                        </div>
                        <Plus className="w-3 h-3 hover:text-blue-600" onClick={() => {
                            setNewChannelType('voice');
                            setIsCreateChannelOpen(true);
                        }} />
                    </div>
                    <div className="space-y-[2px]">
                        {voiceChannels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => onSelectChannel(channel)}
                                className={`w-full flex items-center px-3 py-1.5 rounded-lg group transition-all duration-200 ${
                                    activeChannelId === channel.id 
                                        ? 'bg-slate-100 text-slate-900 font-bold' 
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <Volume2 className={`w-4 h-4 mr-2 ${activeChannelId === channel.id ? 'text-slate-800' : 'text-slate-400'}`} />
                                <span className="text-sm truncate">{channel.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>



            {/* Create Channel Modal */}
            <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                <DialogContent className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Create Channel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Channel Type</label>
                             <div className="space-y-2">
                                 <div 
                                    className={`p-4 rounded-xl cursor-pointer flex items-center justify-between border transition-all ${newChannelType === 'text' ? 'bg-blue-50 border-blue-500/50 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                                    onClick={() => setNewChannelType('text')}
                                 >
                                     <div className="flex items-center gap-4">
                                         <Hash className={`w-6 h-6 ${newChannelType === 'text' ? 'text-blue-500' : 'text-slate-400'}`} />
                                         <div>
                                             <div className="font-bold text-slate-900">Text Channel</div>
                                             <div className="text-xs text-slate-500">Post images, GIFs, stickers, and opinions.</div>
                                         </div>
                                     </div>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newChannelType === 'text' ? 'border-blue-500' : 'border-slate-300'}`}>
                                         {newChannelType === 'text' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                     </div>
                                 </div>
                                 <div 
                                    className={`p-4 rounded-xl cursor-pointer flex items-center justify-between border transition-all ${newChannelType === 'voice' ? 'bg-blue-50 border-blue-500/50 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                                    onClick={() => setNewChannelType('voice')}
                                 >
                                     <div className="flex items-center gap-4">
                                         <Volume2 className={`w-6 h-6 ${newChannelType === 'voice' ? 'text-blue-500' : 'text-slate-400'}`} />
                                         <div>
                                             <div className="font-bold text-slate-900">Voice Channel</div>
                                             <div className="text-xs text-slate-500">Hang out together with voice, video, and screen share.</div>
                                         </div>
                                     </div>
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newChannelType === 'voice' ? 'border-blue-500' : 'border-slate-300'}`}>
                                         {newChannelType === 'voice' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                     </div>
                                 </div>
                             </div>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Channel Name</label>
                             <Input 
                                value={newChannelName}
                                onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                className="bg-slate-50 border-slate-200 text-slate-900 h-11 focus:ring-2 focus:ring-blue-500/20"
                                placeholder="new-channel"
                             />
                         </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateChannelOpen(false)} className="text-slate-500 hover:bg-slate-100 hover:text-slate-900">Cancel</Button>
                        <Button 
                            onClick={() => createChannelMutation.mutate({ name: newChannelName, type: newChannelType })}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                            disabled={!newChannelName}
                        >
                            Create Channel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}