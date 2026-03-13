import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Users, Volume2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebRTCVoice } from '@/components/shared/useWebRTCVoice';
import { useAuth } from '@/components/auth/AuthContext';

export default function ActiveVoiceControls({ room, onLeave }) {
    const { user } = useAuth();
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [talking, setTalking] = useState(false);

    const participantIds = room?.participants?.map(p => p.id) || [];
    useWebRTCVoice(room?.id, user, isMuted, isDeafened, participantIds);

    // Simulate speaking indicator
    useEffect(() => {
        if (isMuted) return;
        const interval = setInterval(() => {
            setTalking(Math.random() > 0.7);
        }, 500);
        return () => clearInterval(interval);
    }, [isMuted]);

    if (!room) return null;

    return (
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-2 pl-4 pr-2 bg-[#1a1f2e] border border-white/10 rounded-full shadow-2xl backdrop-blur-xl"
        >
            {/* Room Info */}
            <div className="flex flex-col mr-4">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold text-white max-w-[150px] truncate">{room.name}</span>
                </div>
                <span className="text-xs text-green-400 font-medium ml-4">Connected</span>
            </div>

            {/* Speaking Visualizer */}
            <div className="flex items-end gap-0.5 h-8 mr-4">
                {[1, 2, 3, 4].map(i => (
                    <motion.div
                        key={i}
                        animate={{ height: talking ? [8, 16, 8] : 4 }}
                        transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.1 }}
                        className={`w-1 rounded-full ${talking ? 'bg-green-400' : 'bg-white/20'}`}
                    />
                ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`rounded-full w-10 h-10 ${isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsDeafened(!isDeafened)}
                    className={`rounded-full w-10 h-10 ${isDeafened ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                    <Volume2 className="w-4 h-4" />
                </Button>

                <div className="w-px h-8 bg-white/10 mx-1" />

                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onLeave}
                    className="rounded-full w-10 h-10 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                >
                    <PhoneOff className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}