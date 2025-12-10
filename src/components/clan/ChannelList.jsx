import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hash, Volume2, Plus, ChevronDown, Settings, LogOut, Trash2, Home, Archive, Calendar, Crown } from 'lucide-react';
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

    const textChannels = channels?.filter(c => c.type === 'text') || [];
    const voiceChannels = channels?.filter(c => c.type === 'voice') || [];

    // Guild Features Section
    const renderGuildHall = () => (
        <div className="mb-4">
             <div className="flex items-center justify-between px-3 mb-2 group text-white/40 hover:text-white/80 cursor-pointer transition-colors">
                <div className="flex items-center text-[10px] font-black uppercase tracking-widest">
                    <ChevronDown className="w-3 h-3 mr-1" /> Guild Hall
                </div>
            </div>
            <div className="space-y-[2px]">
                 <button 
                    onClick={() => onSelectSpecial('overview')}
                    className={`w-full flex items-center px-3 py-1.5 rounded-lg group transition-all duration-200 ${
                        activeChannelId === 'overview' 
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                >
                    <Home className="w-4 h-4 mr-2" />
                    <span className="font-bold text-sm">Dashboard</span>
                 </button>
                 <button 
                    onClick={() => onSelectSpecial('vault')}
                    className={`w-full flex items-center px-3 py-1.5 rounded-lg group transition-all duration-200 ${
                        activeChannelId === 'vault' 
                            ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                >
                    <Archive className="w-4 h-4 mr-2" />
                    <span className="font-bold text-sm">Guild Vault</span>
                 </button>
            </div>
        </div>
    );

    return (
        <div className="w-64 bg-slate-900/60 backdrop-blur-xl border-r border-white/5 flex flex-col h-full relative z-10">
            {/* Server Header */}
            <DropdownMenu>
                <DropdownMenuTrigger className="h-14 px-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors font-black text-white shadow-sm cursor-pointer outline-none tracking-tight">
                     <span className="truncate text-lg">{clan.name}</span>
                     <ChevronDown className="w-4 h-4 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 bg-black/90 backdrop-blur-xl border-white/10 text-slate-300 rounded-xl p-1 shadow-2xl">
                    <DropdownMenuLabel className="text-xs uppercase text-white/30 tracking-widest px-2 py-2">Division Settings</DropdownMenuLabel>
                    <DropdownMenuItem className="hover:bg-blue-600 hover:text-white cursor-pointer rounded-lg mb-1 focus:bg-blue-600 focus:text-white" onClick={() => setIsCreateChannelOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Create Channel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer rounded-lg focus:bg-red-500/10 focus:text-red-300" onClick={() => {
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
                    <div className="flex items-center justify-between px-3 mb-2 group text-white/40 hover:text-white/80 cursor-pointer transition-colors">
                        <div className="flex items-center text-[10px] font-black uppercase tracking-widest">
                            <ChevronDown className="w-3 h-3 mr-1" /> Text Channels
                        </div>
                        <Plus className="w-3 h-3 hover:text-white" onClick={() => {
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
                                        ? 'bg-white/10 text-white' 
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <Hash className="w-4 h-4 mr-2 opacity-50" />
                                <span className="font-medium text-sm truncate">{channel.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Voice Channels */}
                <div>
                    <div className="flex items-center justify-between px-3 mb-2 group text-white/40 hover:text-white/80 cursor-pointer transition-colors">
                        <div className="flex items-center text-[10px] font-black uppercase tracking-widest">
                            <ChevronDown className="w-3 h-3 mr-1" /> Voice Channels
                        </div>
                        <Plus className="w-3 h-3 hover:text-white" onClick={() => {
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
                                        ? 'bg-white/10 text-white' 
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <Volume2 className="w-4 h-4 mr-2 opacity-50" />
                                <span className="font-medium text-sm truncate">{channel.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Panel */}
            <div className="h-14 bg-black/40 backdrop-blur-md px-3 flex items-center gap-2 border-t border-white/5">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border border-white/20 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">Commander</div>
                    <div className="text-[10px] text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                    </div>
                 </div>
                 <Settings className="w-4 h-4 text-white/40 hover:text-white cursor-pointer" />
            </div>

            {/* Create Channel Modal */}
            <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle>Create Channel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Channel Type</label>
                             <div className="space-y-2">
                                 <div 
                                    className={`p-4 rounded-xl cursor-pointer flex items-center justify-between border transition-all ${newChannelType === 'text' ? 'bg-blue-600/10 border-blue-500/50' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                                    onClick={() => setNewChannelType('text')}
                                 >
                                     <div className="flex items-center gap-4">
                                         <Hash className="w-6 h-6 text-slate-400" />
                                         <div>
                                             <div className="font-bold text-white">Text Channel</div>
                                             <div className="text-xs text-slate-400">Post images, GIFs, stickers, and opinions.</div>
                                         </div>
                                     </div>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newChannelType === 'text' ? 'border-blue-500' : 'border-slate-600'}`}>
                                         {newChannelType === 'text' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                     </div>
                                 </div>
                                 <div 
                                    className={`p-4 rounded-xl cursor-pointer flex items-center justify-between border transition-all ${newChannelType === 'voice' ? 'bg-blue-600/10 border-blue-500/50' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                                    onClick={() => setNewChannelType('voice')}
                                 >
                                     <div className="flex items-center gap-4">
                                         <Volume2 className="w-6 h-6 text-slate-400" />
                                         <div>
                                             <div className="font-bold text-white">Voice Channel</div>
                                             <div className="text-xs text-slate-400">Hang out together with voice, video, and screen share.</div>
                                         </div>
                                     </div>
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newChannelType === 'voice' ? 'border-blue-500' : 'border-slate-600'}`}>
                                         {newChannelType === 'voice' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                     </div>
                                 </div>
                             </div>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Channel Name</label>
                             <Input 
                                value={newChannelName}
                                onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                className="bg-black/40 border-white/10 text-white h-11"
                                placeholder="new-channel"
                             />
                         </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateChannelOpen(false)} className="text-white/60 hover:text-white">Cancel</Button>
                        <Button 
                            onClick={() => createChannelMutation.mutate({ name: newChannelName, type: newChannelType })}
                            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
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