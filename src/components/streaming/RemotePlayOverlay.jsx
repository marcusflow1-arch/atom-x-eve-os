import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, Settings, Wifi, WifiOff, Activity, Gamepad2, Monitor, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

export default function RemotePlayOverlay({ game, session, onClose }) {
    const [status, setStatus] = useState('initializing'); // initializing, connecting, active, weak_signal
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [streamStats, setStreamStats] = useState({ fps: 0, latency: 0, bitrate: 0 });
    const [settings, setSettings] = useState(session?.quality_settings || { resolution: '1080p', framerate: 60, bitrate_mbps: 10 });
    
    const containerRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    // Simulate connection sequence
    useEffect(() => {
        const timers = [];
        timers.push(setTimeout(() => setStatus('connecting'), 1000));
        timers.push(setTimeout(() => setStatus('active'), 3000));
        
        return () => timers.forEach(clearTimeout);
    }, []);

    // Simulate live stats
    useEffect(() => {
        if (status !== 'active') return;

        const interval = setInterval(() => {
            setStreamStats({
                fps: Math.max(58, Math.min(61, settings.framerate + (Math.random() - 0.5) * 2)).toFixed(0),
                latency: Math.max(15, Math.min(25, 20 + (Math.random() - 0.5) * 5)).toFixed(1),
                bitrate: Math.max(settings.bitrate_mbps - 1, Math.min(settings.bitrate_mbps + 1, settings.bitrate_mbps + (Math.random() - 0.5))).toFixed(1)
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [status, settings]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => console.error(err));
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
            ref={containerRef}
            onMouseMove={handleMouseMove}
        >
            {/* Game Stream Area (Simulated) */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden group">
                {status === 'active' ? (
                    <>
                        {/* Simulated Game Content (using trailer/image) */}
                         <div className="absolute inset-0">
                            {game.trailer_url && game.trailer_url.includes('mp4') ? (
                                <video 
                                    src={game.trailer_url} 
                                    autoPlay 
                                    loop 
                                    muted 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img 
                                    src={game.cover_image || game.cover} 
                                    alt="Game Stream" 
                                    className="w-full h-full object-cover opacity-80"
                                />
                            )}
                             {/* Scanlines / Stream Artifacts Effect */}
                             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-white space-y-4 z-10">
                        <div className="relative">
                            <Monitor className="w-16 h-16 text-slate-600" />
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full"
                            />
                        </div>
                        <h2 className="text-2xl font-bold">
                            {status === 'initializing' ? 'Initializing Session...' : 'Connecting to Host...'}
                        </h2>
                        <p className="text-slate-400">Establishing secure link with {session?.host_device_name || 'PC'}</p>
                    </div>
                )}

                {/* Connection Quality Indicator */}
                {status === 'active' && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1.5 rounded-full text-xs font-mono text-green-400 border border-green-500/30">
                        <Activity className="w-3 h-3" />
                        <span>{streamStats.latency}ms</span>
                        <span className="text-slate-500">|</span>
                        <span>{streamStats.fps} FPS</span>
                        <span className="text-slate-500">|</span>
                        <span>{streamStats.bitrate} Mbps</span>
                    </div>
                )}
            </div>

            {/* Controls Overlay */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
                    >
                        <div className="flex items-center justify-between max-w-7xl mx-auto">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center overflow-hidden">
                                         <img src={game.cover_image || game.cover} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{game.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                                REMOTE PLAY
                                            </Badge>
                                            <span className="flex items-center gap-1">
                                                <Wifi className="w-3 h-3" /> Excellent
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setIsMicOn(!isMicOn)}
                                    className={`rounded-full ${isMicOn ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                </Button>

                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`rounded-full ${showSettings ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Settings className="w-5 h-5" />
                                </Button>

                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={toggleFullscreen}
                                    className="text-slate-400 hover:text-white rounded-full"
                                >
                                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                </Button>

                                <Button 
                                    variant="destructive" 
                                    onClick={onClose}
                                    className="ml-4 px-6 rounded-full"
                                >
                                    End Stream
                                </Button>
                            </div>
                        </div>

                        {/* Settings Panel */}
                        <AnimatePresence>
                            {showSettings && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 p-4 bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 max-w-md mx-auto">
                                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                            <Settings className="w-4 h-4" /> Stream Quality
                                        </h4>
                                        
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs text-slate-400">Resolution</label>
                                                <Select 
                                                    value={settings.resolution} 
                                                    onValueChange={(v) => setSettings({...settings, resolution: v})}
                                                >
                                                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="720p">720p (HD)</SelectItem>
                                                        <SelectItem value="1080p">1080p (FHD)</SelectItem>
                                                        <SelectItem value="1440p">1440p (QHD)</SelectItem>
                                                        <SelectItem value="4k">4K (UHD)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs text-slate-400">Target Framerate</label>
                                                <div className="flex gap-2">
                                                    {[30, 60, 120].map(fps => (
                                                        <Button
                                                            key={fps}
                                                            variant={settings.framerate === fps ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => setSettings({...settings, framerate: fps})}
                                                            className="flex-1"
                                                        >
                                                            {fps} FPS
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <label className="text-slate-400">Bitrate</label>
                                                    <span className="text-white">{settings.bitrate_mbps} Mbps</span>
                                                </div>
                                                <Slider
                                                    value={[settings.bitrate_mbps]}
                                                    min={5}
                                                    max={50}
                                                    step={1}
                                                    onValueChange={([v]) => setSettings({...settings, bitrate_mbps: v})}
                                                    className="py-2"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}