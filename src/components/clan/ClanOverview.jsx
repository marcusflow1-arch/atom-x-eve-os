import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Crown, Trophy, Target, Calendar, ArrowRight, Sword, LogOut, Trash2, 
    Settings, MessageSquare, Mic, UserPlus, Users, Scroll, Activity, 
    Coins, Gem, ShieldAlert, Star, CircleDot, Gamepad2, Clock, 
    TrendingUp, Flame, Zap, Award, ChevronRight, Send, X, Grid3X3,
    Bell, Megaphone, ArrowLeft, ChevronDown, ChevronUp
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
    
    // Layout swap state: false = chat left/roster right, true = roster left/chat right
    const [layoutSwapped, setLayoutSwapped] = useState(false);
    
    // Announcements dropdown state
    const [showAnnouncements, setShowAnnouncements] = useState(false);
    
    // Listen for toggle event from parent
    useEffect(() => {
        const handleToggle = (e) => {
            if (e.detail === 'announcements') {
                setShowAnnouncements(prev => !prev);
            }
        };
        window.addEventListener('toggleClanPanel', handleToggle);
        return () => window.removeEventListener('toggleClanPanel', handleToggle);
    }, []);

    const { data: upcomingEvents } = useQuery({
        queryKey: ['clanOverviewEvents', clan.id],
        queryFn: async () => {
            const events = await base44.entities.ClanEvent.filter({ divisionId: clan.id });
            return events.sort((a,b) => new Date(a.startTime) - new Date(b.startTime)).slice(0, 10);
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

    const { data: members } = useQuery({
        queryKey: ['clanMembersList', clan.id],
        queryFn: async () => {
            return await base44.entities.ClanMember.filter({ clan_id: clan.id });
        },
        enabled: !!clan.id
    });

    const { data: recentMessages } = useQuery({
        queryKey: ['clanRecentMessages', clan.id],
        queryFn: async () => {
            const messages = await base44.entities.ClanMessage.filter({ divisionId: clan.id });
            return (messages || []).sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)).slice(0, 15);
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

    // Nickname & Title editing
    const [editingMemberId, setEditingMemberId] = useState(null);
    const [editNickname, setEditNickname] = useState('');
    const [editTitle, setEditTitle] = useState('');

    const updateMemberMutation = useMutation({
        mutationFn: ({ id, updates }) => base44.entities.ClanMember.update(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries(['clanMembersList', clan.id]);
            setEditingMemberId(null);
        }
    });

    const clanResources = { gold: 14500, gems: 320, influence: clan.reputation || 0 };

    // Mock activity feed
    const mockActivityFeed = [
        { id: 1, type: 'farm', user: 'ShadowBlade', action: 'completed a farming route', game: 'Elden Ring', time: '12m ago', icon: TrendingUp, color: 'text-green-400' },
        { id: 2, type: 'achievement', user: 'NightHawk', action: 'unlocked', item: 'Dragon Slayer', time: '25m ago', icon: Award, color: 'text-yellow-400' },
        { id: 3, type: 'pvp', user: 'CrimsonWolf', action: 'won a PvP match', game: 'Valorant', time: '1h ago', icon: Sword, color: 'text-red-400' },
        { id: 4, type: 'join', user: 'NewPlayer42', action: 'joined the clan', time: '2h ago', icon: UserPlus, color: 'text-cyan-400' },
        { id: 5, type: 'quest', user: 'PhantomX', action: 'completed clan quest', item: 'Weekly Raid', time: '3h ago', icon: Target, color: 'text-purple-400' },
        { id: 6, type: 'farm', user: 'BladeRunner', action: 'farmed 500 gold', game: 'Diablo IV', time: '4h ago', icon: Coins, color: 'text-yellow-400' },
        { id: 7, type: 'pvp', user: 'StormBreaker', action: 'ranked up to Diamond', game: 'Valorant', time: '5h ago', icon: Trophy, color: 'text-purple-400' },
    ];

    // Mock announcements
    const mockAnnouncements = [
        { id: 1, title: 'Weekly Raid Schedule', content: 'Raids will be held every Saturday at 8PM EST. Make sure to sign up!', date: new Date(), author: 'Leader' },
        { id: 2, title: 'New Members Welcome', content: 'Please welcome our new recruits this week. Help them get oriented.', date: new Date(Date.now() - 86400000), author: 'Officer' },
        { id: 3, title: 'Clan Tournament', content: 'We are entering the regional tournament. Practice sessions start Monday.', date: new Date(Date.now() - 172800000), author: 'Leader' },
    ];

    const mockOnlineStatus = members?.map((m, i) => ({
        ...m,
        isOnline: i < 5,
        currentGame: i < 3 ? ['Elden Ring', 'Valorant', 'Diablo IV'][i] : null,
        status: i < 3 ? 'In Game' : i < 5 ? 'Online' : 'Offline'
    })) || [];

    // Components for swappable panels
    const ChatPanel = ({ expanded }) => (
        <LiquidGlassCard className="p-4 h-full flex flex-col relative">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-blue-400" /> Clan Chat
                </h3>
                <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
                    onClick={() => setLayoutSwapped(!layoutSwapped)}
                    title="Swap Layout"
                >
                    <Grid3X3 className="w-4 h-4" />
                </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {recentMessages?.length > 0 ? recentMessages.map((msg) => (
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
                />
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 h-9 px-3">
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </LiquidGlassCard>
    );

    const RosterPanel = ({ expanded }) => (
        <LiquidGlassCard className="p-4 h-full flex flex-col relative">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Users className="w-4 h-4 text-cyan-400" /> Clan Roster
                </h3>
                <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-300 border-none text-xs">
                        {mockOnlineStatus.filter(m => m.isOnline).length} Online
                    </Badge>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
                        onClick={() => setLayoutSwapped(!layoutSwapped)}
                        title="Swap Layout"
                    >
                        <Grid3X3 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                {mockOnlineStatus.map((member) => (
                    <motion.div 
                        key={member.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                            member.isOnline ? 'bg-white/5 hover:bg-white/10' : 'opacity-50 hover:opacity-70'
                        }`}
                    >
                        <div className="relative">
                            <div className={`w-9 h-9 rounded-full overflow-hidden border-2 ${
                                member.role === 'leader' ? 'border-yellow-500' : 
                                member.role === 'officer' ? 'border-purple-500' : 'border-white/20'
                            }`}>
                                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold text-white/70">
                                    {member.user_id?.slice(0,2).toUpperCase() || 'U'}
                                </div>
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#12141a] ${
                                member.isOnline ? 'bg-green-500' : 'bg-slate-600'
                            }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">
                                        {member.nickname || `Agent ${member.user_id?.slice(0,6) || 'Unknown'}`}
                                    </p>
                                    {member.title && (
                                        <Badge className="bg-white/10 text-white/70 border-none text-[10px]">
                                            {member.title}
                                        </Badge>
                                    )}
                                    {member.role === 'leader' && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                                    {member.role === 'officer' && <Star className="w-3.5 h-3.5 text-purple-400" />}
                                </div>
                                {isOfficer && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10"
                                      onClick={() => { setEditingMemberId(member.id); setEditNickname(member.nickname || ''); setEditTitle(member.title || ''); }}
                                      title="Edit nickname/title"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </Button>
                                )}
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
                            {isOfficer && editingMemberId === member.id && (
                                <div className="mt-2 flex items-center gap-2">
                                    <Input
                                      value={editNickname}
                                      onChange={(e) => setEditNickname(e.target.value)}
                                      placeholder="Nickname"
                                      className="h-8 bg-white/5 border-white/10 text-white"
                                    />
                                    <Input
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      placeholder="Title"
                                      className="h-8 bg-white/5 border-white/10 text-white"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => updateMemberMutation.mutate({ id: member.id, updates: { nickname: editNickname, title: editTitle } })}
                                      className="h-8 px-3"
                                    >
                                      Save
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 px-3" onClick={() => setEditingMemberId(null)}>Cancel</Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </LiquidGlassCard>
    );

    return (
        <div className="h-full overflow-hidden flex flex-col">
            
            {/* ANNOUNCEMENTS DROPDOWN - Pushed down content when open */}
            <AnimatePresence>
                {showAnnouncements && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-white/10 bg-amber-500/5"
                    >
                        <div className="p-4 max-h-64 overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                                    <Megaphone className="w-4 h-4" /> Clan Announcements
                                </h3>
                                <button onClick={() => setShowAnnouncements(false)} className="text-white/40 hover:text-white">
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {mockAnnouncements.map((ann) => (
                                    <div key={ann.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-white text-sm">{ann.title}</h4>
                                            <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px]">{ann.author}</Badge>
                                        </div>
                                        <p className="text-xs text-white/60">{ann.content}</p>
                                        <p className="text-[10px] text-white/30 mt-1">{format(ann.date, 'MMM d, yyyy')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT AREA - Chat, Roster, Activity */}
            <div className="flex-1 overflow-hidden px-4 pb-4 pt-2 flex gap-4">
                {/* LEFT PANEL */}
                <div className={`h-full transition-all duration-300 ${layoutSwapped ? 'w-[55%]' : 'w-[25%]'}`}>
                    {layoutSwapped ? <RosterPanel expanded /> : <ChatPanel />}
                </div>

                {/* CENTER PANEL (Roster or Chat based on swap) */}
                <div className={`h-full transition-all duration-300 ${layoutSwapped ? 'w-[25%]' : 'w-[55%]'}`}>
                    {layoutSwapped ? <ChatPanel /> : <RosterPanel expanded />}
                </div>

                {/* RIGHT PANEL - Activity Log */}
                <div className="w-[20%] h-full">
                    <LiquidGlassCard className="p-4 h-full flex flex-col">
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                            <Activity className="w-3.5 h-3.5 text-orange-400" /> Activity
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            {mockActivityFeed.map((activity) => (
                                <motion.div 
                                    key={activity.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors"
                                >
                                    <div className={`w-6 h-6 rounded flex items-center justify-center bg-white/5 flex-shrink-0 ${activity.color}`}>
                                        <activity.icon className="w-3 h-3" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] text-white/70 leading-tight">
                                            <span className="font-bold text-white">{activity.user}</span>
                                            {' '}{activity.action}
                                            {activity.item && <span className="text-cyan-400"> {activity.item}</span>}
                                        </p>
                                        <span className="text-[9px] text-white/30">{activity.time}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </LiquidGlassCard>
                </div>
            </div>



            {/* Dialogs */}
            <Dialog open={isDismantleOpen} onOpenChange={setIsDismantleOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Dismantle Division?</DialogTitle>
                        <DialogDescription className="text-white/60">
                            This action cannot be undone. This will permanently delete the clan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDismantleOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => dismantleMutation.mutate()}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Invite Member</DialogTitle>
                    </DialogHeader>
                    <Input 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="agent@email.com"
                        className="bg-black/50 border-white/10 text-white"
                    />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                        <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail}>Send</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Leave {clan.name}?</DialogTitle>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsLeaveOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => { leaveMutation.mutate(); setIsLeaveOpen(false); }}>Leave</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}