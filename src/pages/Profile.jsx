import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DragDropContext } from '@hello-pangea/dnd';
import { useAuth } from '../components/auth/AuthContext';
import { User } from '@/entities/User';
import { Avatar } from '@/entities/Avatar';
import { Achievement } from '@/entities/Achievement';
import { base44 } from '@/api/base44Client';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, AreaChart, Area
} from 'recharts';
import AIViewport from '../components/profile/AIViewport';
import EquipmentColumn from '../components/profile/EquipmentColumn';
import StatsAndSkills from '../components/profile/StatsAndSkills';
import InventoryPanel from '../components/profile/InventoryPanel';
import GenreSelector from '../components/profile/GenreSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, Share2, Edit, Crown, TrendingUp, Zap, Package, 
  Users, Target, Sparkles, Sword, Shield, Heart, Star, Trophy,
  Gamepad2, Cog, Leaf
} from 'lucide-react';
import { profileData, inventoryData } from '../components/profile/mockData';

export default function Profile() {
    const { user, avatar, updateUserData } = useAuth();
    const [achievements, setAchievements] = useState([]); // All available definitions
    const [userAchievements, setUserAchievements] = useState([]); // Enriched user achievements
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [profile, setProfile] = useState(profileData);
    const [inventory, setInventory] = useState(inventoryData);
    
    // Calculate power level from equipped items and achievements
    const calculatePowerLevel = () => {
        if (!avatar) return 100;
        
        let power = 100; // Base power
        power += (avatar.level || 1) * 50; // Level contribution
        power += userAchievements.length * 25;
        power += (avatar.equipped_items?.length || 0) * 150;
        
        return power;
    };

    const powerLevel = calculatePowerLevel();
    // We'll use userAchievements for display now, which contains the enriched data
    const unlockedAchievements = userAchievements;
    
    // Count items by rarity
    const countItemsByRarity = () => {
        const counts = { Legendary: 0, Epic: 0, Rare: 0, Uncommon: 0, Common: 0 };
        unlockedAchievements.forEach(ach => {
            if (counts[ach.rarity] !== undefined) {
                counts[ach.rarity] = (counts[ach.rarity] || 0) + 1;
            }
        });
        return counts;
    };

    const rarityCounts = countItemsByRarity();

    // Count by category
    const countByCategory = () => {
        const counts = { ability: 0, equipment: 0, companion: 0 };
        unlockedAchievements.forEach(ach => {
            if (ach.category in counts) {
                counts[ach.category]++;
            }
        });
        return counts;
    };

    const categoryCounts = countByCategory();

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Fetch definitions
                const definitions = await Achievement.list();
                setAchievements(definitions);

                // Fetch user records using the new backend function for enriched data
                // OR use the entity SDK directly if we prefer. 
                // Let's use the entity SDK + manual map for consistency with the rest of the app style
                // but the prompt asked for a backend function. Let's try to use the backend function if possible, 
                // but for direct page load speed, Entity SDK is often better if we just do the join client side.
                // The prompt said "backend function to award... and a user profile section to display".
                // I'll stick to client-side join for the profile display as it's cleaner in React usually.
                
                const userRecs = await base44.entities.UserAchievement.filter({ user_id: user.id });
                
                // Join
                const enriched = userRecs.map(ua => {
                    const def = definitions.find(d => d.id === ua.achievement_id);
                    return {
                        ...ua,
                        ...def, // Merge definition details
                        id: ua.id, // Keep UserAchievement ID as primary
                        defId: def?.id,
                        unlockedAt: ua.unlocked_at || ua.created_date
                    };
                }).filter(item => item.title); // Only keep valid ones

                setUserAchievements(enriched);

            } catch (error) {
                console.error('Failed to load profile data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Handle drag and drop
    const handleDragEnd = (result) => {
        const { source, destination, draggableId } = result;

        // Dropped outside valid droppable
        if (!destination) return;

        // Dropped in same position
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        console.log('Drag ended:', { source, destination, draggableId });

        // Handle equipment drops
        if (destination.droppableId.startsWith('weapon-') || 
            destination.droppableId.startsWith('armor-') ||
            destination.droppableId.startsWith('aspect-') ||
            destination.droppableId.startsWith('artifact-')) {
            
            // This is where you'd update the actual equipped items
            console.log('Equipping item:', draggableId, 'to slot:', destination.droppableId);
        }

        // Handle skill loadout drops
        if (destination.droppableId.startsWith('skill-')) {
            console.log('Equipping skill:', draggableId, 'to slot:', destination.droppableId);
        }
    };

    const handleUnequip = (type, slotId) => {
        console.log('Unequipping:', type, slotId);
        // Update profile to remove equipped item
    };

    const handleAttributeChange = (attribute, newValue) => {
        console.log('Attribute changed:', attribute, newValue);
        // Update profile attributes
    };

    const handleLoadoutChange = (newLoadout) => {
        console.log('Loadout changed:', newLoadout);
        // Switch active loadout
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading profile...</div>
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="min-h-screen bg-slate-950 text-white p-0 md:p-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 max-w-7xl mx-auto"
                >
                    {/* Modern Profile Header */}
                    <div className="relative mb-16">
                        {/* Banner Background */}
                        <div className="h-48 md:h-64 rounded-b-3xl md:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                            
                            {/* Top Actions */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                                    <Share2 className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => setEditMode(!editMode)}>
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Profile Content Overlap */}
                        <div className="px-6 md:px-10 relative -mt-20 flex flex-col md:flex-row items-end md:items-end gap-8">
                            {/* Avatar */}
                            <div className="relative z-10 group">
                                <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl border-4 border-slate-950 bg-slate-900 shadow-2xl overflow-hidden relative">
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-5xl font-bold">
                                            {user?.username?.charAt(0) || 'P'}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider">Change</span>
                                    </div>
                                </div>
                                {/* Level Badge */}
                                <div className="absolute -bottom-4 -right-4 bg-slate-950 p-1.5 rounded-xl">
                                    <div className="bg-yellow-500 text-yellow-950 font-black text-sm px-3 py-1 rounded-lg border border-yellow-400 shadow-lg shadow-yellow-500/20">
                                        LVL {avatar?.level || 1}
                                    </div>
                                </div>
                            </div>

                            {/* Info & Stats */}
                            <div className="flex-1 w-full md:w-auto pb-2">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">{user?.username || 'Player'}</h1>
                                            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 bg-cyan-950/30 backdrop-blur-md px-3 py-1">
                                                {user?.archetype || 'Legend'}
                                            </Badge>
                                        </div>
                                        <p className="text-slate-400 text-base md:text-lg max-w-2xl font-light">
                                            {user?.bio || 'Forging a legacy across digital realms.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                                    <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-colors rounded-xl p-3 md:p-4 flex flex-col">
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-yellow-500" /> Power Level
                                        </div>
                                        <div className="text-2xl md:text-3xl font-bold text-white">{powerLevel.toLocaleString()}</div>
                                    </div>
                                    
                                    <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-colors rounded-xl p-3 md:p-4 flex flex-col">
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <Trophy className="w-3 h-3 text-orange-500" /> Achievements
                                        </div>
                                        <div className="text-2xl md:text-3xl font-bold text-white">{unlockedAchievements.length}</div>
                                    </div>
                                    
                                    <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-colors rounded-xl p-3 md:p-4 flex flex-col">
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <Package className="w-3 h-3 text-blue-500" /> Arsenal Size
                                        </div>
                                        <div className="text-2xl md:text-3xl font-bold text-white">{inventory.length} <span className="text-sm text-slate-500 font-normal">Items</span></div>
                                    </div>

                                    <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-colors rounded-xl p-3 md:p-4 flex flex-col">
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <Users className="w-3 h-3 text-purple-500" /> Allies
                                        </div>
                                        <div className="text-2xl md:text-3xl font-bold text-white">{categoryCounts.companion}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Profile Content */}
                <Tabs defaultValue="loadout" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 mb-6">
                        <TabsTrigger value="loadout" className="gap-2">
                            <Sword className="w-4 h-4" />
                            Loadout
                        </TabsTrigger>
                        <TabsTrigger value="arsenal" className="gap-2">
                            <Package className="w-4 h-4" />
                            Full Arsenal
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Stats
                        </TabsTrigger>
                        <TabsTrigger value="builds" className="gap-2">
                            <Target className="w-4 h-4" />
                            Saved Builds
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="loadout">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Equipment Slots */}
                            <div className="lg:col-span-1">
                                <EquipmentColumn 
                                    profile={profile}
                                    onUnequip={handleUnequip}
                                />
                            </div>

                            {/* Center: Expanded AI Companion Box */}
                            <div className="lg:col-span-1 flex flex-col gap-4">
                                <Card className="bg-slate-800/50 border-slate-700 flex-1">
                                    <CardContent className="p-6 flex flex-col h-full">
                                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                            <Sparkles className="w-6 h-6 text-purple-400" />
                                            AI Companion Zone
                                        </h3>
                                        
                                        {/* AI Viewport Section - Now takes all available space */}
                                        <div className="flex-1 min-h-[500px]">
                                            <AIViewport 
                                                name={user?.username || 'Player'} 
                                                status="online"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Genre Selector - Moved outside the main card */}
                                <Card className="bg-slate-800/50 border-slate-700">
                                    <CardContent className="p-4">
                                        <GenreSelector 
                                            equippedGenres={['RPG', 'Sci-Fi']}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Companion Stats - Moved outside the main card */}
                                <Card className="bg-slate-800/50 border-slate-700">
                                    <CardContent className="p-4">
                                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Companion Stats</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Bond Level</span>
                                                <span className="text-white font-semibold">{avatar?.level || 1}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Experience</span>
                                                <span className="text-white font-semibold">{avatar?.experience || 0} XP</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Active Abilities</span>
                                                <span className="text-white font-semibold">{avatar?.unlocked_abilities?.length || 0}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right: Stats */}
                            <div className="lg:col-span-1">
                                <StatsAndSkills 
                                    profile={profile}
                                    onAttributeChange={handleAttributeChange}
                                    onLoadoutChange={handleLoadoutChange}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="arsenal">
                        <InventoryPanel 
                            inventory={inventory}
                            capacity={profile.inventoryCapacity}
                            profile={profile}
                        />
                    </TabsContent>

                    <TabsContent value="stats" className="space-y-6">
                        {/* Stats Overview Header */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                             <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-lg">
                                    <Sword className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase">Combat Power</div>
                                    <div className="text-2xl font-black text-white">{(powerLevel * 1.2).toFixed(0)}</div>
                                </div>
                             </div>
                             <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <Shield className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase">Defense Rating</div>
                                    <div className="text-2xl font-black text-white">{(powerLevel * 0.8).toFixed(0)}</div>
                                </div>
                             </div>
                             <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                                <div className="p-3 bg-purple-500/10 rounded-lg">
                                    <Sparkles className="w-6 h-6 text-purple-500" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase">Magic Find</div>
                                    <div className="text-2xl font-black text-white">142%</div>
                                </div>
                             </div>
                             <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                                <div className="p-3 bg-green-500/10 rounded-lg">
                                    <Target className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase">Precision</div>
                                    <div className="text-2xl font-black text-white">98.5%</div>
                                </div>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Radar Chart - Attributes */}
                            <Card className="bg-slate-900/60 border-slate-800 lg:col-span-1">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-400" /> Attribute Matrix
                                    </h3>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                                { subject: 'STR', A: profile.attributes?.str || 65, fullMark: 100 },
                                                { subject: 'DEX', A: profile.attributes?.dex || 80, fullMark: 100 },
                                                { subject: 'INT', A: profile.attributes?.int || 90, fullMark: 100 },
                                                { subject: 'WIS', A: profile.attributes?.will || 70, fullMark: 100 },
                                                { subject: 'CON', A: 75, fullMark: 100 },
                                                { subject: 'AGI', A: 85, fullMark: 100 },
                                            ]}>
                                                <PolarGrid stroke="#334155" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar
                                                    name="Attributes"
                                                    dataKey="A"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={2}
                                                    fill="#8b5cf6"
                                                    fillOpacity={0.3}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="text-center mt-2">
                                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                                            Balanced Mystic Build
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Activity Graph */}
                            <Card className="bg-slate-900/60 border-slate-800 lg:col-span-2">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-400" /> Combat Efficiency
                                    </h3>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={[
                                                    { name: 'Mon', dps: 4000, hps: 2400 },
                                                    { name: 'Tue', dps: 3000, hps: 1398 },
                                                    { name: 'Wed', dps: 2000, hps: 9800 },
                                                    { name: 'Thu', dps: 2780, hps: 3908 },
                                                    { name: 'Fri', dps: 1890, hps: 4800 },
                                                    { name: 'Sat', dps: 2390, hps: 3800 },
                                                    { name: 'Sun', dps: 3490, hps: 4300 },
                                                ]}
                                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="colorDps" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorHps" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" stroke="#475569" />
                                                <YAxis stroke="#475569" />
                                                <RechartsTooltip 
                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                                />
                                                <Area type="monotone" dataKey="dps" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDps)" />
                                                <Area type="monotone" dataKey="hps" stroke="#10b981" fillOpacity={1} fill="url(#colorHps)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detailed Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="bg-slate-900/60 border-slate-800">
                                <CardContent className="p-6">
                                    <h4 className="text-white font-bold mb-4 border-b border-slate-800 pb-2">World Stats</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Exploration</span>
                                            <div className="flex items-center gap-2 w-1/2">
                                                <div className="h-2 bg-slate-800 rounded-full flex-1">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '78%' }} />
                                                </div>
                                                <span className="text-white text-xs font-bold">78%</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Quests Completed</span>
                                            <span className="text-white font-mono">1,243</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Time Played</span>
                                            <span className="text-white font-mono">482h 15m</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/60 border-slate-800">
                                <CardContent className="p-6">
                                    <h4 className="text-white font-bold mb-4 border-b border-slate-800 pb-2">Combat Mastery</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Melee Kills</span>
                                            <span className="text-white font-mono">4,521</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Ranged Kills</span>
                                            <span className="text-white font-mono">2,890</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Ability Kills</span>
                                            <span className="text-white font-mono">8,102</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/60 border-slate-800">
                                <CardContent className="p-6">
                                    <h4 className="text-white font-bold mb-4 border-b border-slate-800 pb-2">Recent Achievements</h4>
                                    <div className="space-y-3">
                                        {unlockedAchievements.slice(0, 3).map((ach) => (
                                            <div key={ach.id} className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-lg">
                                                    {ach.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white text-sm font-bold truncate">{ach.title}</div>
                                                    <div className="text-slate-500 text-xs truncate">{ach.description}</div>
                                                </div>
                                                <div className="text-yellow-500 text-xs font-bold">
                                                    {ach.points}
                                                </div>
                                            </div>
                                        ))}
                                        {unlockedAchievements.length === 0 && (
                                            <div className="text-slate-500 text-sm italic">No recent activity</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="builds">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardContent className="p-8 text-center">
                                <Target className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Saved Builds</h3>
                                <p className="text-slate-400">Save and switch between loadouts instantly</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Games Played Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8"
                >
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-blue-400" />
                        Your Legend Spans Multiple Worlds
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {['Cyberpunk 2088', 'Elder Scrolls', 'Half-Life VR', 'Battle Arena', 'Mystic Quest', 'Space Odyssey'].map((game, index) => (
                            <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group">
                                <CardContent className="p-4 text-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-xs text-slate-300">{game}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            </div>
        </DragDropContext>
    );
}