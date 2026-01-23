import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { motion } from 'framer-motion';
import { 
    Crown, Trophy, Target, Calendar, ArrowRight, Sword, LogOut, Trash2, 
    Settings, MessageSquare, Mic, UserPlus, Users, Scroll, Activity, 
    Coins, Gem, ShieldAlert, Star, CircleDot, Gamepad2, Clock, 
    TrendingUp, Flame, Zap, Award, ChevronRight, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
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
            return members[0] || null;
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

    // Fetch recent chat messages
    const { data: recentMessages } = useQuery({
        queryKey: ['clanRecentMessages', clan.id],
        queryFn: async () => {
            const messages = await base44.entities.ClanMessage.filter({ divisionId: clan.id });
            return messages.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 8);
        },
        enabled: !!clan.id
    });

    const leaveMutation = useMutation({
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'leave_clan', data: { divisionId: clan.id } }),
        onSuccess: (res) => {
            if (res.data?.success) {
                queryClient.invalidateQueries(['myClanMemberships']);
            } else {
                alert(res.data?.error || 'Failed to leave clan');
            }
        },
        onError: () => alert('Failed to leave clan. Please try again.')
    });

    const dismantleMutation = useMutation({
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'delete_clan', data: { divisionId: clan.id } }),
        onSuccess: (res) => {
            if (res.data?.success) {
                queryClient.invalidateQueries(['myClanMemberships']);
            } else {
                alert(res.data?.error || 'Failed to dismantle clan');
            }
        },
        onError: () => alert('Failed to dismantle clan. Please try again.')
    });

    const inviteMutation = useMutation({
        mutationFn: () => base44.functions.invoke('clanSystem', { action: 'invite_member', data: { divisionId: clan.id, inviteeEmail: inviteEmail } }),
        onSuccess: (res) => {
            if (res.data?.success) {
                alert("Invite sent!");
                setIsInviteOpen(false);
                setInviteEmail('');
            } else {
                alert(res.data?.error || "Failed to invite user");
            }
        },
        onError: () => alert('Failed to send invite. Please try again.')
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

    // Mock activity feed
    const mockActivityFeed = [
        { id: 1, type: 'farm', user: 'ShadowBlade', action: 'completed a farming route', game: 'Elden Ring', time: '12m ago', icon: TrendingUp, color: 'text-green-400' },
        { id: 2, type: 'achievement', user: 'NightHawk', action: 'unlocked', item: 'Dragon Slayer', time: '25m ago', icon: Award, color: 'text-yellow-400' },
        { id: 3, type: 'pvp', user: 'CrimsonWolf', action: 'won a PvP match', game: 'Valorant', time: '1h ago', icon: Sword, color: 'text-red-400' },
        { id: 4, type: 'join', user: 'NewPlayer42', action: 'joined the clan', time: '2h ago', icon: UserPlus, color: 'text-cyan-400' },
        { id: 5, type: 'quest', user: 'PhantomX', action: 'completed clan quest', item: 'Weekly Raid', time: '3h ago', icon: Target, color: 'text-purple-400' },
    ];

    // Mock online members with status
    const mockOnlineStatus = members?.map((m, i) => ({
        ...m,
        isOnline: i < 5, // First 5 are online
        currentGame: i < 3 ? ['Elden Ring', 'Valorant', 'Diablo IV'][i] : null,
        status: i < 3 ? 'In Game' : i < 5 ? 'Online' : 'Offline'
    })) || [];

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {/* 1. HERO HEADER: Banner, Identity, XP */}
            <div className="relative w-full h-[240px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                <div className="absolute inset-0">
                    <img 
                        src={clan.banner || "https://images.unsplash.com/photo-1533130061792-649d45df8c2d?w=1200"} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        alt="Banner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c10]/90 via-transparent to-[#0a0c10]/30" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row items-end gap-6">
                    {/* Icon Box */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/20 p-1 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <div className="w-full h-full rounded-xl overflow-hidden bg-white/5 relative">
                                {clan.icon ? (
                                    <img src={clan.icon} className="w-full h-full object-cover" />
                                ) : (
                                    <ShieldAlert className="w-full h-full p-4 text-white/20" />
                                )}
                                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
                            </div>
                        </div>
                        <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black border-yellow-400 font-bold px-2 text-xs shadow-lg shadow-yellow-900/50">
                            LVL {clan.level}
                        </Badge>
                    </div>

                    {/* Details */}
                    <div className="flex-1 mb-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-2xl">
                                {clan.name}
                            </h1>
                            {clan.isPrivate && <Badge variant="outline" className="border-white/20 text-white/50 text-xs">Private</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 font-medium">
                            <span className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-cyan-400" /> 
                                {members?.length || 1} Members
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CircleDot className="w-3 h-3 text-green-400" />
                                {mockOnlineStatus.filter(m => m.isOnline).length} Online
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                                Rank #42
                            </span>
                        </div>
                    </div>

                    {/* XP Bar + Leave Button */}
                    <div className="w-full md:w-80 mb-1 flex items-center gap-3">
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-white/70 mb-1 font-bold tracking-wider">
                                <span>CLAN XP</span>
                                <span>{Math.floor(progress)}%</span>
                            </div>
                            <div className="h-2.5 bg-black/50 rounded-full border border-white/10 overflow-hidden relative">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                                    style={{ width: `${progress}%` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                            </div>
                            <p className="text-[10px] text-white/30 mt-0.5 text-right">{(clan.xp || 0).toLocaleString()} / 10,000 XP</p>
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

            {/* 2. MAIN GRID LAYOUT - Expanded for MMORPG feel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: Full Roster (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Full Member Roster */}
                    <LiquidGlassCard className="p-5 h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Users className="w-4 h-4 text-cyan-400" /> Clan Roster
                            </h3>
                            <Badge className="bg-green-500/20 text-green-300 border-none text-xs">
                                {mockOnlineStatus.filter(m => m.isOnline).length} Online
                            </Badge>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                            {mockOnlineStatus.map((member) => (
                                <motion.div 
                                    key={member.id} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                                        member.isOnline ? 'bg-white/5 hover:bg-white/10' : 'opacity-50 hover:opacity-70'
                                    }`}
                                >
                                    <div className="relative">
                                        <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${
                                            member.role === 'leader' ? 'border-yellow-500' : 
                                            member.role === 'officer' ? 'border-purple-500' : 'border-white/20'
                                        }`}>
                                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold text-white/70">
                                                {member.user_id?.slice(0,2).toUpperCase() || 'U'}
                                            </div>
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#12141a] ${
                                            member.isOnline ? 'bg-green-500' : 'bg-slate-600'
                                        }`} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-white truncate">
                                                Agent {member.user_id?.slice(0,6) || 'Unknown'}
                                            </p>
                                            {member.role === 'leader' && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                                            {member.role === 'officer' && <Star className="w-3.5 h-3.5 text-purple-400" />}
                                        </div>
                                        <p className="text-[11px] text-white/40 truncate">
                                            {member.currentGame ? (
                                                <span className="text-green-400 flex items-center gap-1">
                                                    <Gamepad2 className="w-3 h-3" /> {member.currentGame}
                                                </span>
                                            ) : (
                                                member.status
                                            )}
                                        </p>
                                    </div>
                                    
                                    <ChevronRight className="w-4 h-4 text-white/20" />
                                </motion.div>
                            ))}
                        </div>
                        
                        <div className="pt-3 mt-3 border-t border-white/5">
                            <Button 
                                onClick={() => onChangeTab('members')}
                                className="w-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                                size="sm"
                            >
                                View Full Roster <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </LiquidGlassCard>
                </div>

                {/* CENTER COLUMN: Activity Feed & Chat (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Recent Chat Preview */}
                    <LiquidGlassCard className="p-5 h-[280px] flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                                <MessageSquare className="w-4 h-4 text-blue-400" /> Clan Chat
                            </h3>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] text-white/40 hover:text-white"
                                onClick={() => onChangeTab('chat')}
                            >
                                OPEN CHAT
                            </Button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                            {recentMessages?.length > 0 ? recentMessages.map((msg, i) => (
                                <div key={msg.id} className="flex gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[10px] font-bold text-white/60 flex-shrink-0">
                                        {msg.author?.slice(0,2).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-cyan-400">{msg.authorAvatar || `Agent ${msg.author?.slice(0,4)}`}</span>
                                            <span className="text-[10px] text-white/30">{formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}</span>
                                        </div>
                                        <p className="text-sm text-white/70 break-words">{msg.content}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
                                    No messages yet. Start the conversation!
                                </div>
                            )}
                        </div>
                        
                        <div className="pt-3 mt-2 border-t border-white/5 flex gap-2">
                            <Input 
                                placeholder="Type a message..." 
                                className="bg-white/5 border-white/10 text-white text-sm h-9"
                                disabled
                            />
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 h-9 px-3" disabled>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </LiquidGlassCard>

                    {/* Live Activity Feed */}
                    <LiquidGlassCard className="p-5 h-[200px] flex flex-col">
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Activity className="w-4 h-4 text-orange-400" /> Live Activity
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            {mockActivityFeed.map((activity) => (
                                <motion.div 
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${activity.color}`}>
                                        <activity.icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-white/80 truncate">
                                            <span className="font-bold text-white">{activity.user}</span>
                                            {' '}{activity.action}{' '}
                                            {activity.item && <span className="text-cyan-400">{activity.item}</span>}
                                            {activity.game && <span className="text-purple-400">in {activity.game}</span>}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-white/30 flex-shrink-0">{activity.time}</span>
                                </motion.div>
                            ))}
                        </div>
                    </LiquidGlassCard>
                </div>

                {/* RIGHT COLUMN: Resources, Events, Admin (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Clan Resources Card */}
                    <LiquidGlassCard className="p-4">
                        <h3 className="text-white font-bold flex items-center gap-2 text-xs uppercase tracking-wider mb-3">
                            <Coins className="w-3.5 h-3.5 text-yellow-400" /> Treasury
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 text-center">
                                <Coins className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                                <p className="text-xs font-bold text-white">{(clanResources.gold / 1000).toFixed(1)}K</p>
                                <p className="text-[9px] text-white/40">Gold</p>
                            </div>
                            <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 text-center">
                                <Gem className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                                <p className="text-xs font-bold text-white">{clanResources.gems}</p>
                                <p className="text-[9px] text-white/40">Ether</p>
                            </div>
                            <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 text-center">
                                <Star className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                <p className="text-xs font-bold text-white">{clanResources.influence}</p>
                                <p className="text-[9px] text-white/40">Rep</p>
                            </div>
                        </div>
                    </LiquidGlassCard>

                    {/* MOTD / Announcement */}
                    <LiquidGlassCard className="p-4">
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-[10px] mb-2">
                            <Crown className="w-3 h-3 mr-1" /> ANNOUNCEMENT
                        </Badge>
                        <p className="text-sm text-white/80 leading-relaxed line-clamp-4">
                            "{clan.motd || clan.description || "Welcome to the clan! Check the schedule for upcoming events."}"
                        </p>
                    </LiquidGlassCard>

                    {/* Upcoming Events Mini */}
                    <LiquidGlassCard className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                                <Calendar className="w-3.5 h-3.5 text-green-400" /> Schedule
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {upcomingEvents?.length > 0 ? upcomingEvents.slice(0,2).map(event => (
                                <div key={event.id} className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded bg-green-500/20 flex flex-col items-center justify-center text-green-400 font-bold leading-none border border-green-500/30">
                                            <span className="text-[8px] uppercase">{format(new Date(event.startTime), 'MMM')}</span>
                                            <span className="text-xs">{format(new Date(event.startTime), 'd')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{event.title}</p>
                                            <p className="text-[10px] text-white/40">{format(new Date(event.startTime), 'h:mm a')}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-white/30 text-xs italic">
                                    No missions scheduled.
                                </div>
                            )}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full mt-2 h-7 text-[10px] text-white/40" 
                            onClick={() => onChangeTab('events')}
                        >
                            VIEW ALL EVENTS
                        </Button>
                    </LiquidGlassCard>

                    {/* Admin Actions */}
                    {isOfficer && (
                        <LiquidGlassCard className="p-4 border-l-2 border-l-purple-500">
                            <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                                <Settings className="w-3.5 h-3.5 text-purple-400" /> Command
                            </h3>
                            <div className="space-y-2">
                                <Button 
                                    onClick={() => setIsInviteOpen(true)}
                                    size="sm"
                                    className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 justify-start h-8 text-xs"
                                >
                                    <UserPlus className="w-3.5 h-3.5 mr-2" /> Invite Agent
                                </Button>
                                {isLeader && (
                                    <Button 
                                        onClick={() => setIsDismantleOpen(true)}
                                        size="sm"
                                        className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 justify-start h-8 text-xs"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Dismantle
                                    </Button>
                                )}
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

            {/* Leave Clan Dialog */}
            <Dialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Leave {clan.name}?</DialogTitle>
                        <DialogDescription className="text-white/60">
                            Are you sure you want to leave this clan? You can rejoin later if the clan is public or request to rejoin if it's private.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsLeaveOpen(false)}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => {
                                leaveMutation.mutate();
                                setIsLeaveOpen(false);
                            }}
                            disabled={leaveMutation.isPending}
                        >
                            {leaveMutation.isPending ? 'Leaving...' : 'Leave Clan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}