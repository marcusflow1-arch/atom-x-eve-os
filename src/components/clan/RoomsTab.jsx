import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Hash, Lock, Users, Send, Settings, Mic, MicOff, Volume2, Phone, PhoneOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const initialRooms = [
    { 
        id: 1, 
        name: 'general-chat', 
        isPrivate: false, 
        game: 'All Games',
        members: ['Marcus', 'Shadow_Stryker', 'Glitch_Witch', 'Jax_Ripper'],
        hasVoiceChat: true,
        voiceMembers: ['Marcus', 'Shadow_Stryker']
    },
    { 
        id: 2, 
        name: 'raid-planning', 
        isPrivate: false, 
        game: 'World Events',
        members: ['Marcus', 'Shadow_Stryker'],
        hasVoiceChat: true,
        voiceMembers: ['Marcus']
    },
    { 
        id: 3, 
        name: 'vanguard-ops-comp', 
        isPrivate: true, 
        game: 'Vanguard Ops',
        members: ['Shadow_Stryker', 'Glitch_Witch'],
        hasVoiceChat: true,
        voiceMembers: ['Shadow_Stryker']
    },
    { 
        id: 4, 
        name: 're4-mercenaries', 
        isPrivate: false, 
        game: 'Resident Evil 4',
        members: ['Jax_Ripper', 'Cortex'],
        hasVoiceChat: false,
        voiceMembers: []
    },
];

const chatMessages = {
    1: [
        { id: 1, author: 'Marcus', avatar: 'https://i.pravatar.cc/150?u=marcus', content: 'Welcome to the clan hub!', timestamp: '2 min ago' },
        { id: 2, author: 'Jax_Ripper', avatar: 'https://i.pravatar.cc/150?u=jax', content: 'Anyone wanna run some RE4 later?', timestamp: '1 min ago' }
    ],
    2: [
        { id: 3, author: 'Shadow_Stryker', avatar: 'https://i.pravatar.cc/150?u=shadow', content: 'Raid tonight, 8PM EST. Be ready.', timestamp: '5 min ago' }
    ],
    3: [
        { id: 4, author: 'Glitch_Witch', avatar: 'https://i.pravatar.cc/150?u=glitch', content: 'Practice starts at 6. Don\'t be late.', timestamp: '10 min ago' }
    ],
    4: [
        { id: 5, author: 'Jax_Ripper', avatar: 'https://i.pravatar.cc/150?u=jax', content: 'My high score is 1.5M, beat that.', timestamp: '15 min ago' }
    ],
};

export default function RoomsTab({ onlineMembers, currentUser }) {
    const [rooms, setRooms] = useState(initialRooms);
    const [selectedRoom, setSelectedRoom] = useState(rooms[0]);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [inVoiceChat, setInVoiceChat] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [newRoomForm, setNewRoomForm] = useState({
        name: '',
        description: '',
        isPrivate: false,
        password: '',
        game: 'All Games'
    });

    const handleCreateRoom = () => {
        const room = {
            id: rooms.length + 1,
            name: newRoomForm.name,
            description: newRoomForm.description,
            isPrivate: newRoomForm.isPrivate,
            game: newRoomForm.game,
            members: [currentUser.name],
            hasVoiceChat: true,
            voiceMembers: []
        };
        setRooms([...rooms, room]);
        setShowCreateRoom(false);
        setNewRoomForm({ name: '', description: '', isPrivate: false, password: '', game: 'All Games' });
    };

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            // Here you would integrate with backend to send message
            console.log('Sending message:', newMessage, 'to room:', selectedRoom.name);
            setNewMessage('');
        }
    };

    const handleJoinVoiceChat = () => {
        setInVoiceChat(!inVoiceChat);
        // Here you would integrate with voice chat service
        console.log(inVoiceChat ? 'Leaving voice chat' : 'Joining voice chat', 'in room:', selectedRoom.name);
    };

    return (
        <div className="grid grid-cols-12 gap-6 h-full">
            {/* Room List (Left) */}
            <div className="col-span-4 bg-slate-800/50 rounded-lg p-4 flex flex-col border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Divisions / Rooms</h3>
                    <Button size="sm" onClick={() => setShowCreateRoom(true)}>
                        <PlusCircle className="w-4 h-4 mr-1"/>Create
                    </Button>
                </div>
                
                <div className="flex-grow space-y-2 overflow-y-auto">
                    {rooms.map(room => (
                        <motion.button
                            key={room.id}
                            onClick={() => setSelectedRoom(room)}
                            className={`w-full text-left p-3 rounded-md transition-colors flex items-center justify-between ${
                                selectedRoom.id === room.id ? 'bg-blue-600/50 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-center gap-2">
                                {room.isPrivate ? <Lock className="w-4 h-4 flex-shrink-0"/> : <Hash className="w-4 h-4 flex-shrink-0"/>}
                                <div className="min-w-0 flex-grow">
                                    <p className="font-semibold truncate">{room.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{room.game}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-xs">{room.members.length}</span>
                                {room.hasVoiceChat && room.voiceMembers.length > 0 && (
                                    <Volume2 className="w-3 h-3 text-green-400" />
                                )}
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Chat Pane (Center) */}
            <div className="col-span-5 bg-slate-800/50 rounded-lg flex flex-col border border-slate-700">
                <header className="p-4 border-b border-slate-700 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-xl text-white flex items-center gap-2">
                                {selectedRoom.isPrivate ? <Lock className="w-5 h-5"/> : <Hash className="w-5 h-5"/>}
                                {selectedRoom.name}
                            </h2>
                            <p className="text-sm text-slate-400">{selectedRoom.game}</p>
                        </div>
                        {selectedRoom.hasVoiceChat && (
                            <div className="flex gap-2">
                                {inVoiceChat && (
                                    <Button
                                        size="sm"
                                        variant={isMuted ? "destructive" : "outline"}
                                        onClick={() => setIsMuted(!isMuted)}
                                    >
                                        {isMuted ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant={inVoiceChat ? "destructive" : "default"}
                                    onClick={handleJoinVoiceChat}
                                >
                                    {inVoiceChat ? <PhoneOff className="w-4 h-4"/> : <Phone className="w-4 h-4"/>}
                                    {inVoiceChat ? 'Leave' : 'Join'} Voice
                                </Button>
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {(chatMessages[selectedRoom.id] || []).map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3"
                        >
                            <img src={msg.avatar} alt={msg.author} className="w-10 h-10 rounded-full" />
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-blue-300">{msg.author}</p>
                                    <p className="text-xs text-slate-500">{msg.timestamp}</p>
                                </div>
                                <p className="p-3 bg-slate-700/60 rounded-lg text-slate-200">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-700 flex gap-2">
                    <Input 
                        placeholder={`Message #${selectedRoom.name}`} 
                        className="bg-slate-900 border-slate-600"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                        <Send className="w-4 h-4"/>
                    </Button>
                </div>
            </div>

            {/* Room Members (Right) */}
            <div className="col-span-3 bg-slate-800/50 rounded-lg p-4 flex flex-col border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5"/> Members ({selectedRoom.members.length})
                </h3>
                
                {/* Voice Chat Members */}
                {selectedRoom.hasVoiceChat && selectedRoom.voiceMembers.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1">
                            <Volume2 className="w-4 h-4"/> In Voice ({selectedRoom.voiceMembers.length})
                        </h4>
                        <div className="space-y-2">
                            {selectedRoom.voiceMembers.map(memberName => {
                                const member = onlineMembers.find(m => m.name === memberName);
                                return member ? (
                                    <div key={memberName} className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
                                        <img src={member.avatar} alt={memberName} className="w-6 h-6 rounded-full" />
                                        <span className="text-sm text-green-300">{memberName}</span>
                                        <Mic className="w-3 h-3 text-green-400 ml-auto" />
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}

                {/* All Room Members */}
                <div className="flex-grow overflow-y-auto space-y-2">
                    {selectedRoom.members.map(memberName => {
                        const member = onlineMembers.find(m => m.name === memberName) || 
                                     { name: memberName, avatar: `https://i.pravatar.cc/150?u=${memberName}`, status: 'offline' };
                        const isInVoice = selectedRoom.voiceMembers.includes(memberName);
                        
                        return (
                            <div key={memberName} className={`flex items-center justify-between p-2 rounded ${isInVoice ? 'bg-green-500/20' : 'bg-slate-700/30'}`}>
                                <div className="flex items-center gap-2">
                                    <img src={member.avatar} alt={memberName} className="w-8 h-8 rounded-full" />
                                    <span className="text-sm font-semibold text-slate-300">{memberName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {member.status === 'online' && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
                                    {isInVoice && <Volume2 className="w-3 h-3 text-green-400" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Room Modal */}
            <AnimatePresence>
                {showCreateRoom && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setShowCreateRoom(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-800 p-6 rounded-lg w-96"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Create New Room</h3>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Room Name"
                                    value={newRoomForm.name}
                                    onChange={(e) => setNewRoomForm({...newRoomForm, name: e.target.value})}
                                />
                                <Textarea
                                    placeholder="Description (optional)"
                                    value={newRoomForm.description}
                                    onChange={(e) => setNewRoomForm({...newRoomForm, description: e.target.value})}
                                />
                                <Input
                                    placeholder="Game/Topic"
                                    value={newRoomForm.game}
                                    onChange={(e) => setNewRoomForm({...newRoomForm, game: e.target.value})}
                                />
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="private-room"
                                        checked={newRoomForm.isPrivate}
                                        onChange={(e) => setNewRoomForm({...newRoomForm, isPrivate: e.target.checked})}
                                    />
                                    <label htmlFor="private-room" className="text-sm text-slate-300">Private Room</label>
                                </div>
                                {newRoomForm.isPrivate && (
                                    <Input
                                        placeholder="Password"
                                        type="password"
                                        value={newRoomForm.password}
                                        onChange={(e) => setNewRoomForm({...newRoomForm, password: e.target.value})}
                                    />
                                )}
                                <div className="flex gap-2">
                                    <Button onClick={handleCreateRoom} className="flex-1">Create Room</Button>
                                    <Button variant="outline" onClick={() => setShowCreateRoom(false)}>Cancel</Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}