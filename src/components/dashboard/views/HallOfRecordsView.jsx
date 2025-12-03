import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Settings, Palette, Volume2, Bell, ChevronRight, ChevronLeft, Library as LibraryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Achievements from '../../../pages/Achievements';
import Library from '../../../pages/Library';

export default function HallOfRecordsView() {
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [volume, setVolume] = useState([70]);
  const [notifications, setNotifications] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-full flex gap-6 relative">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-slate-800/20 rounded-xl border border-slate-700/30 flex flex-col">
        <Tabs defaultValue="achievements" className="h-full flex flex-col">
          <div className="px-6 pt-4 pb-2 flex-shrink-0">
            <TabsList className="bg-slate-900/50 border border-slate-700 w-auto inline-flex">
              <TabsTrigger value="achievements" className="gap-2 px-6">
                <Trophy className="w-4 h-4" /> Achievements
              </TabsTrigger>
              <TabsTrigger value="library" className="gap-2 px-6">
                <LibraryIcon className="w-4 h-4" /> Library
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="achievements" className="flex-1 overflow-hidden mt-0 relative data-[state=inactive]:hidden">
            <Achievements />
          </TabsContent>
          
          <TabsContent value="library" className="flex-1 overflow-hidden mt-0 relative data-[state=inactive]:hidden">
            <Library />
          </TabsContent>
        </Tabs>
      </div>

      {/* Toggle Button */}
      <div className="absolute right-0 top-0 z-10">
        {!isSidebarOpen && (
          <Button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-white/10 text-white hover:bg-blue-600 backdrop-blur-sm border border-white/10"
            size="icon"
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Settings Panel */}
      <motion.div 
        initial={{ width: 384, opacity: 1 }}
        animate={{ 
          width: isSidebarOpen ? 384 : 0,
          opacity: isSidebarOpen ? 1 : 0,
          display: isSidebarOpen ? 'block' : 'none'
        }}
        className="space-y-4 overflow-hidden"
      >
        <div className="flex justify-end mb-2">
           <Button
            onClick={() => setIsSidebarOpen(false)}
            className="bg-white/10 text-white hover:bg-blue-600 backdrop-blur-sm border border-white/10"
            size="sm"
          >
            Close Settings <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6"
        >
          <h3 className="text-white font-bold flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-blue-400" />
            UI Customization
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Theme</label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                UI Volume: {volume[0]}%
              </label>
              <Slider value={volume} onValueChange={setVolume} max={100} step={1} />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Answer Mode</label>
              <Select defaultValue="balanced">
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Notifications</span>
              <Button
                size="sm"
                variant={notifications ? 'default' : 'outline'}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell className={`w-4 h-4 ${notifications ? 'text-white' : 'text-slate-400'}`} />
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6"
        >
          <h3 className="text-white font-bold flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-purple-400" />
            Avatar Settings
          </h3>
          <div className="space-y-3">
            <Button className="w-full justify-start bg-white/10 text-white hover:bg-blue-600 border-white/10 backdrop-blur-sm">
              Voice Personality
            </Button>
            <Button className="w-full justify-start bg-white/10 text-white hover:bg-blue-600 border-white/10 backdrop-blur-sm">
              Appearance
            </Button>
            <Button className="w-full justify-start bg-white/10 text-white hover:bg-blue-600 border-white/10 backdrop-blur-sm">
              Behavior Traits
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}