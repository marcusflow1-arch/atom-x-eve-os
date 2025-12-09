import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Mic, MicOff, Rocket, Settings, Volume2, PhoneOff, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PartyPanel({ onlineMembers }) {
    const [partyMembers, setPartyMembers] = useState([
        { id: 1, name: 'Marcus', avatar: 'https://i.pravatar.cc/150?u=marcus', isMuted: false, isLeader: true, isInVoice: true },
        { id: 2, name: 'Shadow_Stryker', avatar: 'https://i.pravatar.cc/150?u=shadow', isMuted: true, isLeader: false, isInVoice: true },
        { id: 3, name: 'Jax_Ripper', avatar: 'https://i.pravatar.cc/150?u=jax', isMuted: false, isLeader: false, isInVoice: false },
    ]);
    const [inVoiceChat, setInVoiceChat] = useState(true);
    const [isMuted, setIsMuted] = useState(false);

    const handleInviteMember = () => {
        console.log('Opening invite member dialog');
        // Here you would open a modal to select from online members
    };

    const handleLeaveVoice = () => {
        setInVoiceChat(false);
        console.log('Left voice chat');
    };

    const handleJoinVoice = () => {
        setInVoiceChat(true);
        console.log('Joined voice chat');
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        console.log(isMuted ? 'Unmuted' : 'Muted');
    };

    return (
        <div className="bg-slate-800 h-full flex flex-col p-4">
            {/* Header */}
            <header className="mb-6 flex-shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users /> 
                    Party ({partyMembers.length}/8)
                </h2>
                <p className="text-xs text-slate-400 mt-1">Active members in your current party</p>
            </header>

            {/* Voice Chat Status */}
            {inVoiceChat && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4 flex-shrink-0"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-300 font-semibold">Voice Chat Active</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={toggleMute} className="p-1">
                                {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-green-400" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleLeaveVoice} className="p-1">
                                <PhoneOff className="w-3 h-3 text-red-400" />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Party Members */}
            <div className="flex-grow space-y-3 overflow-y-auto mb-4">
                {partyMembers.map(member => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                                {member.isInVoice && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-slate-800"></div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className={`font-semibold ${member.isLeader ? 'text-yellow-400' : 'text-white'}`}>
                                        {member.name}
                                    </p>
                                    {member.isLeader && <Crown className="w-3 h-3 text-yellow-400" />}
                                </div>
                                <p className="text-xs text-green-400">
                                    {member.isInVoice ? 'In Voice' : 'In-Game: Vanguard Ops'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {member.isInVoice && (
                                <Button variant="ghost" size="icon" className="w-6 h-6 p-0">
                                    {member.isMuted ? 
                                        <MicOff className="w-3 h-3 text-red-400" /> : 
                                        <Mic className="w-3 h-3 text-green-400" />
                                    }
                                </Button>
                            )}
                        </div>
                    </motion.div>
                ))}

                {/* Invite More Members */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-3 text-slate-500 hover:border-slate-400 hover:text-slate-400 transition-colors cursor-pointer"
                    onClick={handleInviteMember}
                >
                    <UserPlus className="w-5 h-5 mr-2"/>
                    <span>Invite to Party</span>
                </motion.div>

                {/* Available Online Members */}
                {onlineMembers && onlineMembers.length > partyMembers.length && (
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-slate-400 mb-2">Available Members</h4>
                        <div className="space-y-1">
                            {onlineMembers
                                .filter(member => !partyMembers.find(pm => pm.name === member.name))
                                .slice(0, 3)
                                .map(member => (
                                <div key={member.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                                    <div className="flex items-center gap-2">
                                        <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full" />
                                        <span className="text-xs text-slate-300">{member.name}</span>
                                    </div>
                                    <Button size="sm" variant="ghost" className="p-1 h-6">
                                        <UserPlus className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <footer className="flex-shrink-0 space-y-2">
                {!inVoiceChat && (
                    <Button onClick={handleJoinVoice} className="w-full bg-green-600 hover:bg-green-700">
                        <Volume2 className="w-4 h-4 mr-2" />
                        Join Voice Chat
                    </Button>
                )}
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 font-bold">
                    <Rocket className="w-5 h-5 mr-2" />
                    LAUNCH GAME
                </Button>
                <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Party Settings
                </Button>
            </footer>
        </div>
    );
}