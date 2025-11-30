import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, X, Download, Share2, Edit, Save, Sparkles, TrendingUp,
  Gamepad2, Trophy, Target, Zap, Bot, Database, Search, Filter
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

// Slick & Compact Smart Container Component
const SmartContainer = ({ clip, onClick, onShare }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-slate-900/60 hover:bg-slate-800/80 rounded-lg border border-slate-800/50 hover:border-blue-500/30 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className="flex h-24">
        {/* Thumbnail - Compact */}
        <div className="relative w-36 h-full flex-shrink-0">
          <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent" />
          <div className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">
            {clip.duration}
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-blue-600/90 rounded-full p-1.5 shadow-lg shadow-blue-500/50 backdrop-blur-sm">
              <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Content - Slick & Organized */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0 relative">
          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white" onClick={(e) => { e.stopPropagation(); onShare(); }}>
                <Share2 className="w-3 h-3" />
             </Button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-sm truncate group-hover:text-blue-400 transition-colors">{clip.title}</h3>
              {clip.tradeable && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-green-500/30 text-green-400 h-4">
                  Tradeable
                </Badge>
              )}
            </div>
            <p className="text-slate-400 text-xs line-clamp-1 font-light">{clip.description}</p>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {clip.tags.slice(0, 2).map((tag, i) => (
                <span key={i} className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">
                  {tag}
                </span>
              ))}
            </div>
            
            {clip.aiLearning && (
              <div className="flex items-center gap-2 bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50 group-hover:border-purple-500/30 transition-colors">
                <Bot className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] text-slate-300">
                  {clip.aiLearning.stat} <span className="text-green-400 font-bold">+{clip.aiLearning.value}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Media Viewer
const MediaViewer = ({ clip, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
    onClick={onClose}
  >
    <div className="relative max-w-4xl w-full bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-black/50 hover:bg-red-500/20 text-white hover:text-red-400 transition-colors">
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="aspect-video bg-black">
        <video controls className="w-full h-full" autoPlay poster={clip.thumbnail}>
          <source src={clip.thumbnail} type="video/mp4" />
        </video>
      </div>
      
      <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{clip.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{clip.description}</p>
          </div>
          
          {clip.aiLearning && (
            <div className="flex-shrink-0 bg-slate-800/50 rounded-xl p-4 border border-purple-500/20 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> AI Analysis
              </div>
              <div className="text-white text-sm font-medium mb-1">{clip.aiLearning.ability}</div>
              <div className="text-green-400 text-lg font-bold">+{clip.aiLearning.value} {clip.aiLearning.stat}</div>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
          <code className="text-xs text-slate-600 font-mono bg-black/30 px-2 py-1 rounded">{clip.dna}</code>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-slate-300">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
              <Share2 className="w-4 h-4 mr-2" /> Share Clip
            </Button>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function TheVault() {
  const [selectedGame, setSelectedGame] = useState('elden-ring');
  const [selectedClip, setSelectedClip] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClips = mockClips.filter(clip => 
    clip.gameId === selectedGame && 
    (clip.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     clip.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleShare = (clip) => {
    // Placeholder for share logic
    console.log(`Sharing ${clip.title}`);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-2">
      {/* LEFT SIDEBAR - Game Index */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search vault..." 
            className="pl-9 bg-slate-900/50 border-slate-700/50 text-sm focus:ring-blue-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bg-slate-900/40 rounded-xl border border-slate-700/30 overflow-hidden flex-1">
          <div className="p-4 border-b border-slate-700/30 bg-slate-900/60">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <Database className="w-3 h-3 text-blue-400" />
              Secure Archives
            </h3>
          </div>
          
          <div className="p-2 space-y-1">
            {gameIndex.map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ x: 2 }}
                onClick={() => setSelectedGame(game.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all border ${
                  selectedGame === game.id
                    ? `bg-gradient-to-r from-blue-900/40 to-slate-900/40 border-blue-500/30`
                    : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-700/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-lg bg-gradient-to-br ${game.color} shadow-lg`}>
                  {game.icon}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`font-semibold text-sm truncate ${selectedGame === game.id ? 'text-white' : 'text-slate-400'}`}>{game.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{game.dnaPrefix}</p>
                </div>
                {selectedGame === game.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 rounded-xl border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase">Capacity</h3>
            <Zap className="w-3 h-3 text-yellow-500" />
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-[65%]" />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>65% Used</span>
            <span>1.2TB Free</span>
          </div>
        </div>
      </div>

      {/* MAIN AREA - Smart Containers Grid */}
      <div className="flex-1 min-w-0 flex flex-col bg-slate-950/30 rounded-2xl border border-slate-800/30 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/30 flex justify-between items-center bg-slate-900/20 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {gameIndex.find(g => g.id === selectedGame)?.icon} 
              {gameIndex.find(g => g.id === selectedGame)?.name}
              <Badge variant="outline" className="ml-2 border-slate-700 text-slate-400 font-mono text-xs">
                {gameIndex.find(g => g.id === selectedGame)?.dnaPrefix}
              </Badge>
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              {filteredClips.length} archived sequences found
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs border-slate-700 text-slate-400 hover:text-white">
              <Filter className="w-3 h-3 mr-1.5" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs border-slate-700 text-slate-400 hover:text-white">
              <TrendingUp className="w-3 h-3 mr-1.5" /> Sort
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredClips.map((clip) => (
              <SmartContainer
                key={clip.id}
                clip={clip}
                onClick={() => setSelectedClip(clip)}
                onShare={() => handleShare(clip)}
              />
            ))}
            
            {/* Empty State */}
            {filteredClips.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600">
                <Database className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">No clips found in this archive sector.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Viewer Modal */}
      <AnimatePresence>
        {selectedClip && (
          <MediaViewer clip={selectedClip} onClose={() => setSelectedClip(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}