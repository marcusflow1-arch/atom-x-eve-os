import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { motion } from 'framer-motion';
import { 
    Crown, Trophy, Target, Calendar, ArrowRight, Sword, LogOut, Trash2, 
    Settings, MessageSquare, Mic, UserPlus, Users, Scroll, Activity, 
    Coins, Gem, ShieldAlert, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';

export default function ClanOverview({ clan, activeVoiceRooms, onChangeTab }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isDismantleOpen, setIsDismantleOpen] = useState(false);
    const [isLeaveOpen, setIsLeaveOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

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
            const members = await base44.entities.ClanMember.filter({ clan_id: clan.id, user_id: user.id });
            return members[0];
        },
        enabled: !!clan.id && !!user
    });

    // Fetch members to display count/roster
    const { data: members } = useQuery({
        queryKey: ['clanMembersList', clan.id],
        queryFn: async () => {
            return await base44.entities.ClanMember.filter({ clan_id: clan.id });
        },
        enabled: !!clan.id
    });

    const leaveMutation = useMutation({
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'leave_clan', data: { divisionId: clan.id } }),
        onSuccess: (res) => {
            if (res.data.success) {
                queryClient.invalidateQueries(['myClanMemberships']);
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

    const inviteMutation = useMutation({
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'invite_member', data: { divisionId: clan.id, inviteeEmail: inviteEmail } }),
        onSuccess: (res) => {
            if (res.data.success) {
                alert("Invite sent!");
                setIsInviteOpen(false);
                setInviteEmail('');
            } else {
                alert(res.data.error || "Failed to invite user");
            }
        }
    });

    const progress = ((clan.xp || 0) / 10000) * 100;
    const isLeader = myMemberRecord?.role === 'leader';
    const isOfficer = myMemberRecord?.role === 'officer' || isLeader;

    // Mock Data for "MMORPG" feel
    const clanResources = {
        gold: 14500,
        gems: 320,
        influence: clan.reputation || 0
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {/* 1. HERO HEADER: Banner, Identity, XP */}
            <div className="relative w-full h-[280px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                <div className="absolute inset-0">
                    <img 
                        src={clan.banner || "https://images.unsplash.com/photo-1533130061792-649d45df8c2d?w=1200"} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        alt="Banner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c10]/90 via-transparent to-[#0a0c10]/30" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row items-end gap-8">
                    {/* Icon Box */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/20 p-1 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <div className="w-full h-full rounded-xl overflow-hidden bg-white/5 relative">
                                {clan.icon ? (
                                    <img src={clan.icon} className="w-full h-full object-cover" />
                                ) : (
                                    <ShieldAlert className="w-full h-full p-6 text-white/20" />
                                )}
                                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
                            </div>
                        </div>
                        <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black border-yellow-400 font-bold px-3 shadow-lg shadow-yellow-900/50">
                            LVL {clan.level}
                        </Badge>
                    </div>

                    {/* Details */}
                    <div className="flex-1 mb-2">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-2xl">
                                {clan.name}
                            </h1>
                            {clan.isPrivate && <Badge variant="outline" className="border-white/20 text-white/50">Private</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-sm text-white/60 font-medium">
                            <span className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-cyan-400" /> 
                                {members?.length || 1} / 50 Members
                            </span>
                            <span className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                                Rank #42
                            </span>
                            <span className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-400" />
                                High Activity
                            </span>
                        </div>
                    </div>

                    {/* XP Bar + Leave Button */}
                    <div className="w-full md:w-72 mb-3">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex-1">
                                <div className="flex justify-between text-xs text-white/70 mb-1 font-bold tracking-wider">
                                    <span>PROGRESS</span>
                                    <span>{Math.floor(progress)}%</span>
                                </div>
                                <div className="h-3 bg-black/50 rounded-full border border-white/10 overflow-hidden relative">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                                        style={{ width: `${progress}%` }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                                </div>
                                <p className="text-[10px] text-white/30 mt-1 text-right">{(clan.xp || 0).toLocaleString()} / 10,000 XP</p>
                            </div>
                            {!isLeader && (
                                <Button 
                                    onClick={() => setIsLeaveOpen(true)}
                                    size="sm"
                                    className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 flex-shrink-0"
                                >
                                    <LogOut className="w-4 h-4 mr-1" /> Leave
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: Info & Roster (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Clan Resources Card */}
                    <LiquidGlassCard className="p-5 flex flex-col gap-4">
                        <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Coins className="w-4 h-4 text-yellow-400" /> Treasury
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2 text-yellow-200">
                                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                        <Coins className="w-3 h-3" />
                                    </div>
                                    <span className="font-bold">Gold</span>
                                </div>
                                <span className="font-mono text-white">{clanResources.gold.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2 text-purple-200">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <Gem className="w-3 h-3" />
                                    </div>
                                    <span className="font-bold">Ether</span>
                                </div>
                                <span className="font-mono text-white">{clanResources.gems.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2 text-blue-200">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Star className="w-3 h-3" />
                                    </div>
                                    <span className="font-bold">Rep</span>
                                </div>
                                <span className="font-mono text-white">{(clanResources.influence || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </LiquidGlassCard>

                    {/* Member Quick List */}
                    <LiquidGlassCard className="p-5 h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Users className="w-4 h-4 text-cyan-400" /> Roster
                            </h3>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChangeTab('members')}>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                            {members?.slice(0, 10).map((member) => (
                                <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-white/10">
                                        {/* Avatar placeholder - in real app fetch user data */}
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/50">
                                            {member.role[0].toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">Agent {member.user_id.slice(0,4)}</p>
                                        <p className={`text-[10px] uppercase font-bold ${
                                            member.role === 'leader' ? 'text-yellow-400' : 
                                            member.role === 'officer' ? 'text-purple-400' : 'text-slate-500'
                                        }`}>
                                            {member.role}
                                        </p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_lime]" />
                                </div>
                            ))}
                        </div>
                    </LiquidGlassCard>
                </div>

                {/* CENTER COLUMN: Feed & MOTD (6 cols) */}
                <div className="lg:col-span-6 space-y-6">
                    {/* Rich MOTD */}
                    <LiquidGlassCard className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                            <Scroll className="w-32 h-32 text-white" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                                <Crown className="w-3 h-3 mr-1 text-yellow-400" /> COMMANDER'S LOG
                            </Badge>
                            <span className="text-xs text-white/30">{format(new Date(), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="bg-black/30 rounded-xl p-4 border border-white/5 min-h-[120px]">
                            <p className="text-lg text-white/90 leading-relaxed font-medium">
                                "{clan.motd || clan.description || "The guild is growing stronger. Complete your weekly contributions and prepare for the upcoming raid. We need all hands on deck for the sector 7 conquest."}"
                            </p>
                        </div>
                    </LiquidGlassCard>

                    {/* Activity Feed (Mocked) */}
                    <LiquidGlassCard className="p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Activity className="w-4 h-4 text-blue-400" /> Recent Activity
                        </h3>
                        <div className="space-y-4 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/10" />
                            
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex gap-4 relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-[#1a1d26] border border-white/10 flex items-center justify-center flex-shrink-0">
                                        {i === 0 ? <Sword className="w-4 h-4 text-red-400" /> : 
                                         i === 1 ? <UserPlus className="w-4 h-4 text-green-400" /> : 
                                         <Trophy className="w-4 h-4 text-yellow-400" />}
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className="text-sm text-white/80">
                                            {i === 0 ? "Clan defeated 'The Void Guardian'" : 
                                             i === 1 ? "New member joined: ShadowBlade" : 
                                             "Clan reached Reputation Level 5"}
                                        </p>
                                        <p className="text-xs text-white/30 mt-1">{i * 2 + 1} hours ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </LiquidGlassCard>
                </div>

                {/* RIGHT COLUMN: Actions & Events (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Admin Actions */}
                    {isOfficer && (
                        <LiquidGlassCard className="p-5 border-l-4 border-l-purple-500">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Settings className="w-4 h-4 text-purple-400" /> Command Center
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                <Button 
                                    onClick={() => setIsInviteOpen(true)}
                                    className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 justify-start"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" /> Invite Agent
                                </Button>
                                <Button 
                                    onClick={() => alert("Settings panel would open here")}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 justify-start"
                                >
                                    <Settings className="w-4 h-4 mr-2" /> Clan Settings
                                </Button>
                                {isLeader && (
                                    <Button 
                                        onClick={() => setIsDismantleOpen(true)}
                                        className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 justify-start mt-2"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" /> Dismantle
                                    </Button>
                                )}
                            </div>
                        </LiquidGlassCard>
                    )}

                    {/* Upcoming Events Mini */}
                    <LiquidGlassCard className="p-5 flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Calendar className="w-4 h-4 text-green-400" /> Schedule
                            </h3>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/40" onClick={() => onChangeTab('events')}>
                                VIEW ALL
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {upcomingEvents?.length > 0 ? upcomingEvents.map(event => (
                                <div key={event.id} className="bg-white/5 rounded-lg p-3 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-green-500/20 flex flex-col items-center justify-center text-green-400 font-bold leading-none border border-green-500/30">
                                            <span className="text-[8px] uppercase">{format(new Date(event.startTime), 'MMM')}</span>
                                            <span className="text-sm">{format(new Date(event.startTime), 'd')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{event.title}</p>
                                            <p className="text-[10px] text-white/40">{format(new Date(event.startTime), 'h:mm a')}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-6 text-white/30 text-xs italic">
                                    No missions scheduled.
                                </div>
                            )}
                        </div>
                    </LiquidGlassCard>

                    {/* Voice Status */}
                    {activeVoiceRooms?.length > 0 && (
                        <LiquidGlassCard className="p-5 bg-green-900/10 border-green-500/20">
                            <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider animate-pulse">
                                <Mic className="w-4 h-4" /> Live Comms
                            </h3>
                            <div className="space-y-2">
                                {activeVoiceRooms.map((room) => (
                                    <div key={room.id} className="flex items-center justify-between text-sm text-white/80">
                                        <span>{room.topic || "Voice Channel"}</span>
                                        <Badge className="bg-green-500/20 text-green-300 border-none text-[10px]">{room.participants.length}</Badge>
                                    </div>
                                ))}
                                <Button 
                                    size="sm" 
                                    className="w-full mt-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30"
                                    onClick={() => onChangeTab('voice')}
                                >
                                    Join Channel
                                </Button>
                            </div>
                        </LiquidGlassCard>
                    )}
                </div>
            </div>

            {/* Dialogs */}
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

            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Invite New Member</DialogTitle>
                        <DialogDescription className="text-white/60">
                            Enter the email of the user you want to invite to {clan.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input 
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="agent@base44.app"
                            className="bg-black/50 border-white/10 text-white"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                        <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending}>
                            {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}