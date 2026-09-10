import React from 'react';
import { Shield, Crown, Users, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClanUpgradesPage({ clan }) {
    return (
        <div className="flex h-full bg-[#0A0D14]">
            {/* Left Side - Environments */}
            <div className="w-[300px] border-r border-white/5 flex flex-col">
                <div className="p-6 pb-2">
                    <div className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-4">Stronghold Environments</div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 space-y-2">
                    <button 
                        className="w-full relative rounded-2xl overflow-hidden group text-left border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        onClick={() => window.dispatchEvent(new CustomEvent('changeStrongholdEnv', { detail: 'virtual_room_7.glb' }))}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10" />
                        <img src="https://images.unsplash.com/photo-1515630278258-407f66498911?w=400&q=80" alt="Room 7" className="w-full h-[100px] object-cover" />
                        <div className="absolute bottom-0 left-0 p-3 z-20 w-full">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white">Room 7</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full w-full overflow-hidden">
                                <div className="h-full bg-cyan-400 w-[92%]" />
                            </div>
                            <div className="text-[9px] text-white/40 mt-1 uppercase tracking-wider">Level 1 • 4617 / 5000 XP</div>
                        </div>
                    </button>

                    <button 
                        className="w-full relative rounded-2xl overflow-hidden group text-left border-2 border-transparent hover:border-white/10"
                        onClick={() => window.dispatchEvent(new CustomEvent('changeStrongholdEnv', { detail: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx' }))}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10" />
                        <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80" alt="Hangar" className="w-full h-[100px] object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 p-3 z-20 w-full">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white">Base Hangar</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full w-full overflow-hidden">
                                <div className="h-full bg-white/20 w-[45%]" />
                            </div>
                            <div className="text-[9px] text-white/40 mt-1 uppercase tracking-wider">Level 2</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Middle Content - Upgrade Tree */}
            <div className="flex-1 flex flex-col border-r border-white/5">
                <div className="px-10 py-6 border-b border-white/5 flex items-end justify-between bg-black/20">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-cyan-400" />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-widest">Room 7</h2>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                            <span className="text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">Level 1</span>
                            <span className="text-white/40">4617 / 5000 XP</span>
                        </div>
                    </div>
                    <div className="flex gap-8 text-right">
                        <div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Capacity</div>
                            <div className="text-xl font-bold text-white">8/10</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-amber-500/60 uppercase tracking-widest mb-1">Energy</div>
                            <div className="text-xl font-bold text-amber-400">450/500</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Slots</div>
                            <div className="text-xl font-bold text-white">3/5</div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-10 overflow-y-auto">
                    <div className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-6 flex items-center gap-2">
                        <Settings className="w-3 h-3" /> Facility Upgrades
                    </div>

                    <div className="flex gap-10 h-full">
                        {/* Categories */}
                        <div className="w-[240px] space-y-2">
                            <button className="w-full text-left px-5 py-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-sm tracking-wider flex items-center gap-3">
                                <Crown className="w-4 h-4" /> Command Center
                            </button>
                            <button className="w-full text-left px-5 py-4 rounded-xl hover:bg-white/5 border border-transparent text-white/50 hover:text-white font-bold text-sm tracking-wider flex items-center gap-3 transition-colors">
                                <Shield className="w-4 h-4" /> Armory
                            </button>
                            <button className="w-full text-left px-5 py-4 rounded-xl hover:bg-white/5 border border-transparent text-white/50 hover:text-white font-bold text-sm tracking-wider flex items-center gap-3 transition-colors">
                                <Users className="w-4 h-4" /> Barracks
                            </button>
                            <button className="w-full text-left px-5 py-4 rounded-xl hover:bg-white/5 border border-transparent text-white/50 hover:text-white font-bold text-sm tracking-wider flex items-center gap-3 transition-colors">
                                <Zap className="w-4 h-4" /> Power Grid
                            </button>
                        </div>

                        {/* Upgrades */}
                        <div className="flex-1 space-y-3">
                            <div className="bg-[#1A1F2A] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                    <span className="font-bold text-white tracking-wide text-sm">Expand Command Desk</span>
                                </div>
                                <div className="text-xs font-bold text-white/40">Tier 1 • Active</div>
                            </div>
                            
                            <div className="bg-[#1A1F2A] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                    <span className="font-bold text-white tracking-wide text-sm">Holographic Tactical Map</span>
                                </div>
                                <div className="text-xs font-bold text-white/40">Tier 2 • Active</div>
                            </div>

                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center justify-between opacity-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-white/20" />
                                    <span className="font-bold text-white tracking-wide text-sm">Advanced Communications Array</span>
                                </div>
                                <div className="text-xs font-bold text-white/20">Tier 3 • Locked</div>
                            </div>
                            
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center justify-between opacity-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-white/20" />
                                    <span className="font-bold text-white tracking-wide text-sm">AI Strategic Advisor</span>
                                </div>
                                <div className="text-xs font-bold text-white/20">Tier 4 • Locked</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Preview & Active Modules */}
            <div className="w-[380px] bg-black/40 flex flex-col">
                <div className="p-6 flex items-center gap-2 text-xs font-bold text-green-400 uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Preview
                </div>
                
                <div className="flex-1 relative flex items-center justify-center">
                    {/* Mockup crosshair for preview */}
                    <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center absolute">
                        <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <Button className="w-full bg-white hover:bg-white/90 text-black font-bold h-12 text-sm tracking-widest rounded-xl">
                        ENTER STRONGHOLD
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/5 font-bold h-12 text-sm tracking-widest rounded-xl">
                        EDIT MODE
                    </Button>
                </div>
            </div>
        </div>
    );
}