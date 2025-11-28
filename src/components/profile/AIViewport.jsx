import React from 'react';
import { motion } from 'framer-motion';

export default function AIViewport({ name, status = 'online' }) {
    const statusColors = {
        online: 'bg-green-500',
        idle: 'bg-yellow-500',
        offline: 'bg-red-500',
    };

    return (
        <div className="relative w-full h-full min-h-[600px] bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
            {/* 3D Model Embed */}
            <div className="sketchfab-embed-wrapper w-full h-full">
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
                >
                </iframe>
            </div>

            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-md text-white flex items-center gap-2 z-10">
                <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`}></div>
                <span className="font-semibold">{name}</span>
            </div>
        </div>
    );
}