import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mic, Plus, MessageCircle, Clock, Hash } from 'lucide-react';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import { Button } from '@/components/ui/button';

// Mock Data Generators
const generateMockContent = (topic) => {
    if (!topic) return [];
    
    // Voice Rooms Mock
    const rooms = [
        { id: 'v1', name: `${topic === 'farming' ? 'Boss Rush' : 'Chill Chat'}`, users: 4, max: 8, tags: ['Mic Required'] },
        { id: 'v2', name: 'New Players Welcome', users: 2, max: 6, tags: ['Noob Friendly'] },
    ];

    // Posts Mock
    const posts = [
        { id: 'p1', title: `Need help with ${topic} quest`, author: 'PlayerOne', time: '2m ago', replies: 5, upvotes: 12 },
        { id: 'p2', title: 'Best strategy for this season?', author: 'ProGamer', time: '15m ago', replies: 24, upvotes: 89 },
        { id: 'p3', title: 'Looking for group - fast clear', author: 'SpeedRunner', time: '1h ago', replies: 0, upvotes: 3 },
    ];

    return { rooms, posts };
};

export default function FarmTopicContent({ topic, gameId }) {
    if (!topic) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl w-full grid gap-8"
                >
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-white tracking-tight">What are you here to do?</h2>
                        <p className="text-white/40 text-lg">Select a channel above to filter discussions and voice rooms.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left opacity-60">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                            <div className="p-3 bg-yellow-500/10 w-fit rounded-xl text-yellow-400">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Find a Squad</h3>
                                <p className="text-sm text-white/40">Join recruitment channels to find active players.</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                            <div className="p-3 bg-green-500/10 w-fit rounded-xl text-green-400">
                                <Mic className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Voice Chat</h3>
                                <p className="text-sm text-white/40">Drop into open voice rooms for live comms.</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                            <div className="p-3 bg-blue-500/10 w-fit rounded-xl text-blue-400">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Strategy & Guides</h3>
                                <p className="text-sm text-white/40">Share builds and discover hidden secrets.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    const { rooms, posts } = generateMockContent(topic);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={topic}
            className="h-full overflow-y-auto p-8 pt-4 custom-scrollbar"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                
                {/* LEFT COLUMN: Discussions (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest">Active Discussions</h3>
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">View All</Button>
                    </div>

                    <div className="space-y-3">
                        {posts.map((post, i) => (
                            <LiquidGlassCard key={post.id} className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors" hover={false}>
                                <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                    <span className="font-bold text-white/80">{post.upvotes}</span>
                                    <span className="text-[10px] text-white/30 uppercase">Votes</span>
                                </div>
                                
                                <div className="flex-1">
                                    <h4 className="text-white font-medium text-lg leading-tight mb-1">{post.title}</h4>
                                    <div className="flex items-center gap-3 text-xs text-white/40">
                                        <span className="hover:text-blue-400 transition-colors">@{post.author}</span>
                                        <span>•</span>
                                        <span>{post.time}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-white/30 bg-white/5 px-3 py-1.5 rounded-lg">
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="text-xs font-bold">{post.replies}</span>
                                </div>
                            </LiquidGlassCard>
                        ))}
                        
                        <Button className="w-full py-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 border-dashed rounded-xl">
                            <Plus className="w-4 h-4 mr-2" /> Start a new discussion in {topic}
                        </Button>
                    </div>
                </div>

                {/* RIGHT COLUMN: Live Voice & Activity (1/3) */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest">Live Voice Rooms</h3>
                        <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            LIVE
                        </span>
                    </div>

                    <div className="grid gap-3">
                        {rooms.map(room => (
                            <LiquidGlassCard key={room.id} className="p-4 flex flex-col gap-3 group cursor-pointer hover:border-blue-500/30 transition-all" hover={false}>
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{room.name}</h4>
                                    <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md">
                                        <Users className="w-3 h-3 text-white/60" />
                                        <span className="text-xs font-mono text-white/80">{room.users}/{room.max}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {room.tags.map(tag => (
                                        <span key={tag} className="text-[10px] uppercase font-bold text-white/30 bg-white/5 px-2 py-1 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <Button size="sm" className="w-full mt-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg">
                                    <Mic className="w-3 h-3 mr-2" /> Join Voice
                                </Button>
                            </LiquidGlassCard>
                        ))}

                        <Button variant="outline" className="w-full border-white/10 text-white/60 hover:text-white hover:bg-white/5">
                            <Plus className="w-4 h-4 mr-2" /> Create Room
                        </Button>
                    </div>

                    {/* Contextual Info Card */}
                    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/10 rounded-xl p-4 mt-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Topic Tip</h4>
                                <p className="text-xs text-white/50 leading-relaxed">
                                    Posts in <span className="text-white font-bold">{topic}</span> are automatically tagged with your current loadout to help others understand your context.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}