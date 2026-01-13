import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { 
    Shield, Plus, Hash, Volume2, Settings, ChevronDown, ChevronRight,
    Users, Calendar, Target, Crown, Megaphone, Gamepad2,
    Send, Search, Bell, Mic, MicOff, Headphones, PhoneOff,
    UserPlus, LogOut, Trash2, Sword, Scroll, Gem, Flag,
    MessageSquare, Smile, Image, Star, Flame, Zap, Award,
    Castle, Swords, BookOpen, Coins, Map, Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Guild Banner Component
const GuildBanner = ({ clan, members }) => (
    <div className="relative h-48 overflow-hidden rounded-t-2xl">
        <img 
            src={clan.banner || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200"} 
            className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/30 to-purple-900/30 mix-blend-overlay" />
        
        {/* Guild Emblem */}
        <div className="absolute bottom-4 left-6 flex items-end gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-700/30 border-2 border-amber-400/50 flex items-center justify-center backdrop-blur-sm shadow-2xl">
                {clan.icon ? (
                    <img src={clan.icon} className="w-full h-full object-cover rounded-xl" />
                ) : (
                    <Shield className="w-10 h-10 text-amber-400" />
                )}
            </div>
            <div className="pb-1">
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-white drop-shadow-lg">{clan.name}</h1>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                        <Crown className="w-3 h-3 mr-1" /> Lvl {clan.level || 1}
                    </Badge>
                </div>
                <p className="text-white/60 text-sm flex items-center gap-3">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {members?.length || 0} Members</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {clan.reputation || 0} Reputation</span>
                </p>
            </div>
        </div>

        {/* Guild Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
            <button className="w-9 h-9 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all">
                <Settings className="w-4 h-4" />
            </button>
        </div>
    </div>
);

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, subtext, color = "amber" }) => {
    const colors = {
        amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
        blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
        purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
        green: "from-green-500/20 to-green-600/10 border-green-500/30 text-green-400",
        red: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400"
    };
    
    return (
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colors[color]} border p-4 backdrop-blur-sm`}>
            <Icon className={`absolute -right-2 -bottom-2 w-16 h-16 opacity-10`} />
            <div className="relative z-10">
                <Icon className={`w-5 h-5 mb-2 ${colors[color].split(' ').pop()}`} />
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-white/50 text-xs">{label}</p>
                {subtext && <p className="text-white/30 text-[10px] mt-1">{subtext}</p>}
            </div>
        </div>
    );
};

// Channel Item Component
const ChannelItem = ({ channel, isActive, onClick, type = "text" }) => {
    const icons = {
        text: Hash,
        voice: Volume2,
        game: Gamepad2,
        announcement: Megaphone
    };
    const Icon = icons[type] || Hash;
    const iconColors = {
        text: "text-white/40",
        voice: "text-green-400",
        game: "text-purple-400",
        announcement: "text-amber-400"
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all group ${
                isActive 
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' 
                    : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
        >
            <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : iconColors[type]}`} />
            <span className="text-sm truncate flex-1 text-left">{channel.name}</span>
            {type === 'voice' && (
                <span className="text-[10px] text-white/30">0</span>
            )}
        </button>
    );
};

// Member Card Component
const MemberCard = ({ member, isLeader, isOfficer }) => (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer group">
        <div className="relative">
            <div className={`w-10 h-10 rounded-lg overflow-hidden border-2 ${
                isLeader ? 'border-amber-400' : isOfficer ? 'border-blue-400' : 'border-white/20'
            }`}>
                {member.user?.avatar_url ? (
                    <img src={member.user.avatar_url} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-sm font-bold">
                        {member.user?.full_name?.charAt(0) || '?'}
                    </div>
                )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#12141a]" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate flex items-center gap-1.5">
                {member.user?.full_name || 'Unknown'}
                {isLeader && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                {isOfficer && <Shield className="w-3 h-3 text-blue-400 fill-blue-400" />}
            </p>
            <p className="text-white/40 text-[10px] capitalize">{member.role}</p>
        </div>
    </div>
);

export default function ClanPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedClanId, setSelectedClanId] = useState(null);
    const [activeTab, setActiveTab] = useState('hall'); // hall, comms, roster, quests, events, vault
    const [activeChannelId, setActiveChannelId] = useState(null);
    const [isCreateClanOpen, setIsCreateClanOpen] = useState(false);
    const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
    const [newClanData, setNewClanData] = useState({ name: '', description: '' });
    const [newChannelData, setNewChannelData] = useState({ name: '', type: 'text' });
    const [message, setMessage] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [channelSearch, setChannelSearch] = useState('');
    const [isSearchingChannels, setIsSearchingChannels] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef(null);
    const searchInputRef = useRef(null);

    // Fetch Memberships
    const { data: memberships, isLoading } = useQuery({
        queryKey: ['myClanMemberships', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const members = await base44.entities.ClanMember.filter({ userId: user.id });
            const divisions = await Promise.all(members.map(async (m) => {
                const d = await base44.entities.Division.get(m.divisionId);
                return d ? { ...d, divisionId: d.id } : null;
            }));
            return divisions.filter(d => d);
        },
        enabled: !!user
    });

    useEffect(() => {
        if (memberships?.length > 0 && !selectedClanId) {
            setSelectedClanId(memberships[0].divisionId);
        }
    }, [memberships]);

    const activeClan = memberships?.find(c => c.divisionId === selectedClanId);

    // Fetch Channels
    const { data: channels } = useQuery({
        queryKey: ['clanChannels', activeClan?.id],
        queryFn: () => base44.entities.ClanChannel.filter({ divisionId: activeClan.id }),
        enabled: !!activeClan
    });

    // Fetch Messages
    const { data: messages } = useQuery({
        queryKey: ['clanMessages', activeChannelId],
        queryFn: async () => {
            if (!activeChannelId) return [];
            const msgs = await base44.entities.ClanMessage.filter({ channelId: activeChannelId });
            return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        },
        enabled: !!activeChannelId,
        refetchInterval: 3000
    });

    // Fetch Members
    const { data: members } = useQuery({
        queryKey: ['clanMembers', activeClan?.id],
        queryFn: async () => {
            const clanMembers = await base44.entities.ClanMember.filter({ divisionId: activeClan.id });
            const memberDetails = await Promise.all(clanMembers.map(async (m) => {
                const u = await base44.entities.User.get(m.userId);
                return { ...m, user: u };
            }));
            return memberDetails.sort((a, b) => {
                const roles = { leader: 0, officer: 1, member: 2 };
                return roles[a.role] - roles[b.role];
            });
        },
        enabled: !!activeClan
    });

    // Fetch Events
    const { data: events } = useQuery({
        queryKey: ['clanEvents', activeClan?.id],
        queryFn: async () => {
            const evts = await base44.entities.ClanEvent.filter({ divisionId: activeClan.id });
            return evts.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        },
        enabled: !!activeClan
    });

    // Mutations
    const createClanMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('clanSystem', { action: 'create_clan', data }),
        onSuccess: (res) => {
            if (res.data.success) {
                queryClient.invalidateQueries(['myClanMemberships']);
                setIsCreateClanOpen(false);
                setSelectedClanId(res.data.division.id);
            }
        }
    });

    const createChannelMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('clanSystem', { action: 'create_channel', data: { divisionId: activeClan.id, ...data } }),
        onSuccess: () => {
            queryClient.invalidateQueries(['clanChannels']);
            setIsCreateChannelOpen(false);
            setNewChannelData({ name: '', type: 'text' });
        }
    });

    const sendMessageMutation = useMutation({
        mutationFn: (content) => base44.entities.ClanMessage.create({
            divisionId: activeClan.id,
            channelId: activeChannelId,
            author: user.full_name || user.email?.split('@')[0],
            authorAvatar: user.avatar_url,
            content: content,
            userId: user.id
        }),
        onSuccess: () => {
            setMessage('');
            queryClient.invalidateQueries(['clanMessages']);
        }
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (message.trim()) {
            sendMessageMutation.mutate(message);
        }
    };

    const textChannels = channels?.filter(c => c.type === 'text') || [];
    const voiceChannels = channels?.filter(c => c.type === 'voice') || [];
    const gameChannels = channels?.filter(c => c.type === 'game') || [];

    const TABS = [
        { id: 'hall', label: 'Guild Hall', icon: Castle },
        { id: 'comms', label: 'Comms', icon: MessageSquare },
        { id: 'roster', label: 'Roster', icon: Users },
        { id: 'quests', label: 'Quests', icon: Scroll },
        { id: 'events', label: 'Events', icon: Calendar },
        { id: 'vault', label: 'Vault', icon: Gem },
    ];

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0c10 0%, #12141a 50%, #0a0c10 100%)' }}>
                <div className="text-center">
                    <Sword className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-white/40 text-sm tracking-wider">Entering Guild Hall...</p>
                </div>
            </div>
        );
    }

    // Empty State
    if (!memberships || memberships.length === 0) {
        return (
            <div 
                className="h-screen flex flex-col items-center justify-center text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(180deg, #0a0c10 0%, #12141a 50%, #0a0c10 100%)' }}
            >
                {/* Ambient Effects */}
                <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-amber-500/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/5 blur-[150px] rounded-full" />
                
                {/* Decorative Border */}
                <div className="absolute inset-8 border border-amber-500/10 rounded-3xl pointer-events-none" />
                <div className="absolute inset-10 border border-amber-500/5 rounded-3xl pointer-events-none" />

                <div className="relative z-10 text-center max-w-lg px-8">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(245,158,11,0.2)]">
                        <Shield className="w-12 h-12 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">No Guild Affiliation</h1>
                    <p className="text-white/50 mb-8 leading-relaxed text-lg">
                        You have not pledged to any guild. Found your own order or seek out allies to join.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button 
                            onClick={() => setIsCreateClanOpen(true)}
                            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-8 py-6 rounded-xl font-semibold shadow-[0_0_30px_rgba(245,158,11,0.3)] border border-amber-500/50"
                        >
                            <Flag className="w-5 h-5 mr-2" />
                            Found a Guild
                        </Button>
                        <Button 
                            variant="outline"
                            className="bg-white/5 border-white/20 hover:bg-white/10 text-white px-8 py-6 rounded-xl font-semibold"
                        >
                            <Search className="w-5 h-5 mr-2" />
                            Find Guild
                        </Button>
                    </div>
                </div>

                {/* Create Clan Dialog */}
                <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                    <DialogContent className="bg-[#12141a] border-amber-500/20 text-white rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Flag className="w-5 h-5 text-amber-400" /> Found New Guild
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2 block">Guild Name</label>
                                <Input 
                                    value={newClanData.name}
                                    onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                    placeholder="Enter guild name..."
                                    className="bg-white/5 border-amber-500/20 text-white h-12 rounded-xl focus:border-amber-500/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2 block">Guild Charter</label>
                                <Input 
                                    value={newClanData.description}
                                    onChange={e => setNewClanData({...newClanData, description: e.target.value})}
                                    placeholder="Describe your guild's purpose..."
                                    className="bg-white/5 border-amber-500/20 text-white h-12 rounded-xl focus:border-amber-500/50"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)} className="text-white/60">Cancel</Button>
                            <Button onClick={() => createClanMutation.mutate(newClanData)} className="bg-amber-600 hover:bg-amber-700">Found Guild</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div 
            className="h-screen flex overflow-hidden pt-16"
            style={{ background: 'linear-gradient(180deg, #0a0c10 0%, #12141a 50%, #0a0c10 100%)' }}
        >
            {/* Guild Selector Sidebar */}
            <div className="w-20 flex-shrink-0 flex flex-col items-center py-4 gap-3 border-r border-white/5 bg-black/20">
                {memberships?.map((membership) => (
                    <TooltipProvider key={membership.divisionId} delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger>
                                <button
                                    onClick={() => setSelectedClanId(membership.divisionId)}
                                    className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 border-2 ${
                                        selectedClanId === membership.divisionId 
                                            ? 'bg-gradient-to-br from-amber-500/30 to-amber-700/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                                            : 'bg-white/5 border-white/10 hover:border-white/30'
                                    }`}
                                >
                                    {membership.icon ? (
                                        <img src={membership.icon} className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <span className="text-xl font-bold text-white">{membership.name?.charAt(0)}</span>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-[#1a1c22] border-amber-500/20 text-white">
                                <p className="font-semibold">{membership.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}

                <div className="w-10 h-px bg-white/10 my-1" />

                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger>
                            <button
                                onClick={() => setIsCreateClanOpen(true)}
                                className="w-14 h-14 rounded-xl bg-white/5 border-2 border-dashed border-amber-500/30 flex items-center justify-center text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 transition-all"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-[#1a1c22] border-amber-500/20 text-white">
                            <p>Found New Guild</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {activeClan && (
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Guild Banner */}
                    <GuildBanner clan={activeClan} members={members} />

                    {/* Navigation Tabs */}
                    <div className="h-14 flex items-center gap-1 px-6 border-b border-white/5 bg-[#12141a]/80 backdrop-blur-sm">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                        : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex overflow-hidden">
                        <AnimatePresence mode="wait">
                            {/* Guild Hall */}
                            {activeTab === 'hall' && (
                                <motion.div
                                    key="hall"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
                                >
                                    {/* MOTD */}
                                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-900/30 to-purple-900/20 border border-amber-500/20 p-6">
                                        <Scroll className="absolute right-4 top-4 w-20 h-20 text-amber-500/10" />
                                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 mb-3">
                                            <Megaphone className="w-3 h-3 mr-1" /> Guild Announcement
                                        </Badge>
                                        <p className="text-white text-lg font-medium leading-relaxed max-w-3xl">
                                            "{activeClan.motd || activeClan.description || "Welcome to the guild, brave adventurer. Check the quest board for active missions."}"
                                        </p>
                                        <p className="text-white/40 text-sm mt-3">— Guild Master</p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <StatCard icon={Star} label="Guild Level" value={activeClan.level || 1} subtext="Next: 2,500 XP" color="amber" />
                                        <StatCard icon={Users} label="Members" value={members?.length || 0} subtext="4 Online" color="green" />
                                        <StatCard icon={Coins} label="Treasury" value="12.5K" subtext="Gold Coins" color="amber" />
                                        <StatCard icon={Award} label="Reputation" value={activeClan.reputation || 0} subtext="Honored" color="purple" />
                                    </div>

                                    {/* Two Column Layout */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Active Quests */}
                                        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5">
                                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                                <Scroll className="w-5 h-5 text-amber-400" /> Active Quests
                                            </h3>
                                            <div className="space-y-3">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer">
                                                        <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                                            <Swords className="w-5 h-5 text-red-400" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-white text-sm font-medium">Weekly Dungeon Clear</p>
                                                            <p className="text-white/40 text-xs">3/5 Completions • 500 XP</p>
                                                        </div>
                                                        <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px]">Active</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Upcoming Events */}
                                        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5">
                                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-purple-400" /> Upcoming Events
                                            </h3>
                                            <div className="space-y-3">
                                                {events?.slice(0, 3).map(event => (
                                                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer">
                                                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/30 flex flex-col items-center justify-center">
                                                            <span className="text-[10px] text-purple-300 uppercase">{format(new Date(event.startTime), 'MMM')}</span>
                                                            <span className="text-lg font-bold text-white">{format(new Date(event.startTime), 'd')}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-white text-sm font-medium">{event.title}</p>
                                                            <p className="text-white/40 text-xs">{format(new Date(event.startTime), 'h:mm a')}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!events || events.length === 0) && (
                                                    <p className="text-white/30 text-sm text-center py-6">No scheduled events</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Comms */}
                            {activeTab === 'comms' && (
                                <motion.div
                                    key="comms"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex"
                                >
                                    {/* Channel List */}
                                    <div className="w-56 flex-shrink-0 border-r border-white/5 bg-black/20 p-3 space-y-4 overflow-y-auto">
                                        {/* Text Channels */}
                                        <div>
                                            <div className="flex items-center justify-between px-2 mb-2">
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Text Channels</span>
                                                <Plus className="w-3 h-3 text-white/30 hover:text-white cursor-pointer" onClick={() => { setNewChannelData({...newChannelData, type: 'text'}); setIsCreateChannelOpen(true); }} />
                                            </div>
                                            <div className="space-y-1">
                                                {textChannels.map(channel => (
                                                    <ChannelItem
                                                        key={channel.id}
                                                        channel={channel}
                                                        isActive={activeChannelId === channel.id}
                                                        onClick={() => setActiveChannelId(channel.id)}
                                                        type="text"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Voice Channels */}
                                        <div>
                                            <div className="flex items-center justify-between px-2 mb-2">
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Voice Channels</span>
                                                <Plus className="w-3 h-3 text-white/30 hover:text-white cursor-pointer" onClick={() => { setNewChannelData({...newChannelData, type: 'voice'}); setIsCreateChannelOpen(true); }} />
                                            </div>
                                            <div className="space-y-1">
                                                {voiceChannels.map(channel => (
                                                    <ChannelItem
                                                        key={channel.id}
                                                        channel={channel}
                                                        isActive={activeChannelId === channel.id}
                                                        onClick={() => setActiveChannelId(channel.id)}
                                                        type="voice"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Game Channels */}
                                        <div>
                                            <div className="flex items-center justify-between px-2 mb-2">
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Game Channels</span>
                                                <Plus className="w-3 h-3 text-white/30 hover:text-white cursor-pointer" onClick={() => { setNewChannelData({...newChannelData, type: 'game'}); setIsCreateChannelOpen(true); }} />
                                            </div>
                                            <div className="space-y-1">
                                                {gameChannels.map(channel => (
                                                    <ChannelItem
                                                        key={channel.id}
                                                        channel={channel}
                                                        isActive={activeChannelId === channel.id}
                                                        onClick={() => setActiveChannelId(channel.id)}
                                                        type="game"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Voice Controls */}
                                        <div className="mt-auto pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold overflow-hidden">
                                                    {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-xs font-medium truncate">{user?.full_name?.split(' ')[0]}</p>
                                                    <p className="text-green-400 text-[10px]">Online</p>
                                                </div>
                                                <button 
                                                    onClick={() => setIsMuted(!isMuted)}
                                                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/50 hover:text-white'}`}
                                                >
                                                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chat Area */}
                                    <div className="flex-1 flex flex-col min-w-0">
                                        {activeChannelId ? (
                                            <>
                                                {/* Channel Header */}
                                                <div className="h-12 flex items-center justify-between px-4 border-b border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Hash className="w-5 h-5 text-white/40" />
                                                        <span className="font-semibold text-white">{channels?.find(c => c.id === activeChannelId)?.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                                                            <Search className="w-4 h-4" />
                                                        </button>
                                                        <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                                                            <Users className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Messages */}
                                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                                                    {messages?.map((msg, i) => {
                                                        const showHeader = i === 0 || messages[i-1].author !== msg.author || (new Date(msg.created_date) - new Date(messages[i-1].created_date) > 300000);
                                                        return (
                                                            <div key={msg.id} className={showHeader ? 'mt-4' : 'mt-1'}>
                                                                {showHeader && (
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-700/20 border border-amber-500/30 overflow-hidden flex items-center justify-center">
                                                                            {msg.authorAvatar ? (
                                                                                <img src={msg.authorAvatar} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <span className="text-amber-300 font-bold">{msg.author?.charAt(0)}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-baseline gap-2">
                                                                            <span className="font-semibold text-amber-300">{msg.author}</span>
                                                                            <span className="text-[10px] text-white/30">{format(new Date(msg.created_date), 'MMM d, h:mm a')}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="pl-[52px]">
                                                                    <p className="text-white/80 text-sm">{msg.content}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {(!messages || messages.length === 0) && (
                                                        <div className="flex flex-col items-center justify-center h-full text-center">
                                                            <Scroll className="w-12 h-12 text-white/10 mb-4" />
                                                            <p className="text-white/30">No messages yet. Be the first to speak!</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Message Input */}
                                                <div className="p-4 border-t border-white/5">
                                                    <form onSubmit={handleSend} className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                                                        <input
                                                            value={message}
                                                            onChange={e => setMessage(e.target.value)}
                                                            placeholder={`Message #${channels?.find(c => c.id === activeChannelId)?.name || 'channel'}`}
                                                            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                                                        />
                                                        <button type="button" className="text-white/30 hover:text-white transition-colors">
                                                            <Smile className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            type="submit" 
                                                            disabled={!message.trim()}
                                                            className="w-8 h-8 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center text-white transition-all"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                    </form>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                <MessageSquare className="w-16 h-16 text-white/10 mb-4" />
                                                <p className="text-white/40">Select a channel to start chatting</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Roster */}
                            {activeTab === 'roster' && (
                                <motion.div
                                    key="roster"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 overflow-y-auto p-6"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Users className="w-5 h-5 text-amber-400" /> Guild Roster
                                        </h2>
                                        <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                                            <UserPlus className="w-4 h-4" /> Invite Member
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {members?.map(m => (
                                            <div 
                                                key={m.id} 
                                                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                                    m.role === 'leader' 
                                                        ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400' 
                                                        : m.role === 'officer'
                                                        ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-400'
                                                        : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                                                }`}
                                            >
                                                <MemberCard 
                                                    member={m} 
                                                    isLeader={m.role === 'leader'} 
                                                    isOfficer={m.role === 'officer'} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Other tabs placeholder */}
                            {['quests', 'events', 'vault'].includes(activeTab) && (
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex flex-col items-center justify-center"
                                >
                                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                        {activeTab === 'quests' && <Scroll className="w-10 h-10 text-white/20" />}
                                        {activeTab === 'events' && <Calendar className="w-10 h-10 text-white/20" />}
                                        {activeTab === 'vault' && <Gem className="w-10 h-10 text-white/20" />}
                                    </div>
                                    <p className="text-white/40">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} coming soon</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Create Channel Dialog */}
            <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                <DialogContent className="bg-[#12141a] border-amber-500/20 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Create Channel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2 block">Channel Name</label>
                            <Input 
                                value={newChannelData.name}
                                onChange={e => setNewChannelData({...newChannelData, name: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                                placeholder="new-channel"
                                className="bg-white/5 border-amber-500/20 text-white h-12 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2 block">Channel Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { type: 'text', icon: Hash, label: 'Text' },
                                    { type: 'voice', icon: Volume2, label: 'Voice' },
                                    { type: 'game', icon: Gamepad2, label: 'Game' },
                                ].map(opt => (
                                    <button
                                        key={opt.type}
                                        onClick={() => setNewChannelData({...newChannelData, type: opt.type})}
                                        className={`p-3 rounded-xl border transition-all text-center ${
                                            newChannelData.type === opt.type 
                                                ? 'bg-amber-500/20 border-amber-500/50' 
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <opt.icon className={`w-5 h-5 mx-auto mb-1 ${newChannelData.type === opt.type ? 'text-amber-400' : 'text-white/40'}`} />
                                        <p className="text-white text-xs">{opt.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateChannelOpen(false)} className="text-white/60">Cancel</Button>
                        <Button onClick={() => createChannelMutation.mutate(newChannelData)} className="bg-amber-600 hover:bg-amber-700" disabled={!newChannelData.name}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Clan Dialog */}
            <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                <DialogContent className="bg-[#12141a] border-amber-500/20 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Flag className="w-5 h-5 text-amber-400" /> Found New Guild
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2 block">Guild Name</label>
                            <Input 
                                value={newClanData.name}
                                onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                placeholder="Enter guild name..."
                                className="bg-white/5 border-amber-500/20 text-white h-12 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2 block">Guild Charter</label>
                            <Input 
                                value={newClanData.description}
                                onChange={e => setNewClanData({...newClanData, description: e.target.value})}
                                placeholder="Describe your guild's purpose..."
                                className="bg-white/5 border-amber-500/20 text-white h-12 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)} className="text-white/60">Cancel</Button>
                        <Button onClick={() => createClanMutation.mutate(newClanData)} className="bg-amber-600 hover:bg-amber-700">Found Guild</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}