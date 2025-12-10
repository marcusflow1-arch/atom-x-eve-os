import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Gem, Archive, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ClanVault() {
    // Mock Data
    const vaultTabs = ["General", "Raid Supplies", "Crafting", "Officer's Cache"];
    const [activeTab, setActiveTab] = React.useState("General");

    const items = Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        name: `Ancient Artifact ${i + 1}`,
        rarity: ['Common', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 4)],
        quantity: Math.floor(Math.random() * 100) + 1,
        icon: `https://api.dicebear.com/7.x/shapes/svg?seed=${i}`
    }));

    const rarityColors = {
        Common: 'border-slate-600 bg-slate-800/50 text-slate-300',
        Rare: 'border-blue-500/50 bg-blue-900/20 text-blue-300',
        Epic: 'border-purple-500/50 bg-purple-900/20 text-purple-300',
        Legendary: 'border-orange-500/50 bg-orange-900/20 text-orange-300',
    };

    return (
        <div className="flex-1 p-8 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Archive className="w-8 h-8 text-yellow-500" /> Guild Vault
                    </h1>
                    <p className="text-white/40 mt-1">Manage communal resources and spoils of war.</p>
                </div>
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="font-mono font-bold text-white text-lg">1,240,500</span>
                        <span className="text-xs text-white/40 uppercase font-bold">Gold</span>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Gem className="w-4 h-4 text-purple-400" />
                        <span className="font-mono font-bold text-white text-lg">450</span>
                        <span className="text-xs text-white/40 uppercase font-bold">Gems</span>
                    </div>
                </div>
            </div>

            {/* Vault Container */}
            <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-black/20">
                    {vaultTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab 
                                    ? 'bg-white/10 text-white shadow-lg' 
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                    <div className="ml-auto flex items-center gap-2 px-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input 
                                placeholder="Search vault..." 
                                className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 w-48"
                            />
                        </div>
                        <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {items.map(item => (
                            <motion.div
                                key={item.id}
                                whileHover={{ scale: 1.02, y: -2 }}
                                className={`relative aspect-square rounded-2xl border ${rarityColors[item.rarity].split(' ')[0]} bg-gradient-to-br from-white/5 to-white/[0.02] p-3 flex flex-col items-center justify-center gap-2 cursor-pointer group`}
                            >
                                <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold border ${rarityColors[item.rarity]}`}>
                                    {item.quantity}x
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-black/40 shadow-inner flex items-center justify-center">
                                    <Archive className="w-6 h-6 text-white/20 group-hover:text-white/60 transition-colors" />
                                </div>
                                <div className="text-center w-full px-1">
                                    <div className="text-xs font-bold text-white truncate">{item.name}</div>
                                    <div className={`text-[10px] uppercase tracking-wider ${item.rarity === 'Legendary' ? 'text-orange-400' : 'text-white/30'}`}>
                                        {item.rarity}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {/* Empty Slots */}
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square rounded-2xl border border-white/5 bg-black/10 flex items-center justify-center">
                                <div className="w-8 h-8 text-white/5">
                                    <PlusIcon className="w-full h-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Footer Controls */}
                <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center text-xs text-white/40 font-mono">
                    <div>
                        Capacity: 24/100 Slots
                    </div>
                    <div className="flex gap-4">
                        <button className="hover:text-white transition-colors">View Logs</button>
                        <button className="hover:text-white transition-colors">Permissions</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const PlusIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);