import React from 'react';
import { ThemeBackground } from '@/components/shared/ThemeSystem';
import { Bot } from 'lucide-react';

export default function AIViewport({ name, status = 'online' }) {
    const statusColors = {
        online: 'bg-green-500',
        idle: 'bg-yellow-500',
        offline: 'bg-red-500',
    };

    return (
        <div className="relative w-full h-full min-h-[600px] bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center group">
            <div className="w-full h-full relative z-10">
                <iframe 
                    title="Sinestrea WAVE (AOV)" 
                    frameBorder="0" 
                    allowFullScreen 
                    mozallowfullscreen="true" 
                    webkitallowfullscreen="true" 
                    allow="autoplay; fullscreen; xr-spatial-tracking" 
                    xr-spatial-tracking="true" 
                    execution-while-out-of-viewport="true" 
                    execution-while-not-rendered="true" 
                    web-share="true" 
                    src="https://sketchfab.com/models/a6493956f268493c8e40db5bbbca140f/embed?autostart=1&ui_controls=0&ui_infos=0&ui_stop=0&ui_inspector=0&ui_hint=0"
                    className="w-full h-full"
                />
            </div>

            {/* Micro-Status Layers (Visible on Hover) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
            
            <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0 z-30">
                <div className="flex flex-col gap-2">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-cyan-400">
                        MODE: <span className="text-white">ADAPTIVE</span>
                    </div>
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-purple-400">
                        MEMORY: <span className="text-white">TACTICAL_CORE_V1</span>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-30">
                <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-md text-white flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`}></div>
                    <span className="font-semibold">{name}</span>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-xs text-white">
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Active Card</div>
                    <div className="flex items-center gap-2">
                        <Bot className="w-3 h-3 text-yellow-400" />
                        <span>Neural Link amplifier</span>
                    </div>
                </div>
            </div>
        </div>
    );
}