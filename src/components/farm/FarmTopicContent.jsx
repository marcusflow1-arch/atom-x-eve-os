import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mic, Plus, MessageCircle, Clock, Hash, Trophy, Target, Bug, Calendar, Lock } from 'lucide-react';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Mock Data Generators with enhanced fields
const generateMockContent = (topic) => {
    if (!topic) return { rooms: [], posts: [] };
    
    let rooms = [];
    let posts = [];

    // Base timestamp for relative time calculation if needed
    const now = new Date();

    switch(topic) {
        case 'achievements':
            rooms = [
                { id: 'v1', name: 'Platinum Hunting', users: 3, max: 4, tags: ['Serious'], isClan: false, active: true },
                { id: 'v2', name: 'Secret Finding', users: 5, max: 8, tags: ['Spoilers'], isClan: false, active: true }
            ];
            posts = [
                { id: 'p1', title: 'Hidden trophy in Level 4?', author: 'TrophyHunter', time: '10m ago', replies: 8, upvotes: 42, isFriend: true },
                { id: 'p2', title: '100% Completion Guide', author: 'GuideMaker', time: '2h ago', replies: 156, upvotes: 890, isFriend: false }
            ];
            break;
        case 'farming':
            rooms = [
                { id: 'v1', name: 'Boss Rush Mode', users: 4, max: 4, tags: ['High Level'], isClan: true, active: true },
                { id: 'v2', name: 'Material Farming', users: 2, max: 4, tags: ['Chill'], isClan: false, active: true }
            ];
            posts = [
                { id: 'p1', title: 'Best spot for Rare Crystal?', author: 'Miner49er', time: '5m ago', replies: 3, upvotes: 12, isFriend: false },
                { id: 'p2', title: 'Efficiency Spreadsheets', author: 'MathWiz', time: '1d ago', replies: 45, upvotes: 300, isFriend: false }
            ];
            break;
        case 'recruitment':
            rooms = [
                { id: 'v1', name: 'Interviews Open', users: 2, max: 10, tags: ['Clan'], isClan: true, active: true },
            ];
            posts = [
                { id: 'p1', title: 'Looking for active guild (NA)', author: 'SoloPlayer', time: '30m ago', replies: 2, upvotes: 5, isFriend: false },
                { id: 'p2', title: 'Top 10 Guild Recruiting', author: 'GuildLeader', time: '4h ago', replies: 12, upvotes: 45, isFriend: false }
            ];
            break;
        default:
             rooms = [
                { id: 'v1', name: 'General Chat', users: 12, max: 20, tags: ['Casual'], isClan: false, active: true },
                { id: 'v2', name: 'New Players', users: 4, max: 10, tags: ['Help'], isClan: false, active: true }
            ];
            posts = [
                { id: 'p1', title: 'This game is amazing!', author: 'Newbie', time: '1h ago', replies: 10, upvotes: 100, isFriend: false },
                { id: 'p2', title: 'Patch notes discussion', author: 'Mod', time: '3h ago', replies: 88, upvotes: 250, isFriend: false }
            ];
    }

    // Sort Logic: Active/Upvotes first, then friends/relevance
    posts.sort((a, b) => b.upvotes - a.upvotes);
    
    return { rooms, posts };
};

const filterByIntent = (content, intent) => {
    if (!intent) return content;
    
    const { rooms, posts } = content;
    
    // Logic to prioritize content based on intent
    // This is a simple example, in real app it would be more complex queries
    let sortedRooms = [...rooms];
    let sortedPosts = [...posts];

    if (intent === 'help') {
        sortedRooms.sort((a, b) => (a.tags.includes('Help') ? -1 : 1));
        sortedPosts.sort((a, b) => (a.title.toLowerCase().includes('help') ? -1 : 1));
    } else if (intent === 'achievements') {
        sortedRooms.sort((a, b) => (a.tags.includes('Serious') ? -1 : 1));
        sortedPosts.sort((a, b) => (a.title.toLowerCase().includes('trophy') ? -1 : 1));
    } else if (intent === 'group') {
         sortedRooms.sort((a, b) => (a.users < a.max ? -1 : 1)); // Open slots first
    }
    
    return { rooms: sortedRooms, posts: sortedPosts };
};

import { INTENTS } from './IntentSelector';

export default function FarmTopicContent({ topic, gameId, isOwned, onJoinRoomRequest, intent }) {
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

    const rawContent = generateMockContent(topic);
    const { rooms, posts } = filterByIntent(rawContent, intent);
    
    const activeIntent = intent ? INTENTS[intent.toUpperCase()] : null;

    // Handlers
    const handleJoinVoice = (room) => {
        if (!isOwned) {
            toast.error("Ownership Required", { description: "You must own the game to join voice rooms." });
            return;
        }
        if (room.isClan) {
            // Placeholder for clan check
            toast.info("Clan Access", { description: "Verifying clan membership..." });
            // In real app, check user.clanId === room.clanId
        }
        onJoinRoomRequest(room);
    };

    const handleCreatePost = () => {
        if (!isOwned) {
            toast.error("Ownership Required", { description: "You must own the game to post discussions." });
            return;
        }
        toast.success("Opening post editor...");
    };

    const handleCreateRoom = () => {
        if (!isOwned) {
            toast.error("Ownership Required", { description: "You must own the game to create rooms." });
            return;
        }
        toast.success("Creating voice room...");
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            key={topic}
            className="h-full overflow-y-auto p-8 pt-4 custom-scrollbar"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                
                {/* Intent Banner if active */}
                {activeIntent && (
                    <div className="lg:col-span-3 mb-2">
                        <div className={`flex items-center gap-3 p-4 rounded-xl border border-white/10 ${activeIntent.bg} backdrop-blur-sm`}>
                            <activeIntent.icon className={`w-5 h-5 ${activeIntent.color}`} />
                            <div className="flex-1">
                                <h3 className={`text-sm font-bold ${activeIntent.color}`}>Focus: {activeIntent.label}</h3>
                                <p className="text-xs text-white/60">Content prioritized for your current goal.</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 text-white/40 hover:text-white" onClick={() => {}}>Change</Button>
                        </div>
                    </div>
                )}

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
                                        <span className={`hover:text-blue-400 transition-colors ${post.isFriend ? 'text-blue-300 font-medium' : ''}`}>@{post.author}</span>
                                        {post.isFriend && <span className="bg-blue-500/20 text-blue-300 px-1.5 rounded text-[10px]">FRIEND</span>}
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
                        
                        <Button 
                            onClick={handleCreatePost}
                            className={`w-full py-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 border-dashed rounded-xl uppercase tracking-wider text-xs font-bold ${!isOwned ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {!isOwned ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} 
                            New {topic} Thread
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
                                    {room.isClan && (
                                        <span className="text-[10px] uppercase font-bold text-purple-300 bg-purple-500/20 px-2 py-1 rounded border border-purple-500/20">
                                            CLAN ONLY
                                        </span>
                                    )}
                                </div>

                                <Button 
                                    size="sm" 
                                    onClick={() => handleJoinVoice(room)}
                                    className={`w-full mt-1 rounded-lg ${!isOwned ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-blue-600/80 hover:bg-blue-600 text-white'}`}
                                >
                                    {!isOwned ? <Lock className="w-3 h-3 mr-2" /> : <Mic className="w-3 h-3 mr-2" />}
                                    Join Voice
                                </Button>
                            </LiquidGlassCard>
                        ))}

                        <Button 
                            variant="outline" 
                            onClick={handleCreateRoom}
                            className={`w-full border-white/10 text-white/60 hover:text-white hover:bg-white/5 ${!isOwned ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {!isOwned ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            Create Room
                        </Button>
                    </div>

                    {/* Contextual Info Card */}
                    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/10 rounded-xl p-4 mt-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Topic Tip</h4>
                                <p className="text-xs text-white/50 leading-relaxed">
                                    You are viewing <span className="text-white font-bold capitalize">{topic}</span>. 
                                    Content is filtered to show relevant guides and discussions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}