import React, { useState } from 'react';
import { Brain, Gamepad2, BookOpen, Search, ChevronRight, Zap, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

export default function KnowledgeConnectionPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('games'); // 'games' | 'knowledge'

  const { data: gameKnowledge = [] } = useQuery({
    queryKey: ['game-knowledge'],
    queryFn: () => base44.entities.GameKnowledge.list('-created_date', 50),
  });

  const { data: knowledgeEntries = [] } = useQuery({
    queryKey: ['knowledge-entries'],
    queryFn: () => base44.entities.KnowledgeEntry.list('-created_date', 200),
  });

  const q = searchTerm.toLowerCase();
  const filteredGames = gameKnowledge.filter(g => !q || g.game_name?.toLowerCase().includes(q) || g.tags?.some(t => t.toLowerCase().includes(q)));
  const filteredKnowledge = knowledgeEntries.filter(e => !q || e.source_filename?.toLowerCase().includes(q) || e.tags?.some(t => t.toLowerCase().includes(q)));

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-bold text-xs">KNOWLEDGE LINK</span>
        </div>
        <p className="text-slate-500 text-[9px] mb-2">Knowledge from Game Study and Data Bank feeds directly into the Engine.</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-2">
          <button onClick={() => setActiveTab('games')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'games' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'text-white/40 hover:text-white/60'}`}>
            <Gamepad2 className="w-3 h-3 inline mr-1" />Games ({gameKnowledge.length})
          </button>
          <button onClick={() => setActiveTab('knowledge')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'knowledge' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-white/40 hover:text-white/60'}`}>
            <Brain className="w-3 h-3 inline mr-1" />Bank ({knowledgeEntries.length})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-7 text-[10px] pl-7 bg-slate-800/50 border-slate-700" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: 'thin' }}>
        {activeTab === 'games' ? (
          filteredGames.length === 0 ? (
            <p className="text-slate-500 text-[10px] text-center py-4">No games studied yet</p>
          ) : filteredGames.map(game => (
            <div key={game.id} onClick={() => setExpandedId(expandedId === game.id ? null : game.id)} className={`rounded-lg border p-2 cursor-pointer transition-all ${expandedId === game.id ? 'border-orange-500/40 bg-orange-500/5' : 'border-slate-700/50 hover:border-slate-600'}`}>
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <span className="text-white text-[11px] font-medium truncate flex-1">{game.game_name}</span>
                <ChevronRight className={`w-3 h-3 text-white/30 transition-transform ${expandedId === game.id ? 'rotate-90' : ''}`} />
              </div>
              {expandedId === game.id && game.architecture_summary && (
                <div className="mt-2 text-[10px] text-slate-400 leading-relaxed max-h-[120px] overflow-y-auto border-t border-slate-700/50 pt-2" style={{ scrollbarWidth: 'thin' }}>
                  <ReactMarkdown>{game.architecture_summary.substring(0, 500)}</ReactMarkdown>
                </div>
              )}
            </div>
          ))
        ) : (
          filteredKnowledge.length === 0 ? (
            <p className="text-slate-500 text-[10px] text-center py-4">No knowledge entries yet</p>
          ) : filteredKnowledge.slice(0, 50).map(entry => (
            <div key={entry.id} onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} className={`rounded-lg border p-2 cursor-pointer transition-all ${expandedId === entry.id ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-slate-700/50 hover:border-slate-600'}`}>
              <div className="flex items-center gap-2">
                <BookOpen className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="text-white text-[10px] font-medium truncate flex-1">{entry.source_filename}</span>
                <Badge variant="outline" className="text-[7px] py-0 text-slate-500 border-slate-700">{entry.category}</Badge>
              </div>
              {expandedId === entry.id && entry.summary && (
                <div className="mt-1.5 text-[9px] text-slate-400 leading-relaxed max-h-[80px] overflow-y-auto border-t border-slate-700/50 pt-1.5" style={{ scrollbarWidth: 'thin' }}>
                  {entry.summary}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}