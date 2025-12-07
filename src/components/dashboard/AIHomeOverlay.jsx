import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, Activity, Cpu, Shield, Wifi, Server, 
  Database, Bell, MessageSquare, Clock, Zap, Settings 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AIHomeOverlay({ onClose }) {
  return (
    <div className="h-full w-full bg-slate-950/90 text-white p-8 md:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
             <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 mb-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
               SYSTEM ONLINE
             </Badge>
             <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white">
               AI Command Center
             </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Uptime</div>
                <div className="text-2xl font-mono text-emerald-400">42:12:09</div>
             </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           
           {/* System Status */}
           <div className="col-span-1 md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                 <Activity className="w-24 h-24 text-emerald-500/10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Cpu className="w-6 h-6 text-emerald-400" /> System Metrics
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div className="space-y-2">
                    <div className="text-slate-400 text-xs font-bold uppercase">CPU Load</div>
                    <div className="text-3xl font-mono text-white">12%</div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full w-[12%] bg-emerald-500" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="text-slate-400 text-xs font-bold uppercase">Memory</div>
                    <div className="text-3xl font-mono text-white">64%</div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full w-[64%] bg-blue-500" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="text-slate-400 text-xs font-bold uppercase">Network</div>
                    <div className="text-3xl font-mono text-white">1.2<span className="text-sm text-slate-500">GB/s</span></div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full w-[80%] bg-purple-500" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="text-slate-400 text-xs font-bold uppercase">Storage</div>
                    <div className="text-3xl font-mono text-white">82%</div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full w-[82%] bg-yellow-500" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Security Status */}
           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-400" /> Security
                </h2>
                <div className="text-emerald-400 text-lg font-bold mb-1">Protected</div>
                <p className="text-slate-400 text-sm">Firewall active. No threats detected in the last 24 hours.</p>
              </div>
              <div className="mt-6 flex gap-2">
                 <div className="flex-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-emerald-300 uppercase font-bold mb-1">Encrypted</div>
                    <div className="text-emerald-400"><Server className="w-5 h-5 mx-auto" /></div>
                 </div>
                 <div className="flex-1 bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-blue-300 uppercase font-bold mb-1">VPN</div>
                    <div className="text-blue-400"><Wifi className="w-5 h-5 mx-auto" /></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Notifications & Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 h-[300px] overflow-y-auto custom-scrollbar">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 sticky top-0 bg-[#0f172a] py-2 z-10">
                <Bell className="w-5 h-5 text-yellow-400" /> Recent Notifications
              </h2>
              <div className="space-y-4">
                 {[1,2,3,4,5].map((i) => (
                    <div key={i} className="flex gap-4 items-start p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/5">
                       <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
                          <MessageSquare className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="text-sm font-bold text-white mb-1">System Update Completed</h4>
                          <p className="text-xs text-slate-400">Patch v2.4.1 has been successfully installed. Reboot required for some changes.</p>
                          <span className="text-[10px] text-slate-500 mt-2 block">2 hours ago</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center items-center text-center">
              <div className="relative z-10">
                 <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
                    <Zap className="w-10 h-10 text-white" />
                 </div>
                 <h2 className="text-3xl font-black text-white mb-4">Quick Diagnostics</h2>
                 <p className="text-blue-100 mb-8 max-w-sm mx-auto">Run a full system scan to optimize performance and clear cache.</p>
                 <Button className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 h-12 rounded-full">
                    Start Scan
                 </Button>
              </div>
              {/* Background Decoration */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                 <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}