import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Volume2, Monitor, Bell, Shield, User, HelpCircle, Video, Upload, X, Image as ImageIcon, Users, Save } from 'lucide-react';

export default function SettingsPanel() {
  const [volume, setVolume] = useState(80);
  const [streamerProfile, setStreamerProfile] = useState({
    bannerImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
    introVideo: '',
    images: [
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=200&fit=crop'
    ],
    sponsors: [],
    bio: 'Professional gamer and content creator',
    favoriteGames: ['Counter-Strike 2', 'Valorant', 'Apex Legends']
  });
  
  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">System Settings</h2>
        <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
          v2.4.0
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-8 flex-wrap">
          <TabsTrigger value="general" className="gap-2"><Monitor className="w-4 h-4" /> General</TabsTrigger>
          <TabsTrigger value="audio" className="gap-2"><Volume2 className="w-4 h-4" /> Audio</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="account" className="gap-2"><User className="w-4 h-4" /> Account</TabsTrigger>

        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Display Options</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white">Streamer Mode</Label>
                <p className="text-sm text-white/50">Hide personal details while streaming</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white">High Contrast UI</Label>
                <p className="text-sm text-white/50">Increase visibility of interface elements</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white">Hardware Acceleration</Label>
                <p className="text-sm text-white/50">Use GPU for smoother animations</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audio" className="space-y-6">
         <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6" style={{ maxWidth: '45%' }}>
           <h3 className="text-lg font-semibold text-white mb-4">Volume Controls</h3>

           <div className="space-y-4">
             <div className="space-y-2">
               <div className="flex justify-between">
                 <Label className="text-white">Master Volume</Label>
                 <span className="text-white/60 text-sm">{volume}%</span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={volume} 
                 onChange={(e) => setVolume(e.target.value)}
                 className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500"
               />
             </div>

              <div className="flex items-center justify-between mt-6">
                <div className="space-y-1">
                  <Label className="text-white">Background Music</Label>
                  <p className="text-sm text-white/50">Play ambient music in dashboard</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">UI Sound Effects</Label>
                  <p className="text-sm text-white/50">Sounds on hover and click</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
           <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Alert Preferences</h3>
             <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white">Friend Requests</Label>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white">Game Invites</Label>
              </div>
              <Switch defaultChecked />
            </div>
           </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
           <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                 U
               </div>
               <div>
                 <h3 className="text-xl font-bold text-white">User Account</h3>
                 <p className="text-white/50">Logged in as user@example.com</p>
               </div>
             </div>
             <div className="pt-4 border-t border-white/10">
               <Button variant="destructive" className="w-full sm:w-auto">Sign Out</Button>
             </div>
           </div>
        </TabsContent>


        </TabsContent>
      </Tabs>
    </div>
  );
}