import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mic, MicOff, Headphones, User, Plus, X, 
    Volume2, Radio, Users, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthContext';

export default function VoiceRoomManager({ clanId, gameId }) {
    const { user } = useAuth();
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newRoomTopic, setNewRoomTopic] = useState('');

    // Mock Rooms Data
    const [rooms, setRooms] = useState([
        { 
            id: '1', topic: 'Raid Planning', participants: [
                { id: 'u1', name: 'CmdrShepard', speaking: true, muted: false },
                { id: 'u2', name: 'Garrus', speaking: false, muted: true }
            ] 
        },
        { 
            id: '2', topic: 'Casual Farming', participants: [] 
        }
    ]);

    // Simulated "Speaking" visualizer
    useEffect(() => {
        const interval = setInterval(() => {
            setRooms(prev => prev.map(room => ({
                ...room,
                participants: room.participants.map(p => ({
                    ...p,
                    speaking: p.muted ? false : Math.random() > 0.7 // Random speaking toggle
                }))
            })));
        }, 300);
        return () => clearInterval(interval);
    }, []);

    const handleCreateRoom = () => {
        if (!newRoomTopic.trim()) return;
        const newRoom = {
            id: Date.now().toString(),
            topic: newRoomTopic,
            participants: []
        };
        setRooms([...rooms, newRoom]);
        setNewRoomTopic('');
        setIsCreateOpen(false);
        handleJoinRoom(newRoom.id);
    };

    const handleJoinRoom = (roomId) => {
        if (activeRoomId === roomId) return;
        
        // Leave current
        if (activeRoomId) {
            setRooms(prev => prev.map(r => r.id === activeRoomId ? {
                ...r,
                participants: r.participants.filter(p => p.id !== user?.id)
            } : r));
        }

        // Join new
        setActiveRoomId(roomId);
        setRooms(prev => prev.map(r => r.id === roomId ? {
            ...r,
            participants: [...r.participants, { 
                id: user?.id || 'me', 
                name: user?.username || 'Me', 
                speaking: false, 
                muted: false 
            }]
        } : r));
    };

    const handleLeaveRoom = () => {
        if (!activeRoomId) return;
        setRooms(prev => prev.map(r => r.id === activeRoomId ? {
            ...r,
            participants: r.participants.filter(p => p.id !== (user?.id || 'me'))
        } : r));
        setActiveRoomId(null);
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

            {/* Room List */}
            <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Create Room Card */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <button className="h-[140px] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/30 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all gap-2 group">
                                <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <span className="font-medium">Create Voice Room</span>
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
                                    <h3 className="font-bold text-white truncate pr-8">{room.topic}</h3>
                                    {isConnected ? (
                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">Connected</Badge>
                                    ) : (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-6 text-xs bg-white/5 hover:bg-white/10 text-white/70"
                                            onClick={() => handleJoinRoom(room.id)}
                                        >
                                            Join
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {room.participants.length === 0 && (
                                        <span className="text-xs text-white/20 italic">Empty - Auto-closing soon</span>
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