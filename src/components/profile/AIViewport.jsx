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
        <div className="relative w-full h-full min-h-[600px] bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
            {/* Matrix "String Code" Effect */}
            <div className="w-full h-full relative z-10 bg-black/50">
                <ThemeBackground themeId="digital_matrix" />
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-green-500 font-mono text-xs mb-2 tracking-widest">SYSTEM INITIALIZED</div>
                        <Bot className="w-16 h-16 text-green-400 mx-auto opacity-80 animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-md text-white flex items-center gap-2 z-10">
                <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`}></div>
                <span className="font-semibold">{name}</span>
            </div>
        </div>
    );
}