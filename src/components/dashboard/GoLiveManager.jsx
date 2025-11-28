import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Radio, Gamepad2, MessageSquare, Camera, Mic, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '../auth/AuthContext';
import { allMockGames } from '../store/mockData';

export default function GoLiveManager({ onClose }) {
  const { user } = useAuth();
  const [streamData, setStreamData] = useState({
    title: '',
    game_id: '',
    tags: [],
    mode: 'streaming',
    language: 'en',
    description: ''
  });
  const [settings, setSettings] = useState({
    camera: false,
    microphone: true,
    quality: 'medium'
  });
  const [currentTag, setCurrentTag] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const availableGames = Object.values(allMockGames).slice(0, 10); // Show first 10 games

  const addTag = () => {
    if (currentTag.trim() && !streamData.tags.includes(currentTag.trim())) {
      setStreamData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setStreamData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleStartStream = async () => {
    if (!streamData.title.trim()) return;

    setIsStarting(true);
    
    try {
      // In production, this would:
      // 1. Create stream record in database
      // 2. Initialize WebRTC or streaming infrastructure
      // 3. Start capturing media
      
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock stream creation
      const newStream = {
        ...streamData,
        id: Date.now().toString(),
        streamer_id: user.id,
        streamer_username: user.username || user.full_name,
        started_at: new Date().toISOString(),
        is_live: true,
        viewer_count: 0,
        settings
      };
      
      console.log('Starting stream:', newStream);
      
      // Close modal and potentially navigate to stream page
      onClose();
      
    } catch (error) {
      console.error('Error starting stream:', error);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-400" />
            Go Live
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Stream Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Stream Title *
            </label>
            <Input
              placeholder="What are you streaming today?"
              value={streamData.title}
              onChange={(e) => setStreamData(prev => ({ ...prev, title: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Game Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Game (Optional)
            </label>
            <Select 
              value={streamData.game_id} 
              onValueChange={(value) => setStreamData(prev => ({ ...prev, game_id: value }))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No Game / Just Chatting</SelectItem>
                {availableGames.map(game => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stream Mode */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Stream Mode
            </label>
            <div className="flex gap-2">
              <Button
                variant={streamData.mode === 'streaming' ? 'default' : 'outline'}
                onClick={() => setStreamData(prev => ({ ...prev, mode: 'streaming' }))}
                className="flex-1"
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                Gaming
              </Button>
              <Button
                variant={streamData.mode === 'talking' ? 'default' : 'outline'}
                onClick={() => setStreamData(prev => ({ ...prev, mode: 'talking' }))}
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Just Chatting
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add a tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="bg-slate-800 border-slate-700 text-white flex-grow"
              />
              <Button onClick={addTag} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {streamData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (Optional)
            </label>
            <Textarea
              placeholder="Tell viewers what to expect..."
              value={streamData.description}
              onChange={(e) => setStreamData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white h-20"
            />
          </div>

          {/* Stream Settings */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Stream Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">Enable Camera</span>
                </div>
                <Switch
                  checked={settings.camera}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, camera: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">Enable Microphone</span>
                </div>
                <Switch
                  checked={settings.microphone}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, microphone: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Stream Quality</span>
                <Select 
                  value={settings.quality} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, quality: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (480p)</SelectItem>
                    <SelectItem value="medium">Medium (720p)</SelectItem>
                    <SelectItem value="high">High (1080p)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleStartStream}
              disabled={!streamData.title.trim() || isStarting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isStarting ? (
                <>Starting...</>
              ) : (
                <>
                  <Radio className="w-4 h-4 mr-2" />
                  Start Streaming
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}