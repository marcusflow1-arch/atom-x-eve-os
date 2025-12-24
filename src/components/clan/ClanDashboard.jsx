import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Users, Trophy, Calendar, Target, Sword, Crown, MessageSquare, Package, Settings, Gamepad2, ShoppingBag, TrendingUp, Camera, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/auth/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/10 shadow-sm rounded-2xl p-6 ${className}`}>
        {children}
    </div>
);

// Shortcut Item Component with Icon
const ShortcutItem = ({ icon: Icon, label, to, color = "blue" }) => {
    const colorStyles = {
        blue: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30",
        purple: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30",
        green: "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30",
        orange: "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30",
        pink: "bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30",
        cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30",
    };
    
    return (
        <Link 
            to={to}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${colorStyles[color]}`}
        >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 shadow-sm">
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold">{label}</span>
        </Link>
    );
};

// Member Viewport Component
const MemberViewport = ({ clanId }) => {
    const { data: members } = useQuery({
        queryKey: ['clanMembersViewport', clanId],
        queryFn: async () => {
            const clanMembers = await base44.entities.ClanMember.filter({ divisionId: clanId });
            const memberDetails = await Promise.all(clanMembers.map(async (m) => {
                const u = await base44.entities.User.get(m.userId);
                return { ...m, user: u };
            }));
            return memberDetails.sort((a, b) => {
                const roles = { leader: 0, officer: 1, member: 2 };
                return roles[a.role] - roles[b.role];
            });
        },
        enabled: !!clanId
    });

    const getRoleBadge = (role) => {
        switch(role) {
            case 'leader': return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
            case 'officer': return { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/20' };
            default: return { icon: Users, color: 'text-white/40', bg: 'bg-white/10' };
        }
    };

    return (
        <GlassCard className="!p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4" /> Members Online
                </h3>
                <span className="text-xs font-mono text-green-400 bg-green-500/20 px-2 py-0.5 rounded border border-green-500/30">
                    {members?.length || 0} Online
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {members?.slice(0, 8).map((m) => {
                    const roleInfo = getRoleBadge(m.role);
                    const RoleIcon = roleInfo.icon;
                    return (
                        <div 
                            key={m.id} 
                            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/10"
                        >
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden ring-2 ring-white/20">
                                    {m.user?.avatar_url ? (
                                        <img src={m.user.avatar_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/40 text-xs font-bold">
                                            {m.user?.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                                    {m.user?.full_name || 'Unknown'}
                                    <RoleIcon className={`w-3 h-3 ${roleInfo.color}`} />
                                </div>
                                <div className="text-[10px] text-white/40 truncate">
                                    {m.role === 'leader' ? 'Commander' : m.role === 'officer' ? 'Officer' : 'Agent'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {members && members.length > 8 && (
                <div className="mt-2 text-center">
                    <span className="text-xs text-white/40">+{members.length - 8} more members</span>
                </div>
            )}
        </GlassCard>
    );
};

export default function ClanDashboard({ clan, events }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const progress = (clan.xp / 10000) * 100;
    const isLeader = clan?.leaderId === user?.id;
    const [showBannerModal, setShowBannerModal] = useState(false);
    const [bannerUrl, setBannerUrl] = useState(clan.banner || '');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Update banner mutation
    const updateBannerMutation = useMutation({
        mutationFn: async (newBanner) => {
            return await base44.entities.Division.update(clan.id, { banner: newBanner });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['myClanMembershipsInitial']);
            setShowBannerModal(false);
        }
    });

    const handleBannerUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setBannerUrl(file_url);
        } catch (err) {
            console.error('Upload failed:', err);
        }
        setIsUploading(false);
    };

    const handleSaveBanner = () => {
        if (bannerUrl) {
            updateBannerMutation.mutate(bannerUrl);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
            {/* Guild Header Banner */}
            <div 
                className={`relative h-64 rounded-3xl overflow-hidden group shadow-lg border border-white/20 ${isLeader ? 'cursor-pointer' : ''}`}
                onClick={() => isLeader && setShowBannerModal(true)}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent z-10" />
                <img 
                    src={clan.banner || "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200"} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt="Clan Banner"
                />
                
                {/* Change Banner Overlay - Only for leader */}
                {isLeader && (
                    <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30">
                            <Camera className="w-5 h-5 text-white" />
                            <span className="text-white font-medium text-sm">Change Banner</span>
                        </div>
                    </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 flex items-end justify-between pointer-events-none">
                    <div className="flex items-end gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-white border-2 border-white p-0.5 shadow-2xl backdrop-blur-sm">
                            {clan.icon ? (
                                <img src={clan.icon} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-xl">
                                    <Shield className="w-10 h-10 text-slate-300" />
                                </div>
                            )}
                        </div>
                        <div className="mb-2">
                            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">{clan.name}</h1>
                            <p className="text-white/90 font-medium text-sm flex items-center gap-2 drop-shadow-md">
                                <span className="bg-white/20 text-white px-2 py-0.5 rounded text-xs border border-white/30 uppercase tracking-wide backdrop-blur-md">Level {clan.level}</span>
                                <span className="w-1 h-1 rounded-full bg-white/50" />
                                <span>{clan.memberCount} Members</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 pointer-events-auto">
                         {/* Stats Pill */}
                         <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/20 shadow-lg">
                             <div className="text-center">
                                 <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Ranking</div>
                                 <div className="text-lg font-bold text-white leading-none drop-shadow-sm">#42</div>
                             </div>
                             <div className="w-px h-8 bg-white/20" />
                             <div className="text-center">
                                 <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Reputation</div>
                                 <div className="text-lg font-bold text-yellow-300 leading-none drop-shadow-sm">Elite</div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Banner Change Modal */}
            <Dialog open={showBannerModal} onOpenChange={setShowBannerModal}>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Camera className="w-5 h-5 text-blue-400" />
                            Change Guild Banner
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Preview */}
                        <div className="aspect-video rounded-xl overflow-hidden border border-white/20 bg-slate-800">
                            {bannerUrl ? (
                                <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/40">
                                    <span>No banner selected</span>
                                </div>
                            )}
                        </div>

                        {/* Upload Option */}
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleBannerUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <Button 
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                className="w-full border-slate-700 text-white gap-2"
                                disabled={isUploading}
                            >
                                <Upload className="w-4 h-4" />
                                {isUploading ? 'Uploading...' : 'Upload Image'}
                            </Button>
                        </div>

                        {/* URL Option */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Or paste image URL</label>
                            <Input 
                                value={bannerUrl}
                                onChange={(e) => setBannerUrl(e.target.value)}
                                placeholder="https://example.com/banner.jpg"
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBannerModal(false)} className="border-slate-700 text-slate-400">Cancel</Button>
                        <Button 
                            onClick={handleSaveBanner}
                            disabled={updateBannerMutation.isPending || !bannerUrl}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {updateBannerMutation.isPending ? 'Saving...' : 'Save Banner'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-8">
                
                {/* Left Column: Updates & Quests */}
                <div className="col-span-8 space-y-8">
                    {/* Message of the Day */}
                    <GlassCard className="relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500" />
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" /> Message of the Day
                        </h3>
                        <p className="text-xl text-white font-medium leading-relaxed italic">
                            "{clan.description || "Welcome to the guild. Coordinate your raid schedules in the #planning channel. We aim for World First this season."}"
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                            <span>Updated by Commander</span>
                            <span className="w-1 h-1 rounded-full bg-white/30" />
                            <span>Today at 09:00 AM</span>
                        </div>
                    </GlassCard>

                    {/* Guild Progression */}
                    <div className="grid grid-cols-2 gap-6">
                         <GlassCard>
                             <div className="flex items-center justify-between mb-4">
                                 <h3 className="text-sm font-bold text-white/60">Guild XP</h3>
                                 <span className="text-xs font-mono text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">{Math.floor(progress)}%</span>
                             </div>
                             <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/10">
                                 <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${progress}%` }}
                                     className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                 />
                             </div>
                             <div className="mt-2 flex justify-between text-xs text-white/40">
                                 <span>Lvl {clan.level}</span>
                                 <span>Lvl {clan.level + 1}</span>
                             </div>
                         </GlassCard>

                         <GlassCard>
                             <div className="flex items-center justify-between mb-4">
                                 <h3 className="text-sm font-bold text-white/60">Weekly Contribution</h3>
                                 <Trophy className="w-4 h-4 text-yellow-400" />
                             </div>
                             <div className="flex items-end gap-2">
                                 <span className="text-2xl font-bold text-white">24,500</span>
                                 <span className="text-sm text-green-400 mb-1 flex items-center font-bold">
                                     +12% <span className="text-white/40 text-xs ml-1 font-normal">vs last week</span>
                                 </span>
                             </div>
                         </GlassCard>
                    </div>

                    {/* Active Guild Quests */}
                    <div>
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-red-400" /> Active Guild Quests
                        </h2>
                        <div className="space-y-3">
                            {[
                                { title: "Slay the Ancient Dragon", progress: 3, total: 5, reward: "Legendary Cache", type: "Raid" },
                                { title: "Gather Void Essence", progress: 450, total: 1000, reward: "+500 Guild XP", type: "Collection" },
                                { title: "Win PvP Skirmishes", progress: 8, total: 20, reward: "Gladiator Title", type: "PvP" }
                            ].map((quest, i) => (
                                <GlassCard key={i} className="p-4 hover:bg-white/15 transition-colors cursor-pointer group !bg-white/5">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-white/10 border-white/20 text-white/70 group-hover:border-blue-400/50 group-hover:text-blue-300 transition-colors">
                                                {quest.type}
                                            </Badge>
                                            <span className="font-bold text-white">{quest.title}</span>
                                        </div>
                                        <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-1 rounded-md border border-amber-500/30">{quest.reward}</span>
                                    </div>
                                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
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

                {/* Right Column: Events, Shortcuts & Members */}
                <div className="col-span-4 space-y-6">
                    {/* Quick Shortcuts */}
                    <GlassCard className="!p-4">
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Quick Access</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <ShortcutItem icon={MessageSquare} label="Forum" to={createPageUrl('Community')} color="blue" />
                            <ShortcutItem icon={ShoppingBag} label="Store" to={createPageUrl('Store')} color="purple" />
                            <ShortcutItem icon={TrendingUp} label="Social" to={createPageUrl('SocialFeed')} color="green" />
                            <ShortcutItem icon={Gamepad2} label="Games" to={createPageUrl('Store') + '?subview=library'} color="orange" />
                            <ShortcutItem icon={Trophy} label="Achieve" to={createPageUrl('Achievements')} color="pink" />
                            <ShortcutItem icon={Settings} label="Settings" to={createPageUrl('LunaTemplate') + '?panel=settings'} color="cyan" />
                        </div>
                    </GlassCard>

                    {/* Member Viewport */}
                    <MemberViewport clanId={clan.id} />

                    <GlassCard className="flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                             <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                                 <Calendar className="w-4 h-4" /> Upcoming Events
                             </h3>
                             <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-white/10">
                                 <Sword className="w-3 h-3 text-white/40" />
                             </Button>
                        </div>

                        <div className="space-y-3 max-h-[250px] overflow-y-auto">
                            {events && events.length > 0 ? events.map(event => (
                                <div key={event.id} className="relative bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all group overflow-hidden cursor-pointer">
                                    <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                        <Sword className="w-12 h-12 text-blue-400" />
                                    </div>
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="flex flex-col items-center justify-center bg-white/10 rounded-lg w-10 h-10 border border-white/10 text-white/70 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
                                            <span className="text-[8px] font-bold uppercase opacity-60">{format(new Date(event.startTime), 'MMM')}</span>
                                            <span className="text-sm font-bold">{format(new Date(event.startTime), 'd')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-white text-sm truncate group-hover:text-blue-300 transition-colors">{event.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="text-[10px] px-1.5 h-5 bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">
                                                    {event.participants?.length || 0}/{event.maxParticipants}
                                                </Badge>
                                                <span className="text-[10px] text-white/40 font-medium">{format(new Date(event.startTime), 'h:mm a')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-white/40 bg-white/5 rounded-xl border border-dashed border-white/10">
                                    <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                    <p className="text-xs font-medium">No active operations</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}