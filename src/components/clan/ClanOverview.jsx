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
            className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-4 group hover:border-white/20 transition-all"
        >
            <div className={`absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity ${colorClass}`}>
                <Icon className="w-12 h-12" />
            </div>
            <div className="relative z-10">
                <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">{label}</div>
                <div className="text-2xl font-black text-white tracking-tight">{value}</div>
                {subtext && <div className={`text-xs mt-1 font-medium ${colorClass}`}>{subtext}</div>}
            </div>
            {/* Animated Bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: delay + 0.2, duration: 1 }}
                    className={`h-full opacity-50 ${colorClass.replace('text-', 'bg-')}`} 
                />
            </div>
        </motion.div>
    );

    const IdentityBadge = ({ spec }) => (
        <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group cursor-default">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${spec.bg} border border-white/5 group-hover:border-white/20 transition-all`}>
                <spec.icon className={`w-5 h-5 ${spec.color}`} />
            </div>
            <div className="text-center">
                <div className="text-xs font-bold text-white/90">{spec.label}</div>
                <div className="text-[10px] text-white/40">Tier {spec.level}</div>
            </div>
        </div>
    );

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 lg:p-10 pb-24">
            
            {/* 1. GUILD IDENTITY HEADER */}
            <div className="relative w-full mb-10">
                {/* Holographic Banner BG */}
                <div className="absolute inset-0 -z-10 rounded-3xl overflow-hidden opacity-50">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
                    {/* Animated Grid Line */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10 p-6">
                    {/* Emblem */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/10 bg-black/60 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group"
                    >
                        {clan.icon ? (
                            <img src={clan.icon} className="w-full h-full object-cover" />
                        ) : (
                            <Shield className="w-16 h-16 text-white/20" />
                        )}
                        <div className="absolute inset-0 rounded-full border border-white/10" />
                        {/* Rotating ring effect */}
                        <div className="absolute inset-0 rounded-full border-t border-cyan-500/50 animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>

                    {/* Info */}
                    <div className="flex-1">
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-center gap-4 mb-2"
                        >
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
                                {clan.name}
                            </h1>
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-3 py-1 text-xs font-bold tracking-widest">
                                LVL {clan.level || 1}
                            </Badge>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-white/60 font-light max-w-2xl leading-relaxed mb-6"
                        >
                            {clan.description || "A Division dedicated to excellence and conquest within the Atom x Eve ecosystem. Operations focused on tactical dominance and economic growth."}
                        </motion.div>

                        {/* Badges Row */}
                        <div className="flex flex-wrap gap-3">
                            {guildSpecialties.map((spec, i) => (
                                <Badge key={i} variant="outline" className={`bg-white/5 border-white/10 ${spec.color} flex items-center gap-1.5 py-1 px-3`}>
                                    <spec.icon className="w-3 h-3" />
                                    {spec.label}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Command Actions (Top Right) */}
                    <div className="flex flex-col gap-3 md:self-start mt-4 md:mt-0">
                        {isOfficer && (
                            <Button onClick={() => setIsInviteOpen(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white border-none shadow-lg shadow-cyan-900/20">
                                <UserPlus className="w-4 h-4 mr-2" /> Invite Agent
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setInventoryOpen(true)} className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
                            <Box className="w-4 h-4 mr-2" /> Inventory
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. MAIN DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* LEFT COLUMN: STATUS PANELS (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Status Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard 
                            label="Members" 
                            value={`${members?.length || 0} / 50`} 
                            subtext="Highly Active" 
                            icon={Users} 
                            colorClass="text-cyan-400" 
                            delay={0.1}
                        />
                        <StatCard 
                            label="Power Score" 
                            value={clanStats.memberStrength.toLocaleString()} 
                            subtext="Top 5% Regional" 
                            icon={Zap} 
                            colorClass="text-yellow-400" 
                            delay={0.2}
                        />
                        <StatCard 
                            label="Momentum" 
                            value="+12.5%" 
                            subtext="Weekly Growth" 
                            icon={Activity} 
                            colorClass="text-green-400" 
                            delay={0.3}
                        />
                    </div>

                    {/* Economy & Progress Section */}
                    <LiquidGlassCard className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Coins className="w-4 h-4 text-amber-400" /> Guild Economy
                            </h3>
                            <div className="text-xs text-white/40">Next Payout: 14h 30m</div>
                        </div>

                        <div className="grid grid-cols-3 gap-8 mb-8">
                            <div className="text-center">
                                <div className="text-xs text-white/40 mb-1">Treasury Funds</div>
                                <div className="text-2xl font-bold text-white tracking-tight">{clanWealth.credits.toLocaleString()} <span className="text-xs text-amber-400">CR</span></div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-white/40 mb-1">Operations Energy</div>
                                <div className="text-2xl font-bold text-white tracking-tight">{clanWealth.energy}%</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-white/40 mb-1">Raw Materials</div>
                                <div className="text-2xl font-bold text-white tracking-tight">{clanWealth.materials.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Upgrade Path Progress */}
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-white font-medium">Command Center Upgrade (Tier 3)</span>
                                    <span className="text-cyan-400">72%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: '72%' }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-white font-medium">Vehicle Bay Expansion</span>
                                    <span className="text-orange-400">45%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: '45%' }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                        className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                                    />
                                </div>
                            </div>
                        </div>
                    </LiquidGlassCard>

                    {/* Activity Identity Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {guildSpecialties.map((spec) => (
                            <IdentityBadge key={spec.id} spec={spec} />
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: FEED & ROSTER (1/3 width) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    
                    <LiquidGlassCard className="flex-1 flex flex-col min-h-[500px]">
                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                            <button 
                                onClick={() => setActiveTab('feed')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'feed' ? 'text-white border-b-2 border-cyan-500 bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                Live Feed
                            </button>
                            <button 
                                onClick={() => setActiveTab('roster')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'roster' ? 'text-white border-b-2 border-cyan-500 bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                Roster ({members?.length || 0})
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                            
                            {activeTab === 'feed' && (
                                <div className="space-y-4">
                                    {feedItems.map((item, idx) => (
                                        <motion.div 
                                            key={item.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="relative pl-6 pb-4 border-l border-white/10 last:border-0 last:pb-0"
                                        >
                                            <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-900 border ${item.color.replace('text-', 'border-')}`} />
                                            <div className="text-[10px] text-white/30 mb-1">{item.time}</div>
                                            <div className="text-sm text-white/80 leading-snug">
                                                <span className={`font-bold ${item.color} mr-1`}>[{item.type.toUpperCase()}]</span>
                                                {item.text}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'roster' && (
                                <div className="space-y-2">
                                    {/* Leaders */}
                                    <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 mt-1">Command</div>
                                    {members?.filter(m => m.role === 'leader' || m.role === 'officer').map(m => (
                                        <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold border border-white/10">
                                                {m.user_id?.slice(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{m.nickname || 'Agent'}</div>
                                                <div className="text-[10px] text-amber-400">{m.role.toUpperCase()}</div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Members */}
                                    <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2 mt-4">Agents</div>
                                    {members?.filter(m => m.role !== 'leader' && m.role !== 'officer').map(m => (
                                        <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white/30">
                                                {m.user_id?.slice(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white/70">{m.nickname || 'Agent'}</div>
                                                <div className="text-[10px] text-white/30">{m.title || 'Member'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    </LiquidGlassCard>
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