import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Map as MapIcon, Wheat, Brain, Users, MessageSquare, Mic, 
    Settings, Shield, Sword, Target, ChevronRight, Hash,
    Plus, Video, Headphones, UserPlus, Send, X, FileText, Gamepad2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/auth/AuthContext';
import { useEntitySubscription } from '@/components/clan/shared/useEntitySubscription';
import VoiceRoomManager from '@/components/clan/voice/VoiceRoomManager';
import PartyManager from '@/components/clan/party/PartyManager';
import ChatZone from '@/components/clan/zones/ChatZone';
import FarmingZone from '@/components/clan/zones/FarmingZone';
import ExplorationZone from '@/components/clan/zones/ExplorationZone';
import StrategyZone from '@/components/clan/zones/StrategyZone';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';
import ClanFormsZone from '@/components/clan/forms/ClanFormsZone';
import InviteModal from '@/components/clan/modals/InviteModal';

const ZONES = [
    { id: 'exploration', label: 'Exploration', icon: MapIcon, desc: 'Maps, Waypoints & Intel' },
    { id: 'farming', label: 'Farming', icon: Wheat, desc: 'Resource Targets & Drop Tables' },
    { id: 'strategy', label: 'Strategy', icon: Brain, desc: 'Planning & Tactics Board' },
    { id: 'party', label: 'Party Formation', icon: Users, desc: 'LFG & Squad Management' },
    { id: 'chat', label: 'Game Chat', icon: MessageSquare, desc: 'General Comms' },
    { id: 'forms', label: 'Clan Forms', icon: FileText, desc: 'Cross-clan coordination & topics' },
    { id: 'voice', label: 'Voice Rooms', icon: Mic, desc: 'Tactical Audio Channels' },
];

export default function GameWorkspace({ game, clan, onBack, initialZone, onGoMainChat, quickSwitchLabel, onQuickSwitch }) {
    const { user, updatePresenceContext } = useAuth();
    const [activeZone, setActiveZone] = useState(initialZone || 'chat');
    const [showInvite, setShowInvite] = useState(false);
    
    // Visited zones state for lazy loading
    const [visitedZones, setVisitedZones] = useState({ [initialZone || 'chat']: true });

    // Limit zones for global chat
    const visibleZones = game?.isGlobalChat ? ZONES.filter(z => ['chat','voice'].includes(z.id)) : ZONES;

    useEffect(() => {
        updatePresenceContext({
            type: 'game',
            name: game.title,
            id: game.id,
            zoneId: activeZone // Track specific zone for granular recovery
        });
    }, [game.id, clan.id, activeZone]);

    // Cleanup when unmounting component (leaving workspace)
    useEffect(() => {
        return () => {
            updatePresenceContext({
                type: 'clan',
                name: clan.name,
                id: clan.id
            });
        };
    }, []);

    const handleZoneChange = (zoneId) => {
        setActiveZone(zoneId);
        if (!visitedZones[zoneId]) {
            setVisitedZones(prev => ({ ...prev, [zoneId]: true }));
        }
    };

    // Fetch Game-Specific Assignments/Objectives
    const { data: objectives } = useQuery({
        queryKey: ['gameObjectives', clan.id, game.id],
        queryFn: async () => {
            const assignments = await base44.entities.ClanAssignment.filter({
                clanId: clan.id,
                targetId: game.id,
                status: 'pending'
            });
            return assignments.filter(a => ['game', 'objective'].includes(a.type));
        },
        enabled: !!clan && !!game && !game?.isGlobalChat
    });

    useEntitySubscription('ClanAssignment', ['gameObjectives', clan.id, game.id]);
    
    // Fetch Active Workspace
    // Real-time presence via GameWorkspace entity
    const { data: workspace } = useQuery({
        queryKey: ['gameWorkspace', clan.id, game.id],
        queryFn: async () => {
            const ws = await base44.entities.GameWorkspace.filter({ clan_id: clan.id, game_id: game.id });
            return ws[0];
        },
        enabled: !game?.isGlobalChat
    });

    useEntitySubscription('GameWorkspace', ['gameWorkspace', clan.id, game.id]);

    // Active Members derived from Workspace
    // We could fetch User details for IDs, but for now we just need the count
    
    // For the list, we might want to fetch user details if we want to show avatars
    // For now, let's just show counts to be efficient or keep the previous mock if needed, 
    // but the prompt asked for SYNC PRESENCE. 
    // So let's rely on the real workspace data.
    const activeMemberIds = workspace?.active_member_ids || [];
    
    // Fetch user details for active members only (efficient)
    const { data: activeMembers = [] } = useQuery({
        queryKey: ['activeWorkspaceUsers', activeMemberIds.join(',')],
        queryFn: async () => {
            if (activeMemberIds.length === 0) return [];
            // We can't bulk fetch users easily by ID list without custom function or multiple calls
            // or filtering by something common. 
            // For now, let's just mock the details or if we have a way to get them.
            // Actually, we can assume we only show the count for "Active" badge, 
            // and maybe a list of Avatars if we have their data.
            // Let's return simple objects.
            return activeMemberIds.map(id => ({ userId: id, isActive: true }));
        },
        enabled: activeMemberIds.length > 0
    });

    const activeCount = activeMembers?.filter(m => m.isActive).length || 0;



    return (
        <div 
            className="flex h-full w-full text-white overflow-hidden relative"
            style={{
                background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #000000 100%)', // Blue-black radial
            }}
        >
            {/* Liquid Marble Effect Overlay */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-30 z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 2000 2000' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                    filter: 'contrast(150%) brightness(100%)',
                    backgroundSize: 'cover'
                }}
            />

            {/* Background Art */}
            <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
                <img 
                    src={game.cover_image || game.cover} 
                    className="w-full h-full object-cover blur-3xl"
                    alt="Game Art"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            </div>

            {/* Sidebar: Navigation & Objectives */}
            <div 
                className="w-80 flex-shrink-0 z-10 flex flex-col backdrop-blur-3xl"
                style={{ 
                    background: 'rgba(15, 23, 42, 0.4)', // Dark blue tint
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
            >
                {/* Header */}
                <div className="p-5 border-b border-white/10">
                    <div className="flex flex-col gap-2 mb-5">
                        <button 
                            onClick={game?.isGlobalChat ? onQuickSwitch : onGoMainChat}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all text-sm font-bold text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] group"
                        >
                            <Hash className="w-4 h-4 group-hover:scale-110 transition-transform" /> {game?.isGlobalChat ? (quickSwitchLabel ? `Back to ${quickSwitchLabel}` : 'Back to Game Chat') : 'Atom X Eve Main Chat'}
                        </button>
                        <button 
                            onClick={onBack}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-bold text-white/70 hover:text-white group"
                        >
                            <Gamepad2 className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> All Clan Game Chats
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                            <img src={game.cover_image || game.cover} className="w-full h-full object-cover" alt={game.title} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-tight">{game.title}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20 px-1.5 h-5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                                    {activeCount} Active
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Objectives / Goals */}
                <div className="p-4 border-b border-white/10 bg-black/20">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Target className="w-3 h-3 text-blue-400" /> Active Objectives
                    </h3>
                    <div className="space-y-2">
                        {objectives?.length > 0 ? (
                            objectives.map(obj => (
                                <div 
                                    key={obj.id} 
                                    className="p-3 rounded-xl border transition-all hover:border-blue-500/30"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-medium text-white/90">{obj.targetName || 'Objective'}</span>
                                        <Target className="w-3 h-3 text-amber-400" />
                                    </div>
                                    <p className="text-xs text-white/60 mb-2 line-clamp-2">{obj.notes || 'No details provided.'}</p>
                                    <div className="flex justify-between mt-1 items-center">
                                        <Badge variant="outline" className={`text-[9px] h-4 px-1 ${
                                            obj.priority === 'critical' ? 'text-red-400 border-red-500/30' : 
                                            obj.priority === 'priority' ? 'text-amber-400 border-amber-500/30' : 
                                            'text-blue-400 border-blue-500/30'
                                        }`}>
                                            {obj.priority}
                                        </Badge>
                                        <span className="text-[9px] text-white/40">
                                            {obj.dueDate ? new Date(obj.dueDate).toLocaleDateString() : 'No due date'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-white/30 text-xs">
                                No active objectives
                            </div>
                        )}
                    </div>
                </div>

                {/* Functional Zones Navigation */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 px-2">Operational Zones</h3>
                    {visibleZones.map(zone => {
                        const Icon = zone.icon;
                        const isActive = activeZone === zone.id;
                        return (
                            <button
                                key={zone.id}
                                onClick={() => handleZoneChange(zone.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group text-left relative overflow-hidden ${
                                    isActive 
                                        ? 'shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                                        : 'hover:bg-white/5'
                                }`}
                                style={isActive ? {
                                    background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderLeft: '3px solid #3b82f6'
                                } : {
                                    border: '1px solid transparent',
                                    borderLeft: '3px solid transparent'
                                }}
                            >
                                <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10'}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold transition-colors ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{zone.label}</p>
                                    <p className="text-[10px] text-white/30">{zone.desc}</p>
                                </div>
                                {isActive && <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col z-10 bg-transparent">
                {/* Zone Header */}
                <div 
                    className="h-16 flex items-center justify-between px-6 backdrop-blur-md"
                    style={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        {ZONES.find(z => z.id === activeZone)?.icon && React.createElement(ZONES.find(z => z.id === activeZone).icon, { className: "w-5 h-5 text-white/60" })}
                        <h2 className="text-xl font-bold text-white">{ZONES.find(z => z.id === activeZone)?.label}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Active Workspace Members */}
                        <div className="flex -space-x-2">
                            {activeMembers?.slice(0, 4).map((member, i) => (
                                <div 
                                    key={member.id || i} 
                                    className={`w-8 h-8 rounded-full border-2 border-[#0a0c10] flex items-center justify-center text-xs font-bold overflow-hidden relative ${
                                        member.isActive ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white/30 grayscale'
                                    }`}
                                    title={member.userId}
                                >
                                    {/* Ideally show Avatar image if available, fallback to initial */}
                                    {member.userId ? member.userId[0].toUpperCase() : 'M'}
                                    {member.isActive && <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-[#0a0c10]" />}
                                </div>
                            ))}
                            {(activeMembers?.length || 0) > 4 && (
                                <div className="w-8 h-8 rounded-full border-2 border-[#0a0c10] bg-slate-800 flex items-center justify-center text-xs text-white/50">
                                    +{(activeMembers.length - 4)}
                                </div>
                            )}
                        </div>
                        <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleZoneChange('voice')}
                            className="bg-transparent hover:bg-green-500/10 text-green-400 border-green-500/30 gap-2 hidden md:flex"
                        >
                            <Mic className="w-4 h-4" /> Join Voice
                        </Button>
                        <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 gap-2" onClick={() => setShowInvite(true)}>
                            <UserPlus className="w-4 h-4" /> Invite
                        </Button>
                    </div>
                </div>

                {/* Contextual Guidance */}
                <div className="px-6 py-2 text-xs text-white/60 border-b border-white/10 bg-black/20">
                    {activeZone === 'voice' && (
                        <span>You’re in Voice: join a room to coordinate faster; the side chat keeps notes during the call.</span>
                    )}
                    {activeZone === 'chat' && (
                        <span>Game Chat: use this for quick text updates and links. For cross-clan coordination, open Clan Forms.</span>
                    )}
                    {activeZone === 'forms' && (
                        <span>Clan Forms: create topics (General, Farming, Grinding, LFG) to collaborate with other clans.</span>
                    )}
                </div>

                {/* Zone Content */}
                <div className="flex-1 overflow-hidden relative">
                    {/* Zones - State Preserved via display:none logic */}
                    
                    {visitedZones.chat && (
                        <div className="h-full w-full" style={{ display: activeZone === 'chat' ? 'block' : 'none' }}>
                            <ChatZone game={game} clan={clan} user={user} />
                        </div>
                    )}

                    {visitedZones.farming && (
                        <div className="h-full w-full" style={{ display: activeZone === 'farming' ? 'block' : 'none' }}>
                            <FarmingZone game={game} clan={clan} />
                        </div>
                    )}

                    {visitedZones.exploration && (
                        <div className="h-full w-full" style={{ display: activeZone === 'exploration' ? 'block' : 'none' }}>
                            <ExplorationZone game={game} clan={clan} />
                        </div>
                    )}

                    {visitedZones.strategy && (
                        <div className="h-full w-full" style={{ display: activeZone === 'strategy' ? 'block' : 'none' }}>
                            <StrategyZone game={game} clan={clan} />
                        </div>
                    )}

                    {visitedZones.forms && (
                        <div className="h-full w-full" style={{ display: activeZone === 'forms' ? 'block' : 'none' }}>
                            <ClanFormsZone game={game} clan={clan} user={user} />
                        </div>
                    )}

                    {visitedZones.voice && (
                        <div className="h-full w-full flex" style={{ display: activeZone === 'voice' ? 'flex' : 'none' }}>
                            <div className="flex-1 min-w-0">
                                <VoiceRoomManager clanId={clan?.id} gameId={game?.id} />
                            </div>
                            <div className="w-80 flex-shrink-0 border-l border-white/5 bg-black/20">
                                <ZoneChatPanel 
                                    clanId={clan?.id} 
                                    gameId={game?.id} 
                                    zoneId="voice" 
                                    title="Voice Comms" 
                                    className="bg-transparent" 
                                />
                            </div>
                        </div>
                    )}

                    {visitedZones.party && (
                        <div className="h-full w-full flex" style={{ display: activeZone === 'party' ? 'flex' : 'none' }}>
                            <div className="flex-1 min-w-0">
                                <PartyManager clanId={clan?.id} gameId={game?.id} />
                            </div>
                            <div className="w-80 flex-shrink-0 border-l border-white/5 bg-black/20">
                                <ZoneChatPanel 
                                    clanId={clan?.id} 
                                    gameId={game?.id} 
                                    zoneId="party" 
                                    title="LFG Chat" 
                                    className="bg-transparent" 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            <InviteModal open={showInvite} onClose={() => setShowInvite(false)} game={game} />
        </div>
    );
}