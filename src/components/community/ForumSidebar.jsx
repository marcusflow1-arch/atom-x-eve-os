import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Gamepad2, MessageSquare, Trophy, Globe, ChevronRight, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

const POPULAR_GAMES = [
    { title: "Cyberpunk 2088", count: 142, genre: "RPG", icon: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=50&h=50&fit=crop" },
    { title: "Elder Scrolls: Reborn", count: 98, genre: "RPG", icon: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=50&h=50&fit=crop" },
    { title: "Vanguard Ops", count: 85, genre: "FPS", icon: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=50&h=50&fit=crop" },
    { title: "Nexus Clash", count: 76, genre: "MOBA", icon: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=50&h=50&fit=crop" },
];

const GENRES = ["RPG", "FPS", "Strategy", "MOBA", "Adventure", "Simulation", "Sports"];

export default function ForumSidebar({ activeSection, onSectionChange, activeGame, onGameChange }) {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="w-full md:w-72 flex-shrink-0 space-y-6">
            {/* Main Navigation */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forum Sections</h3>
                </div>
                <div className="p-2 space-y-1">
                    <button
                        onClick={() => onSectionChange('general_discussion')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeSection === 'general_discussion' 
                            ? 'bg-blue-600/20 text-blue-400' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                    >
                        <Globe className="w-4 h-4" />
                        General Discussion
                    </button>
                    <button
                        onClick={() => onSectionChange('achievement_discussion')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeSection === 'achievement_discussion' 
                            ? 'bg-yellow-600/20 text-yellow-400' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                    >
                        <Trophy className="w-4 h-4" />
                        Achievement Hunters
                    </button>
                </div>
            </div>

            {/* Game Forums Section */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-[600px]">
                <div className="p-4 border-b border-slate-800 flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Game Forums</h3>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <Input 
                            placeholder="Find game..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 pl-8 bg-slate-950/50 border-slate-800 text-xs"
                        />
                    </div>
                </div>
                
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-1">
                        {POPULAR_GAMES.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase())).map((game) => (
                            <button
                                key={game.title}
                                onClick={() => onGameChange(game.title)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                                    activeGame === game.title 
                                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                                }`}
                            >
                                <img src={game.icon} alt="" className="w-8 h-8 rounded bg-slate-800 object-cover" />
                                <div className="flex-1 text-left">
                                    <div className="truncate">{game.title}</div>
                                    <div className="text-[10px] opacity-60">{game.count} posts</div>
                                </div>
                                {activeGame === game.title && <ChevronRight className="w-3 h-3" />}
                            </button>
                        ))}
                        
                        {/* Genre Tags */}
                        <div className="pt-4 pb-2 px-2">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase mb-2">Browse by Genre</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {GENRES.map(genre => (
                                    <Badge 
                                        key={genre} 
                                        variant="outline" 
                                        className="text-[10px] cursor-pointer hover:bg-slate-800 hover:text-white bg-slate-900/50 border-slate-800 text-slate-500"
                                        onClick={() => setSearchTerm(genre)}
                                    >
                                        {genre}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

function Badge({ className, children, ...props }) {
    return <div className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`} {...props}>{children}</div>
}