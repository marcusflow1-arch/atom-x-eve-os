import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, X, Download, Share2, Edit, Save, Sparkles, TrendingUp,
  Gamepad2, Trophy, Target, Zap, Bot, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// Mock Data - Game Index with DNA Strings
const gameIndex = [
  { 
    id: 'elden-ring', 
    name: 'Elden Ring', 
    icon: '🗡️', 
    color: 'from-orange-600 to-orange-800',
    count: 10,
    dnaPrefix: '44-ER'
  },
  { 
    id: 'call-of-duty', 
    name: 'Call of Duty', 
    icon: '🎯', 
    color: 'from-green-600 to-green-800',
    count: 20,
    dnaPrefix: '44-COD'
  },
  { 
    id: 'apex-legends', 
    name: 'Apex Legends', 
    icon: '⚔️', 
    color: 'from-red-600 to-red-800',
    count: 20,
    dnaPrefix: '44-APX'
  },
  { 
    id: 'cyberpunk', 
    name: 'Cyberpunk 2088', 
    icon: '🤖', 
    color: 'from-purple-600 to-purple-800',
    count: 15,
    dnaPrefix: '44-CYB'
  }
];

const mockClips = [
  {
    id: 'CLIP-X99',
    gameId: 'elden-ring',
    thumbnail: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300&fit=crop',
    title: 'Dragon Kill',
    description: 'Used Magic spell to defeat the dragon. Learned timing for dodging fire breath attacks.',
    aiLearning: { stat: 'Intelligence', value: 5, ability: 'Fire Resistance' },
    tags: ['Boss Fight', 'Magic', 'Victory'],
    tradeable: true,
    duration: '4:20',
    dna: '44-ER-01:CLIP-X99:Used_Magic:INT_UP_5'
  },
  {
    id: 'CLIP-Y43',
    gameId: 'call-of-duty',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=300&fit=crop',
    title: 'Long Range Sniper',
    description: 'Hit a sniper shot from 500m while hidden. Perfect stealth approach.',
    aiLearning: { stat: 'Accuracy', value: 8, ability: 'Stealth Precision' },
    tags: ['Sniper', 'Long Range', 'Hidden'],
    tradeable: true,
    duration: '0:45',
    dna: '44-COD-12:CLIP-Y43:Sniper_Hidden:ACC_UP_8'
  },
  {
    id: 'CLIP-Z88',
    gameId: 'apex-legends',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
    title: 'Squad Wipe',
    description: 'Wiped entire enemy squad with coordinated team assault. Communication was key.',
    aiLearning: { stat: 'Teamwork', value: 6, ability: 'Squad Coordination' },
    tags: ['Team Play', 'Communication', 'Victory'],
    tradeable: false,
    duration: '2:15',
    dna: '44-APX-05:CLIP-Z88:Team_Assault:TM_UP_6'
  }
];

// Smart Container Component
const SmartContainer = ({ clip, onClick, onShare, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDesc, setEditedDesc] = useState(clip.description);
  const [glowing, setGlowing] = useState(false);

  const handleSave = () => {
    // Parse keywords from description
    const keywords = editedDesc.toLowerCase();
    let detectedAbilities = [];
    
    if (keywords.includes('sniper') || keywords.includes('long range')) {
      detectedAbilities.push('Accuracy');
    }
    if (keywords.includes('hidden') || keywords.includes('stealth')) {
      detectedAbilities.push('Stealth');
    }
    if (keywords.includes('magic') || keywords.includes('spell')) {
      detectedAbilities.push('Intelligence');
    }
    
    if (detectedAbilities.length > 0) {
      setGlowing(true);
      setTimeout(() => setGlowing(false), 2000);
    }
    
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-800/40 rounded-xl border overflow-hidden mb-3 transition-all ${
        glowing ? 'border-blue-500 shadow-lg shadow-blue-500/50' : 'border-slate-700/50'
      }`}
    >
      <div className="flex gap-4 p-4">
        {/* A. The Anchor - Thumbnail */}
        <div className="relative flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden group cursor-pointer" onClick={onClick}>
          <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-12 h-12 text-white" fill="white" />
          </div>
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-semibold">
            {clip.duration}
          </div>
        </div>

        {/* Right Side Content */}
        <div className="flex-1 space-y-3">
          {/* B. The Header - Title */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">{clip.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                {clip.tags.map((tag, i) => (
                  <Badge key={i} className="bg-blue-600/30 text-blue-400 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {clip.tradeable && (
                <Badge className="bg-green-600/30 text-green-400 border-green-500/50">
                  Tradeable
                </Badge>
              )}
            </div>
          </div>

          {/* C. The Context - Description */}
          <div className="bg-slate-700/30 rounded-lg p-3">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  className="bg-slate-800/50 border-slate-600 text-white text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  💡 Tip: Mention skills like "Sniper", "Stealth", "Magic" to train your AI
                </p>
              </div>
            ) : (
              <div>
                <p className="text-slate-300 text-sm mb-2">{clip.description}</p>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Edit className="w-3 h-3 mr-1" />
                  Edit Description
                </Button>
              </div>
            )}
          </div>

          {/* D. The AI Learning Value */}
          {clip.aiLearning && (
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-3 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-purple-400 font-semibold text-xs">AI LEARNED</p>
                    <p className="text-white text-sm">{clip.aiLearning.ability}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">{clip.aiLearning.stat}</span>
                  <span className="text-green-400 font-bold">+{clip.aiLearning.value}</span>
                </div>
              </div>
            </div>
          )}

          {/* E. DNA String & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3 text-slate-500" />
              <code className="text-xs text-slate-500 font-mono">{clip.dna}</code>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onShare}>
                <Share2 className="w-3 h-3 mr-1" />
                Share to Hub
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Glow Effect on Save */}
      {glowing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-blue-500/10 border-t border-blue-500/30 p-2 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 text-sm font-semibold">AI analyzing your description...</span>
        </motion.div>
      )}
    </motion.div>
  );
};

// Media Viewer
const MediaViewer = ({ clip, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-8"
    onClick={onClose}
  >
    <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute -top-12 right-0 text-white hover:bg-white/10"
      >
        <X className="w-6 h-6" />
      </Button>
      
      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
        <video controls className="w-full" autoPlay>
          <source src={clip.thumbnail} type="video/mp4" />
        </video>
        
        <div className="p-6">
          <h3 className="text-white font-bold text-xl mb-2">{clip.title}</h3>
          <p className="text-slate-400 text-sm mb-4">{clip.description}</p>
          
          {clip.aiLearning && (
            <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500/30">
              <p className="text-purple-400 font-semibold mb-2">AI Stats from this clip:</p>
              <div className="flex items-center gap-4">
                <span className="text-white">{clip.aiLearning.ability}</span>
                <Badge className="bg-green-500/20 text-green-400">
                  {clip.aiLearning.stat} +{clip.aiLearning.value}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

export default function TheVault() {
  const [selectedGame, setSelectedGame] = useState('elden-ring');
  const [selectedClip, setSelectedClip] = useState(null);

  const filteredClips = mockClips.filter(clip => clip.gameId === selectedGame);

  const handleShare = (clip) => {
    alert(`Sharing ${clip.title} to Social Hub with AI stats!`);
  };

  return (
    <div className="h-full flex gap-4">
      {/* LEFT SIDEBAR - Game Index */}
      <div className="w-64 space-y-3 flex-shrink-0">
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
          <h3 className="text-white font-bold flex items-center gap-2 mb-4">
            <Gamepad2 className="w-5 h-5 text-blue-400" />
            Game Index
          </h3>
          
          <div className="space-y-2">
            {gameIndex.map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ x: 5 }}
                onClick={() => setSelectedGame(game.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  selectedGame === game.id
                    ? `bg-gradient-to-r ${game.color} border border-white/20`
                    : 'bg-slate-700/30 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-2xl">{game.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold text-sm">{game.name}</p>
                  <p className="text-slate-400 text-xs">{game.count} clips</p>
                </div>
                <Badge className="bg-blue-600/30 text-blue-400">{game.count}</Badge>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
          <h3 className="text-white font-bold flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Vault Stats
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Clips</span>
              <span className="text-white font-bold">65</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AI Learning</span>
              <span className="text-purple-400 font-bold">+143 XP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tradeable</span>
              <span className="text-green-400 font-bold">32</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN AREA - Smart Containers */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white mb-2">
            {gameIndex.find(g => g.id === selectedGame)?.icon} {gameIndex.find(g => g.id === selectedGame)?.name}
          </h2>
          <p className="text-slate-400">
            {filteredClips.length} clips • Sorted by AI learning value
          </p>
        </div>

        <div className="space-y-3">
          {filteredClips.map((clip) => (
            <SmartContainer
              key={clip.id}
              clip={clip}
              onClick={() => setSelectedClip(clip)}
              onShare={() => handleShare(clip)}
            />
          ))}
        </div>
      </div>

      {/* Media Viewer */}
      <AnimatePresence>
        {selectedClip && (
          <MediaViewer clip={selectedClip} onClose={() => setSelectedClip(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}