import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Users, MessageSquareText, Info, Swords, Shield, Trophy, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import PartyPanel from '../../clan/PartyPanel';
import DashboardTab from '../../clan/DashboardTab';
import MembersTab from '../../clan/MembersTab';
import RoomsTab from '../../clan/RoomsTab';
import GuildInfoTab from '../../clan/GuildInfoTab';
import { useAuth } from '../../auth/AuthContext';
import { ThemeBackground, ThemeToggle } from '../../shared/ThemeSystem';

const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'rooms', label: 'Divisions', icon: MessageSquareText },
    { id: 'info', label: 'Guild Info', icon: Info },
];

export default function StreamTeam() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [onlineMembers, setOnlineMembers] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [currentUser, setCurrentUser] = useState({ role: 'Leader', name: 'Marcus' });
    const { isAuthenticated } = useAuth();
    const [selectedTheme, setSelectedTheme] = useState('electric_blue');

    // Simulate real-time member presence
    useEffect(() => {
        const simulatePresence = () => {
            const members = [
                { id: 1, name: 'Marcus', role: 'Leader', status: 'online', activity: 'In Dashboard', avatar: 'https://i.pravatar.cc/150?u=marcus', joinedAt: '2023-01-15', lastSeen: 'now' },
                { id: 2, name: 'Shadow_Stryker', role: 'Officer', status: 'online', activity: 'Playing Vanguard Ops', avatar: 'https://i.pravatar.cc/150?u=shadow', joinedAt: '2023-02-20', lastSeen: 'now' },
                { id: 3, name: 'Glitch_Witch', role: 'Member', status: 'away', activity: 'Idle', avatar: 'https://i.pravatar.cc/150?u=glitch', joinedAt: '2023-03-10', lastSeen: '5 minutes ago' },
                { id: 4, name: 'Jax_Ripper', role: 'Member', status: 'online', activity: 'In Division: Combat Training', avatar: 'https://i.pravatar.cc/150?u=jax', joinedAt: '2023-03-25', lastSeen: 'now' },
                { id: 5, name: 'Cortex', role: 'Member', status: 'offline', activity: 'Offline', avatar: 'https://i.pravatar.cc/150?u=cortex', joinedAt: '2023-04-05', lastSeen: '2 hours ago' },
                { id: 6, name: 'Vexia', role: 'Recruit', status: 'online', activity: 'In Voice Chat', avatar: 'https://i.pravatar.cc/150?u=vexia', joinedAt: '2023-04-20', lastSeen: 'now' }
            ];
            
            setAllMembers(members);
            setOnlineMembers(members.filter(member => member.status === 'online'));
        };

        simulatePresence();
        
        const interval = setInterval(() => {
            simulatePresence();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab currentUser={currentUser} onlineMembers={onlineMembers} />;
            case 'members':
                return <MembersTab members={allMembers} onlineMembers={onlineMembers} currentUser={currentUser} />;
            case 'rooms':
                return <RoomsTab onlineMembers={onlineMembers} currentUser={currentUser} />;
            case 'info':
                return <GuildInfoTab currentUser={currentUser} />;
            default:
                return null;
        }
    };

    return (
        <div className="h-full text-white overflow-hidden relative flex flex-col md:flex-row">
            <ThemeBackground themeId={selectedTheme} />
            
            {/* Main Content Area with Futuristic Dashboard Layout */}
            <div className="flex-grow flex flex-col h-full overflow-hidden relative z-10 p-6 gap-6">
                
                {/* Floating Header Card */}
                <header className="flex-shrink-0 p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
                            <div className="relative w-20 h-20 bg-slate-950 rounded-full border-2 border-white/10 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                <img src="https://cdn-icons-png.flaticon.com/512/167/167735.png" alt="Clan Icon" className="w-12 h-12 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                            </div>
                            <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-4 border-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                        </div>
                        
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-300 flex items-center gap-4 drop-shadow-sm">
                                STREAM TEAM
                                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 text-[10px] px-2 py-0.5 uppercase tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                    Official Squad
                                </Badge>
                            </h1>
                            <div className="flex items-center gap-6 text-sm text-slate-400 mt-2 font-medium">
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/5 border border-red-500/10">
                                    <Swords className="w-4 h-4 text-red-400" /> 
                                    <span className="text-red-100 font-mono font-bold">245</span> Wins
                                </span>
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10">
                                    <Users className="w-4 h-4 text-blue-400" />
                                    <span className="text-blue-100 font-mono font-bold">{allMembers.length}</span> Members
                                </span>
                                <span className="italic text-slate-500 border-l border-white/10 pl-4">"Live. Laugh. Stream."</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        {!isAuthenticated && (
                            <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                Sign In to Join
                            </Button>
                        )}
                        
                        <ThemeToggle selectedTheme={selectedTheme} onThemeSelect={setSelectedTheme} />
                    </div>
                </header>

                {/* Dashboard Grid Layout */}
                <div className="flex-grow flex gap-6 overflow-hidden">
                    
                    {/* Left Navigation Sidebar (Vertical Tabs) */}
                    <div className="w-64 flex-shrink-0 flex flex-col gap-2">
                        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-2 shadow-lg flex flex-col gap-1 h-full">
                            <div className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Team Command</div>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        group flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden
                                        ${activeTab === tab.id 
                                            ? 'text-white bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}
                                    `}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div 
                                            layoutId="activeTabIndicator"
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" 
                                        />
                                    )}
                                    <tab.icon className={`w-5 h-5 transition-colors ${activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-300'}`} />
                                    <span className="relative z-10">{tab.label}</span>
                                    {activeTab === tab.id && <div className="absolute inset-0 bg-blue-400/5 animate-pulse z-0" />}
                                </button>
                            ))}
                            
                            <div className="mt-auto p-4 bg-slate-950/50 rounded-xl border border-white/5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Team Status</h4>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-slate-500">Activity</span>
                                    <span className="text-green-400">Live</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full w-3/4 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center Content Area */}
                    <main className="flex-grow bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
                        
                        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar relative z-10">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="h-full"
                                >
                                    {renderContent()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </main>

                    {/* Right Party Panel (Floating) */}
                    <div className="w-80 flex-shrink-0 hidden xl:flex flex-col gap-4">
                        <div className="flex-grow bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden flex flex-col">
                             <div className="p-4 border-b border-white/10 bg-slate-950/30 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5 text-green-400 animate-pulse" />
                                    Squad Uplink
                                </h3>
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
                            </div>
                            <div className="flex-grow overflow-y-auto custom-scrollbar">
                                <PartyPanel onlineMembers={onlineMembers} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}