import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, StopCircle, Radio, Camera, Mic } from 'lucide-react';
import StreamChatPanel from './StreamChatPanel';

export default function StreamAffiliateTab({ gameId, onStreamToggle }) {
    const [isStreaming, setIsStreaming] = useState(false);

    const handleToggleStream = () => {
        const newStreamingState = !isStreaming;
        setIsStreaming(newStreamingState);
        onStreamToggle(newStreamingState);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
            {/* Stream Preview and Controls */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex-grow bg-black rounded-xl border-2 border-slate-700 flex items-center justify-center relative aspect-video">
                    {isStreaming ? (
                        <>
                            <img src="https://images.unsplash.com/photo-1542751371-331572b78519?w=1280&h=720&fit=crop" alt="Live Stream" className="w-full h-full object-cover"/>
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-md text-sm font-bold">
                                <Radio className="w-4 h-4 animate-pulse" />
                                LIVE
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-slate-500">
                            <Camera className="w-16 h-16 mx-auto mb-4" />
                            <h3 className="text-xl font-bold">Stream Offline</h3>
                            <p>Press 'Start Streaming' to go live.</p>
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0">
                    <Button 
                        size="lg" 
                        onClick={handleToggleStream} 
                        className={`w-full font-bold ${isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isStreaming ? (
                            <><StopCircle className="w-5 h-5 mr-2" /> Stop Streaming</>
                        ) : (
                            <><Play className="w-5 h-5 mr-2" /> Start Streaming</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Chat Panel */}
            <div className="lg:col-span-1 h-full">
                <StreamChatPanel />
            </div>
        </div>
    );
}