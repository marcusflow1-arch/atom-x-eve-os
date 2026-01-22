import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Mic2, MessageSquare, Plus, ArrowLeft, 
    Hash, Shield, Trophy, Target, Sparkles, AlertCircle, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';

// Component Imports
import FarmTopicSelector from './FarmTopicSelector';
import FarmTopicContent from './FarmTopicContent';

import { toast } from 'sonner';

export default function FarmGameView({ game, onBack }) {
    const [activeTopic, setActiveTopic] = useState(null); // 'achievements', 'farming', 'recruitment', etc.
    const isOwned = game.tags?.includes('Owned');

    const handleAction = (action) => {
        if (!isOwned) {
            toast.error("Ownership Required", {
                description: `You must own ${game.title} to ${action}.`,
                icon: <Shield className="w-4 h-4 text-red-400" />
            });
            return;
        }
        // Logic for action would go here
        toast.success(`Action: ${action}`);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* GAME HEADER */}
            <div className="relative flex-shrink-0">
                {/* Banner Background */}
                <div className="absolute inset-0 h-64 overflow-hidden z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f1419]/80 to-[#0f1419] z-10" />
                    <img src={game.image} alt={game.title} className="w-full h-full object-cover opacity-50" />
                </div>

                <div className="relative z-20 px-8 pt-8 pb-6 flex flex-col gap-6">
                    <div className="flex justify-between w-full">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="self-start text-white/50 hover:text-white hover:bg-white/10 -ml-2"
                            onClick={onBack}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
                        </Button>
                        
                        {!isOwned && (
                            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full text-yellow-500 text-xs font-bold">
                                <Shield className="w-3 h-3" />
                                GUEST MODE
                            </div>
                        )}
                    </div>

                    <div className="flex items-end justify-between">
                        <div className="flex items-end gap-6">
                            {/* Game Cover Art Card */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-32 h-48 rounded-lg overflow-hidden shadow-2xl border border-white/10 bg-gray-900"
                            >
                                <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
                            </motion.div>
                            
                            <div className="mb-2 space-y-2">
                                <motion.h1 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-4xl font-bold text-white tracking-tight"
                                >
                                    {game.title}
                                </motion.h1>
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex items-center gap-6"
                                >
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        {game.activeUsers.toLocaleString()} ONLINE
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                                        <Mic2 className="w-3 h-3" />
                                        {game.voiceRooms} VOICE ROOMS
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 mb-2"
                        >
                            <Button 
                                onClick={() => handleAction('join voice')}
                                className={`rounded-full border ${isOwned ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-white/5 text-white/40 border-white/5 cursor-not-allowed'}`}
                            >
                                <Mic2 className="w-4 h-4 mr-2" />
                                Join Voice
                            </Button>
                            <Button 
                                onClick={() => handleAction('create a post')}
                                className={`rounded-full ${isOwned ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-white/5 text-white/40 border border-white/5 cursor-not-allowed'}`}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Post
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* TOPIC SELECTOR */}
            <div className="px-8 pb-4 border-b border-white/5 z-20">
                <FarmTopicSelector activeTopic={activeTopic} onSelect={setActiveTopic} />
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative z-10 bg-[#0f1419]">
                <FarmTopicContent topic={activeTopic} gameId={game.id} />
            </div>
        </div>
    );
}