import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEntitySubscription } from '@/components/clan/shared/useEntitySubscription';
import { 
    Mic, MicOff, Headphones, User, Plus, X, 
    Volume2, Radio, Users, LogOut, Lock, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { useWebRTCVoice } from '@/components/shared/useWebRTCVoice';

export default function VoiceRoomManager({ clanId, gameId }) {
    const { user, updatePresenceContext } = useAuth();
    const [activeRoomId, setActiveRoomId] = useState(null);
    const isClanWide = !gameId; // If no gameId, it's clan-wide

    useEffect(() => {
        if (activeRoomId) {
            const room = rooms.find(r => r.id === activeRoomId);
            base44.auth.updateMe({ voice_room_id: activeRoomId });
        } else {
            base44.auth.updateMe({ voice_room_id: null });
        }
    }, [activeRoomId]);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);

    const activeRoom = rooms.find(r => r.id === activeRoomId);
    const participantIds = activeRoom?.participants?.map(p => p.id) || [];
    useWebRTCVoice(activeRoomId, user, isMuted, isDeafened, participantIds);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newRoomTopic, setNewRoomTopic] = useState('');
    const [previewRoomId, setPreviewRoomId] = useState(null);
    
    // New Room Config State
    const [isPrivate, setIsPrivate] = useState(false);
    const [maxUsers, setMaxUsers] = useState(10);
    const [linkedObjective, setLinkedObjective] = useState('');

    const queryClient = useQueryClient();

    // Import hook if not already imported (it's not at top level, assuming standard import behaviour or using dynamic import?) 
    // Wait, I can't import inside function. I missed adding the import statement at the top.
    // I will fix imports in a separate call or do it here if possible.
    // Let's assume I will fix imports next.
    
    const { data: rooms = [] } = useQuery({
        queryKey: ['voiceRooms', clanId, gameId],
        queryFn: () => base44.entities.VoiceRoom.filter(isClanWide ? { clanId } : { clanId, gameId }),
    });

    useEntitySubscription('VoiceRoom', ['voiceRooms', clanId, gameId]);

    // Check permissions
    const { data: clanMember } = useQuery({
        queryKey: ['clanMember', clanId, user?.id],
        queryFn: async () => {
             const ms = await base44.entities.ClanMember.filter({ clan_id: clanId, user_id: user?.id });
             return ms[0];
        },
        enabled: !!user?.id
    });
    const canManageVoice = ['officer', 'leader'].includes(clanMember?.role);
    
    // Generic Voice Action Mutation
    const voiceActionMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await base44.functions.invoke('manageVoiceRoom', payload);
            if (!res.ok) throw new Error(res.data?.error || 'Action failed');
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['voiceRooms']);
        }
    });

    // Simulated "Speaking" visualizer (Purely frontend for now)
    // In real WebRTC, this would hook into audio streams
    // Skipping backend update for speaking state to avoid thrashing


    const handleCreateRoom = async () => {
        if (!newRoomTopic.trim()) return;
        
        // Use standard Entity Create
        try {
            const room = await base44.entities.VoiceRoom.create({
                clanId,
                gameId, // can be undefined if clan-wide
                topic: newRoomTopic,
                isTemporary: true,
                isLocked: isPrivate,
                maxParticipants: maxUsers,
                linkedObjectiveId: linkedObjective || null,
                participants: []
            });
            
            await handleJoinRoom(room.id);

            setNewRoomTopic('');
            setIsPrivate(false);
            setMaxUsers(10);
            setLinkedObjective('');
            setIsCreateOpen(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleJoinRoom = async (roomId) => {
        if (activeRoomId === roomId) return;
        
        setActiveRoomId(roomId);
        voiceActionMutation.mutate({ action: 'join', roomId });
    };

    const handleLeaveRoom = async () => {
        if (!activeRoomId) return;
        const roomId = activeRoomId;
        
        setActiveRoomId(null);
        voiceActionMutation.mutate({ action: 'kick', roomId, targetUserId: user?.id });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Active Call Bar (if connected) */}
            <AnimatePresence>
                {activeRoomId && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-green-500/10 border-b border-green-500/20 p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-green-500 animate-pulse" />
                                <span className="font-bold text-green-400">Connected: {rooms.find(r => r.id === activeRoomId)?.topic}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLeaveRoom} className="h-6 w-6 text-white/50 hover:text-white">
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsMuted(!isMuted)}
                                className={isMuted ? "text-red-400 bg-red-400/10" : "text-white/80"}
                            >
                                {isMuted ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                                {isMuted ? 'Muted' : 'Mic On'}
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsDeafened(!isDeafened)}
                                className={isDeafened ? "text-red-400 bg-red-400/10" : "text-white/80"}
                            >
                                {isDeafened ? <Headphones className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                                {isDeafened ? 'Deafened' : 'Audio On'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Join Confirmation Dialog */}
            <Dialog open={!!previewRoomId} onOpenChange={(open) => !open && setPreviewRoomId(null)}>
                <DialogContent className="bg-[#12141a] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Headphones className="w-5 h-5 text-green-400" />
                            Join Voice Channel
                        </DialogTitle>
                        <DialogDescription className="text-white/50">
                            Confirm connection to this voice room.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {(() => {
                        const room = rooms.find(r => r.id === previewRoomId);
                        if (!room) return null;
                        
                        const isFull = room.maxParticipants && room.participants.length >= room.maxParticipants;
                        const isLocked = room.isLocked;

                        return (
                            <div className="py-4">
                                <div className="bg-white/5 rounded-lg p-4 border border-white/5 mb-4 relative overflow-hidden">
                                    <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                                        {room.topic}
                                        {isLocked && <Lock className="w-4 h-4 text-red-400" />}
                                    </h3>
                                    <p className="text-xs text-white/40 mb-2">{room.isTemporary ? 'Temporary Room' : 'Permanent Channel'}</p>
                                    
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className={`border-white/10 ${isFull ? 'text-red-400' : 'text-white/60'}`}>
                                            {room.participants.length} / {room.maxParticipants || '∞'} Users
                                        </Badge>
                                        {room.linkedObjectiveId && (
                                            <Badge variant="outline" className="border-amber-500/20 text-amber-400">
                                                Objective Linked
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs font-medium text-white/40 uppercase tracking-wider">
                                        <span>Participants ({room.participants.length})</span>
                                        {room.participants.length > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> Live</span>}
                                    </div>
                                    
                                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                                        {room.participants.length === 0 ? (
                                            <div className="text-center py-6 text-white/20 italic bg-white/[0.02] rounded-lg">
                                                Room is empty
                                            </div>
                                        ) : (
                                            room.participants.map(p => (
                                                <div key={p.id} className="flex items-center justify-between bg-white/[0.03] p-2 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className={`w-8 h-8 border-2 ${p.speaking ? 'border-green-500' : 'border-transparent'}`}>
                                                            <AvatarFallback className="bg-slate-700 text-[10px]">{p.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-white/90">{p.name}</span>
                                                    </div>
                                                    {p.speaking && <Volume2 className="w-4 h-4 text-green-500 animate-pulse" />}
                                                    {p.muted && <MicOff className="w-3.5 h-3.5 text-red-400/70" />}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setPreviewRoomId(null)} className="hover:bg-white/10">Cancel</Button>
                        {(() => {
                             const room = rooms.find(r => r.id === previewRoomId);
                             const isFull = room && room.maxParticipants && room.participants.length >= room.maxParticipants;
                             const isLocked = room && room.isLocked;
                             
                             return (
                                <Button 
                                    className={`${isFull || isLocked ? 'bg-white/10 text-white/50' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                                    disabled={isFull || isLocked}
                                    onClick={() => {
                                        handleJoinRoom(previewRoomId);
                                        setPreviewRoomId(null);
                                    }}
                                >
                                    {isLocked ? <Lock className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />} 
                                    {isLocked ? 'Locked' : isFull ? 'Room Full' : 'Connect'}
                                </Button>
                             );
                        })()}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header for Context */}
            <div className="px-6 pt-6 pb-2">
                <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    {isClanWide ? (
                        <><Users className="w-4 h-4" /> Clan Wide Channels</>
                    ) : (
                        <><Target className="w-4 h-4" /> Tactical Game Comms</>
                    )}
                </h3>
            </div>

            {/* Room List */}
            <ScrollArea className="flex-1 p-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Create Room Card */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <button className="h-[140px] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/30 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all gap-2 group">
                                <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <span className="font-medium">Create {isClanWide ? 'General' : 'Game'} Room</span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#12141a] border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>Create Temporary Voice Room</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Topic / Activity</label>
                                    <Input 
                                        placeholder="e.g. Boss Fight Strategy" 
                                        value={newRoomTopic}
                                        onChange={(e) => setNewRoomTopic(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                    <p className="text-xs text-white/40">Room creates instantly and closes when empty.</p>
                                </div>
                                
                                {/* Advanced Options (Simulated Leader/Officer Access) */}
                                <div className="space-y-4 pt-2 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-white text-sm">Private Channel</Label>
                                            <p className="text-[10px] text-white/40">Only invited members can join</p>
                                        </div>
                                        <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label className="text-white text-sm">Max Participants</Label>
                                            <span className="text-xs text-white/60">{maxUsers} Users</span>
                                        </div>
                                        <Slider 
                                            value={[maxUsers]} 
                                            onValueChange={([v]) => setMaxUsers(v)} 
                                            max={40} 
                                            min={2} 
                                            step={1} 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-white text-sm">Link Objective (Optional)</Label>
                                        <Select value={linkedObjective} onValueChange={setLinkedObjective}>
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                                                <SelectValue placeholder="None" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="obj1">Raid: Molten Core</SelectItem>
                                                <SelectItem value="obj2">Weekly Farm</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button onClick={handleCreateRoom} className="w-full bg-blue-600 hover:bg-blue-500">
                                    Start Room
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Active Rooms */}
                    {rooms.map(room => {
                        const isConnected = activeRoomId === room.id;
                        return (
                            <div 
                                key={room.id}
                                className={`
                                    relative p-4 rounded-xl border transition-all
                                    ${isConnected ? 'bg-green-500/5 border-green-500/30' : 'bg-black/40 border-white/10 hover:border-white/20'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white truncate">{room.topic}</h3>
                                        {room.isLocked && <Lock className="w-3 h-3 text-white/40" />}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 mb-3">
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 text-white/30 border-white/10 gap-1">
                                            <Users className="w-3 h-3" /> {room.participants.length}/{room.maxParticipants || '∞'}
                                        </Badge>
                                        {room.linkedObjectiveId && (
                                            <Badge variant="outline" className="text-[10px] h-4 px-1 text-amber-400/70 border-amber-500/20 gap-1">
                                                <Target className="w-3 h-3" /> Objective Linked
                                            </Badge>
                                        )}
                                    </div>

                                    {isConnected ? (
                                        <Badge className="absolute top-4 right-4 bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">Connected</Badge>
                                    ) : (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="absolute top-4 right-4 h-6 text-xs bg-white/5 hover:bg-white/10 text-white/70"
                                            onClick={() => setPreviewRoomId(room.id)}
                                        >
                                            Join
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {room.participants.length === 0 && (
                                        <span className="text-xs text-white/20 italic">Empty</span>
                                    )}
                                    {room.participants.map(p => (
                                        <div key={p.id} className="relative group">
                                            <Avatar className={`w-10 h-10 border-2 transition-colors ${p.speaking ? 'border-green-500' : 'border-transparent'}`}>
                                                <AvatarFallback className="bg-slate-700 text-xs font-bold">{p.name[0]}</AvatarFallback>
                                            </Avatar>
                                            {p.muted && (
                                                <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border border-[#12141a]">
                                                    <MicOff className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            )}
                                            {/* Tooltip Name */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                                                {p.name}
                                            </div>
                                            
                                            {/* Moderation Controls Overlay */}
                                            {canManageVoice && p.id !== (user?.id || 'me') && (
                                                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity z-20 backdrop-blur-[1px]">
                                                    <button 
                                                        className="p-1 hover:text-red-400 text-white/80" 
                                                        title="Kick"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            voiceActionMutation.mutate({ action: 'kick', roomId: room.id, targetUserId: p.id });
                                                        }}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                        className="p-1 hover:text-amber-400 text-white/80" 
                                                        title="Force Mute"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            voiceActionMutation.mutate({ action: 'mute_participant', roomId: room.id, targetUserId: p.id, state: !p.muted });
                                                        }}
                                                    >
                                                        <MicOff className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}