import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Wifi, Radio, Box, ArrowLeft, Filter, Archive } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Mock empty state vs populated state logic
const HAS_UPDATES = false; // Toggle this to true to see populated state

const updates = [
    // Populated data would go here
    // { id: 1, title: 'System Update 2.0', date: 'Today', type: 'System', content: '...' }
];

export default function Notifications() {
  const [filter, setFilter] = useState('All');

  return (
    <div className="min-h-screen w-full bg-[#0f1419] relative overflow-hidden text-white font-sans selection:bg-cyan-500/30">
        {/* Dynamic Background */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        {/* Header Zone */}
        <header className="relative z-10 px-8 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-4">
                <Link to={createPageUrl('LunaTemplate')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10 group">
                    <ArrowLeft className="w-5 h-5 text-white/60 group-hover:text-white" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-wide flex items-center gap-3">
                        <Radio className="w-6 h-6 text-cyan-400" />
                        System Updates
                    </h1>
                    <p className="text-white/40 text-xs font-mono tracking-widest mt-1">CONSOLE VERSION 2.4.0 • ONLINE</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5" />
                    Filters
                </button>
                <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                    <Archive className="w-3.5 h-3.5" />
                    Archive
                </button>
            </div>
        </header>

        {/* Main Content Frame (XY Grid) */}
        <main className="relative z-10 p-8 max-w-7xl mx-auto">
            {HAS_UPDATES ? (
                /* Populated State (Future) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Updates would render here */}
                </div>
            ) : (
                /* Empty State / Placeholder UI */
                <div className="w-full flex flex-col items-center justify-center min-h-[60vh] relative">
                    
                    {/* XY Grid Lines Decoration */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent dashed" />
                        <div className="absolute right-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent dashed" />
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent dashed" />
                        <div className="absolute bottom-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent dashed" />
                    </div>

                    {/* Empty State Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 w-full max-w-md p-8 rounded-2xl border border-white/10 text-center backdrop-blur-xl"
                        style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 relative">
                            <Wifi className="w-8 h-8 text-white/20" />
                            <div className="absolute inset-0 rounded-full border border-white/5 animate-ping opacity-20" />
                        </div>
                        
                        <h2 className="text-xl font-bold text-white mb-2">No System Updates Yet</h2>
                        <p className="text-white/50 text-sm leading-relaxed mb-6">
                            This space will automatically populate when new announcements, patch notes, or platform alerts are released.
                        </p>

                        <div className="flex justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
                            <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse delay-150" />
                            <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse delay-300" />
                        </div>
                    </motion.div>

                    {/* Skeleton / Ghost Placeholders in Background */}
                    <div className="absolute top-10 left-10 w-64 h-32 rounded-xl border border-white/5 bg-white/[0.01] blur-sm opacity-50" />
                    <div className="absolute bottom-20 right-20 w-80 h-40 rounded-xl border border-white/5 bg-white/[0.01] blur-sm opacity-50" />
                </div>
            )}
        </main>
    </div>
  );
}