import React from 'react';
import { Play, Pause, MessageSquare, WifiOff, Volume2, Settings, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StreamPlayerBox({ isLive, onToggleLive, isPlaying, onTogglePlay, volume, onVolumeChange, settingsOpen, onCloseSettings, isSettingsMaximized, onToggleSettingsMaximize }) {
  return (
    <div 
        className="flex-[3] rounded-3xl overflow-hidden min-h-[400px] relative group border border-white/10 shadow-2xl"
        style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
    >
        {settingsOpen && (
          <div className={isSettingsMaximized ? 'fixed inset-0 z-[200] flex flex-col' : 'absolute inset-0 z-30 flex flex-col'}>
            <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10">
              <div className="text-white font-bold">Stream Settings</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleSettingsMaximize}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title={isSettingsMaximized ? 'Restore' : 'Maximize'}
                >
                  {isSettingsMaximized ? <Minimize className="w-4 h-4 text-white" /> : <Maximize className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-black/50 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 p-4 bg-white/5">
                  <h4 className="text-white font-semibold mb-3 text-sm">General</h4>
                  <div className="space-y-3 text-sm text-white/80">
                    <label className="flex items-center justify-between">
                      <span>Auto record</span>
                      <input type="checkbox" defaultChecked className="accent-cyan-400" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Show chat overlay</span>
                      <input type="checkbox" className="accent-cyan-400" />
                    </label>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 p-4 bg-white/5">
                  <h4 className="text-white font-semibold mb-3 text-sm">Video</h4>
                  <div className="space-y-3 text-sm text-white/80">
                    <label className="flex items-center justify-between gap-3">
                      <span>Resolution</span>
                      <select className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-white/90">
                        <option>1080p</option>
                        <option>720p</option>
                        <option>480p</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      <span>Bitrate</span>
                      <select className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-white/90">
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 p-4 bg-white/5">
                  <h4 className="text-white font-semibold mb-3 text-sm">Audio</h4>
                  <div className="space-y-3 text-sm text-white/80">
                    <label className="flex items-center justify-between">
                      <span>Mic Enabled</span>
                      <input type="checkbox" defaultChecked className="accent-cyan-400" />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      <span>Audio Bitrate</span>
                      <select className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-white/90">
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {isLive ? (
            <div className="w-full h-full relative">
                 {/* Mock Live Stream Content removed */}
                 
                 {/* Overlay Gradient */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                 {/* Top Status */}
                 <div className="absolute top-6 left-6">
                   <div className="bg-red-600 px-3 py-1 rounded text-white text-xs font-bold uppercase animate-pulse shadow-lg shadow-red-600/20">
                     LIVE
                   </div>
                 </div>
                 <div className="absolute top-6 right-6">
                   <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded text-white text-xs font-medium flex items-center gap-2 border border-white/10">
                     <MessageSquare className="w-3 h-3 text-white/60" />
                     1.2k Viewers
                   </div>
                 </div>

                 {/* Center Play Button (On Hover) */}
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <button 
                        onClick={onTogglePlay}
                        className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center pointer-events-auto hover:bg-white/20 hover:scale-110 transition-all"
                    >
                        {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                    </button>
                 </div>

                 {/* Bottom Controls */}
                 <div className="absolute bottom-0 left-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Stream Info */}
                    <div className="mb-4">
                        <h3 className="font-bold text-xl text-white drop-shadow-md">My Awesome Stream Title</h3>
                        <p className="text-sm text-cyan-400 font-medium">Playing: Valorant</p>
                    </div>

                    {/* Control Bar */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={onTogglePlay} className="text-white hover:text-cyan-400 transition-colors">
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            
                            <div className="flex items-center gap-2 group/vol">
                                <Volume2 className="w-5 h-5 text-white" />
                                <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                                    <div className="w-20 h-1 bg-white/30 rounded-full ml-2 relative cursor-pointer">
                                        <div className="absolute left-0 top-0 bottom-0 bg-white rounded-full" style={{ width: `${volume}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-white/60 font-mono">
                                <span className="text-red-500">●</span> 02:14:35
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="text-white/70 hover:text-white transition-colors" title="Settings">
                                <Settings className="w-5 h-5" />
                            </button>
                            <button className="text-white/70 hover:text-white transition-colors" title="Fullscreen">
                                <Maximize className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                 </div>
            </div>
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 text-center p-8">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <WifiOff className="w-8 h-8 text-white/40" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Currently Offline</h2>
                <p className="text-white/40 max-w-md">
                    You are not streaming right now. Go live to interact with your audience!
                </p>
                <Button 
                    className="mt-6 bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-600/20"
                    onClick={onToggleLive}
                >
                    <Play className="w-4 h-4 mr-2" />
                    Start Test Stream
                </Button>
            </div>
        )}
    </div>
  );
}