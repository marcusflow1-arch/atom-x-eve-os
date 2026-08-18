import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Gamepad2, Brain, Wrench, ChevronLeft, ChevronRight, Bot, Sparkles, MessageSquare, Unplug, Camera, Pencil, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import EngineViewport from '../components/engine/EngineViewport';
import EngineToolbar from '../components/engine/EngineToolbar';
import GameStudyPanel from '../components/engine/GameStudyPanel';
import KnowledgeConnectionPanel from '../components/engine/KnowledgeConnectionPanel';
import EngineAIChat from '../components/engine/EngineAIChat';
import BlueprintPanel from '../components/engine/BlueprintPanel';
import DirectorChat from '../components/admin/DirectorChat';
import UnrealBridgePanel from '../components/engine/UnrealBridgePanel';
import EngineCommandListener from '../components/engine/EngineCommandListener';
import EngineEditStudio from '../components/engine/EngineEditStudio';
import GlassPageFrame from '../components/shared/GlassPageFrame';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';

export default function Engine() {
  const navigate = useNavigate();
  const [sceneApi, setSceneApi] = useState(null);
  const [leftPanel, setLeftPanel] = useState('ai');
  const [rightPanel, setRightPanel] = useState('knowledge');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (editMode) setEditMode(false);
        else navigate(createPageUrl('LunaTemplate'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, editMode]);

  return (
    <PageErrorBoundary pageName="Engine">
      <GlassPageFrame>
        <EngineCommandListener sceneApi={sceneApi} />
        <div className="h-screen w-full flex flex-col pt-16" style={{ background: 'linear-gradient(135deg, #0a0d14 0%, #111827 50%, #0a0d14 100%)' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10" style={{ background: 'rgba(10, 15, 25, 0.8)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center"><Cpu className="w-4 h-4 text-white" /></div>
              <div><h1 className="text-white font-bold text-sm tracking-wider">ATOM×EVE ENGINE</h1><p className="text-white/40 text-[9px]">AI-Powered Builder • Knowledge-Driven • Blueprint System</p></div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant={editMode ? 'default' : 'ghost'} onClick={() => setEditMode(v => !v)} className={`h-7 text-[10px] ${editMode ? 'bg-orange-600 hover:bg-orange-700' : ''}`}><Pencil className="w-3 h-3 mr-1" /> {editMode ? 'Exit Edit' : 'Edit'}</Button>
              <div className="w-px h-5 bg-white/10 mx-0.5" />
              <Button size="sm" variant={leftPanel === 'ai' ? 'default' : 'ghost'} onClick={() => { setLeftPanel('ai'); setLeftCollapsed(false); }} className={`h-7 text-[10px] ${leftPanel === 'ai' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}`}><Bot className="w-3 h-3 mr-1" /> AI Builder</Button>
              <Button size="sm" variant={leftPanel === 'blueprints' ? 'default' : 'ghost'} onClick={() => { setLeftPanel('blueprints'); setLeftCollapsed(false); }} className={`h-7 text-[10px] ${leftPanel === 'blueprints' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}><Sparkles className="w-3 h-3 mr-1" /> Blueprints</Button>
              <Button size="sm" variant={leftPanel === 'study' ? 'default' : 'ghost'} onClick={() => { setLeftPanel('study'); setLeftCollapsed(false); }} className="h-7 text-[10px]"><Gamepad2 className="w-3 h-3 mr-1" /> Game Study</Button>
              <Button size="sm" variant={leftPanel === 'tools' ? 'default' : 'ghost'} onClick={() => { setLeftPanel('tools'); setLeftCollapsed(false); }} className="h-7 text-[10px]"><Wrench className="w-3 h-3 mr-1" /> Tools</Button>
              <Button size="sm" variant={leftPanel === 'unreal' ? 'default' : 'ghost'} onClick={() => { setLeftPanel('unreal'); setLeftCollapsed(false); }} className={`h-7 text-[10px] ${leftPanel === 'unreal' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}><Unplug className="w-3 h-3 mr-1" /> Unreal</Button>
              <Button size="sm" variant={leftPanel === 'director' ? 'default' : 'ghost'} onClick={() => { setLeftPanel('director'); setLeftCollapsed(false); }} className={`h-7 text-[10px] ${leftPanel === 'director' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}`}><Camera className="w-3 h-3 mr-1" /> Director</Button>
              <div className="w-px h-5 bg-white/10 mx-0.5" />
              <Button size="sm" variant={!rightCollapsed ? 'default' : 'ghost'} onClick={() => setRightCollapsed(!rightCollapsed)} className="h-7 text-[10px]"><Brain className="w-3 h-3 mr-1" /> Knowledge</Button>
            </div>
          </div>

          <div className="flex-1 flex min-h-0 relative">
            {!leftCollapsed && (
              <div className="h-full border-r border-white/10 flex-shrink-0 overflow-hidden" style={{ background: 'rgba(10, 15, 25, 0.6)', backdropFilter: 'blur(20px)', width: (leftPanel === 'ai' || leftPanel === 'unreal' || leftPanel === 'director') ? 380 : 320 }}>
                <div className="h-full flex flex-col">
                  {leftPanel === 'director' ? <DirectorChat context="Engine Editor" editorState={{ activePanel: leftPanel, sceneReady: !!sceneApi }} onTaskCompiled={(task) => console.log('[Engine] Director task compiled:', task)} /> : leftPanel === 'ai' ? <EngineAIChat sceneApi={sceneApi} /> : leftPanel === 'blueprints' ? <BlueprintPanel /> : leftPanel === 'study' ? <GameStudyPanel /> : leftPanel === 'unreal' ? <UnrealBridgePanel /> : <div className="p-3"><EngineToolbar sceneApi={sceneApi} /></div>}
                </div>
              </div>
            )}

            <button onClick={() => setLeftCollapsed(!leftCollapsed)} className="w-4 flex-shrink-0 flex items-center justify-center hover:bg-white/5 transition-colors border-r border-white/5">{leftCollapsed ? <ChevronRight className="w-3 h-3 text-white/30" /> : <ChevronLeft className="w-3 h-3 text-white/30" />}</button>

            <div className="flex-1 min-w-0 p-2 relative">
              <EngineViewport onSceneReady={setSceneApi} />
              {editMode && <EngineEditStudio sceneApi={sceneApi} onClose={() => setEditMode(false)} />}
            </div>

            <button onClick={() => setRightCollapsed(!rightCollapsed)} className="w-4 flex-shrink-0 flex items-center justify-center hover:bg-white/5 transition-colors border-l border-white/5">{rightCollapsed ? <ChevronLeft className="w-3 h-3 text-white/30" /> : <ChevronRight className="w-3 h-3 text-white/30" />}</button>

            {!rightCollapsed && (
              <div className="h-full border-l border-white/10 flex-shrink-0 overflow-hidden" style={{ background: 'rgba(10, 15, 25, 0.6)', backdropFilter: 'blur(20px)', width: 280 }}><KnowledgeConnectionPanel /></div>
            )}
          </div>
        </div>
      </GlassPageFrame>
    </PageErrorBoundary>
  );
}
