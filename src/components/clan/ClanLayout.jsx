import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ClanLayout({ 
    children, 
    activeClanId, 
    onSelectClan, 
    onCreateClan,
    userMemberships 
}) {
    return (
        <div className="flex h-screen w-full bg-[#0f1419] overflow-hidden text-white font-sans relative pt-28">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
            </div>

            {/* 1. Division Sidebar (Left) */}
            <div className="w-[72px] flex-shrink-0 flex flex-col items-center py-6 gap-4 z-20 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl">
                {/* Home/Dashboard Link - Optional */}
                
                <div className="w-10 h-0.5 bg-white/10 rounded-full my-2" />

                {/* Clan List */}
                <div className="flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto custom-scrollbar px-2">
                    {userMemberships?.map((membership) => (
                        <TooltipProvider key={membership.divisionId}>
                            <Tooltip>
                                <TooltipTrigger>
                                    <button
                                        onClick={() => onSelectClan(membership.divisionId)}
                                        className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                            activeClanId === membership.divisionId 
                                                ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)] text-white' 
                                                : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
                                        }`}
                                    >
                                        {/* Active Indicator */}
                                        {activeClanId === membership.divisionId && (
                                            <motion.div 
                                                layoutId="activeIndicator"
                                                className="absolute -left-3 w-1 h-8 bg-white rounded-r-full"
                                            />
                                        )}
                                        
                                        {membership.icon ? (
                                            <img src={membership.icon} className="w-full h-full object-cover rounded-2xl" />
                                        ) : (
                                            <Shield className="w-6 h-6" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-slate-900 border-white/10 text-white">
                                    <p>{membership.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}

                    {/* Create New */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <button
                                    onClick={onCreateClan}
                                    className="w-12 h-12 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/40 transition-all"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-slate-900 border-white/10 text-white">
                                <p>Initialize New Division</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-900/30 backdrop-blur-sm">
                {children}
            </div>
        </div>
    );
}