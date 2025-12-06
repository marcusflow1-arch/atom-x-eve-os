import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Zap, Cpu, Layers, ArrowRight, Loader2, Lightbulb, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UIGenerator from '@/components/ideals/UIGenerator';

export default function Ideals() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [step, setStep] = useState('idle'); // idle, processing, complete

    const generateIdeals = async () => {
        setLoading(true);
        setStep('processing');
        setData(null);
        setError(null);
        try {
            const res = await base44.functions.invoke('generateIdeals', {});
            if (res.data && !res.data.error) {
                setData(res.data);
                setStep('complete');
            } else {
                throw new Error(res.data?.error || "Failed to generate ideals");
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Communication with neural engines disrupted.");
            setStep('idle');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4"
                    >
                        <Brain className="w-4 h-4" />
                        <span className="text-sm font-medium">Multi-Model Intelligence System</span>
                    </motion.div>
                    
                    <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Atom XE Ideals Engine
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Harnessing the combined power of Gemini 3, ChatGPT-5, and Claude 4.5 to autonomously generate, refine, and evolve the Atom XE Operating System.
                    </p>
                </div>

                <Tabs defaultValue="ideals" className="w-full">
                    <div className="flex justify-center mb-8">
                        <TabsList className="bg-slate-900/50 p-1 rounded-full border border-slate-800">
                            <TabsTrigger value="ideals" className="rounded-full px-6 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Ideals Generator
                            </TabsTrigger>
                            <TabsTrigger value="ui" className="rounded-full px-6 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                                <ImageIcon className="w-4 h-4 mr-2" />
                                UI Design Generator
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="ideals" className="mt-0">
                        {/* Control Center */}
                        <div className="flex flex-col items-center gap-4">
                            <Button 
                                size="lg" 
                                onClick={generateIdeals} 
                                disabled={loading}
                                className="h-16 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 font-bold text-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                        Synthesizing Neural Pathways...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-6 h-6 mr-3 fill-current" />
                                        {data ? "Regenerate Ideals" : "Initiate Ideals Generation"}
                                    </>
                                )}
                            </Button>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30 text-sm font-medium"
                                >
                                    Error: {error}
                                </motion.div>
                            )}
                        </div>

                        {/* Results Area */}
                        <AnimatePresence>
                            {data && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-12 mt-12"
                                >
                                    {/* Source Engines Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Gemini */}
                                        <SourceCard 
                                            title="Gemini 3" 
                                            icon={<Cpu className="w-6 h-6 text-blue-400" />}
                                            color="blue"
                                            description="Ecosystem & Integration"
                                            ideas={data.sources.gemini}
                                            delay={0.1}
                                        />
                                        {/* ChatGPT */}
                                        <SourceCard 
                                            title="ChatGPT-5" 
                                            icon={<Sparkles className="w-6 h-6 text-green-400" />}
                                            color="green"
                                            description="Creativity & Social"
                                            ideas={data.sources.chatgpt}
                                            delay={0.2}
                                        />
                                        {/* Claude */}
                                        <SourceCard 
                                            title="Claude 4.5" 
                                            icon={<Layers className="w-6 h-6 text-orange-400" />}
                                            color="orange"
                                            description="Architecture & Utility"
                                            ideas={data.sources.claude}
                                            delay={0.3}
                                        />
                                    </div>

                                    {/* Synthesis Connector */}
                                    <div className="flex justify-center items-center gap-4 opacity-50">
                                        <div className="h-12 w-px bg-gradient-to-b from-transparent via-slate-500 to-slate-500" />
                                        <div className="px-4 py-1 rounded-full border border-slate-700 bg-slate-900 text-xs text-slate-400">
                                            Merging Neural Streams
                                        </div>
                                        <div className="h-12 w-px bg-gradient-to-b from-transparent via-slate-500 to-slate-500" />
                                    </div>

                                    {/* Unified Output */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <div className="bg-slate-900/50 border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
                                            
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
                                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
                                                        <Brain className="w-7 h-7 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-white">Unified Intelligence Output</h2>
                                                        <p className="text-slate-400">Synthesized, refined, and scored high-impact ideals.</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                                    {data.result.map((ideal, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: 0.6 + (idx * 0.05) }}
                                                            className="group p-5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all cursor-default"
                                                        >
                                                            <div className="flex justify-between items-start mb-3">
                                                                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                                                                    {ideal.origin}
                                                                </Badge>
                                                                {ideal.score && (
                                                                    <span className="text-xs font-mono text-green-400 font-bold">
                                                                        SCORE: {ideal.score}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                                                                {ideal.title}
                                                            </h3>
                                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                                {ideal.description}
                                                            </p>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </TabsContent>

                    <TabsContent value="ui" className="mt-0">
                        <UIGenerator />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function SourceCard({ title, icon, color, description, ideas, delay }) {
    const colorStyles = {
        blue: "border-blue-500/20 bg-blue-500/5 text-blue-400",
        green: "border-green-500/20 bg-green-500/5 text-green-400",
        orange: "border-orange-500/20 bg-orange-500/5 text-orange-400"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`rounded-2xl border p-6 ${colorStyles[color]} backdrop-blur-sm`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-slate-950/50 border border-white/10">
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-white">{title}</h3>
                    <p className="text-xs opacity-70">{description}</p>
                </div>
            </div>
            
            <div className="space-y-3">
                {ideas?.slice(0, 3).map((idea, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-950/30 border border-white/5 text-sm">
                        <div className="font-medium text-white mb-1 truncate">{idea.title}</div>
                        <div className="text-xs opacity-60 line-clamp-2">{idea.description}</div>
                    </div>
                ))}
                {ideas?.length > 3 && (
                    <div className="text-center text-xs opacity-50 pt-2">
                        + {ideas.length - 3} more raw ideas
                    </div>
                )}
            </div>
        </motion.div>
    );
}