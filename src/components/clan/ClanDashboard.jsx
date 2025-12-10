import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Users, Trophy, Calendar, Target, Sword, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 ${className}`}>
        {children}
    </div>
);

export default function ClanDashboard({ clan, events }) {
    // Mock progression data
    const progress = (clan.xp / 10000) * 100; // Assuming 10k xp per level for demo

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
            {/* Guild Header Banner */}
            <div className="relative h-64 rounded-3xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <img 
                    src={clan.banner || "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200"} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt="Clan Banner"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 flex items-end justify-between">
                    <div className="flex items-end gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-black border-2 border-white/20 p-0.5 shadow-2xl backdrop-blur-sm">
                            {clan.icon ? (
                                <img src={clan.icon} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl">
                                    <Shield className="w-10 h-10 text-white/50" />
                                </div>
                            )}
                        </div>
                        <div className="mb-2">
                            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">{clan.name}</h1>
                            <p className="text-blue-200/80 font-medium text-sm flex items-center gap-2">
                                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs border border-blue-500/30 uppercase tracking-wide">Level {clan.level}</span>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <span>{clan.memberCount} Members</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         {/* Stats Pill */}
                         <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md rounded-full px-6 py-3 border border-white/10">
                             <div className="text-center">
                                 <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Ranking</div>
                                 <div className="text-lg font-bold text-white leading-none">#42</div>
                             </div>
                             <div className="w-px h-8 bg-white/10" />
                             <div className="text-center">
                                 <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Reputation</div>
                                 <div className="text-lg font-bold text-yellow-400 leading-none">Elite</div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-8">
                
                {/* Left Column: Updates & Quests */}
                <div className="col-span-8 space-y-8">
                    {/* Message of the Day */}
                    <GlassCard className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500" />
                        <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-500" /> Message of the Day
                        </h3>
                        <p className="text-xl text-white font-medium leading-relaxed">
                            "{clan.description || "Welcome to the guild. Coordinate your raid schedules in the #planning channel. We aim for World First this season."}"
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                            <span>Updated by Commander</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span>Today at 09:00 AM</span>
                        </div>
                    </GlassCard>

                    {/* Guild Progression */}
                    <div className="grid grid-cols-2 gap-6">
                         <GlassCard>
                             <div className="flex items-center justify-between mb-4">
                                 <h3 className="text-sm font-bold text-white/60">Guild XP</h3>
                                 <span className="text-xs font-mono text-blue-400">{Math.floor(progress)}%</span>
                             </div>
                             <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                                 <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${progress}%` }}
                                     className="h-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                 />
                             </div>
                             <div className="mt-2 flex justify-between text-xs text-white/30">
                                 <span>Lvl {clan.level}</span>
                                 <span>Lvl {clan.level + 1}</span>
                             </div>
                         </GlassCard>

                         <GlassCard>
                             <div className="flex items-center justify-between mb-4">
                                 <h3 className="text-sm font-bold text-white/60">Weekly Contribution</h3>
                                 <Trophy className="w-4 h-4 text-yellow-500" />
                             </div>
                             <div className="flex items-end gap-2">
                                 <span className="text-2xl font-bold text-white">24,500</span>
                                 <span className="text-sm text-green-400 mb-1 flex items-center">
                                     +12% <span className="text-white/20 text-xs ml-1">vs last week</span>
                                 </span>
                             </div>
                         </GlassCard>
                    </div>

                    {/* Active Guild Quests */}
                    <div>
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-red-500" /> Active Guild Quests
                        </h2>
                        <div className="space-y-3">
                            {[
                                { title: "Slay the Ancient Dragon", progress: 3, total: 5, reward: "Legendary Cache", type: "Raid" },
                                { title: "Gather Void Essence", progress: 450, total: 1000, reward: "+500 Guild XP", type: "Collection" },
                                { title: "Win PvP Skirmishes", progress: 8, total: 20, reward: "Gladiator Title", type: "PvP" }
                            ].map((quest, i) => (
                                <GlassCard key={i} className="p-4 hover:bg-white/10 transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-white/5 border-white/10 text-white/60 group-hover:text-white group-hover:border-white/30">
                                                {quest.type}
                                            </Badge>
                                            <span className="font-bold text-white">{quest.title}</span>
                                        </div>
                                        <span className="text-xs font-bold text-yellow-400">{quest.reward}</span>
                                    </div>
                                    <div className="relative h-2 bg-black/40 rounded-full overflow-hidden">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-orange-500"
                                            style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                                        />
                                    </div>
                                    <div className="mt-1 text-right text-[10px] text-white/40 font-mono">
                                        {quest.progress} / {quest.total}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Events */}
                <div className="col-span-4 space-y-6">
                    <GlassCard className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                             <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                                 <Calendar className="w-4 h-4" /> Upcoming Events
                             </h3>
                             <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-white/10">
                                 <Sword className="w-3 h-3 text-white/60" />
                             </Button>
                        </div>

                        <div className="flex-1 space-y-4">
                            {events && events.length > 0 ? events.map(event => (
                                <div key={event.id} className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 border border-white/5 hover:border-blue-500/50 transition-all group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Sword className="w-12 h-12" />
                                    </div>
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg w-12 h-12 border border-white/10">
                                            <span className="text-[10px] font-bold text-white/40 uppercase">{format(new Date(event.startTime), 'MMM')}</span>
                                            <span className="text-lg font-bold text-white">{format(new Date(event.startTime), 'd')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-white truncate group-hover:text-blue-400 transition-colors">{event.title}</h4>
                                            <p className="text-xs text-white/40 mb-2 truncate">{event.description}</p>
                                            <div className="flex items-center gap-2">
                                                <Badge className="text-[10px] px-1.5 h-5 bg-blue-500/20 text-blue-300 border-blue-500/30">
                                                    {event.participants?.length || 0}/{event.maxParticipants}
                                                </Badge>
                                                <span className="text-[10px] text-white/30">{format(new Date(event.startTime), 'h:mm a')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-white/20">
                                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-xs">No active operations</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}