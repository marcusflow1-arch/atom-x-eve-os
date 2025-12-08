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
  Gamepad2, Cog, Leaf, ShoppingCart
} from 'lucide-react';
import { profileData, inventoryData, itemData } from '../components/profile/mockData';
import MarketplaceHistory from '../components/profile/MarketplaceHistory';

export default function Profile() {
    const { user, avatar, updateUserData } = useAuth();
    const [achievements, setAchievements] = useState([]); 
    const [userAchievements, setUserAchievements] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [profile, setProfile] = useState(profileData);
    const [inventory, setInventory] = useState(inventoryData);
    const [activeTab, setActiveTab] = useState('inventory'); // inventory, evolution, chronicles

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

    // Simplified Slot Component for the Redesign
    const LoadoutSlot = ({ label, item, slotId, type, side = 'left', level }) => (
        <div className={`flex items-center gap-4 group ${side === 'right' ? 'flex-row-reverse text-right' : ''}`}>
             <div className="relative">
                 {/* Glass Slot Container */}
                 <div className="w-20 h-20 bg-white/5 backdrop-blur-md border border-white/20 rounded-sm shadow-xl flex items-center justify-center relative overflow-hidden group-hover:border-white/40 transition-all duration-300">
                     {item ? (
                         <img src={item.icon_url || item.icon || "https://via.placeholder.com/64"} alt={label} className="w-full h-full object-cover p-2 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center opacity-20">
                             <div className="w-8 h-8 rounded-full border border-white/30" />
                         </div>
                     )}
                     
                     {/* Rarity Glow */}
                     {item && <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent pointer-events-none" />}
                 </div>

                 {/* Key Bind / Level Indicator */}
                 {level && (
                     <div className={`absolute -bottom-2 ${side === 'left' ? '-right-2' : '-left-2'} bg-white/10 backdrop-blur-md border border-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white rounded-sm`}>
                         IV
                         <span className="text-yellow-400 ml-0.5">↑</span>
                     </div>
                 )}
             </div>

             {/* Text Label */}
             <div className="flex flex-col">
                 <span className="text-white font-serif tracking-widest text-sm uppercase">{label}</span>
                 {item && <span className="text-white/50 text-xs font-light tracking-wider">{item.name || "Unknown"}</span>}
             </div>
        </div>
    );

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="min-h-screen bg-[#0f1115] text-white relative overflow-hidden font-sans selection:bg-white/20">
                
                {/* Frost / Glass Theme Background */}
                <div className="fixed inset-0 pointer-events-none">
                    {/* Subtle Gradient Base */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#13161c] to-black" />
                    
                    {/* Frost/Fog Effects */}
                    <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/5 to-transparent mix-blend-overlay pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_#0f1115_90%)] z-0" />
                </div>

                {/* Top Navigation Bar - Banishers Style */}
                <nav className="relative z-20 flex justify-center items-center gap-12 py-8 border-b border-white/5 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-sm">
                    {['Map', 'Inventory', 'Evolution', 'Chronicles', 'Haunting Cases'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`relative px-4 py-2 uppercase tracking-[0.2em] text-sm transition-all duration-300 ${
                                activeTab === tab.toLowerCase() 
                                ? 'text-white font-bold' 
                                : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            {tab}
                            {activeTab === tab.toLowerCase() && (
                                <motion.div 
                                    layoutId="activeTabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                />
                            )}
                        </button>
                    ))}
                    
                    {/* Key Hint */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4 text-xs text-white/40 tracking-wider">
                         <span className="flex items-center gap-2">
                             <span className="w-6 h-6 border border-white/20 flex items-center justify-center rounded-sm">1</span>
                             <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/50" />
                         </span>
                         <span className="flex items-center gap-2">
                             <span className="w-6 h-6 border border-white/20 flex items-center justify-center rounded-sm">0</span>
                             <span className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/50" />
                         </span>
                         <div className="h-8 w-px bg-white/10 mx-2" />
                         <div className="border border-white/20 px-2 py-1 rounded-sm">LEVEL {avatar?.level || 19}</div>
                    </div>
                </nav>

                {/* Main Content Area */}
                <div className="relative z-10 container mx-auto h-[calc(100vh-100px)] pt-12">
                    
                    {/* Grid Layout matching screenshot */}
                    <div className="grid grid-cols-12 h-full">
                        
                        {/* LEFT COLUMN - Equipment */}
                        <div className="col-span-3 flex flex-col justify-center items-end pr-12 gap-10">
                             <h2 className="absolute top-12 left-12 text-3xl font-serif text-white/90 tracking-wider font-light">Equipment</h2>
                             
                             <LoadoutSlot 
                                 label="Outfit" 
                                 side="left" 
                                 level={true}
                                 item={itemData[profile?.equipped?.armor?.chest] || { name: "Banisher's Coat", icon: "https://cdn-icons-png.flaticon.com/512/3273/3273760.png" }} 
                             />
                             
                             <div className="relative group cursor-pointer">
                                 {/* Selected Indicator Circle */}
                                 <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/30 flex items-center justify-center">
                                     <div className="w-1 h-1 bg-white rounded-full" />
                                 </div>
                                 <LoadoutSlot 
                                     label="Saber & Firebane" 
                                     side="left" 
                                     level={true}
                                     item={itemData[profile?.equipped?.weapons?.[0]] || { name: "Silver Estoc", icon: "https://cdn-icons-png.flaticon.com/512/10095/10095640.png" }}
                                 />
                             </div>

                             <LoadoutSlot 
                                 label="Rifle" 
                                 side="left" 
                                 level={true}
                                 item={itemData[profile?.equipped?.weapons?.[1]] || { name: "Flintlock Musket", icon: "https://cdn-icons-png.flaticon.com/512/2042/2042337.png" }}
                             />
                             
                             <div className="mt-8">
                                <LoadoutSlot 
                                    label="Decoction" 
                                    side="left" 
                                    level={true}
                                    item={itemData[profile?.equipped?.artifacts?.[0]] || { name: "Spirit Flask", icon: "https://cdn-icons-png.flaticon.com/512/867/867448.png" }}
                                />
                                <div className="text-right text-xs text-white/50 mt-1 mr-24">Charges: 3 / 3</div>
                             </div>
                        </div>

                        {/* CENTER COLUMN - Avatar */}
                        <div className="col-span-6 relative flex items-center justify-center">
                            {/* Avatar Background Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[800px] bg-gradient-to-t from-blue-500/10 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />
                            
                            {/* 3D Model Viewport */}
                            <div className="w-full h-[85vh] relative z-10 -mt-12 mask-image-gradient">
                                <AIViewport name="" status="online" />
                                
                                {/* Overlay Gradient for better integration */}
                                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0f1115] to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* RIGHT COLUMN - Accessories & Stats */}
                        <div className="col-span-3 flex flex-col pl-12 pt-20">
                            
                            {/* Accessories Slots */}
                            <div className="flex flex-col gap-10 mb-16">
                                <LoadoutSlot 
                                    label="Amulet" 
                                    side="right" 
                                    level={true}
                                    item={itemData[profile?.equipped?.armor?.head] || { name: "Traveler's Charm", icon: "https://cdn-icons-png.flaticon.com/512/4064/4064788.png" }}
                                />
                                <LoadoutSlot 
                                    label="Wristband" 
                                    side="right" 
                                    level={true}
                                    item={itemData[profile?.equipped?.armor?.gloves] || { name: "Leather Bracers", icon: "https://cdn-icons-png.flaticon.com/512/10096/10096238.png" }}
                                />
                                <LoadoutSlot 
                                    label="Brooch" 
                                    side="right" 
                                    level={true}
                                    item={itemData[profile?.equipped?.aspects?.[0]] || { name: "Iron Pin", icon: "https://cdn-icons-png.flaticon.com/512/2753/2753429.png" }}
                                />
                                <LoadoutSlot 
                                    label="Bane Ring" 
                                    side="right" 
                                    level={true}
                                    item={itemData[profile?.equipped?.aspects?.[1]] || { name: "Signet of Void", icon: "https://cdn-icons-png.flaticon.com/512/3015/3015504.png" }}
                                />
                            </div>

                            {/* Attributes Panel */}
                            <div className="mt-auto mb-12">
                                <h3 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-6 font-bold">Attributes</h3>
                                <div className="space-y-4 font-serif">
                                    {[
                                        { label: 'Strength', value: profile.attributes?.str || 30 },
                                        { label: 'Dexterity', value: profile.attributes?.dex || 33 },
                                        { label: 'Willpower', value: profile.attributes?.will || 36 },
                                        { label: 'Wisdom', value: profile.attributes?.int || 50 },
                                        { label: 'Wrath', value: 30 },
                                        { label: 'Vitality', value: 190 },
                                        { label: 'Persistence', value: 264 }
                                    ].map((stat) => (
                                        <div key={stat.label} className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                                            <span className="text-white/70 font-light group-hover:text-white transition-colors">{stat.label}</span>
                                            <span className="text-white font-bold tracking-widest">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10">
                                     <h3 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4 font-bold">Survivability</h3>
                                     <div className="space-y-4 font-serif">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/70 font-light">Health</span>
                                            <span className="text-white font-bold tracking-widest">290</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/70 font-light">Spirit</span>
                                            <span className="text-white font-bold tracking-widest">364</span>
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DragDropContext>
    );
}