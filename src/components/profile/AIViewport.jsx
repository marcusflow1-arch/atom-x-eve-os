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
        <div className="relative w-full h-full min-h-[600px] flex items-center justify-center overflow-hidden">
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

            {/* Name tag removed for cleaner UI */}
        </div>
    );
}