import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hash, Volume2, Plus, ChevronDown, Settings, LogOut, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

export default function ChannelList({ clan, activeChannelId, onSelectChannel }) {
    const queryClient = useQueryClient();
    const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelType, setNewChannelType] = useState('text');

    const { data: channels } = useQuery({
        queryKey: ['clanChannels', clan.id],
        queryFn: async () => {
            const res = await base44.entities.ClanChannel.filter({ divisionId: clan.id });
            // If no channels exist, maybe create default 'general' (handled in UI fallback or backend)
            // For now, if empty, we can render nothing or a default button
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
             // Hard reload or redirect handled by parent usually, but here we can invalidate
             window.location.reload(); 
        }
    });

    // Group channels by type (simplified for now, usually by category)
    const textChannels = channels?.filter(c => c.type === 'text') || [];
    const voiceChannels = channels?.filter(c => c.type === 'voice') || [];

    // Add default general if none exist and user has created none
    // (Optional enhancement, skipping for brevity)

    return (
        <div className="w-60 bg-[#2B2D31] flex flex-col h-full">
            {/* Server Header */}
            <DropdownMenu>
                <DropdownMenuTrigger className="h-12 px-4 flex items-center justify-between border-b border-[#1F2023] hover:bg-[#35373C] transition-colors font-bold text-white shadow-sm cursor-pointer outline-none">
                     <span className="truncate">{clan.name}</span>
                     <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#111214] border-[#1F2023] text-[#B5BAC1]">
                    <DropdownMenuItem className="hover:bg-[#4752C4] hover:text-white cursor-pointer" onClick={() => setIsCreateChannelOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Create Channel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#1F2023]" />
                    <DropdownMenuItem className="text-red-400 hover:bg-[#DA373C] hover:text-white cursor-pointer" onClick={() => {
                        if(confirm('Are you sure you want to delete this division? This action cannot be undone.')) {
                            deleteClanMutation.mutate();
                        }
                    }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Division
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Channels */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-6">
                
                {/* Text Channels */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-1 group text-[#949BA4] hover:text-[#dbdee1] cursor-pointer">
                        <div className="flex items-center text-xs font-bold uppercase tracking-wide">
                            <ChevronDown className="w-3 h-3 mr-0.5" /> Text Channels
                        </div>
                        <Plus className="w-4 h-4 cursor-pointer hover:text-white" onClick={() => {
                            setNewChannelType('text');
                            setIsCreateChannelOpen(true);
                        }} />
                    </div>
                    <div className="space-y-[2px]">
                        {textChannels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => onSelectChannel(channel)}
                                className={`w-full flex items-center px-2 py-[6px] rounded-md group transition-colors ${
                                    activeChannelId === channel.id 
                                        ? 'bg-[#404249] text-white' 
                                        : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#dbdee1]'
                                }`}
                            >
                                <Hash className="w-5 h-5 mr-1.5 text-[#80848E]" />
                                <span className="font-medium truncate">{channel.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Voice Channels */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-1 group text-[#949BA4] hover:text-[#dbdee1] cursor-pointer">
                        <div className="flex items-center text-xs font-bold uppercase tracking-wide">
                            <ChevronDown className="w-3 h-3 mr-0.5" /> Voice Channels
                        </div>
                        <Plus className="w-4 h-4 cursor-pointer hover:text-white" onClick={() => {
                            setNewChannelType('voice');
                            setIsCreateChannelOpen(true);
                        }} />
                    </div>
                    <div className="space-y-[2px]">
                        {voiceChannels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => onSelectChannel(channel)}
                                className={`w-full flex items-center px-2 py-[6px] rounded-md group transition-colors ${
                                    activeChannelId === channel.id 
                                        ? 'bg-[#404249] text-white' 
                                        : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#dbdee1]'
                                }`}
                            >
                                <Volume2 className="w-5 h-5 mr-1.5 text-[#80848E]" />
                                <span className="font-medium truncate">{channel.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Controls (Bottom Bar) */}
            <div className="h-[52px] bg-[#232428] px-2 flex items-center gap-2">
                 {/* User info usually goes here */}
                 <div className="flex-1">
                    <div className="text-sm font-bold text-white truncate">User</div>
                    <div className="text-xs text-[#B5BAC1]">Online</div>
                 </div>
                 <Settings className="w-5 h-5 text-[#B5BAC1] hover:text-white cursor-pointer" />
            </div>

            {/* Create Channel Modal */}
            <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                <DialogContent className="bg-[#313338] border-none text-[#dbdee1]">
                    <DialogHeader>
                        <DialogTitle className="text-white">Create Channel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                         <div>
                             <label className="text-xs font-bold text-[#B5BAC1] uppercase">Channel Type</label>
                             <div className="mt-2 space-y-2">
                                 <div 
                                    className={`p-3 rounded-md cursor-pointer flex items-center justify-between ${newChannelType === 'text' ? 'bg-[#404249]' : 'bg-[#2B2D31] hover:bg-[#35373C]'}`}
                                    onClick={() => setNewChannelType('text')}
                                 >
                                     <div className="flex items-center gap-3">
                                         <Hash className="w-6 h-6 text-[#B5BAC1]" />
                                         <div>
                                             <div className="font-medium text-white">Text</div>
                                             <div className="text-xs text-[#B5BAC1]">Send messages, images, and opinions.</div>
                                         </div>
                                     </div>
                                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newChannelType === 'text' ? 'border-white bg-white' : 'border-[#B5BAC1]'}`}>
                                         {newChannelType === 'text' && <div className="w-2.5 h-2.5 rounded-full bg-[#313338]" />}
                                     </div>
                                 </div>
                                 <div 
                                    className={`p-3 rounded-md cursor-pointer flex items-center justify-between ${newChannelType === 'voice' ? 'bg-[#404249]' : 'bg-[#2B2D31] hover:bg-[#35373C]'}`}
                                    onClick={() => setNewChannelType('voice')}
                                 >
                                     <div className="flex items-center gap-3">
                                         <Volume2 className="w-6 h-6 text-[#B5BAC1]" />
                                         <div>
                                             <div className="font-medium text-white">Voice</div>
                                             <div className="text-xs text-[#B5BAC1]">Hang out together with voice, video, and screen share.</div>
                                         </div>
                                     </div>
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newChannelType === 'voice' ? 'border-white bg-white' : 'border-[#B5BAC1]'}`}>
                                         {newChannelType === 'voice' && <div className="w-2.5 h-2.5 rounded-full bg-[#313338]" />}
                                     </div>
                                 </div>
                             </div>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-[#B5BAC1] uppercase">Channel Name</label>
                             <Input 
                                value={newChannelName}
                                onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                className="bg-[#1E1F22] border-none text-white mt-1"
                                placeholder="new-channel"
                             />
                         </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateChannelOpen(false)} className="text-white hover:underline">Cancel</Button>
                        <Button 
                            onClick={() => createChannelMutation.mutate({ name: newChannelName, type: newChannelType })}
                            className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
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