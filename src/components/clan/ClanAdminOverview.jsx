import React, { useState } from 'react';
import { Shield, Zap, ClipboardList, TrendingUp } from 'lucide-react';
import ClanTreasuryPage from '@/components/clan/ClanTreasuryPage';
import ClanSchedulePage from '@/components/clan/ClanSchedulePage';
import ClanUpgradesPage from '@/components/clan/ClanUpgradesPage';

export default function ClanAdminOverview({ clan }) {
    const [activeTab, setActiveTab] = useState('treasury');

    return (
        <div className="absolute inset-0 flex flex-col">
            <div className="h-20 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center px-8 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">Admin Overview</h2>
                        <div className="text-xs font-bold text-white/50 uppercase tracking-wider">Guild Master & Officers Only</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => setActiveTab('treasury')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === 'treasury'
                            ? 'bg-white/10 text-amber-400'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <Zap className="w-4 h-4" /> Treasury
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === 'schedule'
                            ? 'bg-white/10 text-blue-400'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <ClipboardList className="w-4 h-4" /> Schedule
                    </button>
                    <button
                        onClick={() => setActiveTab('upgrades')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === 'upgrades'
                            ? 'bg-white/10 text-emerald-400'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4" /> Upgrades
                    </button>
                </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-black/20">
                {activeTab === 'treasury' && <ClanTreasuryPage clan={clan} />}
                {activeTab === 'schedule' && <ClanSchedulePage clan={clan} />}
                {activeTab === 'upgrades' && <ClanUpgradesPage clan={clan} />}
            </div>
        </div>
    );
}