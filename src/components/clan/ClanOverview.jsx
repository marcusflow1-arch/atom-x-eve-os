import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { motion } from 'framer-motion';
import { Crown, Trophy, Target, Calendar, ArrowRight, Sword, LogOut, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 ${className}`}>
        {children}
    </div>
);

export default function ClanOverview({ clan, onChangeTab }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isDismantleOpen, setIsDismantleOpen] = useState(false);
    const [isLeaveOpen, setIsLeaveOpen] = useState(false);

    const { data: upcomingEvents } = useQuery({
        queryKey: ['clanOverviewEvents', clan.id],
        queryFn: async () => {
            const events = await base44.entities.ClanEvent.filter({ divisionId: clan.id });
            return events.sort((a,b) => new Date(a.startTime) - new Date(b.startTime)).slice(0, 3);
        },
        enabled: !!clan.id
    });

    const { data: activeQuests } = useQuery({
        queryKey: ['clanOverviewQuests', clan.id],
        queryFn: async () => {
            const quests = await base44.entities.ClanQuest.filter({ divisionId: clan.id, status: 'open' });
            return quests.slice(0, 3);
        },
        enabled: !!clan.id
    });

    const { data: myMemberRecord } = useQuery({
        queryKey: ['myClanRole', clan.id],
        queryFn: async () => {
            const members = await base44.entities.ClanMember.filter({ divisionId: clan.id, userId: user.id });
            return members[0];
        },
        enabled: !!clan.id && !!user
    });

    const leaveMutation = useMutation({
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'leave_clan', data: { divisionId: clan.id } }),
        onSuccess: (res) => {
            if (res.data.success) {
                queryClient.invalidateQueries(['myClanMemberships']);
                // Parent component will handle redirect if needed as membership list updates
            } else {
                alert(res.data.error);
            }
        }
    });

    const dismantleMutation = useMutation({
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'delete_clan', data: { divisionId: clan.id } }),
        onSuccess: (res) => {
            if (res.data.success) {
                queryClient.invalidateQueries(['myClanMemberships']);
            } else {
                alert(res.data.error);
            }
        }
    });

    const progress = (clan.xp / 10000) * 100;
    const isLeader = myMemberRecord?.role === 'leader';

    return (
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar h-full">
            {/* MOTD Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-3xl overflow-hidden p-8 border border-white/10 group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/80 z-0" />
                <img 
                    src={clan.banner || "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200"} 
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay transition-transform duration-700 group-hover:scale-105" 
                />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 uppercase tracking-widest text-[10px]">
                            <Crown className="w-3 h-3 mr-1" /> MOTD
                        </Badge>
                        <span className="text-white/40 text-xs">Posted today</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight max-w-3xl">
                        "{clan.motd || clan.description || "Welcome to the guild. Coordinate your raid schedules in the #planning channel."}"
                    </h2>
                    <p className="text-white/60 text-sm">
                        - Commander
                    </p>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Trophy className="w-5 h-5 text-blue-400" />
                        </div>
                        <Badge variant="outline" className="border-blue-500/30 text-blue-300">Lvl {clan.level}</Badge>
                    </div>
                    <div className="mb-2">
                        <span className="text-3xl font-bold text-white">{clan.xp.toLocaleString()}</span>
                        <span className="text-white/40 text-sm ml-2">/ 10,000 XP</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
                    </div>
                </GlassCard>

                <GlassCard>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Target className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-xs text-white/40 font-mono">Weekly</span>
                    </div>
                    <div className="mb-1">
                        <span className="text-3xl font-bold text-white">Elite</span>
                        <span className="text-white/40 text-sm ml-2">Tier</span>
                    </div>
                    <p className="text-xs text-white/50">Top 5% of active clans</p>
                </GlassCard>

                <GlassCard className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sword className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-white font-bold mb-1">Guild Reputation</h3>
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                            {clan.reputation || 0}
                        </div>
                        <p className="text-xs text-white/40 mt-2">Very Honorable</p>
                    </div>
                </GlassCard>
            </div>

            {/* Content Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Operations (Quests) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-red-400" /> Active Operations
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => onChangeTab('quests')} className="text-white/40 hover:text-white">
                            View All <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {activeQuests?.map(quest => (
                            <div key={quest.id} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white group-hover:text-blue-300 transition-colors">{quest.title}</h4>
                                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px]">
                                        Active
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs text-white/40">
                                    <span>{quest.participants.length}/{quest.maxParticipants} Agents</span>
                                    <span>Reward: {quest.rewards}</span>
                                </div>
                            </div>
                        ))}
                        {(!activeQuests || activeQuests.length === 0) && (
                            <div className="text-center py-8 text-white/30 bg-white/5 rounded-xl border border-dashed border-white/10">
                                <p>No active operations</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-400" /> Upcoming Events
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => onChangeTab('events')} className="text-white/40 hover:text-white">
                            View Calendar <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {upcomingEvents?.map(event => (
                            <div key={event.id} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 transition-all cursor-pointer">
                                <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex flex-col items-center justify-center border border-white/10">
                                    <span className="text-[10px] uppercase font-bold text-white/40">{format(new Date(event.startTime), 'MMM')}</span>
                                    <span className="text-lg font-bold text-white">{format(new Date(event.startTime), 'd')}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{event.title}</h4>
                                    <span className="text-xs text-white/40">{format(new Date(event.startTime), 'h:mm a')} • {event.eventType}</span>
                                </div>
                            </div>
                        ))}
                        {(!upcomingEvents || upcomingEvents.length === 0) && (
                            <div className="text-center py-8 text-white/30 bg-white/5 rounded-xl border border-dashed border-white/10">
                                <p>No events scheduled</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-8 border-t border-white/10">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-white/40" /> Membership Settings
                </h3>
                <div className="flex gap-4">
                    {isLeader ? (
                        <Button 
                            variant="destructive" 
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                            onClick={() => setIsDismantleOpen(true)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Dismantle Division
                        </Button>
                    ) : (
                        <Button 
                            variant="destructive" 
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                            onClick={() => setIsLeaveOpen(true)}
                        >
                            <LogOut className="w-4 h-4 mr-2" /> Leave Division
                        </Button>
                    )}
                </div>
            </div>

            {/* Dismantle Dialog */}
            <Dialog open={isDismantleOpen} onOpenChange={setIsDismantleOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Dismantle Division?</DialogTitle>
                        <DialogDescription className="text-white/60">
                            This action cannot be undone. This will permanently delete the clan and remove all members.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDismantleOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => dismantleMutation.mutate()}>Confirm Dismantle</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Leave Dialog */}
            <Dialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Leave Division?</DialogTitle>
                        <DialogDescription className="text-white/60">
                            Are you sure you want to leave {clan.name}? You will lose access to clan chat and events.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsLeaveOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => leaveMutation.mutate()}>Confirm Leave</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}