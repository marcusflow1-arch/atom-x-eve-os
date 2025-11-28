import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    ChevronLeft, Trophy, FileText, Star, Gamepad2, 
    Users, Calendar, MapPin, Activity, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

// Reusing DualPost logic would be ideal, but keeping it self-contained for now or we can export DualPost
// Importing DualPost from SocialHub (assuming it's exported or we redefine a simpler version)
// To be safe, I'll create a simple version of the feed item here.

const MemoryCard = ({ memory }) => (
    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    {memory.user_id?.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-slate-300 text-sm font-medium">User {memory.user_id?.substring(0, 8)}</span>
            </div>
            <span className="text-slate-500 text-xs">{new Date(memory.created_date).toLocaleDateString()}</span>
        </div>
        <h3 className="text-white font-bold mb-2">{memory.title}</h3>
        <p className="text-slate-300 text-sm mb-3">{memory.description}</p>
        {memory.media_url && (
             <img src={memory.media_url} alt="Memory" className="w-full rounded-lg mb-3" />
        )}
        {memory.ai_analysis && (
            <div className="bg-slate-900/50 rounded p-3 border border-slate-700">
                <p className="text-blue-400 text-xs font-bold mb-1">AI ANALYSIS</p>
                <p className="text-slate-300 text-sm italic">"{memory.ai_analysis.message || memory.ai_analysis.summary}"</p>
            </div>
        )}
    </div>
);

const ContractCard = ({ contract }) => (
    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 mb-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-white font-bold">{contract.role} Contract</h3>
                <p className="text-slate-400 text-xs">Posted by {contract.creator_id?.substring(0, 8)}</p>
            </div>
            <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                {contract.status}
            </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-900/50 p-2 rounded">
                <span className="text-slate-500 text-xs block">Tokens</span>
                <span className="text-yellow-400 font-mono">{contract.tokens}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded">
                <span className="text-slate-500 text-xs block">Duration</span>
                <span className="text-slate-300">{contract.duration}</span>
            </div>
        </div>
        <p className="text-slate-300 text-sm">{contract.description}</p>
        <Button size="sm" className="w-full mt-2">View Details</Button>
    </div>
);

export default function GameProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameTitle = urlParams.get('game');

    // Fetch Game Info
    const { data: gameData } = useQuery({
        queryKey: ['game', gameTitle],
        queryFn: async () => {
            const res = await base44.entities.Game.list(null, 100);
            return res.data.find(g => g.title === gameTitle);
        },
        enabled: !!gameTitle
    });

    // Fetch Memories
    const { data: memories } = useQuery({
        queryKey: ['gameMemories', gameTitle],
        queryFn: async () => {
            // Using simple list and filter. Ideally SDK supports filtering by field.
            const res = await base44.entities.Memory.list('-created_date', 100);
            return res.data.filter(m => m.game_name === gameTitle);
        },
        enabled: !!gameTitle
    });

    // Fetch Contracts
    const { data: contracts } = useQuery({
        queryKey: ['gameContracts', gameTitle],
        queryFn: async () => {
            const res = await base44.entities.Contract.list('-created_date', 100);
            return res.data.filter(c => c.game_name === gameTitle);
        },
        enabled: !!gameTitle
    });

    if (!gameTitle) return <div className="p-10 text-center text-slate-400">Game not found</div>;

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Hero Section */}
            <div className="h-64 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900 z-10" />
                {gameData?.cover_image ? (
                    <img src={gameData.cover_image} alt={gameTitle} className="w-full h-full object-cover opacity-50" />
                ) : (
                    <div className="w-full h-full bg-slate-800" />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 max-w-7xl mx-auto">
                    <Link 
                        to={createPageUrl('GameIndex')} 
                        className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Index
                    </Link>
                    <div className="flex items-end justify-between">
                        <h1 className="text-4xl font-black text-white tracking-tight">{gameTitle}</h1>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2">
                                <Share2 className="w-4 h-4" /> Share
                            </Button>
                            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                                <Users className="w-4 h-4" /> Join Hub
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Stats & Info */}
                <div className="space-y-6">
                    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            Game Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <Trophy className="w-4 h-4" /> Memories
                                </span>
                                <span className="text-white font-bold">{memories?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Contracts
                                </span>
                                <span className="text-white font-bold">{contracts?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <Star className="w-4 h-4" /> Community Rating
                                </span>
                                <span className="text-yellow-400 font-bold">4.5/5.0</span>
                            </div>
                        </div>
                    </div>

                    {gameData?.description && (
                        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6">
                            <h3 className="text-lg font-bold text-white mb-3">About</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {gameData.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column - Content Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="memories">
                        <TabsList className="bg-slate-800/50 border border-slate-700 mb-6">
                            <TabsTrigger value="memories" className="gap-2">
                                <Trophy className="w-4 h-4" /> Memories
                            </TabsTrigger>
                            <TabsTrigger value="contracts" className="gap-2">
                                <FileText className="w-4 h-4" /> Contracts
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="memories" className="space-y-4">
                            {memories?.length > 0 ? (
                                memories.map(memory => (
                                    <MemoryCard key={memory.id} memory={memory} />
                                ))
                            ) : (
                                <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-slate-700/50 border-dashed">
                                    <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <h3 className="text-white font-medium">No memories yet</h3>
                                    <p className="text-slate-400 text-sm">Be the first to share a memory for {gameTitle}!</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="contracts" className="space-y-4">
                            {contracts?.length > 0 ? (
                                contracts.map(contract => (
                                    <ContractCard key={contract.id} contract={contract} />
                                ))
                            ) : (
                                <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-slate-700/50 border-dashed">
                                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <h3 className="text-white font-medium">No active contracts</h3>
                                    <p className="text-slate-400 text-sm">Check back later or post your own.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}