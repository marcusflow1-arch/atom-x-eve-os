import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Coins, Gem, Star, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Clock, Users, Trophy, Target } from 'lucide-react';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import ClanInventoryGrid from './ClanInventoryGrid';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function ClanTreasuryPage({ clan }) {
    const [tab, setTab] = React.useState('overview');
    // Mock treasury data
    const clanResources = { 
        gold: 14500, 
        gems: 320, 
        influence: clan?.reputation || 850,
        weeklyChange: { gold: 1200, gems: 45, influence: 30 }
    };

    const mockTransactions = [
        { id: 1, type: 'income', category: 'Raid Reward', amount: 500, currency: 'gold', date: new Date(Date.now() - 3600000), user: 'ShadowBlade' },
        { id: 2, type: 'expense', category: 'Clan Upgrade', amount: 200, currency: 'gems', date: new Date(Date.now() - 7200000), user: 'Leader' },
        { id: 3, type: 'income', category: 'Tournament Prize', amount: 50, currency: 'influence', date: new Date(Date.now() - 86400000), user: 'NightHawk' },
        { id: 4, type: 'income', category: 'Weekly Contribution', amount: 1000, currency: 'gold', date: new Date(Date.now() - 172800000), user: 'Multiple' },
        { id: 5, type: 'expense', category: 'Event Hosting', amount: 300, currency: 'gold', date: new Date(Date.now() - 259200000), user: 'Officer' },
        { id: 6, type: 'income', category: 'PvP Season Rewards', amount: 100, currency: 'gems', date: new Date(Date.now() - 345600000), user: 'CrimsonWolf' },
    ];

    const topContributors = [
        { name: 'ShadowBlade', contribution: 2500, rank: 1 },
        { name: 'NightHawk', contribution: 1800, rank: 2 },
        { name: 'CrimsonWolf', contribution: 1200, rank: 3 },
        { name: 'PhantomX', contribution: 950, rank: 4 },
        { name: 'BladeRunner', contribution: 720, rank: 5 },
    ];

    const getCurrencyIcon = (currency) => {
        switch(currency) {
            case 'gold': return <Coins className="w-4 h-4 text-yellow-400" />;
            case 'gems': return <Gem className="w-4 h-4 text-purple-400" />;
            case 'influence': return <Star className="w-4 h-4 text-blue-400" />;
            default: return <Coins className="w-4 h-4" />;
        }
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-6">
            <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setTab('overview')}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${tab === 'overview' ? 'bg-white/15 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setTab('inventory')}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${tab === 'inventory' ? 'bg-white/15 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
                >
                  Inventory
                </button>
            </div>
            {tab === 'overview' && (<>
            {/* Resource Cards */}
            <div className="grid grid-cols-3 gap-4">
                <LiquidGlassCard className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Gold Reserve</p>
                            <p className="text-3xl font-bold text-white">{clanResources.gold.toLocaleString()}</p>
                            <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
                                <TrendingUp className="w-4 h-4" />
                                <span>+{clanResources.weeklyChange.gold} this week</span>
                            </div>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                            <Coins className="w-7 h-7 text-yellow-400" />
                        </div>
                    </div>
                </LiquidGlassCard>

                <LiquidGlassCard className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Ether Crystals</p>
                            <p className="text-3xl font-bold text-white">{clanResources.gems}</p>
                            <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
                                <TrendingUp className="w-4 h-4" />
                                <span>+{clanResources.weeklyChange.gems} this week</span>
                            </div>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                            <Gem className="w-7 h-7 text-purple-400" />
                        </div>
                    </div>
                </LiquidGlassCard>

                <LiquidGlassCard className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Reputation</p>
                            <p className="text-3xl font-bold text-white">{clanResources.influence}</p>
                            <div className="flex items-center gap-1 mt-2 text-green-400 text-sm">
                                <TrendingUp className="w-4 h-4" />
                                <span>+{clanResources.weeklyChange.influence} this week</span>
                            </div>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                            <Star className="w-7 h-7 text-blue-400" />
                        </div>
                    </div>
                </LiquidGlassCard>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3 gap-4">
                {/* Transactions - Takes 2 columns */}
                <LiquidGlassCard className="col-span-2 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-cyan-400" /> Recent Transactions
                    </h3>
                    <div className="space-y-3">
                        {mockTransactions.map((tx) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                                    }`}>
                                        {tx.type === 'income' ? (
                                            <ArrowUpRight className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <ArrowDownRight className="w-5 h-5 text-red-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{tx.category}</p>
                                        <p className="text-xs text-white/40">by {tx.user} • {format(tx.date, 'MMM d, h:mm a')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getCurrencyIcon(tx.currency)}
                                    <span className={`font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                        {tx.type === 'income' ? '+' : '-'}{tx.amount}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </LiquidGlassCard>

                {/* Top Contributors */}
                <LiquidGlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" /> Top Contributors
                    </h3>
                    <div className="space-y-3">
                        {topContributors.map((contributor, index) => (
                            <div
                                key={contributor.name}
                                className="flex items-center gap-3 p-2 rounded-lg"
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    index === 0 ? 'bg-yellow-500/30 text-yellow-400' :
                                    index === 1 ? 'bg-slate-400/30 text-slate-300' :
                                    index === 2 ? 'bg-amber-600/30 text-amber-500' :
                                    'bg-white/10 text-white/60'
                                }`}>
                                    {contributor.rank}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{contributor.name}</p>
                                </div>
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <Coins className="w-3 h-3" />
                                    <span className="text-sm font-bold">{contributor.contribution}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </LiquidGlassCard>
            </div>
            </>)}}
            {tab === 'inventory' && (
              <ClanInventoryGrid />
            )}
        </div>
    );
}