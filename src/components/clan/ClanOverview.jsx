import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Crown, Trophy, Target, Calendar, ArrowRight, Sword, LogOut, Trash2, 
    Settings, MessageSquare, Mic, UserPlus, Users, Scroll, Activity, 
    Coins, Gem, ShieldAlert, Shield, Star, CircleDot, Gamepad2, Clock, 
    TrendingUp, Flame, Zap, Award, ChevronRight, Send, X, Grid3X3,
    Bell, Megaphone, ArrowLeft, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import ClanInventoryModal from '@/components/clan/ClanInventoryModal';

export default function ClanOverview({ clan, activeVoiceRooms, onChangeTab }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isDismantleOpen, setIsDismantleOpen] = useState(false);
    const [isLeaveOpen, setIsLeaveOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'roster' | 'events'
    const [inventoryOpen, setInventoryOpen] = useState(false);

    // Fetch essential data
    const { data: members } = useQuery({
        queryKey: ['clanMembersList', clan.id],
        queryFn: async () => base44.entities.ClanMember.filter({ clan_id: clan.id }),
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

    const isLeader = myMemberRecord?.role === 'leader';
    const isOfficer = myMemberRecord?.role === 'officer' || isLeader;

    // --- Mock / Derived Data for High Fidelity UI ---
    // Clan Progression
    const levelProgress = ((clan.xp || 0) / 10000) * 100;
    const currentSeasonRank = "Gold III"; // Mocked
    const reputationScore = clan.reputation || 0;
    
    // Clan Economy (Mocked for now until entity update)
    const clanWealth = {
        credits: 1450000,
        energy: 85, // % capacity
        materials: 3240
    };

    // Clan Stats (Mocked)
    const clanStats = {
        memberStrength: Math.floor((members?.length || 1) * 1250), // Approx power
        winRate: "68%",
        raidsCompleted: 42,
        territoryCount: 3
    };

    // Activity Identity (Badges)
    const guildSpecialties = [
        { id: 'pve', label: 'PvE Raiders', icon: Sword, level: 5, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { id: 'farm', label: 'Resource Ops', icon: Pickaxe, level: 3, color: 'text-green-400', bg: 'bg-green-500/10' },
        { id: 'tech', label: 'Tech Crafting', icon: Cpu, level: 4, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { id: 'ach', label: 'Completionists', icon: Trophy, level: 2, color: 'text-purple-400', bg: 'bg-purple-500/10' }
    ];

    // Mock Feed
    const feedItems = [
        { id: 1, type: 'convoy', text: "Convoy Operation 'Silent Night' completed successfully.", time: "10m ago", icon: Truck, color: "text-green-400" },
        { id: 2, type: 'achievement', text: "Guild unlocked 'Apex Predator' achievement.", time: "45m ago", icon: Trophy, color: "text-yellow-400" },
        { id: 3, type: 'pvp', text: "Victory in Sector 7 skirmish against [RIVAL].", time: "2h ago", icon: Crosshair, color: "text-red-400" },
        { id: 4, type: 'upgrade', text: "Guild Vault expansion Tier 2 unlocked.", time: "5h ago", icon: Box, color: "text-blue-400" },
        { id: 5, type: 'join', text: "Agent 'Viper' has joined the division.", time: "1d ago", icon: UserPlus, color: "text-white" }
    ];

    // --- Mutations ---
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
        }
    });
    
    // --- Render Components ---

    const StatCard = ({ label, value, subtext, icon: Icon, colorClass, delay = 0 }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all group relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors`}>
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                {subtext && <div className="text-[10px] font-medium px-2 py-1 rounded-full bg-white/[0.03] text-white/40 border border-white/5">{subtext}</div>}
            </div>
            
            <div className="text-2xl font-light text-white tracking-wide mb-1">{value}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/30">{label}</div>
            
            {/* Hover Glow */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-[60px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${colorClass.replace('text-', 'bg-')}`} />
        </motion.div>
    );

    // Modern Glass Card replacement for LiquidGlassCard
    const ModernGlassCard = ({ children, className = "" }) => (
        <div className={`bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-3xl p-8 ${className}`}>
            {children}
        </div>
    );

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-8 lg:p-12 pb-32">
            
            {/* 1. GUILD IDENTITY HEADER */}
            <div className="relative w-full mb-12">
                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    {/* Emblem */}
                    <div className="relative group">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-32 h-32 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center relative overflow-hidden"
                        >
                            {clan.icon ? (
                                <img src={clan.icon} className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-12 h-12 text-white/20" />
                            )}
                        </motion.div>
                        <div className="absolute -inset-4 bg-cyan-500/20 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <motion.div 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex flex-col md:flex-row items-center gap-4 mb-4"
                        >
                            <h1 className="text-5xl font-thin text-white tracking-widest uppercase">
                                {clan.name}
                            </h1>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-white/[0.05] border border-white/10 rounded-full text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                                    LVL {clan.level || 1}
                                </span>
                                <span className="px-3 py-1 bg-white/[0.05] border border-white/10 rounded-full text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                                    {members?.length || 0} Members
                                </span>
                            </div>
                        </motion.div>
                        
                        <motion.p 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-white/40 font-light max-w-2xl leading-relaxed text-sm tracking-wide"
                        >
                            {clan.description || "Dedicated to excellence and conquest. Operations focused on tactical dominance."}
                        </motion.p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {isOfficer && (
                            <Button onClick={() => setIsInviteOpen(true)} variant="outline" className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white text-xs uppercase tracking-wider h-10 px-6">
                                <UserPlus className="w-3 h-3 mr-2" /> Invite
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setInventoryOpen(true)} className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white text-xs uppercase tracking-wider h-10 px-6">
                            <Box className="w-3 h-3 mr-2" /> Storage
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                
                {/* STATS ROW (Spans full width initially) */}
                <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-6 mb-2">
                    <StatCard 
                        label="Total Roster" 
                        value={`${members?.length || 0}/50`} 
                        subtext="Online: 12" 
                        icon={Users} 
                        colorClass="text-cyan-400" 
                        delay={0.1}
                    />
                    <StatCard 
                        label="Power Index" 
                        value={clanStats.memberStrength.toLocaleString()} 
                        subtext="Regional: #42" 
                        icon={Zap} 
                        colorClass="text-yellow-400" 
                        delay={0.2}
                    />
                    <StatCard 
                        label="Weekly XP" 
                        value="+12.5k" 
                        subtext="Momentum: High" 
                        icon={Activity} 
                        colorClass="text-green-400" 
                        delay={0.3}
                    />
                    <StatCard 
                        label="Treasury" 
                        value={`${(clanWealth.credits / 1000).toFixed(1)}k`} 
                        subtext="Capacity: 85%" 
                        icon={Coins} 
                        colorClass="text-amber-400" 
                        delay={0.4}
                    />
                </div>

                {/* LEFT: Economy & Quests (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Quests */}
                    <ModernGlassCard>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                <Target className="w-4 h-4 text-red-400" /> Active Operations
                            </h3>
                            <span className="text-[10px] text-white/30 uppercase tracking-wider">Reset: 14h</span>
                        </div>
                        <div className="space-y-4">
                            {[
                                { title: "Sector 7 Domination", progress: 8, total: 20, reward: "Gladiator Title", type: "PvP", color: "from-red-500 to-orange-500" },
                                { title: "Resource Extraction", progress: 450, total: 1000, reward: "+500 Guild XP", type: "Farm", color: "from-green-500 to-emerald-500" },
                                { title: "Void Boss Raid", progress: 1, total: 1, reward: "Legendary Cache", type: "Raid", color: "from-purple-500 to-indigo-500" }
                            ].map((quest, i) => (
                                <div key={i} className="group bg-white/[0.03] border border-white/5 p-4 rounded-xl hover:bg-white/[0.05] transition-all">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-medium text-white group-hover:text-white transition-colors">{quest.title}</span>
                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/[0.05] text-white/50">{quest.type}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden mb-2">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(quest.progress / quest.total) * 100}%` }}
                                            className={`h-full bg-gradient-to-r ${quest.color}`}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-white/30">{quest.progress} / {quest.total}</span>
                                        <span className="text-amber-400">{quest.reward}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ModernGlassCard>

                    {/* Upgrades */}
                    <ModernGlassCard>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                <TrendingUp className="w-4 h-4 text-blue-400" /> Research & Upgrades
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="text-xs text-white/50 mb-2">Command Center</div>
                                <div className="text-lg font-bold text-white mb-3">Tier 3</div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-[72%] bg-blue-500" />
                                </div>
                            </div>
                            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="text-xs text-white/50 mb-2">Armory</div>
                                <div className="text-lg font-bold text-white mb-3">Tier 2</div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-[45%] bg-orange-500" />
                                </div>
                            </div>
                        </div>
                    </ModernGlassCard>
                </div>

                {/* RIGHT: Feed & Roster (2 cols) */}
                <div className="lg:col-span-2">
                    <ModernGlassCard className="h-full flex flex-col">
                        <div className="flex items-center gap-6 border-b border-white/5 pb-4 mb-6">
                            <button 
                                onClick={() => setActiveTab('feed')}
                                className={`text-xs font-bold uppercase tracking-wider pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'feed' ? 'text-white border-white' : 'text-white/30 border-transparent hover:text-white/60'}`}
                            >
                                Live Feed
                            </button>
                            <button 
                                onClick={() => setActiveTab('roster')}
                                className={`text-xs font-bold uppercase tracking-wider pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'roster' ? 'text-white border-white' : 'text-white/30 border-transparent hover:text-white/60'}`}
                            >
                                Roster
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                            {activeTab === 'feed' && (
                                <div className="space-y-6">
                                    {feedItems.concat([
                                        { id: 6, type: 'rank', text: "Guild rank increased to #42 Regional.", time: "1d ago", icon: TrendingUp, color: "text-cyan-400" },
                                        { id: 7, type: 'system', text: "Weekly maintenance scheduled for 03:00 UTC.", time: "2d ago", icon: Settings, color: "text-white/40" }
                                    ]).map((item, idx) => (
                                        <div key={item.id} className="flex gap-4 group">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2 h-2 rounded-full ${item.color.replace('text-', 'bg-')} group-hover:scale-125 transition-transform`} />
                                                <div className="w-px h-full bg-white/5 my-1 group-last:hidden" />
                                            </div>
                                            <div className="pb-4">
                                                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{item.time}</div>
                                                <div className="text-sm text-white/80 font-light leading-relaxed">
                                                    <span className={`font-medium ${item.color} mr-2`}>[{item.type.toUpperCase()}]</span>
                                                    {item.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'roster' && (
                                <div className="grid grid-cols-1 gap-2">
                                    {members?.map((m) => (
                                        <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">
                                                    {m.user_id?.slice(0,2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{m.nickname || 'Unknown Agent'}</div>
                                                    <div className="text-[10px] text-white/30 uppercase tracking-wider">{m.role}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${m.role === 'leader' ? 'bg-green-500' : 'bg-slate-600'}`} />
                                                <span className="text-[10px] text-white/30">{m.role === 'leader' ? 'Online' : 'Offline'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ModernGlassCard>
                </div>
            </div>

            {/* Modals */}
            <ClanInventoryModal open={inventoryOpen} onOpenChange={setInventoryOpen} />
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
                        <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail}>Send Invite</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Additional Icon Imports needed for the new UI
import { Box, Truck, Crosshair, Pickaxe, Cpu } from 'lucide-react';