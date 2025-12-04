import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, MessageSquare, Layout, Eye, Settings, Mic, Camera, Share2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StreamerTools() {
  const [overlays, setOverlays] = useState({
    achievements: true,
    chat: true,
    ugc: false,
    stats: true
  });

  return (
    <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Monitor className="w-6 h-6 text-purple-500" />
            Streamer Command Center
          </h2>
          <p className="text-slate-400">Manage your broadcast overlays and integrations.</p>
        </div>
        <Badge className="bg-red-600 animate-pulse">ON AIR</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Layout className="w-5 h-5 text-blue-400" />
              Dynamic Overlays
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-white font-medium">Achievement Popups</p>
                  <p className="text-xs text-slate-400">Show real-time unlocks to viewers</p>
                </div>
              </div>
              <Switch checked={overlays.achievements} onCheckedChange={(v) => setOverlays({...overlays, achievements: v})} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-white font-medium">Chat Integration</p>
                  <p className="text-xs text-slate-400">Display cross-platform chat on stream</p>
                </div>
              </div>
              <Switch checked={overlays.chat} onCheckedChange={(v) => setOverlays({...overlays, chat: v})} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-pink-500" />
                <div>
                  <p className="text-white font-medium">UGC Highlighter</p>
                  <p className="text-xs text-slate-400">Showcase user-created content details</p>
                </div>
              </div>
              <Switch checked={overlays.ugc} onCheckedChange={(v) => setOverlays({...overlays, ugc: v})} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Stream Health & Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 uppercase">Viewers</p>
                <p className="text-2xl font-bold text-white">1,245</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 uppercase">Engagement</p>
                <p className="text-2xl font-bold text-green-400">High</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Settings className="w-4 h-4 mr-2" /> Configure OBS Plugin
              </Button>
              <Button variant="outline" className="w-full border-slate-600">
                View Analytics Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const TrophyIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)