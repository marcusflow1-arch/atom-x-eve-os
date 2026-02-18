import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Gamepad2, Brain, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import EngineViewport from '../components/engine/EngineViewport';
import EngineToolbar from '../components/engine/EngineToolbar';
import GameStudyPanel from '../components/engine/GameStudyPanel';
import KnowledgeConnectionPanel from '../components/engine/KnowledgeConnectionPanel';
import GlassPageFrame from '../components/shared/GlassPageFrame';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';

export default function Engine() {
  const navigate = useNavigate();
  const [sceneApi, setSceneApi] = useState(null);
  const [leftPanel, setLeftPanel] = useState('study'); // 'study' | 'tools'
  const [rightPanel, setRightPanel] = useState('knowledge'); // 'knowledge'
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') navigate(createPageUrl('LunaTemplate'));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <PageErrorBoundary pageName="Engine">
      <GlassPageFrame>
        <div className="h-screen w-full flex flex-col pt-16" style={{ background: 'linear-gradient(135deg, #0a0d14 0%, #111827 50%, #0a0d14 100%)' }}>
          {/* Engine Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10" style={{ background: 'rgba(10, 15, 25, 0.8)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-sm tracking-wider">ATOM×EVE ENGINE</h1>
                <p className="text-white/40 text-[9px]">3D World Builder • Powered by Knowledge Bank</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Panel toggle buttons */}
              <Button size="sm" variant={leftPanel === 'study' ? 'default' : 'ghost'} onClick={() => { setLeftPanel('study'); setLeftCollapsed(false); }} className="h-7 text-[10px]">
                <Gamepad2 className="w-3 h-3 mr-1" /> Game Study
              </Button>
              <Button size="sm" variant={leftPanel === 'tools' ? 'default' : 'ghost'} onClick={() => { setLeftPanel('tools'); setLeftCollapsed(false); }} className="h-7 text-[10px]">
                <Wrench className="w-3 h-3 mr-1" /> Tools
              </Button>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <Button size="sm" variant="ghost" onClick={() => setRightCollapsed(!rightCollapsed)} className="h-7 text-[10px]">
                <Brain className="w-3 h-3 mr-1" /> Knowledge
              </Button>
            </div>
          </div>

          {/* Main Layout: Left Panel + Viewport + Right Panel */}
          <div className="flex-1 flex min-h-0">
            {/* Left Panel */}
            {!leftCollapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="h-full border-r border-white/10 flex-shrink-0 overflow-hidden"
                style={{ background: 'rgba(10, 15, 25, 0.6)', backdropFilter: 'blur(20px)', width: 320 }}
              >
                <div className="h-full flex flex-col">
                  {leftPanel === 'study' ? (
                    <GameStudyPanel />
                  ) : (
                    <div className="p-3">
                      <EngineToolbar sceneApi={sceneApi} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Collapse/Expand Left */}
            <button onClick={() => setLeftCollapsed(!leftCollapsed)} className="w-4 flex-shrink-0 flex items-center justify-center hover:bg-white/5 transition-colors border-r border-white/5">
              {leftCollapsed ? <ChevronRight className="w-3 h-3 text-white/30" /> : <ChevronLeft className="w-3 h-3 text-white/30" />}
            </button>

            {/* 3D Viewport - Takes remaining space (roughly 50%) */}
            <div className="flex-1 min-w-0 p-2">
              <EngineViewport onSceneReady={setSceneApi} />
            </div>

            {/* Collapse/Expand Right */}
            <button onClick={() => setRightCollapsed(!rightCollapsed)} className="w-4 flex-shrink-0 flex items-center justify-center hover:bg-white/5 transition-colors border-l border-white/5">
              {rightCollapsed ? <ChevronLeft className="w-3 h-3 text-white/30" /> : <ChevronRight className="w-3 h-3 text-white/30" />}
            </button>

            {/* Right Panel - Knowledge Connection */}
            {!rightCollapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="h-full border-l border-white/10 flex-shrink-0 overflow-hidden"
                style={{ background: 'rgba(10, 15, 25, 0.6)', backdropFilter: 'blur(20px)', width: 280 }}
              >
                <KnowledgeConnectionPanel />
              </motion.div>
            )}
          </div>
        </div>
      </GlassPageFrame>
    </PageErrorBoundary>
  );
}