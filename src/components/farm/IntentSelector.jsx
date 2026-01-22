import React from 'react';
import { motion } from 'framer-motion';
import { HandHeart, Trophy, Users, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const INTENTS = {
    HELP: { id: 'help', label: 'Help Others', icon: HandHeart, color: 'text-green-400', bg: 'bg-green-500/10' },
    ACHIEVEMENTS: { id: 'achievements', label: 'Farm Achievements', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    GROUP: { id: 'group', label: 'Find Group', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    CHAT: { id: 'chat', label: 'Chat Casually', icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

export default function IntentSelector({ onSelect, onSkip }) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-4xl bg-[#0f1419] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="relative p-8 md:p-12 text-center">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-4 right-4 text-white/30 hover:text-white"
                        onClick={onSkip}
                    >
                        <X className="w-6 h-6" />
                    </Button>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-10 space-y-2"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                            What's your goal today?
                        </h2>
                        <p className="text-white/40 text-lg">
                            We'll customize your experience based on your playstyle.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.values(INTENTS).map((intent, index) => (
                            <motion.button
                                key={intent.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (index * 0.1) }}
                                onClick={() => onSelect(intent.id)}
                                className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300"
                            >
                                <div className={`p-4 rounded-2xl ${intent.bg} ${intent.color} group-hover:scale-110 transition-transform duration-300`}>
                                    <intent.icon className="w-8 h-8" />
                                </div>
                                <span className="font-bold text-white group-hover:text-blue-200 transition-colors">
                                    {intent.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8"
                    >
                        <button 
                            onClick={onSkip}
                            className="text-white/30 hover:text-white/60 text-sm font-medium transition-colors"
                        >
                            Skip for now
                        </button>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}