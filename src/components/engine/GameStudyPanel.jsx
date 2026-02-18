import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Loader2, Brain, Gamepad2, CheckCircle2, XCircle,
  SkipForward, Cpu, Layers, Box, Sparkles, BookOpen, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/components/error/ErrorToast';
import { enqueueFiles, subscribe, getState, invalidateKnowledgeCache } from '../admin/knowledgeLearner';
import ReactMarkdown from 'react-markdown';

function classifyFile(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['json','yaml','yml','env','config','toml','ini','cfg','uproject','umap','uplugin'].includes(ext)) return 'config';
  if (['js','jsx','ts','tsx','py','cs','cpp','c','java','rb','go','rs','h','hpp','lua','blueprint'].includes(ext)) return 'code';
  if (['csv','xlsx','xls','tsv','db','sqlite'].includes(ext)) return 'data';
  if (['md','txt','doc','docx','pdf','rst'].includes(ext)) return 'documentation';
  if (['png','jpg','jpeg','gif','webp','svg','glb','gltf','fbx','obj','uasset','tga','dds','hdr','exr'].includes(ext)) return 'asset';
  if (['psd','ai','fig','sketch','xd','blend','ma','mb'].includes(ext)) return 'design';
  if (['wav','mp3','ogg','flac','aiff'].includes(ext)) return 'asset';
  if (['hlsl','glsl','ush','usf','shader','material'].includes(ext)) return 'code';
  return 'other';
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function useLearnerState() {
  const [state, setState] = useState(getState);
  useEffect(() => subscribe(setState), []);
  return state;
}

// Analyze the overall game structure from file list
async function analyzeGameStructure(folderName, fileList, knowledgeIds) {
  // Build a file tree summary
  const dirs = new Set();
  const extensions = {};
  let totalSize = 0;
  const sampleFiles = [];

  for (const f of fileList) {
    totalSize += f.size || 0;
    const parts = f.name.split('/');
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join('/'));
      }
    }
    const ext = f.name.split('.').pop()?.toLowerCase();
    extensions[ext] = (extensions[ext] || 0) + 1;
    if (sampleFiles.length < 200) sampleFiles.push(f.name);
  }

  const topDirs = [...dirs].filter(d => d.split('/').length <= 2).sort().slice(0, 50);
  const extSummary = Object.entries(extensions).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([e, c]) => `${e}: ${c}`).join(', ');

  const prompt = `You are analyzing an entire VIDEO GAME project folder to understand how it was built.

GAME/PROJECT: "${folderName}"
TOTAL FILES: ${fileList.length}
TOTAL SIZE: ${(totalSize / 1024 / 1024).toFixed(1)} MB

TOP-LEVEL DIRECTORIES:
${topDirs.join('\n')}

FILE EXTENSIONS (count):
${extSummary}

SAMPLE FILE PATHS (first 200):
${sampleFiles.join('\n')}

Based on this structure, provide an EXHAUSTIVE analysis. This is the master reference for understanding this game:

## Architecture Summary
5+ paragraphs: What engine/framework is this? How is the project structured? What are the major systems? How do they interconnect? What design philosophy is being used?

## Detected Tech Stack
List every technology, engine, framework, language, and tool detected.

## Systems Map
Break down EVERY system you can identify:
- Rendering / Graphics pipeline
- Physics / Collision
- AI / Behavior trees / FSMs
- Networking / Multiplayer
- Audio system
- Input handling
- UI framework
- Save/Load system
- Asset management / streaming
- Build system / packaging
- Plugin architecture
- Scripting system (Blueprints, Lua, etc.)

## Code Architecture
- Source code organization patterns
- Class hierarchies and inheritance
- Module/plugin structure
- API patterns
- Memory management approach

## Asset Pipeline
How are assets organized? What formats? What's the loading/streaming strategy? Texture pipelines, model formats, animation systems.

## Gameplay Systems
- Player controller architecture
- Camera systems
- Combat / interaction systems
- Inventory / progression
- Level/world design patterns
- Quest/mission systems

## World & Level Structure
How are levels/maps organized? Scene graph? Streaming? Open world vs linear?

## Rendering & Shaders
Material system, shader pipeline, post-processing, lighting model, LOD system.

## Lessons & Patterns to Apply
What can be directly applied to building games in Three.js / React? Specific patterns, architectures, and techniques that translate.

## Tags
20-30 tags`;

  const analysis = await base44.integrations.Core.InvokeLLM({ prompt });

  // Parse sections
  const getSection = (name) => {
    const regex = new RegExp(`##\\s*${name}\\s*\\n([\\s\\S]*?)(?:\\n##|$)`, 'i');
    const m = analysis.match(regex);
    return m ? m[1].trim() : '';
  };

  const tagMatch = analysis.match(/##\s*Tags\s*\n([\s\S]*?)(?:\n##|$)/i);
  const tags = tagMatch ? (tagMatch[1].match(/[\w.-]+/g)?.filter(t => t.length > 1 && t.length < 30).slice(0, 30) || []) : [];

  const techLine = getSection('Detected Tech Stack');
  const techStack = techLine.match(/[\w.#+]+/g)?.filter(t => t.length > 1).slice(0, 20) || [];

  return await base44.entities.GameKnowledge.create({
    game_name: folderName,
    source_folder: folderName,
    file_count: fileList.length,
    architecture_summary: getSection('Architecture Summary').substring(0, 5000),
    tech_stack: techStack,
    systems_map: getSection('Systems Map').substring(0, 5000),
    code_patterns: getSection('Code Architecture').substring(0, 5000),
    asset_pipeline: getSection('Asset Pipeline').substring(0, 3000),
    gameplay_systems: getSection('Gameplay Systems').substring(0, 5000),
    world_structure: getSection('World & Level Structure').substring(0, 3000),
    rendering_info: getSection('Rendering & Shaders').substring(0, 3000),
    tags,
    status: 'complete',
    linked_knowledge_ids: knowledgeIds,
  });
}

export default function GameStudyPanel() {
  const queryClient = useQueryClient();
  const folderInputRef = useRef(null);
  const [readingFolder, setReadingFolder] = useState(false);
  const [analyzingGame, setAnalyzingGame] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const learner = useLearnerState();

  const { data: gameKnowledge = [], isLoading } = useQuery({
    queryKey: ['game-knowledge'],
    queryFn: () => base44.entities.GameKnowledge.list('-created_date', 50),
  });

  const { data: knowledgeEntries = [] } = useQuery({
    queryKey: ['knowledge-entries'],
    queryFn: () => base44.entities.KnowledgeEntry.list('-created_date', 500),
  });

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['game-knowledge'] });
    queryClient.invalidateQueries({ queryKey: ['knowledge-entries'] });
    invalidateKnowledgeCache();
  }, [queryClient]);

  const handleGameFolderPick = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setReadingFolder(true);

    const folderName = selected[0]?.webkitRelativePath?.split('/')[0] || 'Game';
    const items = [];
    const fileList = [];

    for (const file of selected) {
      const displayName = file.webkitRelativePath || file.name;
      fileList.push({ name: displayName, size: file.size });

      // Skip junk folders
      if (displayName.includes('node_modules/') || displayName.includes('.git/') ||
          displayName.includes('__pycache__/') || displayName.includes('.DS_Store') ||
          displayName.includes('Intermediate/') || displayName.includes('DerivedDataCache/') ||
          displayName.includes('Binaries/') || displayName.includes('.vs/') ||
          file.name.startsWith('.')) continue;
      if (file.size > 2 * 1024 * 1024) continue;

      const category = classifyFile(file.name);
      const isTextBased = !['asset', 'design'].includes(category);
      let content = '';
      if (isTextBased) {
        try { content = await readFileAsText(file); } catch { content = '[Could not read]'; }
      }

      items.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '_' + file.name,
        name: displayName, size: file.size, category,
        content: content.substring(0, 50000), rawFile: file,
        needsUpload: !isTextBased, status: 'queued',
      });
    }

    setReadingFolder(false);

    if (items.length === 0) {
      showError('No readable files found in that game folder');
      return;
    }

    // Enqueue all individual files for the knowledge learner (runs in background)
    const { added, dupes } = await enqueueFiles(items, `🎮 ${folderName}`);
    if (folderInputRef.current) folderInputRef.current.value = '';

    showSuccess(`Queued ${added} game files for deep learning${dupes > 0 ? ` (${dupes} duplicates skipped)` : ''}`);

    // Also create a high-level GameKnowledge analysis of the overall structure
    setAnalyzingGame(true);
    try {
      await analyzeGameStructure(folderName, fileList, []);
      refreshAll();
      showSuccess(`Game "${folderName}" architecture analysis complete!`);
    } catch (err) {
      showError('Game structure analysis failed: ' + (err?.message || 'Unknown error'));
    }
    setAnalyzingGame(false);
  };

  const pct = learner.progress.total > 0 ? Math.round((learner.progress.done / learner.progress.total) * 100) : 0;

  const filteredGames = gameKnowledge.filter(g => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return g.game_name?.toLowerCase().includes(q) || g.tags?.some(t => t.toLowerCase().includes(q));
  });

  // Count knowledge entries linked to a game
  const getGameFileCount = (gameName) => {
    return knowledgeEntries.filter(e => e.source_filename?.startsWith(gameName + '/')).length;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-orange-400" />
            <span className="text-white font-bold text-sm">GAME STUDY LAB</span>
          </div>
          <Badge variant="outline" className="text-orange-400 border-orange-500/30">
            {gameKnowledge.length} Games Studied
          </Badge>
        </div>
        <p className="text-slate-500 text-[10px]">
          Upload a game's project folder — AI analyzes the entire structure, code, assets, and systems to learn how it was built.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
        {/* Folder Picker */}
        <div
          className="border-2 border-dashed border-orange-500/30 hover:border-orange-400/60 rounded-xl p-6 text-center transition-all cursor-pointer group bg-orange-500/[0.03]"
          onClick={() => !readingFolder && !analyzingGame && folderInputRef.current?.click()}
        >
          <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleGameFolderPick} className="hidden" />
          <div className="flex flex-col items-center gap-2">
            {readingFolder || analyzingGame ? (
              <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
            ) : (
              <Gamepad2 className="w-10 h-10 text-orange-400 group-hover:text-orange-300 transition-colors" />
            )}
            <p className="text-white font-bold text-sm">
              {analyzingGame ? 'Analyzing Game Structure...' : readingFolder ? 'Reading Files...' : 'Upload Game Folder'}
            </p>
            <p className="text-slate-500 text-[10px] max-w-[280px]">
              Select an Unreal, Unity, Godot, or any game project folder. AI will study every file to understand how the game was built.
            </p>
          </div>
        </div>

        {/* Active Learning Progress */}
        {learner.isRunning && learner.folderName?.startsWith('🎮') && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-orange-500/10">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                <span className="text-white text-xs font-bold">Learning game files...</span>
                <span className="text-orange-300/60 text-[10px]">{learner.folderName}</span>
              </div>
              <span className="text-orange-300 text-[10px] font-mono">{learner.progress.done}/{learner.progress.total}</span>
            </div>
            <div className="h-1 bg-orange-900/40">
              <motion.div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400" animate={{ width: `${pct}%` }} />
            </div>
            <div className="px-3 py-2 flex items-center gap-3 text-[10px]">
              {learner.completed.length > 0 && <span className="text-green-400"><CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" />{learner.completed.length}</span>}
              {learner.skipped.length > 0 && <span className="text-slate-400"><SkipForward className="w-2.5 h-2.5 inline mr-0.5" />{learner.skipped.length}</span>}
              {learner.failed.length > 0 && <span className="text-red-400"><XCircle className="w-2.5 h-2.5 inline mr-0.5" />{learner.failed.length}</span>}
            </div>
          </div>
        )}

        {/* Search */}
        {gameKnowledge.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input placeholder="Search games..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-800/50 border-slate-700 pl-9 h-8 text-xs" />
          </div>
        )}

        {/* Game Knowledge Cards */}
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading studied games...</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">{gameKnowledge.length === 0 ? 'No games studied yet' : 'No matches'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGames.map(game => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedGame(selectedGame?.id === game.id ? null : game)}
                className={`rounded-lg border p-3 cursor-pointer transition-all ${
                  selectedGame?.id === game.id ? 'border-orange-500/50 bg-orange-500/5' : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{game.game_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-slate-500 text-[10px]">{game.file_count} files</span>
                      <span className="text-slate-500 text-[10px]">•</span>
                      <span className="text-slate-500 text-[10px]">{getGameFileCount(game.game_name)} learned</span>
                      <Badge className={`text-[8px] py-0 px-1 ${game.status === 'complete' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {game.status}
                      </Badge>
                    </div>
                    {game.tech_stack?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {game.tech_stack.slice(0, 5).map(t => (
                          <Badge key={t} variant="outline" className="text-[8px] py-0 text-orange-400/60 border-orange-500/20">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {selectedGame?.id === game.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-slate-700 space-y-3">
                        {game.architecture_summary && (
                          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                            <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                              <Cpu className="w-3 h-3" /> Architecture
                            </div>
                            <div className="text-[11px] text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                              <ReactMarkdown>{game.architecture_summary}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                        {game.systems_map && (
                          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                            <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                              <Layers className="w-3 h-3" /> Systems Map
                            </div>
                            <div className="text-[11px] text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                              <ReactMarkdown>{game.systems_map}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                        {game.gameplay_systems && (
                          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                            <div className="flex items-center gap-1.5 text-green-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                              <Box className="w-3 h-3" /> Gameplay Systems
                            </div>
                            <div className="text-[11px] text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                              <ReactMarkdown>{game.gameplay_systems}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}