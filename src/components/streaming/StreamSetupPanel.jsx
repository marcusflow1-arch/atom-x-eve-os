import React, { useState } from 'react';
import { Camera, Mic, Radio, Settings, Gamepad2, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { allMockGames } from '@/components/store/mockData';

export default function StreamSetupPanel({ onStartStream }) {
  const [streamData, setStreamData] = useState({
    title: '',
    game_id: '',
    tags: [],
    mode: 'streaming',
    description: ''
  });
  const [settings, setSettings] = useState({
    camera: false,
    microphone: true,
    quality: 'medium'
  });
  const [currentTag, setCurrentTag] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const availableGames = Object.values(allMockGames).slice(0, 10);

  const addTag = () => {
    if (currentTag.trim() && !streamData.tags.includes(currentTag.trim())) {
      setStreamData(prev => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setStreamData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleStart = async () => {
    if (!streamData.title.trim()) return;
    setIsStarting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsStarting(false);
    onStartStream(streamData, settings);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-2">
        <Settings className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-white tracking-wider">STREAM SETUP</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* Stream Title */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Stream Title *
          </label>
          <Input
            placeholder="What are you streaming?"
            value={streamData.title}
            onChange={(e) => setStreamData(prev => ({ ...prev, title: e.target.value }))}
            className="bg-black/40 border-white/10 text-white text-sm h-9"
          />
        </div>

        {/* Game Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Game Category
          </label>
          <Select 
            value={streamData.game_id} 
            onValueChange={(value) => setStreamData(prev => ({ ...prev, game_id: value }))}
          >
            <SelectTrigger className="bg-black/40 border-white/10 text-white h-9 text-sm">
              <SelectValue placeholder="Select a game" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Just Chatting</SelectItem>
              {availableGames.map(game => (
                <SelectItem key={game.id} value={game.id}>
                  {game.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add tag..."
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              className="bg-black/40 border-white/10 text-white h-8 text-xs flex-grow"
            />
            <Button onClick={addTag} variant="outline" size="sm" className="h-8 border-white/10 text-white/70 hover:text-white">Add</Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {streamData.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer border border-white/5 text-[10px] py-0 px-2 h-5 flex items-center" onClick={() => removeTag(tag)}>
                {tag} <X className="w-2.5 h-2.5 ml-1 opacity-50" />
              </Badge>
            ))}
          </div>
        </div>

        {/* Hardware Settings */}
        <div className="pt-2 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Camera</span>
            </div>
            <Switch
              checked={settings.camera}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, camera: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Microphone</span>
            </div>
            <Switch
              checked={settings.microphone}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, microphone: checked }))}
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-black/40">
        <Button
          onClick={handleStart}
          disabled={!streamData.title.trim() || isStarting}
          className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-bold tracking-wider"
        >
          {isStarting ? (
            'STARTING STREAM...'
          ) : (
            <>
              <Radio className="w-5 h-5 mr-2 animate-pulse" />
              GO LIVE NOW
            </>
          )}
        </Button>
      </div>
    </div>
  );
}