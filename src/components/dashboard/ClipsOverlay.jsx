
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowLeft, Play, Pause, Scissors, Download, Mic, Save, Trash2, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { allMockGames } from '../store/mockData';

// Mock data remains the same
const mockUserLibrary = [
  'sample_1', 'cyberpunk_2088', 'elder_scrolls', 'battle_arena'
];
const mockClipsByGame = {
  'sample_1': [{ id: 'clip_1_1', title: 'Epic Dragon Battle', duration: '2:34', thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=180&fit=crop', resolution: '1080p', privacy: 'private' }, { id: 'clip_1_2', title: 'Spell Casting Montage', duration: '1:45', thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=180&fit=crop', resolution: '720p', privacy: 'public' }],
  'cyberpunk_2088': [{ id: 'clip_2_1', title: 'Night City Chase', duration: '3:12', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=180&fit=crop', resolution: '4K', privacy: 'public' }, { id: 'clip_2_2', title: 'Perfect Headshots', duration: '1:28', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=180&fit=crop', resolution: '1080p', privacy: 'private' }],
  'elder_scrolls': [{ id: 'clip_3_1', title: 'Castle Siege Victory', duration: '4:21', thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=180&fit=crop', resolution: '1080p', privacy: 'unlisted' }],
  'battle_arena': []
};

const ClipsOverlay = ({ isVisible, onClose }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedClip, setSelectedClip] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get owned games with clip counts
  const ownedGames = React.useMemo(() => {
    return mockUserLibrary.map(gameId => {
      const game = allMockGames[gameId];
      const clips = mockClipsByGame[gameId] || [];
      return { ...game, id: gameId, clipCount: clips.length };
    }).filter(Boolean);
  }, []);

  useEffect(() => {
    // When the overlay is closed, reset the state
    if (!isVisible) {
      setSelectedGame(null);
      setSelectedClip(null);
    }
  }, [isVisible]);

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setSelectedClip(null); // Deselect clip when changing games
  };

  const currentGameClips = selectedGame ? (mockClipsByGame[selectedGame.id] || []) : [];

  if (!isVisible) return null;

  const renderRightPanel = () => {
    // If a clip is selected, show the editor
    if (selectedClip) {
      return (
        <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 flex flex-col h-full">
          {/* Back Button */}
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white" onClick={() => setSelectedClip(null)}>
              <ArrowLeft className="w-4 h-4 mr-2"/>
              Back to Clips
          </Button>

          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <img src={selectedClip.thumbnail} alt={selectedClip.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Button onClick={() => setIsPlaying(!isPlaying)} size="lg" className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm">
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              </Button>
            </div>
          </div>
          
          <Slider defaultValue={[33]} max={100} step={1} />
          
          <div className="flex-grow space-y-4">
            <h4 className="text-white font-semibold">{selectedClip.title}</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline"><Scissors className="w-4 h-4 mr-2" /> Trim</Button>
              <Button variant="outline"><Mic className="w-4 h-4 mr-2" /> Voiceover</Button>
              <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
              <Button variant="outline" className="text-red-400 hover:text-red-400 border-red-400/50 hover:bg-red-400/10"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
            </div>
          </div>
        </motion.div>
      );
    }

    // If a game is selected, show its clips
    if (selectedGame) {
      return (
        <motion.div key="clips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 h-full">
          <h4 className="text-white font-semibold text-lg mb-4">
            Clips for {selectedGame.title} ({currentGameClips.length})
          </h4>
          {currentGameClips.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto h-full pb-16">
              {currentGameClips.map(clip => (
                <Card 
                  key={clip.id}
                  className="bg-slate-800/40 border-slate-700/50 hover:border-blue-500/50 transition-all cursor-pointer"
                  onClick={() => setSelectedClip(clip)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video rounded-t-lg overflow-hidden bg-slate-700">
                      <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover"/>
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                      <Badge variant="secondary" className="absolute bottom-2 right-2 text-xs">{clip.duration}</Badge>
                    </div>
                    <div className="p-3">
                      <h5 className="text-white text-sm font-medium truncate">{clip.title}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{clip.resolution}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{clip.privacy}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No clips found for {selectedGame.title}</p>
            </div>
          )}
        </motion.div>
      );
    }

    // If no game is selected, show a placeholder
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <p>Select a game from the left to view clips</p>
      </div>
    );
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 right-0 h-full w-[85vw] z-50 bg-slate-900/95 backdrop-blur-lg border-l border-slate-700/50"
    >
      <style jsx>{`
        .invisible-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .invisible-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700/50 flex-shrink-0">
        <h3 className="text-white font-bold text-xl">Clip Editor</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5 text-slate-400 hover:text-white" />
        </Button>
      </div>

      <div className="flex h-full" style={{ height: 'calc(100% - 80px)' }}>
        {/* Left Column - Owned Games */}
        <div className="w-80 border-r border-slate-700/50 flex flex-col">
          <div className="p-4 border-b border-slate-700/50">
            <h4 className="text-white font-semibold text-lg">Your Games</h4>
          </div>
          <div className="flex-1 overflow-y-auto invisible-scrollbar p-4 space-y-3">
            {ownedGames.map(game => (
              <Card 
                key={game.id}
                className={`cursor-pointer transition-all border ${
                  selectedGame?.id === game.id 
                    ? 'bg-blue-600/20 border-blue-500/50' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/40'
                }`}
                onClick={() => handleGameSelect(game)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={game.cover_image || game.cover} alt={game.title} className="w-12 h-16 rounded object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-white text-sm font-medium truncate">{game.title}</h5>
                      <p className="text-slate-400 text-xs">{game.clipCount} clip{game.clipCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column - Clips & Editor */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {renderRightPanel()}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ClipsOverlay;
