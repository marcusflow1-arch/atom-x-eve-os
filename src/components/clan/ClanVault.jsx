import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Gem, Archive, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ClanVault() {
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
        Common: 'border-slate-200 bg-slate-50 text-slate-600',
        Rare: 'border-blue-200 bg-blue-50 text-blue-600',
        Epic: 'border-purple-200 bg-purple-50 text-purple-600',
        Legendary: 'border-orange-200 bg-orange-50 text-orange-600',
    };

    return (
        <div className="flex-1 p-8 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Archive className="w-8 h-8 text-amber-500" /> Guild Vault
                    </h1>
                    <p className="text-slate-500 mt-1">Manage communal resources and spoils of war.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/40 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-amber-500" />
                        <span className="font-mono font-bold text-slate-700 text-lg">1,240,500</span>
                        <span className="text-xs text-slate-400 uppercase font-bold">Gold</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <Gem className="w-4 h-4 text-purple-500" />
                        <span className="font-mono font-bold text-slate-700 text-lg">450</span>
                        <span className="text-xs text-slate-400 uppercase font-bold">Gems</span>
                    </div>
                </div>
            </div>

            {/* Vault Container */}
            <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl overflow-hidden flex flex-col shadow-sm">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-white/40">
                    {vaultTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab 
                                    ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-100' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                    <div className="ml-auto flex items-center gap-2 px-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                placeholder="Search vault..." 
                                className="bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 w-48 shadow-sm"
                            />
                        </div>
                        <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
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
                                className={`relative aspect-square rounded-2xl border ${rarityColors[item.rarity].split(' ')[0]} bg-white/80 p-3 flex flex-col items-center justify-center gap-2 cursor-pointer group shadow-sm hover:shadow-md transition-all`}
                            >
                                <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold border ${rarityColors[item.rarity]}`}>
                                    {item.quantity}x
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:border-blue-200 transition-colors">
                                    <Archive className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <div className="text-center w-full px-1">
                                    <div className="text-xs font-bold text-slate-700 truncate">{item.name}</div>
                                    <div className={`text-[10px] uppercase tracking-wider font-semibold mt-1 ${
                                        item.rarity === 'Legendary' ? 'text-orange-500' : 
                                        item.rarity === 'Epic' ? 'text-purple-500' :
                                        item.rarity === 'Rare' ? 'text-blue-500' : 'text-slate-400'
                                    }`}>
                                        {item.rarity}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {/* Empty Slots */}
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center">
                                <div className="w-8 h-8 text-slate-200">
                                    <PlusIcon className="w-full h-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Footer Controls */}
                <div className="p-4 border-t border-slate-200 bg-white/60 flex justify-between items-center text-xs text-slate-500 font-mono">
                    <div>
                        Capacity: 24/100 Slots
                    </div>
                    <div className="flex gap-4 font-sans font-bold">
                        <button className="hover:text-blue-600 transition-colors">View Logs</button>
                        <button className="hover:text-blue-600 transition-colors">Permissions</button>
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