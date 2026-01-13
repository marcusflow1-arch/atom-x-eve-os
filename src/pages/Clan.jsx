import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { 
    Shield, Plus, Hash, Volume2, Settings, ChevronDown, ChevronRight,
    Users, Calendar, Target, Vote, Crown, Megaphone, Gamepad2,
    Send, Search, Bell, Pin, Mic, MicOff, Headphones, PhoneOff,
    MoreVertical, UserPlus, LogOut, Trash2, Home, Archive, Star,
    MessageSquare, Video, ScreenShare, Smile, Gift, Image, AtSign, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Liquid Glass Card Component
const GlassPanel = ({ children, className = "", intensity = "medium" }) => {
    const intensityStyles = {
        light: "bg-white/[0.03] border-white/[0.06]",
        medium: "bg-white/[0.05] border-white/[0.08]",
        strong: "bg-white/[0.08] border-white/[0.12]"
    };
    
    return (
        <div 
            className={`backdrop-blur-2xl border rounded-2xl ${intensityStyles[intensity]} ${className}`}
            style={{ 
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.2)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)'
            }}
        >
            {children}
        </div>
    );
};

// Voice Status Indicator
const VoiceStatus = ({ isMuted, isDeafened, isSpeaking }) => (
    <div className="flex items-center gap-1">
        {isSpeaking && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
        {isDeafened && <Headphones className="w-3 h-3 text-red-400" />}
    </div>
);

export default function ClanPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedClanId, setSelectedClanId] = useState(null);
    const [activeView, setActiveView] = useState('home'); // home, chat, voice, events, quests, voting, members
    const [activeChannelId, setActiveChannelId] = useState(null);
    const [isCreateClanOpen, setIsCreateClanOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
    const [newClanData, setNewClanData] = useState({ name: '', description: '' });
    const [newChannelData, setNewChannelData] = useState({ name: '', type: 'text', game: '' });
    const [message, setMessage] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [expandedSections, setExpandedSections] = useState({ announcements: true, text: true, voice: true, games: true });
    const scrollRef = useRef(null);

    // Fetch Memberships
    const { data: memberships, isLoading: isMembershipsLoading } = useQuery({
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

    // Initial Selection
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

    // Fetch Messages for active channel
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
            setNewChannelData({ name: '', type: 'text', game: '' });
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

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Categorize channels
    const announcementChannels = channels?.filter(c => c.name?.includes('announce') || c.type === 'announcement') || [];
    const textChannels = channels?.filter(c => c.type === 'text' && !c.name?.includes('announce')) || [];
    const voiceChannels = channels?.filter(c => c.type === 'voice') || [];
    const gameChannels = channels?.filter(c => c.type === 'game') || [];

    if (isMembershipsLoading) {
        return (
            <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #080810 0%, #0d1020 50%, #080810 100%)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/40 text-sm tracking-wider">Connecting to Division...</p>
                </div>
            </div>
        );
    }

    // Empty State
    if (!memberships || memberships.length === 0) {
        return (
            <div 
                className="h-screen flex flex-col items-center justify-center text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #080810 0%, #0d1020 50%, #080810 100%)' }}
            >
                {/* Ambient Glow */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 blur-[150px] rounded-full" />
                
                <GlassPanel className="p-12 max-w-md text-center relative z-10" intensity="medium">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-white/10">
                        <Shield className="w-10 h-10 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">No Active Division</h1>
                    <p className="text-white/50 mb-8 leading-relaxed">
                        You're not part of any clan yet. Create your own division or search for one to join.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button 
                            onClick={() => setIsCreateClanOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-5 rounded-xl font-semibold"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Division
                        </Button>
                        <Button 
                            onClick={() => setIsSearchOpen(true)}
                            variant="outline"
                            className="bg-white/5 border-white/10 hover:bg-white/10 text-white px-6 py-5 rounded-xl font-semibold"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Find Division
                        </Button>
                    </div>
                </GlassPanel>

                {/* Create Clan Dialog */}
                <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                    <DialogContent className="bg-[#0d1020]/95 backdrop-blur-3xl border-white/10 text-white rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Create New Division</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Division Name</label>
                                <Input 
                                    value={newClanData.name}
                                    onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                    placeholder="Enter division name..."
                                    className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Description</label>
                                <Input 
                                    value={newClanData.description}
                                    onChange={e => setNewClanData({...newClanData, description: e.target.value})}
                                    placeholder="What's your division about?"
                                    className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)} className="text-white/60">Cancel</Button>
                            <Button onClick={() => createClanMutation.mutate(newClanData)} className="bg-blue-600 hover:bg-blue-700">Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div 
            className="h-screen flex overflow-hidden pt-16"
            style={{ background: 'linear-gradient(135deg, #080810 0%, #0d1020 50%, #080810 100%)' }}
        >
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 blur-[200px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 blur-[200px] rounded-full" />
            </div>

            {/* Server List (Far Left) */}
            <div className="w-[72px] flex-shrink-0 flex flex-col items-center py-4 gap-2 z-20 border-r border-white/[0.06] bg-black/20 backdrop-blur-xl">
                {/* Clan Icons */}
                {memberships?.map((membership) => (
                    <TooltipProvider key={membership.divisionId} delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger>
                                <button
                                    onClick={() => setSelectedClanId(membership.divisionId)}
                                    className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                        selectedClanId === membership.divisionId 
                                            ? 'bg-blue-600 rounded-xl' 
                                            : 'bg-white/5 hover:bg-white/10 hover:rounded-xl'
                                    }`}
                                >
                                    {selectedClanId === membership.divisionId && (
                                        <motion.div 
                                            layoutId="activeIndicator"
                                            className="absolute -left-[14px] w-1 h-8 bg-white rounded-r-full"
                                        />
                                    )}
                                    {membership.icon ? (
                                        <img src={membership.icon} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <span className="text-white font-bold text-lg">{membership.name?.charAt(0)}</span>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-black/90 border-white/10 text-white ml-2">
                                <p className="font-semibold">{membership.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}

                <div className="w-8 h-px bg-white/10 my-2" />

                {/* Add Server */}
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger>
                            <button
                                onClick={() => setIsCreateClanOpen(true)}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-green-400 hover:bg-green-500/10 hover:border-green-400/50 hover:rounded-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-black/90 border-white/10 text-white ml-2">
                            <p>Create Division</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {activeClan && (
                <>
                    {/* Channel Sidebar */}
                    <div className="w-60 flex-shrink-0 flex flex-col z-10 bg-white/[0.02] backdrop-blur-xl border-r border-white/[0.06]">
                        {/* Server Header */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] hover:bg-white/5 transition-colors cursor-pointer outline-none">
                                <span className="font-bold text-white truncate">{activeClan.name}</span>
                                <ChevronDown className="w-4 h-4 text-white/40" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-[#0d1020]/95 backdrop-blur-xl border-white/10 text-white rounded-xl p-1">
                                <DropdownMenuItem className="hover:bg-white/10 cursor-pointer rounded-lg" onClick={() => setIsCreateChannelOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" /> Create Channel
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-white/10 cursor-pointer rounded-lg">
                                    <UserPlus className="w-4 h-4 mr-2" /> Invite People
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-white/10 cursor-pointer rounded-lg">
                                    <Settings className="w-4 h-4 mr-2" /> Server Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem className="text-red-400 hover:bg-red-500/20 cursor-pointer rounded-lg">
                                    <LogOut className="w-4 h-4 mr-2" /> Leave Server
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Channels */}
                        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4 custom-scrollbar">
                            {/* Home / Overview */}
                            <button
                                onClick={() => { setActiveView('home'); setActiveChannelId(null); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                                    activeView === 'home' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <Home className="w-4 h-4" />
                                <span className="text-sm font-medium">Overview</span>
                            </button>

                            {/* Announcements */}
                            <div>
                                <button 
                                    onClick={() => toggleSection('announcements')}
                                    className="w-full flex items-center justify-between px-2 py-1 text-white/40 hover:text-white/70 transition-colors"
                                >
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                        {expandedSections.announcements ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        Announcements
                                    </div>
                                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setNewChannelData({...newChannelData, type: 'announcement'}); setIsCreateChannelOpen(true); }} />
                                </button>
                                <AnimatePresence>
                                    {expandedSections.announcements && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-0.5 mt-1">
                                            <button
                                                onClick={() => { setActiveView('announcements'); setActiveChannelId('announcements'); }}
                                                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                                                    activeChannelId === 'announcements' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                                                }`}
                                            >
                                                <Megaphone className="w-4 h-4 text-yellow-400" />
                                                <span className="text-sm">announcements</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Text Channels */}
                            <div>
                                <button 
                                    onClick={() => toggleSection('text')}
                                    className="w-full flex items-center justify-between px-2 py-1 text-white/40 hover:text-white/70 transition-colors group"
                                >
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                        {expandedSections.text ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        Text Channels
                                    </div>
                                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-white" onClick={(e) => { e.stopPropagation(); setNewChannelData({...newChannelData, type: 'text'}); setIsCreateChannelOpen(true); }} />
                                </button>
                                <AnimatePresence>
                                    {expandedSections.text && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-0.5 mt-1">
                                            {textChannels.map(channel => (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => { setActiveView('chat'); setActiveChannelId(channel.id); }}
                                                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                                                        activeChannelId === channel.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                                                    }`}
                                                >
                                                    <Hash className="w-4 h-4" />
                                                    <span className="text-sm truncate">{channel.name}</span>
                                                </button>
                                            ))}
                                            {textChannels.length === 0 && (
                                                <p className="text-white/30 text-xs px-3 py-2">No text channels</p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Voice Channels */}
                            <div>
                                <button 
                                    onClick={() => toggleSection('voice')}
                                    className="w-full flex items-center justify-between px-2 py-1 text-white/40 hover:text-white/70 transition-colors group"
                                >
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                        {expandedSections.voice ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        Voice Channels
                                    </div>
                                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-white" onClick={(e) => { e.stopPropagation(); setNewChannelData({...newChannelData, type: 'voice'}); setIsCreateChannelOpen(true); }} />
                                </button>
                                <AnimatePresence>
                                    {expandedSections.voice && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-0.5 mt-1">
                                            {voiceChannels.map(channel => (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => { setActiveView('voice'); setActiveChannelId(channel.id); }}
                                                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                                                        activeChannelId === channel.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                                                    }`}
                                                >
                                                    <Volume2 className="w-4 h-4 text-green-400" />
                                                    <span className="text-sm truncate">{channel.name}</span>
                                                </button>
                                            ))}
                                            {voiceChannels.length === 0 && (
                                                <p className="text-white/30 text-xs px-3 py-2">No voice channels</p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Game Channels */}
                            <div>
                                <button 
                                    onClick={() => toggleSection('games')}
                                    className="w-full flex items-center justify-between px-2 py-1 text-white/40 hover:text-white/70 transition-colors group"
                                >
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                        {expandedSections.games ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        Game Channels
                                    </div>
                                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-white" onClick={(e) => { e.stopPropagation(); setNewChannelData({...newChannelData, type: 'game'}); setIsCreateChannelOpen(true); }} />
                                </button>
                                <AnimatePresence>
                                    {expandedSections.games && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-0.5 mt-1">
                                            {gameChannels.map(channel => (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => { setActiveView('chat'); setActiveChannelId(channel.id); }}
                                                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                                                        activeChannelId === channel.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                                                    }`}
                                                >
                                                    <Gamepad2 className="w-4 h-4 text-purple-400" />
                                                    <span className="text-sm truncate">{channel.name}</span>
                                                </button>
                                            ))}
                                            {gameChannels.length === 0 && (
                                                <p className="text-white/30 text-xs px-3 py-2">No game channels</p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Voice Status Bar */}
                        <GlassPanel className="m-2 p-3" intensity="strong">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                                        {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0)}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0d1020]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-semibold truncate">{user?.full_name || user?.email?.split('@')[0]}</p>
                                    <p className="text-white/40 text-[10px]">Online</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => setIsMuted(!isMuted)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>
                                    <button 
                                        onClick={() => setIsDeafened(!isDeafened)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDeafened ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        {isDeafened ? <PhoneOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                                    </button>
                                    <button className="w-8 h-8 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </GlassPanel>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 relative z-10">
                        {/* Channel Header */}
                        <div className="h-14 flex-shrink-0 border-b border-white/[0.06] flex items-center justify-between px-4 bg-white/[0.02] backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                {activeView === 'home' && <Home className="w-5 h-5 text-white/60" />}
                                {activeView === 'chat' && <Hash className="w-5 h-5 text-white/60" />}
                                {activeView === 'voice' && <Volume2 className="w-5 h-5 text-green-400" />}
                                {activeView === 'announcements' && <Megaphone className="w-5 h-5 text-yellow-400" />}
                                <span className="font-semibold text-white">
                                    {activeView === 'home' ? 'Overview' : channels?.find(c => c.id === activeChannelId)?.name || 'Channel'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
                                    <Bell className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
                                    <Pin className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
                                    <Users className="w-4 h-4" />
                                </button>
                                <div className="relative ml-2">
                                    <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input 
                                        placeholder="Search..." 
                                        className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white w-40 focus:ring-1 focus:ring-blue-500/50 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Main Content */}
                            <div className="flex-1 flex flex-col min-w-0">
                                <AnimatePresence mode="wait">
                                    {activeView === 'home' && (
                                        <motion.div
                                            key="home"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
                                        >
                                            {/* MOTD Banner */}
                                            <GlassPanel className="relative overflow-hidden p-6" intensity="medium">
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
                                                <img 
                                                    src={activeClan.banner || "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200"} 
                                                    className="absolute inset-0 w-full h-full object-cover opacity-20" 
                                                />
                                                <div className="relative z-10">
                                                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 mb-3">
                                                        <Megaphone className="w-3 h-3 mr-1" /> ANNOUNCEMENT
                                                    </Badge>
                                                    <h2 className="text-2xl font-bold text-white mb-2">
                                                        {activeClan.motd || activeClan.description || "Welcome to the clan!"}
                                                    </h2>
                                                    <p className="text-white/50 text-sm">Posted by Commander</p>
                                                </div>
                                            </GlassPanel>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <GlassPanel className="p-5" intensity="light">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                                            <Star className="w-5 h-5 text-blue-400" />
                                                        </div>
                                                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Lvl {activeClan.level || 1}</Badge>
                                                    </div>
                                                    <p className="text-2xl font-bold text-white">{(activeClan.xp || 0).toLocaleString()}</p>
                                                    <p className="text-white/40 text-xs">Experience Points</p>
                                                </GlassPanel>

                                                <GlassPanel className="p-5" intensity="light">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                                            <Users className="w-5 h-5 text-green-400" />
                                                        </div>
                                                    </div>
                                                    <p className="text-2xl font-bold text-white">{members?.length || 0}</p>
                                                    <p className="text-white/40 text-xs">Members</p>
                                                </GlassPanel>

                                                <GlassPanel className="p-5" intensity="light">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                                                            <Crown className="w-5 h-5 text-yellow-400" />
                                                        </div>
                                                    </div>
                                                    <p className="text-2xl font-bold text-white">{activeClan.reputation || 0}</p>
                                                    <p className="text-white/40 text-xs">Reputation</p>
                                                </GlassPanel>
                                            </div>

                                            {/* Events & Quests */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <GlassPanel className="p-5" intensity="light">
                                                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-purple-400" /> Upcoming Events
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {events?.slice(0, 3).map(event => (
                                                            <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-bold">
                                                                    {format(new Date(event.startTime), 'd')}
                                                                </div>
                                                                <div>
                                                                    <p className="text-white text-sm font-medium">{event.title}</p>
                                                                    <p className="text-white/40 text-xs">{format(new Date(event.startTime), 'h:mm a')}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {(!events || events.length === 0) && (
                                                            <p className="text-white/30 text-sm text-center py-4">No upcoming events</p>
                                                        )}
                                                    </div>
                                                </GlassPanel>

                                                <GlassPanel className="p-5" intensity="light">
                                                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                                        <Target className="w-4 h-4 text-red-400" /> Active Quests
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <p className="text-white/30 text-sm text-center py-4">No active quests</p>
                                                    </div>
                                                </GlassPanel>
                                            </div>
                                        </motion.div>
                                    )}

                                    {(activeView === 'chat' || activeView === 'announcements') && activeChannelId && (
                                        <motion.div
                                            key="chat"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex-1 flex flex-col"
                                        >
                                            {/* Messages */}
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                                                {messages?.map((msg, i) => {
                                                    const showHeader = i === 0 || messages[i-1].author !== msg.author || (new Date(msg.created_date) - new Date(messages[i-1].created_date) > 300000);
                                                    return (
                                                        <div key={msg.id} className={`group ${showHeader ? 'mt-4' : 'mt-1'}`}>
                                                            {showHeader && (
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 overflow-hidden flex items-center justify-center text-white font-bold">
                                                                        {msg.authorAvatar ? (
                                                                            <img src={msg.authorAvatar} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            msg.author?.charAt(0)
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-baseline gap-2">
                                                                        <span className="font-semibold text-white hover:underline cursor-pointer">{msg.author}</span>
                                                                        <span className="text-[10px] text-white/30">{format(new Date(msg.created_date), 'MMM d, h:mm a')}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="pl-[52px]">
                                                                <p className="text-white/80 text-sm leading-relaxed">{msg.content}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {(!messages || messages.length === 0) && (
                                                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                                            <Hash className="w-8 h-8 text-white/20" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-white mb-2">Welcome to #{channels?.find(c => c.id === activeChannelId)?.name}</h3>
                                                        <p className="text-white/40 text-sm">This is the start of the channel.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Message Input */}
                                            <div className="p-4 bg-white/[0.02]">
                                                <form onSubmit={handleSend} className="relative">
                                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                                        <button type="button" className="text-white/40 hover:text-white transition-colors">
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                        <input
                                                            value={message}
                                                            onChange={e => setMessage(e.target.value)}
                                                            placeholder={`Message #${channels?.find(c => c.id === activeChannelId)?.name || 'channel'}`}
                                                            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <button type="button" className="text-white/40 hover:text-white transition-colors">
                                                                <Gift className="w-5 h-5" />
                                                            </button>
                                                            <button type="button" className="text-white/40 hover:text-white transition-colors">
                                                                <Image className="w-5 h-5" />
                                                            </button>
                                                            <button type="button" className="text-white/40 hover:text-white transition-colors">
                                                                <Smile className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeView === 'voice' && (
                                        <motion.div
                                            key="voice"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex-1 flex flex-col items-center justify-center"
                                        >
                                            <GlassPanel className="p-8 text-center max-w-md" intensity="medium">
                                                <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                                                    <Volume2 className="w-10 h-10 text-green-400" />
                                                </div>
                                                <h2 className="text-2xl font-bold text-white mb-2">{channels?.find(c => c.id === activeChannelId)?.name}</h2>
                                                <p className="text-white/50 mb-6">Voice channel - Click to join</p>
                                                <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-5 rounded-xl">
                                                    <Mic className="w-4 h-4 mr-2" /> Join Voice
                                                </Button>
                                            </GlassPanel>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Members Sidebar */}
                            <div className="w-60 flex-shrink-0 border-l border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-y-auto custom-scrollbar py-4 px-3">
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider px-2 mb-3">Online — {members?.length || 0}</p>
                                <div className="space-y-1">
                                    {members?.map(m => (
                                        <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-all">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 overflow-hidden flex items-center justify-center text-white text-xs font-bold">
                                                    {m.user?.avatar_url ? <img src={m.user.avatar_url} className="w-full h-full object-cover" /> : m.user?.full_name?.charAt(0)}
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0d1020]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-xs font-medium truncate flex items-center gap-1">
                                                    {m.user?.full_name || 'Unknown'}
                                                    {m.role === 'leader' && <Crown className="w-3 h-3 text-yellow-400" />}
                                                    {m.role === 'officer' && <Shield className="w-3 h-3 text-blue-400" />}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Create Channel Dialog */}
            <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                <DialogContent className="bg-[#0d1020]/95 backdrop-blur-3xl border-white/10 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Create Channel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 block">Channel Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { type: 'text', icon: Hash, label: 'Text', desc: 'Send messages' },
                                    { type: 'voice', icon: Volume2, label: 'Voice', desc: 'Voice & video' },
                                    { type: 'game', icon: Gamepad2, label: 'Game', desc: 'Game-specific' },
                                    { type: 'announcement', icon: Megaphone, label: 'Announcement', desc: 'News & updates' },
                                ].map(opt => (
                                    <button
                                        key={opt.type}
                                        onClick={() => setNewChannelData({...newChannelData, type: opt.type})}
                                        className={`p-4 rounded-xl border transition-all text-left ${
                                            newChannelData.type === opt.type 
                                                ? 'bg-blue-500/20 border-blue-500/50' 
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <opt.icon className={`w-5 h-5 mb-2 ${newChannelData.type === opt.type ? 'text-blue-400' : 'text-white/40'}`} />
                                        <p className="text-white font-medium text-sm">{opt.label}</p>
                                        <p className="text-white/40 text-xs">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Channel Name</label>
                            <Input 
                                value={newChannelData.name}
                                onChange={e => setNewChannelData({...newChannelData, name: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                                placeholder="new-channel"
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateChannelOpen(false)} className="text-white/60">Cancel</Button>
                        <Button 
                            onClick={() => createChannelMutation.mutate(newChannelData)} 
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!newChannelData.name}
                        >
                            Create Channel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Clan Dialog */}
            <Dialog open={isCreateClanOpen} onOpenChange={setIsCreateClanOpen}>
                <DialogContent className="bg-[#0d1020]/95 backdrop-blur-3xl border-white/10 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Create New Division</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Division Name</label>
                            <Input 
                                value={newClanData.name}
                                onChange={e => setNewClanData({...newClanData, name: e.target.value})}
                                placeholder="Enter division name..."
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Description</label>
                            <Input 
                                value={newClanData.description}
                                onChange={e => setNewClanData({...newClanData, description: e.target.value})}
                                placeholder="What's your division about?"
                                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateClanOpen(false)} className="text-white/60">Cancel</Button>
                        <Button onClick={() => createClanMutation.mutate(newClanData)} className="bg-blue-600 hover:bg-blue-700">Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}