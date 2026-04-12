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

export default function ChannelList({ clan, activeChannelId, onSelectChannel, onSelectSpecial, myRole }) {
    const queryClient = useQueryClient();
    const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelType, setNewChannelType] = useState('text');
    const [newChannelRoleRestriction, setNewChannelRoleRestriction] = useState('none');

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

    // Everyone can SEE all channels (including restricted ones).
    // Posting restrictions are enforced inside ChatArea / ClanChat.
    // A lock icon distinguishes read-only channels for regular members.
    const canPostInChannel = (ch) => {
        const restriction = ch.role_restriction || 'none';
        if (restriction === 'none') return true;
        if (restriction === 'officer') return myRole === 'officer' || myRole === 'leader';
        if (restriction === 'leader') return myRole === 'leader';
        return true;
    };

    const textChannels = channels?.filter(c => c.type === 'text') || [];
    const voiceChannels = channels?.filter(c => c.type === 'voice') || [];

    // Guild Features Section
    const renderGuildHall = () => (
        <div className="mb-4">
             <div className="flex items-center justify-between px-3 mb-2 group text-white/40 hover:text-white/70 cursor-pointer transition-colors">
                <div className="flex items-center text-[10px] font-black uppercase tracking-widest">
                    <ChevronDown className="w-3 h-3 mr-1" /> Guild Hall
                </div>
            </div>
            <div className="space-y-[2px]">
                 <button 
                    onClick={() => onSelectSpecial('overview')}
                    className={`w-full flex items-center px-3 py-1.5 rounded-lg group transition-all duration-200 ${
                        activeChannelId === 'overview' 
                            ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30' 
                            : 'text-white/60 hover:bg-white/10 hover:text-white border border-transparent'
                    }`}
                >
                    <Home className={`w-4 h-4 mr-2 ${activeChannelId === 'overview' ? 'text-blue-400' : 'text-white/40'}`} />
                    <span className="text-sm">Dashboard</span>
                 </button>
                 <button 
                    onClick={() => onSelectSpecial('vault')}
                    className={`w-full flex items-center px-3 py-1.5 rounded-lg group transition-all duration-200 ${
                        activeChannelId === 'vault' 
                            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' 
                            : 'text-white/60 hover:bg-white/10 hover:text-white border border-transparent'
                    }`}
                >
                    <Archive className={`w-4 h-4 mr-2 ${activeChannelId === 'vault' ? 'text-amber-400' : 'text-white/40'}`} />
                    <span className="text-sm">Guild Vault</span>
                 </button>
                 <button 
                    onClick={() => onSelectSpecial('members')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg group transition-all duration-200 ${
                        activeChannelId === 'members' 
                            ? 'bg-green-500/20 text-green-300 font-bold border border-green-500/30' 
                            : 'text-white/60 hover:bg-white/10 hover:text-white border border-transparent'
                    }`}
                >
                    <div className="flex items-center">
                        <Users className={`w-4 h-4 mr-2 ${activeChannelId === 'members' ? 'text-green-400' : 'text-white/40'}`} />
                        <span className="text-sm">Members</span>
                    </div>
                    <Badge className="bg-white/10 text-white/60 text-[10px] h-5 px-1.5">{memberCount}</Badge>
                 </button>
            </div>
        </div>
    );

    return (
        <div className="w-64 bg-slate-900/60 backdrop-blur-xl border-r border-white/10 flex flex-col h-full relative z-10">
            {/* Server Header */}
            <DropdownMenu>
                <DropdownMenuTrigger className="h-14 px-4 flex items-center justify-between border-b border-white/10 hover:bg-white/5 transition-colors font-black text-white shadow-sm cursor-pointer outline-none tracking-tight">
                     <span className="truncate text-lg">{clan.name}</span>
                     <ChevronDown className="w-4 h-4 opacity-50 text-white/60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 bg-slate-800/95 backdrop-blur-xl border-white/10 text-slate-300 rounded-xl p-1 shadow-2xl">
                    <DropdownMenuLabel className="text-xs uppercase text-slate-500 tracking-widest px-2 py-2">Division Settings</DropdownMenuLabel>
                    {(myRole === 'leader' || myRole === 'officer') ? (
                        <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer rounded-lg mb-1 focus:bg-white/10 focus:text-white" onClick={() => setIsCreateChannelOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Create Channel
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem disabled className="text-white/30 cursor-not-allowed rounded-lg mb-1">
                            <Plus className="w-4 h-4 mr-2" /> Create Channel (Officers+)
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/10" />
                    {myRole === 'leader' && (
                        <DropdownMenuItem className="text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer rounded-lg focus:bg-red-500/20 focus:text-red-300" onClick={() => {
                            if(confirm('Are you sure you want to delete this division? This action cannot be undone.')) {
                                deleteClanMutation.mutate();
                            }
                        }}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Division
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Channels */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-4 space-y-6 text-white">
                
                {renderGuildHall()}

                {/* Text Channels */}
                <div>
                    <div className="flex items-center justify-between px-3 mb-2 group text-white/40 hover:text-white/70 cursor-pointer transition-colors">
                        <div className="flex items-center text-[10px] font-black uppercase tracking-widest">
                            <ChevronDown className="w-3 h-3 mr-1" /> Text Channels
                        </div>
                        {(myRole === 'leader' || myRole === 'officer') && (
                            <Plus className="w-3 h-3 hover:text-blue-400" onClick={() => {
                                setNewChannelType('text');
                                setIsCreateChannelOpen(true);
                            }} />
                        )}
                    </div>
                    <div className="space-y-[2px]">
                        {textChannels.map(channel => (
                            <ContextMenu key={channel.id}>
                                <ContextMenuTrigger>
                                    <button
                                        onClick={() => onSelectChannel(channel)}
                                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg group transition-all duration-200 ${
                                            activeChannelId === channel.id 
                                                ? 'bg-white/10 text-white font-bold' 
                                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                           <Hash className={`w-4 h-4 mr-1 flex-shrink-0 ${activeChannelId === channel.id ? 'text-white' : 'text-white/40'}`} />
                                           <span className="text-sm truncate">{channel.name}</span>
                                           {channel.role_restriction === 'officer' && (
                                             <Badge className="ml-1 h-4 px-1 bg-blue-500/15 text-blue-300/70 border-blue-500/20 text-[9px] flex-shrink-0">
                                               {canPostInChannel(channel) ? 'Officers' : '👁 Read'}
                                             </Badge>
                                           )}
                                           {channel.role_restriction === 'leader' && (
                                             <Badge className="ml-1 h-4 px-1 bg-amber-500/15 text-amber-300/70 border-amber-500/20 text-[9px] flex-shrink-0">
                                               <Crown className="w-2.5 h-2.5 mr-0.5" />
                                               {canPostInChannel(channel) ? 'Leaders' : '👁 Read'}
                                             </Badge>
                                           )}
                                        </div>
                                        {myRole === 'leader' && (
                                            <X 
                                               className="w-3 h-3 text-white/30 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all" 
                                               onClick={(e) => {
                                                   e.stopPropagation();
                                                   if(confirm(`Delete #${channel.name}?`)) {
                                                       deleteChannelMutation.mutate(channel.id);
                                                   }
                                               }}
                                            />
                                        )}
                                    </button>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="bg-slate-800/95 backdrop-blur-xl border-white/10 rounded-lg shadow-xl">
                                    {myRole === 'leader' ? (
                                        <ContextMenuItem 
                                            className="text-red-400 hover:bg-red-500/20 cursor-pointer"
                                            onClick={() => {
                                                if(confirm(`Delete #${channel.name}?`)) {
                                                    deleteChannelMutation.mutate(channel.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Channel
                                        </ContextMenuItem>
                                    ) : (
                                        <ContextMenuItem disabled className="text-white/30">
                                            Only leaders can delete channels
                                        </ContextMenuItem>
                                    )}
                                </ContextMenuContent>
                            </ContextMenu>
                        ))}
                    </div>
                </div>

                {/* Voice Channels */}
                <div>
                    <div className="flex items-center justify-between px-3 mb-2 group text-white/40 hover:text-white/70 cursor-pointer transition-colors">
                        <div className="flex items-center text-[10px] font-black uppercase tracking-widest">
                            <ChevronDown className="w-3 h-3 mr-1" /> Voice Channels
                        </div>
                        {(myRole === 'leader' || myRole === 'officer') && (
                            <Plus className="w-3 h-3 hover:text-blue-400" onClick={() => {
                                setNewChannelType('voice');
                                setIsCreateChannelOpen(true);
                            }} />
                        )}
                    </div>
                    <div className="space-y-[2px]">
                        {voiceChannels.map(channel => (
                            <ContextMenu key={channel.id}>
                                <ContextMenuTrigger>
                                    <button
                                        onClick={() => onSelectChannel(channel)}
                                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg group transition-all duration-200 ${
                                            activeChannelId === channel.id 
                                                ? 'bg-white/10 text-white font-bold' 
                                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <Volume2 className={`w-4 h-4 mr-2 ${activeChannelId === channel.id ? 'text-white' : 'text-white/40'}`} />
                                            <span className="text-sm truncate">{channel.name}</span>
                                        </div>
                                        {myRole === 'leader' && (
                                            <X 
                                                className="w-3 h-3 text-white/30 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(confirm(`Delete ${channel.name}?`)) {
                                                        deleteChannelMutation.mutate(channel.id);
                                                    }
                                                }}
                                            />
                                        )}
                                    </button>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="bg-slate-800/95 backdrop-blur-xl border-white/10 rounded-lg shadow-xl">
                                    {myRole === 'leader' ? (
                                        <ContextMenuItem 
                                            className="text-red-400 hover:bg-red-500/20 cursor-pointer"
                                            onClick={() => {
                                                if(confirm(`Delete ${channel.name}?`)) {
                                                    deleteChannelMutation.mutate(channel.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Channel
                                        </ContextMenuItem>
                                    ) : (
                                        <ContextMenuItem disabled className="text-white/30">
                                            Only leaders can delete channels
                                        </ContextMenuItem>
                                    )}
                                </ContextMenuContent>
                            </ContextMenu>
                        ))}
                    </div>
                </div>
            </div>



            {/* Create Channel Modal */}
            <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">Create Channel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                         <div>
                             <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Channel Type</label>
                             <div className="space-y-2">
                                 <div 
                                    className={`p-4 rounded-xl cursor-pointer flex items-center justify-between border transition-all ${newChannelType === 'text' ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                    onClick={() => setNewChannelType('text')}
                                 >
                                     <div className="flex items-center gap-4">
                                         <Hash className={`w-6 h-6 ${newChannelType === 'text' ? 'text-blue-400' : 'text-white/40'}`} />
                                         <div>
                                             <div className="font-bold text-white">Text Channel</div>
                                             <div className="text-xs text-white/50">Post images, GIFs, stickers, and opinions.</div>
                                         </div>
                                     </div>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newChannelType === 'text' ? 'border-blue-400' : 'border-white/30'}`}>
                                         {newChannelType === 'text' && <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />}
                                     </div>
                                 </div>
                                 <div 
                                    className={`p-4 rounded-xl cursor-pointer flex items-center justify-between border transition-all ${newChannelType === 'voice' ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                    onClick={() => setNewChannelType('voice')}
                                 >
                                     <div className="flex items-center gap-4">
                                         <Volume2 className={`w-6 h-6 ${newChannelType === 'voice' ? 'text-blue-400' : 'text-white/40'}`} />
                                         <div>
                                             <div className="font-bold text-white">Voice Channel</div>
                                             <div className="text-xs text-white/50">Hang out together with voice, video, and screen share.</div>
                                         </div>
                                     </div>
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newChannelType === 'voice' ? 'border-blue-400' : 'border-white/30'}`}>
                                         {newChannelType === 'voice' && <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />}
                                     </div>
                                 </div>
                             </div>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Channel Name</label>
                             <Input 
                                value={newChannelName}
                                onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                className="bg-white/10 border-white/20 text-white h-11 focus:ring-2 focus:ring-blue-500/30 placeholder:text-white/30"
                                placeholder="new-channel"
                             />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Access Restriction</label>
                             <div className="space-y-2">
                                 {[
                                     { value: 'none', label: 'Everyone', desc: 'All members can view and chat' },
                                     { value: 'officer', label: 'Officers & Leaders Only', desc: 'Regular members cannot see this channel' },
                                     { value: 'leader', label: 'Leaders Only', desc: 'Only clan leaders can access' },
                                 ].map(opt => (
                                     <div
                                         key={opt.value}
                                         className={`p-3 rounded-xl cursor-pointer flex items-center justify-between border transition-all ${newChannelRoleRestriction === opt.value ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                         onClick={() => setNewChannelRoleRestriction(opt.value)}
                                     >
                                         <div>
                                             <div className="font-bold text-white text-sm flex items-center gap-2">
                                                 {opt.value === 'leader' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                                                 {opt.label}
                                             </div>
                                             <div className="text-[11px] text-white/40">{opt.desc}</div>
                                         </div>
                                         <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newChannelRoleRestriction === opt.value ? 'border-blue-400' : 'border-white/30'}`}>
                                             {newChannelRoleRestriction === opt.value && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateChannelOpen(false)} className="text-white/60 hover:bg-white/10 hover:text-white">Cancel</Button>
                        <Button 
                            onClick={() => createChannelMutation.mutate({ name: newChannelName, type: newChannelType, role_restriction: newChannelRoleRestriction })}
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